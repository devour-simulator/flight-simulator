import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../game.js', import.meta.url), 'utf8');
const start = source.indexOf('function updateQ400Powerplant(dt');
const end = source.indexOf('\nfunction flightPhysics', start);
if (start < 0 || end < 0) throw new Error('Unable to extract Q400 powerplant');

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const damp = (current, target, response, dt) => current + (target - current) * (1 - Math.exp(-response * dt));
const THREE = { MathUtils: { clamp } };
const state = {
  ias: 40, altitude: 0, heading: 0, onGround: true, throttle: -25,
  conditionLever: 100, engines: [60, 60], propRpm: 1020, bladePitch: 20,
  torque: 0, q400Torque: [0, 0], reversePower: 0, engineYaw: 0,
  propFeather: [false, false], failedEngine: null,
  itt: 15, nh: 0, nl: 0, temperature: 15, icingLevel: 0, engineOverlimitTime: 0,
};
const activeAircraft = { id: 'Q400' };
const activeWeather = { wind: 0, rain: 0 };
const ui = { throttle: { value: 0 } };
const saved = { aircraftCondition: { Q400: 100 } };
let icingRisk = false, protectedFromIce = false;
const aircraftSystemStatus = () => ({ icingRisk, iceProtected: protectedFromIce });
const factory = new Function('THREE', 'state', 'activeAircraft', 'activeWeather', 'aircraftSystemStatus', 'damp', 'ui', 'saved', 'performance', 'warningTimer', 'toast', 'warningTone', 'syncFeatherButtons', `${source.slice(start, end)}; return updateQ400Powerplant;`);
const update = factory(THREE, state, activeAircraft, activeWeather, aircraftSystemStatus, damp, ui, saved, { now: () => 0 }, 0, () => {}, () => {}, () => {});
const assert = (condition, message) => { if (!condition) throw new Error(message); };

update(.1, 1, 1);
assert(state.reversePower === 1 && state.bladePitch < 0, 'Ground reverse should command negative blade pitch');
assert(state.q400Torque.every(value => value > 60), 'Both engines should produce reverse shaft torque');

state.onGround = false; state.throttle = -25;
update(.1, 1, 1);
assert(state.throttle === 0 && state.reversePower === 0, 'Airborne reverse must be locked out');

state.throttle = 70; state.engines = [60, 0];
update(.1, 1, .5);
assert(state.q400Torque[0] > 60 && state.q400Torque[1] === 0, 'Single-engine torque must be calculated independently');
assert(state.engineYaw < 0, 'Left-only power should create asymmetric yaw');

icingRisk = true; activeWeather.rain = 1;
update(10, .8, .5);
assert(state.icingLevel > 0, 'Unprotected cold precipitation should accumulate ice');
const iced = state.icingLevel; protectedFromIce = true;
update(10, .8, .5);
assert(state.icingLevel < iced, 'De-ice protection should remove accumulated ice');

console.log('Q400 round 3 reverse, asymmetric torque and de-ice systems verified');
