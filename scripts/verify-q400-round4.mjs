import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../game.js', import.meta.url), 'utf8');
const start = source.indexOf('const missionCatalog=');
const end = source.indexOf('\nfunction careerLevel()', start);
if (start < 0 || end < 0) throw new Error('Unable to extract Q400 mission system');

const saved = { regionalMissionRotation: 0, q400MissionRotation: 0 };
const state = { currentAirport: 'YHI', x: 0, z: 2050 };
const airports = [
  { code: 'YHI', x: 0, z: 0 }, { code: 'SMA', x: -52000, z: -65000 },
  { code: 'LGA', x: 35000, z: -50000 }, { code: 'EAS', x: 80000, z: -35000 },
  { code: 'WDS', x: -105000, z: -40000 }, { code: 'NPL', x: 45000, z: -100000 },
];
const displayDistanceKm = distance => distance / 1000;
const weatherProfiles = { clear: { name: '晴朗' }, wind: { name: '大风' }, rain: { name: '降雨' }, fog: { name: '大雾' }, night: { name: '夜间' }, storm: { name: '雷雨' } };
const noop = () => {};
const factory = new Function('saved', 'state', 'airports', 'displayDistanceKm', 'weatherProfiles', 'saveCareer', 'renderMissionCenter', 'toast', `${source.slice(start, end)}; return { missionCatalog, missionVariant, q400MissionVariant, refreshMissionBoard };`);
const { missionCatalog, missionVariant, refreshMissionBoard } = factory(saved, state, airports, displayDistanceKm, weatherProfiles, noop, noop, noop);
const assert = (condition, message) => { if (!condition) throw new Error(message); };

const shortBase = missionCatalog.find(mission => mission.id === 'q400-short');
const iceBase = missionCatalog.find(mission => mission.id === 'q400-ice');
const firstShort = missionVariant(shortBase), firstIce = missionVariant(iceBase);
assert(firstShort.requiredAircraft === 'Q400' && firstShort.payload, 'Q400 regional contract must include aircraft and payload');
assert(firstShort.destination !== state.currentAirport, 'Q400 contract cannot target the current airport');
assert(firstShort.maxTouchdownSpeed === 142 && firstShort.maxSink === 650, 'Short-field contract must enforce Q400 landing limits');
assert(firstIce.minDeiceSeconds === 3 && ['rain', 'storm'].includes(firstIce.weather), 'Icing contract must require de-ice use in wet weather');

refreshMissionBoard();
const nextShort = missionVariant(shortBase);
assert(nextShort.destination !== firstShort.destination || nextShort.payload !== firstShort.payload, 'Refresh must rotate Q400 route or payload');
assert(source.includes("pendingMission?.weather||(state.simpleMode?'clear':$('#weatherSelect').value)"), 'Accepted mission weather must survive flight start');
assert(source.includes('saved.q400Passengers') && source.includes('saved.q400RegionalFlights'), 'Q400 passenger and flight totals must be saved');

console.log('Q400 round 4 rotating contracts, payload brief and career tracking verified');
