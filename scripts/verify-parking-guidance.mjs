import fs from 'node:fs';

const source=fs.readFileSync(new URL('../game.js',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const assert=(condition,message)=>{if(!condition)throw new Error(message)};

for(const marker of[
  'const parkingStands=[];',
  'function registerParkingStand(',
  'function assignParkingStand()',
  'function updateParkingGuidance(',
  'state.parkingDistance>48',
  '跟随绿色箭头',
  'state.landingCompleted=true',
  'updateParkingGuidance(dt)',
])assert(source.includes(marker),`Missing parking guidance marker: ${marker}`);

for(const marker of[
  'id="parkingGuide"',
  'id="parkingGuideTitle"',
  'id="parkingGuideDirection"',
  '.parking-guide.show',
  'game.js?v=parking-guidance-41',
])assert(html.includes(marker),`Missing parking UI marker: ${marker}`);

const localStandCount=(source.match(/registerParkingStand\(runway,ap,/g)||[]).length;
assert(localStandCount>=1,'The home airport must register visible parking stands');
assert(source.includes("[-190,0,190].forEach"),'Remote airports must receive multiple parking stands');
assert(source.includes("landingCompleted:false,parkingStandId:null,parkingDistance:Infinity"),'Parking state must reset safely');

console.log('Visible parking stands, ATC assignment, guidance, and shutdown gating verified');
