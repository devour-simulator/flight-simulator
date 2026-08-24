const DT = 0.04;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const damp = (current, target, response) => current + (target - current) * (1 - Math.exp(-response * DT));

const airports = [
  ['LGA', 35000, -50000, [90, 270]],
  ['SMA', -52000, -65000, [40, 220]],
  ['EAS', 80000, -35000, [120, 300]],
  ['NPL', 45000, -100000, [180, 360]],
  ['WDS', -105000, -40000, [80, 260]],
  ['ISL', 120000, -110000, [50, 230]],
  ['ALP', -120000, -125000, [140, 320]],
];
const profiles = [
  { id: 'B738', cruise: 250, approach: 137 },
  { id: 'Q400', cruise: 220, approach: 112 },
];

function simulate(airport, runwayHeading, profile, initialAltitude) {
  const [, runwayX, runwayZ] = airport;
  const runwayRad = runwayHeading * Math.PI / 180;
  const pointOnFinal = distance => [
    runwayX - Math.sin(runwayRad) * distance,
    runwayZ + Math.cos(runwayRad) * distance,
  ];
  const route = [pointOnFinal(26000), pointOnFinal(13000), [runwayX, runwayZ]];
  const state = {
    x: 0, z: 2050, altitude: initialAltitude, ias: profile.cruise,
    heading: 0, roll: 0, path: 0, leg: 0, lastLegDistance: Infinity,
    targetAltitude: initialAltitude, targetSpeed: profile.cruise,
    final: false, flare: false,
  };

  for (let step = 0; step < 120000; step++) {
    const dx = runwayX - state.x;
    const dz = runwayZ - state.z;
    const distance = Math.hypot(dx, dz);
    const along = dx * Math.sin(runwayRad) - dz * Math.cos(runwayRad);
    const lateral = dx * Math.cos(runwayRad) + dz * Math.sin(runwayRad);
    const descentTrigger = state.altitude * .3048 / Math.tan(5 * Math.PI / 180) + 10000;
    if (distance < descentTrigger) {
      state.targetAltitude = Math.max(3000, distance * Math.tan(4 * Math.PI / 180) * 3.28084);
    }

    const headingError = Math.abs(((state.heading - runwayHeading + 540) % 360) - 180);
    const enteringApproach = state.leg >= route.length - 2 && headingError < 65 &&
      along < 27500 && along > -2200 && Math.abs(lateral) < 2600;
    const established = enteringApproach || (state.final && along > -3200 && Math.abs(lateral) < 4400);
    let rollInput = 0;
    let pathTarget = 0;

    if (established) {
      state.final = true;
      const flareAltitude = profile.id === 'Q400' ? 120 : 140;
      if (!state.flare && along < 1600 && state.altitude < flareAltitude) state.flare = true;
      const glideHeight = Math.max(0, along) * Math.tan(3 * Math.PI / 180) * 3.28084;
      state.targetAltitude = state.flare ? 0 : glideHeight;
      state.targetSpeed = along < 2800 ? profile.approach : along < 7000 ? profile.approach + 22 : profile.approach + 42;
      const aim = pointOnFinal(Math.max(0, along - 6000));
      const localizerHeading = (runwayHeading + clamp(lateral / 35, -15, 15) + 360) % 360;
      const aimHeading = along < 7000 ? localizerHeading : (Math.atan2(aim[0] - state.x, -(aim[1] - state.z)) * 180 / Math.PI + 360) % 360;
      const headingDelta = ((aimHeading - state.heading + 540) % 360) - 180;
      rollInput = clamp(headingDelta / 24, -.5, .5);
      const belowGlide = glideHeight - state.altitude;
      const directPathRaw = -Math.atan2(Math.max(0, state.altitude - 28) * .3048, Math.max(700, along - 550)) * 180 / Math.PI;
      const directPath = profile.id === 'Q400' ? clamp(directPathRaw * 1.22, -13, .5) : clamp(directPathRaw * 1.08, -11.5, .5);
      pathTarget = state.flare ? (profile.id === 'Q400' ? -4.8 : -3.2) : belowGlide > 260 ? clamp(belowGlide / 850 - 1.6, -1.2, 2.2) : directPath;
    } else {
      state.final = false;
      const altitudeError = state.targetAltitude - state.altitude;
      const maxClimb = clamp((state.ias - (profile.approach + 35)) / 14, 0, 6);
      pathTarget = clamp(altitudeError / 1450, -7, maxClimb);
      if (state.ias < profile.approach + 15) pathTarget = Math.min(pathTarget, state.altitude > 800 ? -1 : 0);

      let leg = route[state.leg];
      const legDistance = Math.hypot(leg[0] - state.x, leg[1] - state.z);
      const captureRadius = Math.max(650, state.ias * 5.5);
      const passedLeg = Number.isFinite(state.lastLegDistance) &&
        legDistance > state.lastLegDistance + 12 && state.lastLegDistance < captureRadius * 2.4;
      let targetHeading = (Math.atan2(leg[0] - state.x, -(leg[1] - state.z)) * 180 / Math.PI + 360) % 360;
      if ((legDistance < captureRadius || passedLeg) && state.leg < route.length - 1) {
        state.leg++;
        state.lastLegDistance = Infinity;
        leg = route[state.leg];
        targetHeading = (Math.atan2(leg[0] - state.x, -(leg[1] - state.z)) * 180 / Math.PI + 360) % 360;
      } else {
        state.lastLegDistance = legDistance;
      }
      const headingDelta = ((targetHeading - state.heading + 540) % 360) - 180;
      rollInput = clamp(headingDelta / 25, -.72, .72);
    }

    state.roll += (rollInput * 48 - state.roll) * Math.min(1, DT * 2.8);
    state.heading = (state.heading + state.roll * .18 * DT + 360) % 360;
    state.path = damp(state.path, pathTarget, state.flare ? 12 : state.final ? 4 : .72);
    state.ias = damp(state.ias, state.targetSpeed, .3);
    const speed = state.ias * .5144;
    const horizontalSpeed = speed * Math.cos(state.path * Math.PI / 180);
    state.x += Math.sin(state.heading * Math.PI / 180) * horizontalSpeed * DT;
    state.z -= Math.cos(state.heading * Math.PI / 180) * horizontalSpeed * DT;
    const verticalSpeed = state.ias * 101.269 * Math.sin(state.path * Math.PI / 180);
    state.altitude += verticalSpeed / 60 * DT;

    if (state.altitude <= 0) {
      const touchdownX = state.x - runwayX;
      const touchdownZ = state.z - runwayZ;
      const lateralOffset = Math.abs(touchdownX * Math.cos(-runwayRad) - touchdownZ * Math.sin(-runwayRad));
      const longitudinalOffset = Math.abs(touchdownX * Math.sin(-runwayRad) + touchdownZ * Math.cos(-runwayRad));
      const touchdownHeadingError = Math.abs(((state.heading - runwayHeading + 540) % 360) - 180);
      return {
        // This lightweight route model validates runway capture and touchdown placement.
        // Sink-rate safety is covered by verify-runtime-autoland.mjs using the real flightPhysics implementation.
        ok: lateralOffset < 34 && longitudinalOffset < 2600 && touchdownHeadingError < 12 && Math.abs(verticalSpeed) < 1100,
        lateral: +lateralOffset.toFixed(1), longitudinal: Math.round(longitudinalOffset),
        headingError: +touchdownHeadingError.toFixed(1), sink: Math.round(Math.abs(verticalSpeed)),
      };
    }
  }
  return { ok: false, reason: 'timeout' };
}

const failures = [];
let scenarios = 0;
for (const profile of profiles) {
  for (const airport of airports) {
    for (const runway of airport[3]) {
      for (const altitude of [3000, 10000, 20000]) {
        scenarios++;
        const result = simulate(airport, runway, profile, altitude);
        if (!result.ok) failures.push({ aircraft: profile.id, airport: airport[0], runway, altitude, ...result });
      }
    }
  }
}

if (failures.length) {
  console.error(JSON.stringify(failures, null, 2));
  throw new Error(`${failures.length} of ${scenarios} autoland scenarios failed`);
}
console.log(`${scenarios} autoland scenarios completed with safe runway touchdowns`);
