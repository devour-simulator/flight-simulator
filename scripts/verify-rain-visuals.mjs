import fs from 'node:fs';

const source=fs.readFileSync(new URL('../game.js',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const assert=(condition,message)=>{if(!condition)throw new Error(message)};

for(const marker of[
  'const rainDropCount=950',
  'new THREE.LineSegments(rainGeo,rainMaterial)',
  'function stabilizeRainSegments()',
  'wetRunwayMaterial',
  "const wet=key==='rain'||key==='storm'",
  "asphaltMat.roughness=wet?.34:1",
  "setAirfieldLighting(key)",
])assert(source.includes(marker),`Missing rain visual marker: ${marker}`);

for(const marker of[
  'class="rain-haze"',
  '.view-external .rain-layer{clip-path:none',
  '@keyframes rainFallNear',
  'game.js?v=',
])assert(html.includes(marker),`Missing rain interface marker: ${marker}`);

assert(!source.includes('new THREE.Points(rainGeo'), 'Rain must not render as square point sprites');
assert(html.includes('clip-path:inset(0 0 43% 0)'), 'Cockpit rain must stay off the instrument panel');

console.log('Layered rain, wet runway and cockpit visibility verified');
