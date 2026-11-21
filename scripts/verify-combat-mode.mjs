import assert from 'node:assert/strict';
import fs from 'node:fs';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const game=fs.readFileSync(new URL('../game.js',import.meta.url),'utf8');

for(const token of ['id="combatStart"','id="combatHud"','id="combatMarker"','id="combatMouseHint"','id="combatRadar"','id="combatMissionSelect"','id="combatDifficulty"','id="combatObjective"','id="combatBoss"','game.js?v=combat-missions-47'])assert.ok(html.includes(token),`Missing combat UI token: ${token}`);
for(const token of ['function makeCombatFighter','function beginCombatMode','function spawnCombatWave','function fireCombatCannon','function fireCombatMissile','function releaseCombatFlare','function updateCombatFlight','function updateCombatBattle','function endCombatMode','combatMissionProfiles','combatDifficultyProfiles','combatEnemyProfiles','function grantCombatReward'])assert.ok(game.includes(token),`Missing combat runtime: ${token}`);
assert.ok(game.includes('maxWaves:5'),'Combat mode should contain five waves');
assert.ok(game.includes("key==='r'")&&game.includes("key==='x'"),'Combat keyboard shortcuts are missing');
assert.ok(game.includes("$('#combatStart').onclick=beginCombatMode"),'Combat lobby entry is not connected');
assert.ok(game.includes('requestPointerLock')&&game.includes('pointerlockchange')&&game.includes('movementX'),'Mouse aiming and cursor lock are missing');
assert.ok(game.includes('function drawCombatRadar')&&game.includes('AUTO LOCK')&&game.includes("marker.classList.toggle('offscreen'"),'Automatic lock, radar or off-screen direction indicator is missing');
assert.ok(game.includes("tactic==='cross'")&&game.includes('behindPlayer')&&game.includes('targetSpeed=enemy.tactic'),'Enemy attack-pass and crossing maneuvers are missing');
assert.ok(game.includes("mission==='intercept'")&&game.includes("mission==='escort'")&&game.includes("type==='boss'"),'Mission-specific rules and ace boss are missing');
assert.ok(game.includes('bestCombo')&&game.includes('战场维修 +12%'),'Combo scoring and combat rewards are missing');
console.log('Combat mode static verification passed.');
