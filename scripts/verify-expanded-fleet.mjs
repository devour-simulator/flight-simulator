import fs from 'node:fs';
import assert from 'node:assert/strict';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const game=fs.readFileSync(new URL('../game.js',import.meta.url),'utf8');
const expected=[
  ['B738','Boeing 737-800'],
  ['Q400','Dash 8 Q400'],
  ['E190','Embraer E190-E2'],
  ['A320N','Airbus A320neo'],
  ['C919','COMAC C919'],
  ['B789','Boeing 787-9 Dreamliner'],
  ['B77W','Boeing 777-300ER']
];

for(const [id,name] of expected){
  assert.match(game,new RegExp(`${id}:\\{id:'${id}',name:'${name.replace(/[.*+?^${}()|[\\]\\]/g,'\\$&')}'`));
}
assert.equal((game.match(/fuelCapacity:/g)||[]).length,expected.length);
assert.equal((game.match(/cruiseSpeed:/g)||[]).length,expected.length);
assert.equal((game.match(/referenceWeight:/g)||[]).length,expected.length);
assert.match(game,/grid\.innerHTML=Object\.values\(aircraftProfiles\)\.map/);
assert.match(game,/满油量<b>\$\{p\.fuelCapacity\.toLocaleString\(\)\} KG/);
assert.match(game,/state\.weight=profile\.referenceWeight/);
assert.match(game,/const autoRotateSpeed=activeAircraft\.autoRotateSpeed/);
assert.match(game,/referenceWeight=activeAircraft\.referenceWeight/);
assert.match(game,/recommendedSpeed:Math\.min\(activeAircraft\.cruiseSpeed/);
assert.match(html,/game\.js\?v=career-contracts-33/);

console.log('Expanded seven-aircraft fleet, market cards and profile-specific flight data verified.');
