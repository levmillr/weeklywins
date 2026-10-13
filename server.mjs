import http from 'node:http';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {readFile} from 'node:fs/promises';
import {readFileSync} from 'node:fs';
import {parseEnv} from 'node:util';
import {generateVibe,VibeError} from './lib/vibe.mjs';

import {generateThemedGames} from './lib/games.mjs';

const root=path.dirname(fileURLToPath(import.meta.url));
const assets=new Map([['/','index.html'],['/index.html','index.html'],['/styles.css','styles.css'],['/app.js','app.js'],['/games/','games/index.html'],['/games/index.html','games/index.html'],['/games/core.js','games/core.js'],['/games/play.js','games/play.js'],['/games/games.css','games/games.css'],['/games/editions/sample.json','games/editions/sample.json']]);
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8'};
const environmentKey=process.env.OPENAI_API_KEY;
const environmentModel=process.env.OPENAI_MODEL;
function config(){let local={};try{local=parseEnv(readFileSync(path.join(root,'.env'),'utf8'));}catch(error){if(error.code!=='ENOENT')throw error;}return {apiKey:environmentKey||local.OPENAI_API_KEY,model:environmentModel||local.OPENAI_MODEL||'gpt-4.1-mini'};}
function json(res,status,data){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));}
async function readJSON(req){if(req.headers['content-type']?.split(';')[0]!=='application/json')throw new VibeError('Send JSON to the generation endpoint.',415);const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>180000)throw new VibeError('This draft is too large. Shorten it and try again.',413);chunks.push(chunk);}try{return JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw new VibeError('The draft request could not be read.');}}

export function createServer({getConfig=config,generate=generateVibe,generateGames=generateThemedGames}={}){
  let busy=false;
  return http.createServer(async(req,res)=>{
    const host=req.headers.host||'';
    if(!/^(127\.0\.0\.1|localhost)(:\d+)?$/.test(host)){json(res,403,{error:'Use this app on localhost.'});return;}
    const url=new URL(req.url,`http://${host}`);
    if(req.headers.origin&&req.headers.origin!==`http://${host}`){json(res,403,{error:'Use the editor to generate a vibe.'});return;}
    if(req.method==='GET'&&url.pathname==='/api/status'){try{const c=getConfig();json(res,200,{configured:!!c.apiKey,model:c.model});}catch{json(res,500,{error:'The local .env file could not be loaded.'});}return;}
    if(req.method==='POST'&&['/api/vibe','/api/games'].includes(url.pathname)){
      if(busy){json(res,429,{error:'A generation is already running. Wait for it to finish.'});return;}
      busy=true;
      try{const input=await readJSON(req);const result=await (url.pathname==='/api/games'?generateGames:generate)(input,getConfig());json(res,200,result);}
      catch(error){json(res,error instanceof VibeError?error.status:500,{error:error instanceof VibeError?error.message:'Generation failed. Check the local server configuration and try again.'});}
      finally{busy=false;}return;
    }
    if(req.method!=='GET'&&req.method!=='HEAD'){json(res,405,{error:'Method not allowed.'});return;}
    const file=assets.get(url.pathname);if(!file){json(res,404,{error:'Not found.'});return;}
    try{const body=await readFile(path.join(root,'dist',file));res.writeHead(200,{'Content-Type':types[path.extname(file)],'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'});res.end(req.method==='HEAD'?undefined:body);}catch{json(res,500,{error:'App files could not be loaded.'});}
  });
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  const port=Number(process.env.PORT||5173);const server=createServer();
  server.listen(port,'127.0.0.1',()=>console.log(`Weekly Wins Studio: http://127.0.0.1:${port}`));
  server.on('error',error=>{console.error(error.code==='EADDRINUSE'?`Port ${port} is in use. Stop the old preview server or set PORT to a free port.`:'Could not start the local server.');process.exitCode=1;});
}
