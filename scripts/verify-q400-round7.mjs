import fs from 'node:fs';

const source = fs.readFileSync(new URL('../game.js', import.meta.url), 'utf8');
const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const assert = (condition, message) => { if (!condition) throw new Error(message); };

for (const marker of [
  'const q400TutorialSteps=[',
  'function groundOperationsReady()',
  'function missingGroundOperations()',
  'function requestTaxiClearance()',
  'function completeTurnaround()',
  "activeAircraft.id==='Q400'?q400TutorialSteps:tutorialSteps",
  "state.pushbackComplete=true",
]) assert(source.includes(marker), `Missing round 7 marker: ${marker}`);

assert(html.includes('data-ground-op="shutdown"'), 'Ground operations panel is missing the shutdown check');
assert(html.includes('game.js?v=q400-round7-22'), 'Round 7 cache version was not updated');

const start = source.indexOf('function groundOperationsReady()');
const end = source.indexOf('\nfunction resetATC', start);
if (start < 0 || end < 0) throw new Error('Unable to extract ground operations functions');

const state = {
  ready:false,simpleMode:false,onGround:true,ias:0,z:2050,heading:0,throttle:0,
  jetbridgeServiced:false,jetbridgeConnected:false,boardingComplete:false,
  baggageComplete:false,fuelingComplete:false,pushbackTimer:0,pushbackComplete:false,
  turnaroundComplete:false,landingRollout:null,conditionLever:0,engines:[0,0],beacon:false,
};
const activeAircraft = { id:'Q400' };
const saved = { completedTurnarounds:0, careerXP:0 };
const ui = { throttle:{ value:0 } };
const notices = [];
const buttons = ['bridge','boarding','baggage','fuel','pushback','shutdown'].map(groundOp => ({
  dataset:{groundOp},textContent:'',disabled:false,classList:{toggle(){}},
}));
const factory = new Function(
  'state','activeAircraft','saved','ui','$','$$','toast','warningTone','refuelAircraft',
  'unlockAchievement','saveCareer','setATCInstruction',
  `${source.slice(start, end)}; return {groundOperationsReady,missingGroundOperations,runGroundOperation,startPushback,updatePushback,requestTaxiClearance,completeTurnaround};`,
);
const ops = factory(
  state,activeAircraft,saved,ui,() => null,() => buttons,
  message => notices.push(message),() => {},() => {},() => {},() => {},() => {},
);

assert(!ops.groundOperationsReady(), 'Cold aircraft must not start with ground services complete');
assert(ops.startPushback() === false, 'Pushback must be blocked before ground service completion');
assert(ops.runGroundOperation('boarding') === undefined && !state.boardingComplete, 'Boarding must require stairs first');
ops.runGroundOperation('bridge');
ops.runGroundOperation('boarding');
ops.runGroundOperation('baggage');
ops.runGroundOperation('fuel');
assert(!ops.groundOperationsReady(), 'Connected stairs must block pushback');
ops.runGroundOperation('bridge');
assert(ops.groundOperationsReady(), 'Completed and disconnected ground services must release the aircraft');
assert(ops.startPushback() === true && state.pushbackTimer === 7, 'Authorized ground flow must start pushback');
ops.updatePushback(7);
assert(state.pushbackComplete && state.pushbackTimer === 0, 'Pushback completion must persist for the checklist');

assert(ops.completeTurnaround() === false, 'Shutdown must not complete before a landing');
state.landingRollout = {};
assert(ops.completeTurnaround() === true, 'A stopped Q400 with condition levers at fuel off must complete shutdown');
assert(saved.completedTurnarounds === 1 && saved.careerXP === 15, 'Completed turnaround reward is incorrect');

console.log('Q400 round 7 full ground-to-shutdown operating flow verified');
