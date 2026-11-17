import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
const output='.local-artifacts/reload'; await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
const results=[],errors=[];
try{
 for(const [name,width,height]of[['desktop',1536,1024],['mobile',390,844]]){
  const page=await browser.newPage({viewport:{width,height}});
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
   window.reloadFrames=[]; window.reloadEvents=[];
   for(const event of ['DOMContentLoaded','load','pageshow','scroll'])addEventListener(event,()=>window.reloadEvents.push({event,y:scrollY,restoration:history.scrollRestoration,time:performance.now()}));
   if(performance.getEntriesByType('navigation')[0]?.type==='reload'){
    const sample=()=>{if(document.querySelector('#home'))window.reloadFrames.push({y:scrollY,theme:document.querySelector('nav')?.dataset.theme}); if(window.reloadFrames.length<150)requestAnimationFrame(sample);};requestAnimationFrame(sample);
   }
  });
  await page.goto('http://localhost:5173/#top');await page.waitForTimeout(1400);
  const check=async label=>{
   await page.waitForTimeout(1400);
   const data=await page.evaluate(async()=>{
    const resource=performance.getEntriesByType('resource');
    const storeUrl=resource.find(e=>e.name.includes('/src/store/introStore.js')).name;
    const {useIntroStore}=await import(storeUrl);
    const {_roots}=await import(resource.find(e=>e.name.includes('/@react-three_fiber.js')).name);
    const root=_roots.get(document.querySelector('[data-globe-stage] canvas')).store.getState();let spin,outer;
    root.scene.traverse(o=>{if(o.isPoints&&o.geometry.getAttribute('aSize')){spin=o.parent;outer=spin.parent.parent;}});
    const config=await import(resource.find(e=>e.name.includes('/src/scene/Particles/particleConfig.js')).name);
    return {rootY:document.scrollingElement.scrollTop,pending:document.documentElement.dataset.reloadTop,y:scrollY,active:document.querySelector('.nav-link[aria-current="location"]').textContent.trim(),theme:document.querySelector('nav').dataset.theme,
     progress:useIntroStore.getState().scrollProgress,opacity:useIntroStore.getState().globeOpacity,pose:{x:outer.position.x,y:outer.position.y,radius:outer.scale.x},expected:config.getGlobePose(innerWidth,innerHeight,0),yaw:spin.rotation.y,
     frames:window.reloadFrames,events:window.reloadEvents,restoration:history.scrollRestoration,url:location.href};
   });
   assert.equal(data.y,0,`${name}/${label}: reload starts at top ${JSON.stringify({events:data.events,frames:data.frames.slice(0,8)})}`);assert.equal(data.active,'Home');assert.equal(data.theme,'dark');assert.equal(data.progress,0);assert.equal(data.opacity,1);
   for(const key of ['x','y','radius'])assert.ok(Math.abs(data.pose[key]-data.expected[key])<1e-6);
   assert.ok(Math.abs(data.yaw+3.34)<0.15,'Asia-facing starting rotation');
   assert.ok(data.frames.length>0&&data.frames.every(f=>f.y===0&&(!f.theme||f.theme==='dark')),'every observed initial frame stays at top with Home theme');
   assert.equal(data.rootY,0);assert.equal(data.pending,'pending');assert.equal(data.restoration,'manual','reload restoration stays disabled until user intent');
   results.push({name,label,...data});
  };
  for(const id of ['about','events','site-footer']){
   await page.evaluate(id=>{document.documentElement.style.scrollBehavior='auto';scrollTo({top:document.getElementById(id).getBoundingClientRect().top+scrollY-80,behavior:'instant'});},id);await page.waitForTimeout(150);
   assert.ok(await page.evaluate(()=>scrollY>50));await page.reload();await check(id);
  }
  await page.reload();await check('repeated reload');
  await page.evaluate(()=>scrollTo({top:innerHeight/2,behavior:'instant'}));await page.reload();await check('mid-transition reload');
  const cdp=await page.context().newCDPSession(page);await cdp.send('Page.reload',{ignoreCache:true});await page.waitForLoadState('load');await check('hard reload');
  await page.waitForTimeout(8000);assert.equal(await page.evaluate(()=>scrollY),0,'remains at top after eight seconds');
  await page.evaluate(()=>scrollTo({top:document.getElementById('events').getBoundingClientRect().top+scrollY,behavior:'instant'}));
  await page.route('**/hero-portrait-csed.png',async route=>{await new Promise(resolve=>setTimeout(resolve,1500));await route.continue();});
  const imageLoaded=page.waitForResponse(response=>response.url().endsWith('/hero-portrait-csed.png'));
  await page.reload();await imageLoaded;await check('slow image reload');await page.unrouteAll({behavior:'wait'});
  await page.route('**/hero-portrait-csed.png',async route=>{await new Promise(resolve=>setTimeout(resolve,2000));await route.continue();});
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForSelector('nav');await page.mouse.wheel(0,250);await page.waitForTimeout(300);
  const intentionalY=await page.evaluate(()=>scrollY);assert.ok(intentionalY>100);
  await page.waitForLoadState('load');await page.waitForTimeout(500);
  assert.equal(await page.evaluate(()=>scrollY),intentionalY,'late layout verification never resets intentional early scrolling');
  await page.unrouteAll({behavior:'wait'});
  await page.reload();await check('after early input');
  await page.mouse.wheel(0,250);await page.waitForTimeout(300);assert.ok(await page.evaluate(()=>scrollY>100));assert.equal(await page.evaluate(()=>history.scrollRestoration),'auto','trusted wheel releases restoration guard');
  if(width<1024)await page.getByRole('button',{name:'Toggle navigation'}).click();
  await page.locator('nav').getByRole('button',{name:'About',exact:true}).click();
  // Existing About SplitType initialization can interrupt smooth scrolling slightly before its offset.
  await page.waitForFunction(()=>{const nav=document.querySelector('nav').getBoundingClientRect();const y=document.querySelector('#about').getBoundingClientRect().top;return y>=0&&y<nav.bottom+nav.height;},{},{timeout:5000});
  await page.goto('http://localhost:5173/?fresh=1#about');await page.waitForTimeout(1600);assert.ok(await page.evaluate(()=>scrollY>50),'fresh hash navigation preserved');
  await page.reload();await check('hash reload');assert.ok(page.url().endsWith('#about'),'URL hash preserved on reload');
  await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>history.scrollRestoration),'auto');
  await page.evaluate(()=>{document.documentElement.style.scrollBehavior='auto';location.hash='events';});await page.waitForTimeout(400);assert.ok(await page.evaluate(()=>scrollY>1000));
  await page.goBack();await page.waitForTimeout(400);assert.equal(await page.evaluate(()=>scrollY),0,'same-document Back restores reloaded Home position');
  await page.goForward();await page.waitForTimeout(400);assert.ok(Math.abs(await page.locator('#events').evaluate(e=>e.getBoundingClientRect().top)-80)<2);
  const previousY=await page.evaluate(()=>scrollY);
  await page.goto('http://localhost:5173/?other=1');await page.waitForTimeout(700);await page.goBack();await page.waitForTimeout(1400);
  assert.ok(Math.abs(await page.evaluate(()=>scrollY)-previousY)<2,'cross-document Back restores prior scroll');
  await page.screenshot({path:`${output}/${name}-back-restored.png`});
  await page.reload();await check('after history restore');await page.screenshot({path:`${output}/${name}-reloaded-home.png`});
  await page.close();
 }
 assert.deepEqual(errors,[]);await writeFile(`${output}/results.json`,JSON.stringify({results,errors},null,2));
 console.log('PASS: About/Events/Footer/repeated/hash reloads, first-frame Home state, hero pose, normal scroll/navigation, hash preservation and Back/Forward.');
}finally{await browser.close();}
