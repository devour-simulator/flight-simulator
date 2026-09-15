import fs from 'node:fs';
import assert from 'node:assert/strict';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const game=fs.readFileSync(new URL('../game.js',import.meta.url),'utf8');

for(const marker of[
  'id="flightModeSelect"',
  'id="conditionBadge"',
  'id="gameClock"',
  'id="employmentPanel"',
  'id="contractAircraftMode"',
  'id="contractAircraftSelect"',
  '公司提供飞机 · 奖励 ×1.0',
  '租飞机 · 奖励 ×1.4',
  '自己的飞机 · 奖励 ×2.0'
])assert.ok(html.includes(marker),`Missing career interface: ${marker}`);

for(const marker of[
  'GAME_MINUTES_PER_REAL_SECOND=1',
  'COMPANY_FOUNDING_REQUIREMENT=200000000',
  'function gameCalendar(',
  'function processDailyLoanPayment(',
  'function advanceGameClock(',
  'function renderEmployment(',
  'function rentalCost(',
  'function missionSchedule(',
  "company:{label:'公司提供飞机',multiplier:1",
  "rental:{label:'租飞机接单',multiplier:1.4",
  "owned:{label:'自己的飞机',multiplier:2",
  "'own-company':{label:'自己航空公司的航线',multiplier:2.6",
  'state.contractAircraftId=pendingMission.aircraftId',
  'scheduledDeparture:schedule.departure',
  'scheduledArrival:schedule.arrival',
  'updateConditionBadge()'
])assert.ok(game.includes(marker),`Missing career behavior: ${marker}`);

const clockStart=game.indexOf('function gameCalendar(');
const clockEnd=game.indexOf('\nfunction processDailyLoanPayment',clockStart);
const clock=new Function('saved',`${game.slice(clockStart,clockEnd)};return {gameCalendar,formatGameTime};`)({gameMinute:540});
assert.equal(clock.formatGameTime(540),'第1年 1月1日 星期一 09:00');
assert.equal(clock.formatGameTime(1980),'第1年 1月2日 星期二 09:00');

console.log('Career modes, contract aircraft, game clock, company gate and daily loan UI verified.');
