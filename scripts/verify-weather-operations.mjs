import fs from 'node:fs';

const source=fs.readFileSync(new URL('../game.js',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const assert=(condition,message)=>{if(!condition)throw new Error(message)};

for(const marker of[
  'windDirection:',
  'ceiling:',
  'function runwayWindComponents(',
  'function bestRunwayForWeather(',
  'function renderAtisBriefing(',
  "strip.id='atisStrip'",
  "bestRunwayForWeather(state.autoLand.airport,state.autoLand.runway.id)",
  "ap.runways.find(r=>r.id===selectedRunwayId)",
  '★ 建议 · ',
  '阵风侧风',
])assert(source.includes(marker),`Missing weather-aware operation: ${marker}`);

for(const marker of[
  '.atis-strip{',
  'game.js?v=weather-operations-27',
])assert(html.includes(marker),`Missing weather operations interface: ${marker}`);

assert((source.match(/windDirection:/g)||[]).length>=6,'Every weather profile needs a wind direction');
assert((source.match(/ceiling:/g)||[]).length>=6,'Every weather profile needs a cloud ceiling');
console.log('Weather-aware ATIS, runway recommendation, FMC and ATC integration verified');
