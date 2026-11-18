import assert from 'node:assert/strict';
import fs from 'node:fs';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const game=fs.readFileSync(new URL('../game.js',import.meta.url),'utf8');

for(const token of ['id="combatStart"','id="combatHud"','id="combatMarker"','id="combatMouseHint"','id="combatRadar"','game.js?v=combat-radar-45'])assert.ok(html.includes(token),`Missing combat UI token: ${token}`);
for(const token of ['function makeCombatFighter','function beginCombatMode','function spawnCombatWave','function fireCombatCannon','function fireCombatMissile','function releaseCombatFlare','function updateCombatFlight','function updateCombatBattle','function endCombatMode'])assert.ok(game.includes(token),`Missing combat runtime: ${token}`);
assert.ok(game.includes('maxWaves:5'),'Combat mode should contain five waves');
assert.ok(game.includes("key==='r'")&&game.includes("key==='x'"),'Combat keyboard shortcuts are missing');
assert.ok(game.includes("$('#combatStart').onclick=beginCombatMode"),'Combat lobby entry is not connected');
assert.ok(game.includes('requestPointerLock')&&game.includes('pointerlockchange')&&game.includes('movementX'),'Mouse aiming and cursor lock are missing');
assert.ok(game.includes('function drawCombatRadar')&&game.includes('AUTO LOCK')&&game.includes("marker.classList.toggle('offscreen'"),'Automatic lock, radar or off-screen direction indicator is missing');
console.log('Combat mode static verification passed.');
