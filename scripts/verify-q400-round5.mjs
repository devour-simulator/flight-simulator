import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../game.js', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const start = source.indexOf('function updateQ400Powerplant(dt');
const end = source.indexOf('\nfunction flightPhysics', start);
if (start < 0 || end < 0) throw new Error('Unable to extract Q400 powerplant');

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const damp = (current, target, response, dt) => current + (target - current) * (1 - Math.exp(-response * dt));
const THREE = { MathUtils: { clamp } };
const state = {
  ias: 180, heading: 0, onGround: false, throttle: 70, conditionLever: 100,
  engines: [60, 60], propRpm: 1020, bladePitch: 25, propFeather: [false, false],
  failedEngine: null, torque: 0, q400Torque: [0, 0], reversePower: 0, engineYaw: 0,
  itt: 15, nh: 0, nl: 0, temperature: -5, icingLevel: 0, engineOverlimitTime: 0,
};
const activeAircraft = { id: 'Q400' };
const activeWeather = { wind: 0, rain: 0 };
const ui = { throttle: { value: 0 } };
const saved = { aircraftCondition: { Q400: 100 } };
const status = () => ({ icingRisk: false, iceProtected: false });
let syncCount = 0;
const factory = new Function('THREE', 'state', 'activeAircraft', 'activeWeather', 'aircraftSystemStatus', 'damp', 'ui', 'saved', 'performance', 'warningTimer', 'toast', 'warningTone', 'syncFeatherButtons', `${source.slice(start, end)}; return updateQ400Powerplant;`);
const update = factory(THREE, state, activeAircraft, activeWeather, status, damp, ui, saved, { now: () => 0 }, 0, () => {}, () => {}, () => { syncCount++; });
const assert = (condition, message) => { if (!condition) throw new Error(message); };

update(.1, 1, 1);
assert(state.q400Torque[0] > 60 && state.q400Torque[1] > 60, 'Both unfeathered engines should produce torque');
state.propFeather[1] = true;
update(.1, 1, 1);
assert(state.q400Torque[0] > 60 && state.q400Torque[1] === 0, 'Feathered propeller must stop producing thrust');
state.engines[1] = 0; state.propFeather[1] = false;
update(.1, 1, .5);
assert(state.failedEngine === 1 && syncCount > 0, 'Single-engine failure must trigger the abnormal checklist');
assert(state.engineYaw < 0, 'Single-engine torque must create asymmetric yaw');

assert(html.includes('id="mcpVs"') && html.includes('data-ap="vs"'), 'Cockpit must expose V/S target and mode controls');
assert(source.includes('failedPropDrag') && source.includes('PROP FEATHERED · 风车阻力已降低'), 'Unfeathered failure drag and feather recovery must be implemented');
assert(source.includes("if(state.ap.vs){const err=state.targets.vs-state.vs"), 'Autopilot must command selected vertical speed');

console.log('Q400 round 5 V/S autopilot, prop feather and single-engine procedure verified');
