import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../game.js', import.meta.url), 'utf8');
const start = source.indexOf('function flightPhysics(dt)');
const end = source.indexOf('\nfunction updateAutopilotMotionGuard', start);
if (start < 0 || end < 0) throw new Error('Unable to extract flightPhysics from game.js');
const flightPhysicsSource = source.slice(start, end);

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const damp = (current, target, response, dt) => current + (target - current) * (1 - Math.exp(-response * dt));
const THREE = { MathUtils: { clamp, damp } };
const noop = () => {};
const element = () => ({
  value: 0, textContent: '', innerHTML: '',
  classList: { add: noop, remove: noop, toggle: noop, contains: () => false },
  style: { setProperty: noop },
});
const elements = new Map();
const $ = selector => {
  if (!elements.has(selector)) elements.set(selector, element());
  return elements.get(selector);
};
const document = { documentElement: { style: { setProperty: noop } } };

const aircraftProfiles = {
  B738: { id: 'B738', short: 'B737-800', approachSpeed: 137, controlSpeed: 125, criticalAoa: 15, pitchResponse: 1, rollResponse: 1, yawResponse: 1, thrust: 1, drag: 1, lift: 1, fuelBurn: 1, rotateSpeed: 112, maxSpeed: 520, ceiling: 41000, gearLimit: 270 },
  Q400: { id: 'Q400', short: 'Q400', approachSpeed: 112, controlSpeed: 94, criticalAoa: 17, pitchResponse: 1.35, rollResponse: 1.55, yawResponse: 1.45, thrust: .82, drag: 1.12, lift: 1.24, fuelBurn: .55, rotateSpeed: 88, maxSpeed: 360, ceiling: 25000, gearLimit: 250 },
};
const airportData = {
  LGA: [18000, -26000, [90, 270]], SMA: [-23000, -42000, [40, 220]],
  EAS: [52000, -18000, [120, 300]], NPL: [38000, -65000, [180, 360]],
  WDS: [-60000, -28000, [80, 260]], ISL: [70000, -80000, [50, 230]],
  ALP: [-70000, -90000, [140, 320]],
};
const airportCode = process.argv[2] || 'LGA';
const [runwayX, runwayZ, runwayHeadings] = airportData[airportCode] || airportData.LGA;
const runwayHeading = +(process.argv[3] || runwayHeadings[0]);
const activeAircraft = aircraftProfiles[process.argv[4]] || aircraftProfiles.B738;
const initialAltitude = +(process.argv[5] || 10000);
const trace = process.argv.includes('--trace');
const runway = { id: String(runwayHeading).padStart(2, '0'), heading: runwayHeading, x: runwayX, z: runwayZ };
const airport = { code: airportCode, name: airportCode, x: runway.x, z: runway.z, runways: [runway] };
const pointOnFinal = distance => {
  const rad = runway.heading * Math.PI / 180;
  return [runway.x - Math.sin(rad) * distance, runway.z + Math.cos(rad) * distance];
};
const route = [
  { name: `${airportCode}-IAF`, pos: pointOnFinal(26000) },
  { name: `${runway.id}-FINAL`, pos: pointOnFinal(13000) },
  { name: 'RWY09', pos: [runway.x, runway.z] },
];
const runtimePointOnFinal = (r, distance) => {
  const rad = r.heading * Math.PI / 180;
  return [r.x - Math.sin(rad) * distance, r.z + Math.cos(rad) * distance];
};
const state = {
  running: true, crashed: false, engines: [60, 60], throttle: 64, fuel: 7800,
  fuelTanks: { left: 2600, center: 2600, right: 2600 }, leftPump: true, centerPump: true, rightPump: true,
  speedbrake: 0, flaps: 0, gearDown: false, gearPosition: 0, gearDamaged: false,
  gearOverspeedTime: 0, gearWarnUntil: 0, ias: activeAircraft.id === 'Q400' ? 220 : 250, altitude: initialAltitude,
  radioAlt: initialAltitude, vs: 0, heading: 0, pitch: 3, flightPathAngle: 0,
  roll: 0, rudder: 0, aoa: 3, criticalAoa: 15, stallSeverity: 0,
  temperature: 15, cg: 25, trim: 5, fmcPlan: null,
  x: 0, y: 3.69 + initialAltitude * .3048, z: 2050, weight: activeAircraft.id === 'Q400' ? 29000 : 65000,
  onGround: false, airborne: true, landingRollout: null, flightSeconds: 0,
  offPavementTime: 0, offPavementNotified: false, ceilingWarned: false,
  rotateCommand: false, route, activeLeg: 0, currentAirport: 'YHI', departureAirport: 'YHI',
  autoLand: {
    airport, runway, phase: 'NAV', cruiseAltitude: initialAltitude, pathTarget: 0,
    pitchTarget: 3, lastDistance: Infinity, lastX: 0, lastZ: 2050,
    movedDistance: 0, takeoffMode: false, takeoffHeading: 0,
    avoidHeading: null, terrainAvoidUntil: 0, terrainSafeAltitude: 0,
    watchTimer: 0, watchX: 0, watchZ: 2050, watchIas: activeAircraft.id === 'Q400' ? 220 : 250,
    recoveries: 0, gearRetracted: true,
  },
  ap: { fd: true, at: true, lnav: true, vnav: true, heading: false, altitude: false, ap: true, app: false },
  targets: { speed: activeAircraft.id === 'Q400' ? 220 : 250, heading: 0, altitude: initialAltitude },
};
const keys = {};
const ui = { speedbrake: element(), flaps: element(), throttle: element(), gear: element() };
const aircraft = { position: { set: noop }, rotation: { order: '', set: noop } };
const activeWeather = { wind: 0, gust: 0, friction: 1, night: false, lightning: false };
const weatherProfiles = {};
const obstacles = [];
const saved = { hours: 0, cycles: 0, flights: 0, routes: [], bestLanding: 0 };
const reports = [];
let crashReason = '';

