import fs from 'node:fs';

const source=fs.readFileSync(new URL('../game.js',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const assert=(condition,message)=>{if(!condition)throw new Error(message)};

for(const marker of[
  'onboardingComplete:false',
  'function arrangeStartModes()',
  "modes.prepend(quick);modes.append(simple)",
  'const firstVisitTutorialSteps=[',
  "tutorialKind==='welcome'",
  "saved.onboardingComplete=true",
  "localStorage.setItem('b738-first-visit-complete','1')",
  "$('#firstVisitStart').onclick=()=>beginTutorial('welcome')",
])assert(source.includes(marker),`Missing first-visit behavior: ${marker}`);

for(const text of[
  '第一次来？先用简单模式学会飞',
  '进入简单模式并开始教学',
  'Boeing 737-800',
  'Dash 8 Q400',
  'id="lobbyHint"',
  'game.js?v=first-visit-tutorial-26',
])assert(html.includes(text),`Missing first-visit interface: ${text}`);

assert(firstVisitStepCount(source)>=12,'First-visit tutorial must cover all major rules and both aircraft');
console.log('First-login prompt, two-aircraft tutorial and post-tutorial lobby order verified');

function firstVisitStepCount(code){
  const start=code.indexOf('const firstVisitTutorialSteps=['),end=code.indexOf('];',start);
  return (code.slice(start,end).match(/\{title:/g)||[]).length;
}
