import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const url = 'http://localhost:3000/';
const cli = path.join(root, 'node_modules', 'vinext', 'dist', 'cli.js');
const open = () => {
  if (process.env.KOSTERBROS_NO_OPEN === '1') return;
  if (process.platform === 'win32') spawn('explorer.exe', [url], {windowsHide:true, detached:true, stdio:'ignore'}).unref();
  else spawn(process.platform === 'darwin' ? 'open' : 'xdg-open', [url], {detached:true, stdio:'ignore'}).unref();
};
async function available() {
  try { const r=await fetch(url,{signal:AbortSignal.timeout(2000)});return r.ok && (await r.text()).includes('KosterBro'); }catch{return false;}
}
if (await available()) {
  console.log(`KosterBro's draait al! Open ${url}`);open();
} else if (!existsSync(cli)) {
  console.error('Installeer eerst de spelonderdelen: open deze map in een terminal en voer npm install uit.');process.exitCode=1;
} else {
  console.log("KosterBro's start... Houd dit venster open terwijl je speelt.");
  const child=spawn(process.execPath,[cli,'dev','--host','127.0.0.1','--port','3000'],{cwd:root,stdio:'inherit',windowsHide:true});
  let done=false;
  child.on('error',error=>{done=true;console.error('Starten mislukt:',error.message);process.exitCode=1;});
  child.on('exit',code=>{done=true;process.exitCode=code??0;});
  process.on('SIGINT',()=>child.kill());process.on('SIGTERM',()=>child.kill());
  const deadline=Date.now()+120000;
  while(!done&&Date.now()<deadline) {
    if(await available()){console.log(`Klaar! ${url}`);open();break;}
    await new Promise(resolve=>setTimeout(resolve,700));
  }
}
