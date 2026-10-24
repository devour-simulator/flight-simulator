import fs from 'node:fs';
import assert from 'node:assert/strict';

const source=fs.readFileSync(new URL('../game.js',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');

assert.ok(!source.includes("comfortLoss+=(activeWeather.gust-12)"),'Wind must not passively reduce passenger comfort');
assert.ok(source.includes("if(activeWeather.gust>12&&activeWeatherKey==='storm')safetyLoss+=.008*dt"),'Storm safety risk should remain separate from comfort');
assert.ok(source.includes('if(Math.abs(state.roll)>26){comfortLoss+='),'Actual excessive bank must still affect comfort');
assert.ok(source.includes('if(rollRate>18){comfortLoss+='),'Actual abrupt roll must still affect comfort');
assert.ok(source.includes('if(verticalJolt>520){comfortLoss+='),'Actual vertical jolts must still affect comfort');
assert.ok(html.includes('game.js?v=atc-release-38'),'ATC release cache version is missing');
console.log('Wind no longer passively drains passenger comfort.');
