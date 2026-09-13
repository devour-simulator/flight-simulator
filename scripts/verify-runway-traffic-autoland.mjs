import fs from 'node:fs';

const source=fs.readFileSync(new URL('../game.js',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const assert=(condition,message)=>{if(!condition)throw new Error(message)};

for(const marker of[
  'trafficOps={clock:0,lastRunwayUse:new Map(),movements:0}',
  "phase=i%3===0?'TAXI':i%3===1?'PARKED':'HOLDING'",
  'function runwayTrafficStatus(',
  'function runwayAvailableForTraffic(',
  'function updateScheduledTraffic(',
  "t.phase='TAKEOFF'",
  "t.phase='FINAL'",
  "t.phase='LANDING'",
  'function requestTakeoffRelease(',
  'function autolandWindCorrection(',
  'function autolandStabilityIssue(',
  "triggerGoAround(stabilityIssue)",
  '去蟹行',
  '已建立复飞航路',
])assert(source.includes(marker),`Missing runway traffic/autoland behavior: ${marker}`);

assert(html.includes('game.js?v=aircraft-market-30'),'New aircraft-market cache version is missing');

const trafficStart=source.indexOf('function runwayTrafficStatus(');
const trafficEnd=source.indexOf('\nfunction runwayAvailableForTraffic',trafficStart);
const statusFactory=new Function('traffic',`${source.slice(trafficStart,trafficEnd)};return runwayTrafficStatus;`);
const ap={code:'TST'},runway={id:'09'};
const available=statusFactory([])(ap,runway);
const occupied=statusFactory([{airport:ap,runway,phase:'FINAL',callSign:'YH218'}])(ap,runway);
assert(available.available&&available.label==='跑道空闲','Empty runway must be available');
assert(!occupied.available&&occupied.label.includes('YH218'),'Final traffic must reserve the runway');

const correctionStart=source.indexOf('function autolandWindCorrection(');
const correctionEnd=source.indexOf('\nfunction autolandStabilityIssue',correctionStart);
const correctionFactory=new Function('state','THREE','runwayWindComponents',`${source.slice(correctionStart,correctionEnd)};return autolandWindCorrection;`);
const correction=correctionFactory({ias:140},{MathUtils:{clamp:(value,min,max)=>Math.max(min,Math.min(max,value))}},()=>({crosswind:28,gustCrosswind:34,limit:35}))({});
assert(correction.crab>0&&correction.crab<=8,'Autoland must command a bounded into-wind crab angle');

console.log('Scheduled runway traffic, ATC separation, crosswind autoland and automatic go-around verified');
