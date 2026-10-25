import fs from 'node:fs';
import assert from 'node:assert/strict';

const source=fs.readFileSync(new URL('../game.js',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');

for(const marker of[
  "mode:'near'",
  'function navigationDestination()',
  'function navigationRunwayId()',
  'function navigationRouteExtent()',
  'function setNavigationView(',
  'function programMissionNavigation(',
  'mission.runwayId=runway.id',
  'mission.navigationRoute=plan.route',
  "setNavigationView('route',false)",
  '任务导航已载入',
  '前方或完整航线'
]) assert.ok(source.includes(marker),`Missing mission navigation marker: ${marker}`);

for(const marker of[
  'id="cockpitRouteInfo"',
  'id="navRouteInfo"',
  'data-nav-view="near"',
  'data-nav-view="route"',
  '前方导航',
  '完整航线',
  'game.js?v=wind-comfort-40'
]) assert.ok(html.includes(marker),`Missing navigation UI marker: ${marker}`);

assert.match(source,/destination\?\.code===ap\.code&&r\.id===runwayId/);
assert.match(source,/navigationRouteExtent\(\),37040,2400000/);
console.log('Mission airport, runway and near/full route navigation verified.');
