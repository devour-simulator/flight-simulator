import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../game.js', import.meta.url), 'utf8');
const start = source.indexOf('function electricalStatus()');
const end = source.indexOf('\nfunction powered()', start);
if (start < 0 || end < 0) throw new Error('Unable to extract aircraft system functions');

const state = {
  battery: false, groundPower: false, apuGen: false, apuRunning: false,
  gen1: false, gen2: false, engineData: [{ phase: 'OFF' }, { phase: 'OFF' }],
  engines: [0, 0], hydraulics: false, fuelPumps: false, leftPump: false,
  rightPump: false, fuelTanks: { left: 2600, center: 2600, right: 2600 },
  bleed: false, packs: false, pressurization: false, irsAligned: false,
  onGround: true, temperature: 15, engineAntiIce: false, wingAntiIce: false,
};
const activeWeather = { rain: 0 };
const difficulty = 'realistic';
const factory = new Function('state', 'difficulty', 'activeWeather', `${source.slice(start, end)}; return { electricalStatus, aircraftSystemStatus };`);
const { electricalStatus, aircraftSystemStatus } = factory(state, difficulty, activeWeather);
const assert = (condition, message) => { if (!condition) throw new Error(message); };

assert(!electricalStatus().transfer, 'Cold aircraft should have no AC power');
state.battery = true;
assert(electricalStatus().dcStandby && !electricalStatus().transfer, 'Battery should power DC standby only');
state.groundPower = true;
assert(electricalStatus().ac1 && electricalStatus().ac2, 'Ground power should energize both AC buses');
state.groundPower = false; state.gen1 = true; state.engineData[0].phase = 'STABLE';
assert(electricalStatus().ac1 && !electricalStatus().ac2, 'GEN 1 should energize AC bus 1 only');
state.leftPump = true;
assert(aircraftSystemStatus().fuelPressure, 'Left tank pump should establish fuel pressure');
state.irsAligned = true;
assert(aircraftSystemStatus().navAvailable, 'Aligned IRS should enable navigation');
state.onGround = false; state.temperature = -8; activeWeather.rain = 1;
assert(aircraftSystemStatus().icingRisk && !aircraftSystemStatus().iceProtected, 'Cold precipitation should create unprotected icing risk');
state.engineAntiIce = state.wingAntiIce = true;
assert(aircraftSystemStatus().iceProtected, 'Engine and wing anti-ice should protect the aircraft');

console.log('Aircraft electrical, fuel, IRS and anti-ice systems verified');
