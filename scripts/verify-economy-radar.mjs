import fs from 'node:fs';

const source=fs.readFileSync(new URL('../game.js',import.meta.url),'utf8');
const assert=(condition,message)=>{if(!condition)throw new Error(message)};

for(const marker of[
  'function calculateFlightEconomics(',
  'ticketRevenue',
  'fuelCost',
  'airportFees',
  'maintenanceReserve',
  'function layoutRadarAirports(',
  'renderNavigationMap(ui.externalRadar)',
])assert(source.includes(marker),`Missing economy/radar feature: ${marker}`);

const routeStart=source.indexOf('const routeContracts=');
const routeEnd=source.indexOf('\n',routeStart);
const economyStart=source.indexOf('function calculateFlightEconomics(');
const economyEnd=source.indexOf('\nfunction settleAirlineFlight',economyStart);
const economyFactory=new Function('state','activeAircraft','THREE','displayDistanceKm',`${source.slice(routeStart,routeEnd)}\n${source.slice(economyStart,economyEnd)}\nreturn calculateFlightEconomics;`);
const state={payloadPassengers:174,payloadBaggage:1800,fuel:6800,flightMetrics:{fuelStart:7800,elapsed:3600}};
const activeAircraft={id:'B738',capacity:174};
const THREE={MathUtils:{clamp:(value,min,max)=>Math.max(min,Math.min(max,value))}};
const calculateFlightEconomics=economyFactory(state,activeAircraft,THREE,meters=>meters*8/1000);
const economics=calculateFlightEconomics({code:'YHI',x:0,z:0},{code:'LGA',x:62500,z:0},{overall:90});
assert(economics.ticketRevenue>0&&economics.fuelCost===7200,'Ticket revenue or fuel-cost calculation is incorrect');
assert(economics.net<500000&&economics.net>-500000,'A routine flight must not create multi-million profit/loss');
assert(economics.gross===economics.ticketRevenue+economics.cargoRevenue+economics.contractBonus,'Gross revenue breakdown is inconsistent');

const layoutStart=source.indexOf('function layoutRadarAirports(');
const layoutEnd=source.indexOf('\nfunction renderNavigationMap',layoutStart);
const layoutFactory=new Function('state',`${source.slice(layoutStart,layoutEnd)}\nreturn layoutRadarAirports;`);
const layout=layoutFactory({currentAirport:'CUR',x:0,z:0});
const candidates=Array.from({length:30},(_,i)=>({code:i===0?'CUR':i===1?'DST':`A${i}`,x:(i%6)*3,z:Math.floor(i/6)*3,database:i>4}));
const labels=layout(candidates,(x,z)=>[100+x,70+z],()=>true,{code:'DST'},12);
assert(labels.length<=12,'Radar label count must be limited');
assert(labels.some(item=>item.ap.code==='CUR')&&labels.some(item=>item.ap.code==='DST'),'Current and destination airports must be prioritized');
const ordinary=labels.filter(item=>!['CUR','DST'].includes(item.ap.code));
for(let i=0;i<ordinary.length;i++)for(let j=i+1;j<ordinary.length;j++)assert(Math.hypot(ordinary[i].p[0]-ordinary[j].p[0],ordinary[i].p[1]-ordinary[j].p[1])>=26,'Nearby ordinary airports must be merged on radar');
for(let i=0;i<labels.length;i++)for(let j=i+1;j<labels.length;j++){
  const a=labels[i],b=labels[j],aw=Math.max(24,a.ap.code.length*5.7),bw=Math.max(24,b.ap.code.length*5.7);
  const overlap=a.labelX-2<b.labelX+bw+2&&a.labelX+aw+2>b.labelX-2&&a.labelY-10<b.labelY+3&&a.labelY+3>b.labelY-10;
  assert(!overlap,`Radar labels overlap: ${a.ap.code}/${b.ap.code}`);
}

const rewards=[...source.matchAll(/reward:(\d+)/g)].map(match=>+match[1]);
assert(Math.max(...rewards)<500000,'Mission rewards should be measured in thousands, not millions');
console.log('Airline economy and decluttered shared radar verified');
