import fs from 'node:fs';
import assert from 'node:assert/strict';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const game = fs.readFileSync(new URL('../game.js', import.meta.url), 'utf8');

assert.match(html, /id="aircraftMarketBtn"[^>]*>飞机商店</);
assert.match(html, /id="startMarket"/);
assert.match(html, /id="aircraftMarket"/);
assert.equal((html.match(/data-market-tab=/g) || []).length, 2);
assert.match(html, /data-market-tab="new"[^>]*>全新飞机</);
assert.match(html, /data-market-tab="used"[^>]*>二手飞机</);
assert.match(html, /id="marketBank"/);
assert.match(html, /game\.js\?v=aircraft-market-30/);

assert.match(game, /B738:\{[^\n]*price:650000000,usedPrice:180000000/);
assert.match(game, /Q400:\{[^\n]*price:220000000,usedPrice:50000000/);
assert.match(game, /function renderAircraftMarket/);
assert.match(game, /Object\.values\(aircraftProfiles\)\.map/);
assert.match(game, /condition=used\?72:100/);
assert.match(game, /function openAircraftMarket/);
assert.match(game, /renderAircraftMarket\(button\.dataset\.marketTab\)/);
assert.match(game, /careerMarkup\(\);renderAircraftMarket\(\);saveCareer\(\)/);
assert.match(game, /marketBank[^\n]*careerPanel/);

console.log('Aircraft marketplace checks passed.');
