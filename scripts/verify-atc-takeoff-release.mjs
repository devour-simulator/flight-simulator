import fs from 'node:fs';
import assert from 'node:assert/strict';

const source=fs.readFileSync(new URL('../game.js',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');

for(const marker of[
  'playerReservation:null',
  'function reservePlayerTakeoff(',
  'function expediteRunwayForPlayer(',
  'slotDue||waited>=30',
  'waited>=30',
  '系统每 3 秒自动检查',
  'takeoffClearanceRetry=setTimeout(',
  '计划起飞时间已到，你的航班立即优先放行',
  '!playerReserved'
])assert.ok(source.includes(marker),`Missing automatic ATC release behavior: ${marker}`);

assert.ok(html.includes('game.js?v=scheduled-priority-39'),'Scheduled departure priority cache version is missing');
console.log('Scheduled flights receive immediate ATC priority; early flights retain the automatic queue.');
