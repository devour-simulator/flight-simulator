import fs from 'node:fs';

const source = fs.readFileSync(new URL('../game.js', import.meta.url), 'utf8');
const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

for (const marker of [
  'function calculateQ400VSpeeds()',
  'function toggleAutofeather()',
  'function toggleQ400Deice()',
  'function recordQ400Maintenance(',
  'function monitorRunwaySafety(dt)',
  "AUTOFEATHER · PROP ${failed+1} FEATHERED",
  "recordQ400Maintenance('PW150A 超限检查'",
  "recordQ400Maintenance('严重积冰检查'",
  "recordQ400Maintenance(landingLoss?'Q400 重着陆检查':'Q400 航后检查'",
  "animateGroundService('牵引车',8)",
]) assert(source.includes(marker), `Missing round 8 marker: ${marker}`);

for (const marker of [
  'id="q400Ops"',
  'id="q400VSpeeds"',
  'id="autofeatherBtn"',
  'id="q400DeiceBtn"',
  'id="maintenanceHistory"',
  'game.js?v=',
]) assert(html.includes(marker), `Missing round 8 interface: ${marker}`);

const speedStart = source.indexOf('function calculateQ400VSpeeds()');
const speedEnd = source.indexOf('\nfunction updateQ400OperationsPanel', speedStart);
const speedState = { weight:23000, baseZfw:19000, fuel:4000, flaps:2, q400VSpeeds:null };
const speedFactory = new Function('state','activeWeather','THREE',`${source.slice(speedStart, speedEnd)}; return calculateQ400VSpeeds;`);
const calculate = speedFactory(speedState,{gust:0},{MathUtils:{clamp}});
const light = calculate();
speedState.weight = 29000;
const heavy = calculate();
assert(heavy.v1 > light.v1 && heavy.vr > light.vr && heavy.vref > light.vref, 'Q400 V-speeds must rise with weight');
assert(light.v1 < light.vr && light.vr < light.v2, 'Q400 takeoff V-speeds must be ordered V1 < VR < V2');

const powerStart = source.indexOf('function updateQ400Powerplant(dt,densityRatio,running)');
const powerEnd = source.indexOf('\nfunction flightPhysics', powerStart);
const powerState = {
  ias:140,heading:0,onGround:false,throttle:75,conditionLever:100,propRpm:1020,bladePitch:20,
  propFeather:[false,false],engines:[0,60],q400Torque:[0,0],torque:0,engineYaw:0,failedEngine:null,
  autoFeatherArmed:true,autoFeatherTriggered:false,temperature:5,itt:400,nh:0,nl:0,icingLevel:0,
  engineOverlimitTime:0,q400OverlimitLogged:false,q400IcingLogged:false,tas:0,groundSpeed:0,reversePower:0,
};
const notices = [];
const powerFactory = new Function(
  'state','activeAircraft','activeWeather','ui','aircraftSystemStatus','damp','THREE','syncFeatherButtons',
  'toast','speakCallout','warningTone','performance','recordQ400Maintenance','warningTimer',
  `${source.slice(powerStart, powerEnd)}; return updateQ400Powerplant;`,
);
const updatePowerplant = powerFactory(
  powerState,{id:'Q400',maxSpeed:360},{wind:0,rain:false},{throttle:{value:75}},
  () => ({icingRisk:false,iceProtected:false}),(current,target) => target,{MathUtils:{clamp}},() => {},
  message => notices.push(message),() => {},() => {},{now:() => 10000},() => {},0,
);
updatePowerplant(.1,1,.5);
assert(powerState.propFeather[0] && powerState.autoFeatherTriggered, 'Armed autofeather must feather a failed Q400 engine');
assert(notices.some(message => message.includes('AUTOFEATHER')), 'Autofeather must tell the pilot what happened');

const runwayStart = source.indexOf('function monitorRunwaySafety(dt)');
const runwayEnd = source.indexOf('\nfunction updateFlightExperience', runwayStart);
const runwayState = {running:true,onGround:true,pushbackTimer:0,ias:32,throttle:70,simpleMode:false,atcPhase:'taxi',runwayIncursionWarned:false};
const runwayUi = {throttle:{value:70}};
const runwayFactory = new Function(
  'state','ui','nearestRunway','setATCInstruction','offerTakeoffClearance','toast','warningTone','recordQ400Maintenance',
  `${source.slice(runwayStart, runwayEnd)}; return monitorRunwaySafety;`,
);
const runwayNotices = [];
const monitorRunway = runwayFactory(
  runwayState,runwayUi,() => ({lateral:12,longitudinal:900,r:{id:'09'},ap:{code:'YHI'}}),
  () => {},() => {},message => runwayNotices.push(message),() => {},() => {},
);
monitorRunway(.5);
assert(runwayState.throttle === 0 && runwayUi.throttle.value === 0, 'Unauthorized runway entry must close power');
assert(runwayState.runwayIncursionWarned && runwayNotices.some(message => message.includes('RUNWAY INCURSION')), 'Runway incursion protection must warn the pilot');

console.log('Q400 round 8 performance, autofeather, maintenance and runway safety verified');
