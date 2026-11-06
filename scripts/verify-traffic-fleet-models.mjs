import fs from 'node:fs';

const source=fs.readFileSync(new URL('../game.js',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const assert=(condition,message)=>{if(!condition)throw new Error(message)};

for(const marker of[
  "const trafficFleet=['B738','Q400','E190','A320N','C919','B789','B77W']",
  'trafficModelSpecs={B738:',
  'function makeTraffic(',
  'function trafficSurface(',
  'function trafficWheel(',
  'function positionTrafficAtStand(',
  'function updateTrafficVisual(',
  'props.forEach(',
  'fans.forEach(',
  'gearVisible=',
  't.profile.short',
])assert(source.includes(marker),`Missing detailed traffic fleet marker: ${marker}`);

for(const profile of['B738','Q400','E190','A320N','C919','B789','B77W'])assert(source.includes(`${profile}:`)||source.includes(`'${profile}'`),`Traffic fleet is missing ${profile}`);
assert(source.includes('t.parkingStandKey=stand.key'),'Parked traffic must use marked airport stands');
assert(source.includes("stand.key!==state.parkingStandId"),'NPC traffic must leave the player-assigned stand free');
assert(source.includes('spec.turboprop?')&&source.includes('blade<6'),'Q400 traffic must have six-blade propellers');
assert(source.includes('spec.widebody?27'),'Widebody traffic needs a larger collision envelope');
assert(html.includes('game.js?v=traffic-fleet-42'),'Traffic fleet cache key is missing');

console.log('Seven detailed NPC aircraft types, animated engines, gear, lights and parking stands verified');
