// Zero-dependency local development server. Usage: npm run serve
import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const port=Number(process.env.PORT)||8000;
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml'};
createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,`http://localhost:${port}`);
  const filename=resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));
  if(filename!==root&&!filename.startsWith(root+sep)){res.writeHead(403);res.end('Forbidden');return;}
  const meta=await stat(filename);if(!meta.isFile())throw Error('Not a file');
  res.writeHead(200,{'Content-Type':mime[extname(filename)]||'application/octet-stream','Cache-Control':'no-cache'});
  res.end(await readFile(filename));
 }catch(e){res.writeHead(404,{'Content-Type':'text/plain'});res.end('File not found');}
}).listen(port,'127.0.0.1',()=>console.log(`ISTQB learning app: http://127.0.0.1:${port}`));
