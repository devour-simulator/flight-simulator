import fs from 'node:fs';
import assert from 'node:assert/strict';

const source=fs.readFileSync(new URL('../game.js',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');

for(const marker of[
  'PILOT_RECRUIT_COST=2000000',
  'PILOT_DAILY_GROSS=220000',
  'PILOT_DAILY_WAGE=80000',
  'PILOT_DAILY_RESERVE=35000',
  'HANGAR_BASE_COST=25000000',
  'HANGAR_PILOT_SLOTS=3',
  'function processAirlineDailyOperations(',
  'function buyCompanyHangar(',
  'function recruitAirlinePilot(',
  'function renderCompanyOperations(',
  'processAirlineDailyOperations(day);processDailyLoanPayment(day)',
  '航空公司运营 · 机库与雇员',
  '每名雇员需要 1 架闲置的自有飞机和 1 个机库席位'
]) assert.ok(source.includes(marker),`Missing airline company marker: ${marker}`);

assert.match(source,/Math\.min\(saved\.hiredPilots\|\|0,airlinePilotCapacity\(\),Math\.max\(0,saved\.ownedAircraft\.length-1\)\)/);
assert.match(html,/\.company-operations\{/);
assert.match(html,/game\.js\?v=airline-career-35/);
console.log('Airline company operations verification passed.');
