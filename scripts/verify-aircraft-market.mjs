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
assert.match(html, /id="refreshUsedAircraft"/);
assert.match(html, /game\.js\?v=variable-used-wear-31/);

assert.match(game, /B738:\{[^\n]*price:650000000,usedPrice:180000000/);
assert.match(game, /Q400:\{[^\n]*price:220000000,usedPrice:50000000/);
assert.match(game, /function renderAircraftMarket/);
assert.match(game, /Object\.values\(aircraftProfiles\)\.map/);
assert.match(game, /function createUsedAircraftListing/);
assert.match(game, /function refreshUsedAircraftListings/);
assert.match(game, /aircraftMaxCondition/);
assert.match(game, /function naturalWearForFlight/);
assert.match(game, /function applyNaturalWear/);
assert.match(game, /永久损耗/);
assert.match(game, /function openAircraftMarket/);
assert.match(game, /renderAircraftMarket\(button\.dataset\.marketTab\)/);
assert.match(game, /careerMarkup\(\);renderAircraftMarket\(\);saveCareer\(\)/);
assert.match(game, /marketBank[^\n]*careerPanel/);

const priceStart = game.indexOf('function usedAircraftPrice(');
const priceEnd = game.indexOf('\nfunction ensureUsedAircraftListings', priceStart);
const pricing = new Function(`${game.slice(priceStart, priceEnd)};return {usedAircraftPrice,createUsedAircraftListing};`)();
const q400 = { id: 'Q400', usedPrice: 50_000_000 };
assert.equal(pricing.usedAircraftPrice(q400, 72), 50_000_000);
assert.ok(pricing.usedAircraftPrice(q400, 90) > pricing.usedAircraftPrice(q400, 60));
assert.equal(pricing.createUsedAircraftListing(q400, 0).condition, 52);
assert.equal(pricing.createUsedAircraftListing(q400, 0.999999).condition, 91);

const wearStart = game.indexOf('function naturalWearForFlight(');
const wearEnd = game.indexOf('\nfunction applyNaturalWear', wearStart);
const wear = new Function(`${game.slice(wearStart, wearEnd)};return naturalWearForFlight;`)();
assert.ok(wear({ id: 'Q400' }, 2) > wear({ id: 'B738' }, 2));
assert.ok(wear({ id: 'B738' }, 2) > wear({ id: 'B738' }, 0));

const wearApplyEnd = game.indexOf('\nfunction recordFlightResults', wearStart);
const wearSaved = { aircraftMaxCondition: { Q400: 60 }, aircraftCondition: { Q400: 60 }, maintenanceLog: [] };
const wearSystem = new Function('saved', 'aircraftProfiles', `${game.slice(wearStart, wearApplyEnd)};return {applyNaturalWear};`)(wearSaved, { Q400: { id: 'Q400', short: 'Q400' } });
wearSystem.applyNaturalWear('Q400', 2);
assert.ok(wearSaved.aircraftMaxCondition.Q400 < 60);
assert.equal(wearSaved.aircraftCondition.Q400, wearSaved.aircraftMaxCondition.Q400);
assert.equal(wearSaved.maintenanceLog[0].permanent, true);

const maintainStart = game.indexOf('function maintainAircraft(');
const maintainEnd = game.indexOf('\nfunction renderMaintenance', maintainStart);
const maintenanceSaved = { credits: 10_000_000, aircraftCondition: { Q400: 50 }, aircraftMaxCondition: { Q400: 60 } };
const maintenance = new Function('saved', 'toast', 'formatMoney', 'saveCareer', 'careerMarkup', `${game.slice(maintainStart, maintainEnd)};return maintainAircraft;`)(maintenanceSaved, () => {}, String, () => {}, () => {});
maintenance('Q400');
assert.equal(maintenanceSaved.aircraftCondition.Q400, 60);
assert.notEqual(maintenanceSaved.aircraftCondition.Q400, 100);

console.log('Aircraft marketplace checks passed.');
