import fs from 'node:fs';
import assert from 'node:assert/strict';

const source=fs.readFileSync(new URL('../game.js',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');

assert.ok(!source.includes("comfortLoss+=(activeWeather.gust-12)"),'Wind must not passively reduce passenger comfort');
assert.ok(source.includes("if(activeWeather.gust>12&&activeWeatherKey==='storm')safetyLoss+=.008*dt"),'Storm safety risk should remain separate from comfort');
assert.ok(source.includes("const windComfortProtected=activeWeatherKey==='wind'"),'Strong-wind comfort protection must be active');
assert.ok(source.includes('if(!windComfortProtected&&Math.abs(state.roll)>26){comfortLoss+='),'Wind-induced bank must not reduce comfort');
assert.ok(source.includes('if(!windComfortProtected&&rollRate>18){comfortLoss+='),'Wind-induced roll rate must not reduce comfort');
assert.ok(source.includes('if(!windComfortProtected&&pitchRate>10){comfortLoss+='),'Wind-induced pitch rate must not reduce comfort');
assert.ok(source.includes('if(!windComfortProtected&&verticalJolt>520){comfortLoss+='),'Wind-induced vertical jolts must not reduce comfort');
assert.ok(source.includes('if(state.stallSeverity>.04||state.aoa>=state.criticalAoa)'),'Stall must still reduce comfort');
assert.ok(source.includes('if(state.ias>activeAircraft.passengerOverspeed)'),'Overspeed must still reduce comfort');
assert.ok(html.includes('game.js?v=wind-comfort-40'),'Wind comfort cache version is missing');
console.log('Strong wind and its unavoidable motion no longer reduce passenger comfort.');
