import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { spawn } from 'node:child_process';
const root = fileURLToPath(new URL('./dist/', import.meta.url));
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.jpg':'image/jpeg', '.png':'image/png' };
const server = createServer(async (req, res) => {
  try {
    const file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
    if (file !== root && !file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    const target = file === root ? path.join(root, 'index.html') : file;
    res.writeHead(200, { 'Content-Type': types[path.extname(target)] || 'application/octet-stream' });
    res.end(await readFile(target));
  } catch { res.writeHead(404).end('Not found'); }
});
server.listen(process.env.PORT || 4173, '127.0.0.1', () => {
  const url=`http://127.0.0.1:${server.address().port}`;
  console.log(`RAP DNA: ${url}`);
  if(process.argv.includes('--open')&&process.platform==='win32'){
    const child=spawn('cmd.exe',['/c','start','',url],{windowsHide:true,stdio:'ignore'});
    child.on('error',()=>console.log('Please open the URL above in your browser.'));
  }
});
server.on('error',err=>{console.error(err.code==='EADDRINUSE'?'Port 4173 is in use. Close the previous Demo window or set PORT to another port.':err.message);process.exitCode=1;});
