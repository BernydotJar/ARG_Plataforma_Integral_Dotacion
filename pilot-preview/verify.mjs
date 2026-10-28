import { chromium } from "playwright";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const base = "http://127.0.0.1:36321";
const out = path.join(root,"artifacts","qa","preview-20261027");
fs.mkdirSync(out,{recursive:true});
const results = [];
const unexpectedRequests = [];
let server;
let browser;
let failed = false;
function check(ok, description) {
  results.push({status:ok?"PASS":"FAIL",description});
  if(!ok) failed=true;
}
try {
  server = spawn(process.execPath,["pilot-preview/dist/server.js"],{
    cwd:root,env:{...process.env,PORT:"36321",HOSTNAME:"127.0.0.1"},
    stdio:["ignore","pipe","pipe"]
  });
  const log = fs.createWriteStream(path.join(out,"server.log"));
  server.stdout.pipe(log);server.stderr.pipe(log);
  for(let i=0;i<50;i++){
    try {const r=await fetch(base+"/api/health");if(r.ok)break;}catch{}
    await new Promise(resolve=>setTimeout(resolve,100));
  }
  const health = await fetch(base+"/api/health");
  const healthBody = await health.json();
  check(health.status===200 && healthBody.mode==="preview" && healthBody.readOnly &&
    healthBody.backendConfigured===false,"health declares isolated read-only preview");
  for(const route of ["/api/auth/session/demo","/api/pedidos","/api/inventario/stock"]){
    const r=await fetch(base+route);
    check(r.status===403, "business API unavailable: "+route);
  }
  for(const method of ["POST","PUT","PATCH","DELETE"]){
    const r=await fetch(base+"/api/pedidos",{method,headers:{"Content-Type":"application/json"},body:"{}"});
    check(r.status===405,method+" operations rejected");
  }
  const unknown=await fetch(base+"/asistente-rag");
  check(unknown.status===404,"out-of-scope module excluded");

  browser=await chromium.launch({headless:true,executablePath:"/usr/bin/chromium",args:["--no-sandbox","--disable-dev-shm-usage"]});
  for(const vp of [
    {name:"desktop",width:1440,height:900},
    {name:"tablet",width:768,height:1024},
    {name:"mobile",width:390,height:844}
  ]){
    const context=await browser.newContext({viewport:{width:vp.width,height:vp.height},locale:"es-CO",reducedMotion:"reduce",serviceWorkers:"block"});
    const page=await context.newPage();
    page.on("request",(req)=>{
      if(req.url().startsWith("http")&&!req.url().startsWith(base))unexpectedRequests.push(req.url());
    });
    page.on("pageerror",(err)=>{failed=true;results.push({status:"FAIL",description:vp.name+": page error "+String(err).slice(0,150)});});
    await context.tracing.start({screenshots:true,snapshots:true});
    for(const [route,title] of [
      ["/login?utm_source=chatgpt.com","La dotación, de principio a fin."],
      ["/pedidos","Ciclos y pedidos"],
      ["/inventario","Inventario y existencias"],
      ["/catalogos","Datos maestros"]
    ]){
      const response=await page.goto(base+route,{waitUntil:"load"});
      const label=vp.name+" "+route.split("?")[0];
      check(response.status()===200,label+" HTTP 200");
      const headings=await page.getByRole("heading").allTextContents();
      check(headings.some(x=>x.includes(title)),label+" heading");
      check((await page.locator(".disclaimer").innerText()).includes("Datos ilustrativos"),label+" synthetic-data warning");
      check((await page.getByRole("link",{name:"Ciclos y pedidos"}).count())>=1,label+" navigation present");
      check((await page.locator("button,input,textarea,form").count())===0,label+" no business action controls");
      check((await page.locator("script").count())===0,label+" no executable JS");
      check((await page.locator('meta[name="robots"]').getAttribute("content"))==="noindex,nofollow,noarchive",label+" noindex policy");
      const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
      check(overflow<=2,label+" no document horizontal overflow ("+overflow+"px)");
      const css=await page.locator(".hero,.section-head").first().evaluate(el=>getComputedStyle(el).display);
      check(css!=="none",label+" stylesheet renders");
      await page.screenshot({path:path.join(out,vp.name+"-"+(route.slice(1).split("?")[0]||"home")+".png"),fullPage:true});
    }
    await page.goto(base+"/login?utm_source=chatgpt.com");
    await page.getByRole("link",{name:"Ciclos y pedidos"}).first().click();
    check(new URL(page.url()).pathname==="/pedidos",vp.name+" navigation works without backend");
    check((await context.cookies()).length===0,vp.name+" no cookies or sessions");
    await context.tracing.stop({path:path.join(out,vp.name+"-trace.zip")});
    await context.close();
  }
  check(unexpectedRequests.length===0,"no external network requests");
}catch(e){
  failed=true;
  results.push({status:"FAIL",description:"runner error: "+String(e)});
}finally{
  if(browser)await browser.close();
  if(server)server.kill("SIGTERM");
  const summary={result:failed?"FAIL":"PASS",assertions:results.length,passed:results.filter(x=>x.status==="PASS").length,
    failed:results.filter(x=>x.status==="FAIL"),externalRequests:unexpectedRequests,
    screenshotDirectory:path.relative(root,out)};
  fs.writeFileSync(path.join(out,"summary.json"),JSON.stringify(summary,null,2)+"\n");
  console.log(JSON.stringify(summary,null,2));
  if(failed)process.exitCode=1;
}
