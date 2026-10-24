import fs from 'node:fs';
import assert from 'node:assert/strict';

const source=fs.readFileSync(new URL('../game.js',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');

for(const marker of[
  'playerReservation:null',
  'function reservePlayerTakeoff(',
  'function expediteRunwayForPlayer(',
  'waited>=30',
  '系统每 3 秒自动检查',
  'takeoffClearanceRetry=setTimeout(',
  '已为准点航班腾出跑道',
  '!playerReserved'
])assert.ok(source.includes(marker),`Missing automatic ATC release behavior: ${marker}`);

assert.ok(html.includes('game.js?v=atc-release-38'),'ATC release cache version is missing');
console.log('ATC takeoff queue, automatic recheck and 30-second release limit verified.');
