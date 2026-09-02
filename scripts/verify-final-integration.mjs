import fs from 'node:fs';

const source=fs.readFileSync(new URL('../game.js',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const assert=(condition,message)=>{if(!condition)throw new Error(message)};

for(const marker of[
  'function dispatchPerformance()',
  'function renderFlightCenter()',
  'function generateFlightDispatch()',
  'function requestNextATC()',
  'function triggerAircraftFailure(type,training=false)',
  'function clearTrainingFailure()',
  "failureMode:difficulty==='failures'?'realistic':'off'",
  "['hold-short','等待点']",
  "['shutdown','停机']",
  "hapticFeedback(.65,500,.8)",
])assert(source.includes(marker),`Missing final integration marker: ${marker}`);

for(const marker of[
  'id="flightCenterBtn"',
  'id="flightCenter"',
  'id="dispatchGrid"',
  'id="phaseLine"',
  'id="flightHealthGrid"',
  'id="failureMode"',
  'id="startDispatch"',
  'data-training-failure="engine"',
  'game.js?v=',
])assert(html.includes(marker),`Missing final integration interface: ${marker}`);

const start=source.indexOf('function dispatchPerformance()');
const end=source.indexOf('\nfunction flightHealthCards()',start);
assert(start>=0&&end>start,'Dispatch performance function must be extractable');
const state={x:0,z:0,baseZfw:22000,fuel:3500,weight:25500};
const aircraft={id:'Q400',ceiling:25000,approachSpeed:112};
const airport={code:'TST',x:10000,z:0,runways:[{id:'09',lengthFt:6200}]};
const factory=new Function('state','activeAircraft','activeWeather','selectedAirport','$','runwayWindComponents','displayDistanceKm','THREE','calculateQ400VSpeeds','fmcSpeeds',`${source.slice(start,end)};return dispatchPerformance;`);
const calculate=factory(state,aircraft,{rain:0,gust:4},()=>airport,selector=>({value:selector==='#runwaySelect'?'09':''}),()=>({direction:90,headwind:4,crosswind:0,gustCrosswind:0,limit:32,withinLimit:true}),meters=>meters*8/1000,{MathUtils:{clamp:(value,min,max)=>Math.max(min,Math.min(max,value))}},()=>({v1:90,vr:94,v2:102,vref:113}),()=>({v1:130,vr:135,v2:142}));
const dispatch=calculate();
assert(dispatch.recommendedFuel>0&&dispatch.recommendedFuel<=4200,'Q400 dispatch fuel must stay within tank capacity');
assert(dispatch.recommendedAltitude<=24000,'Q400 dispatch cruise must respect the 25,000 ft ceiling margin');
assert(dispatch.speeds.v1<dispatch.speeds.vr&&dispatch.speeds.vr<dispatch.speeds.v2,'Dispatch V-speeds must be ordered');
assert(dispatch.runwayOk&&dispatch.runwayLength===6200,'Dispatch must evaluate runway suitability');

console.log('Final integrated dispatch, ATC, failure training and interface verified');