function runwayApproachGeometry(r) {
  const rad = r.heading * Math.PI / 180;
  const dx = r.x - state.x;
  const dz = r.z - state.z;
  return { along: dx * Math.sin(rad) - dz * Math.cos(rad), lateral: dx * Math.cos(rad) + dz * Math.sin(rad) };
}
function nearestRunway() {
  const a = -runway.heading * Math.PI / 180;
  const dx = state.x - runway.x;
  const dz = state.z - runway.z;
  const lateral = Math.abs(dx * Math.cos(a) - dz * Math.sin(a));
  const longitudinal = Math.abs(dx * Math.sin(a) + dz * Math.cos(a));
  const headingError = Math.abs(((state.heading - runway.heading + 540) % 360) - 180);
  return { ap: airport, r: runway, lateral, longitudinal, headingError, score: lateral };
}
function setGear(down) { state.gearDown = down; }
function crash(reason) { state.crashed = true; crashReason = reason; }

const makeFlightPhysics = new Function(
  'THREE', 'state', 'activeAircraft', 'keys', 'ui', '$', 'document', 'aircraft',
  'activeWeather', 'weatherProfiles', 'obstacles', 'saved', 'MAX_ALTITUDE_FT',
  'PLAYER_GROUND_Y', 'WORLD_DISTANCE_SCALE', 'runwayApproachGeometry', 'autopilotTerrainThreat',
  'setGear', 'toast', 'warningTone', 'beep', 'unlockAchievement', 'nearestRunway',
  'crash', 'showLandingReport', 'updateCurrentAirportLabel', 'saveCareer',
  'maybeFailure', 'onAirportPavement', 'performance', 'collisionWarningTimer',
  'displayDistanceKm', 'damp', 'warningTimer', 'engineGain', 'engineNoiseGain', 'engineOsc',
  'pointOnFinal', 'aircraftSystemStatus', 'readGamepad', 'disconnectAutopilot', 'updateFlightExperience', 'speakCallout', 'consumeFuel',
  `${flightPhysicsSource}; return flightPhysics;`,
);
const flightPhysics = makeFlightPhysics(
  THREE, state, activeAircraft, keys, ui, $, document, aircraft,
  activeWeather, weatherProfiles, obstacles, saved, 41000, 3.69, 12,
  runwayApproachGeometry, () => null, setGear, noop, noop, noop, noop,
  nearestRunway, crash, data => reports.push(data), noop, noop, noop,
  () => true, { now: () => state.flightSeconds * 1000 }, 0, meters => meters * 12 / 1000, damp,
  0, null, null, null,
  runtimePointOnFinal, () => ({ transfer: true, hydA: true, hydB: true }), () => null, noop, noop, noop, () => true,
);

const DT = .04;
let lastLog = -1;
for (let frame = 0; frame < 90000 && !state.crashed && state.autoLand; frame++) {
  flightPhysics(DT);
  state.gearPosition = damp(state.gearPosition, state.gearDown ? 1 : 0, 2.1, DT);
  state.radioAlt = state.altitude;
  const second = Math.floor(state.flightSeconds);
  if (trace && second % 60 === 0 && second !== lastLog) {
    lastLog = second;
    const geometry = runwayApproachGeometry(runway);
    console.log(JSON.stringify({
      second, phase: state.autoLand?.phase, leg: state.activeLeg,
      speed: Math.round(state.ias), altitude: Math.round(state.altitude),
      along: Math.round(geometry.along), lateral: Math.round(geometry.lateral),
      heading: Math.round(state.heading), path: +state.flightPathAngle.toFixed(1),
    }));
  }
}

if (state.crashed) throw new Error(`Runtime autoland crashed: ${crashReason}`);
if (state.autoLand || state.currentAirport !== airportCode) {
  throw new Error(`Runtime autoland did not complete: phase=${state.autoLand?.phase} airport=${state.currentAirport} runway=${JSON.stringify(nearestRunway())} report=${JSON.stringify(reports.at(-1) || null)}`);
}
console.log(`Runtime flightPhysics autoland completed: ${activeAircraft.id} ${airportCode} runway ${runway.id} from ${initialAltitude} ft`);
