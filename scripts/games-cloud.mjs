import {spawnSync} from 'node:child_process';
import {readFileSync,mkdtempSync,writeFileSync,copyFileSync,mkdirSync,rmSync} from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import C from '../dist/games/core.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const [action,...args]=process.argv.slice(2),opts={};for(let i=0;i<args.length;i+=2){if(!/^--[a-z-]+$/.test(args[i])||!args[i+1]||args[i+1].startsWith('--'))throw new Error('Use named options with values.');opts[args[i].slice(2)]=args[i+1];}
if(!['deploy','publish','teardown','validate'].includes(action)||!opts.profile||!opts.region||!/^\d{12}$/.test(opts.account||'')||!/^weekly-wins-games-[a-z0-9-]{1,35}$/.test(opts.stack||'')){console.error('Usage: node scripts/games-cloud.mjs deploy|publish|teardown|validate --profile NAME --region REGION --account ACCOUNT_ID --stack weekly-wins-games-NAME [--puzzle FILE] [--confirm-delete STACK_NAME]');process.exit(1);}
const allowed=new Set(['profile','region','account','stack','puzzle','confirm-delete']);for(const k of Object.keys(opts))if(!allowed.has(k))throw new Error(`Unknown option: ${k}`);
if(!/^[a-z]{2}(?:-[a-z]+)+-\d$/.test(opts.region))throw new Error('Use a valid AWS region name.');
function aws(args,{json=false,allowMissing=false}={}){const r=spawnSync('aws',[...args,'--profile',opts.profile,'--region',opts.region,'--no-cli-pager',...(json?['--output','json']:[])],{encoding:'utf8',maxBuffer:8*1024*1024,env:{...process.env,AWS_PAGER:''}});if(r.error)throw r.error;if(r.status!==0){if(allowMissing&&/Stack with id .* does not exist/.test(r.stderr))return null;throw new Error(r.stderr.trim()||'AWS command failed.');}if(json)return JSON.parse(r.stdout);if(r.stdout.trim())console.log(r.stdout.trim());}
function getStack(required=true){const result=aws(['cloudformation','describe-stacks','--stack-name',opts.stack],{json:true,allowMissing:!required});if(!result)return null;const s=result.Stacks[0];if(!s.Tags?.some(t=>t.Key==='App'&&t.Value==='WeeklyWinsGames')||!s.StackId.split(':')[4]||s.StackId.split(':')[4]!==opts.account)throw new Error('This stack is not a Weekly Wins games stack in the expected account.');return s;}
function outputs(s){const o=Object.fromEntries(s.Outputs.map(x=>[x.OutputKey,x.OutputValue]));if(!o.BucketName||!o.DistributionId||!o.GameURL)throw new Error('Hosting outputs are missing.');return o;}
try{
 const identity=aws(['sts','get-caller-identity'],{json:true});if(identity.Account!==opts.account)throw new Error('AWS account differs from --account. No resources changed.');
 console.log(`Target: ${identity.Account} / ${opts.region} / ${opts.stack}`);
 if(action==='validate'){aws(['cloudformation','validate-template','--template-body','file://'+path.join(root,'infra/games-stack.json')]);process.exit(0);}
 if(action==='teardown'){
  if(opts['confirm-delete']!==opts.stack)throw new Error('Teardown deletes the hosted puzzles. Pass --confirm-delete with the exact stack name.');
  const s=getStack(),o=outputs(s);const r=aws(['cloudformation','describe-stack-resource','--stack-name',opts.stack,'--logical-resource-id','GamesBucket'],{json:true});if(r.StackResourceDetail.PhysicalResourceId!==o.BucketName)throw new Error('Bucket ownership check failed.');
  aws(['s3','rm',`s3://${o.BucketName}/`,'--recursive']);aws(['cloudformation','delete-stack','--stack-name',opts.stack]);console.log('Stack deletion requested. Waiting for CloudFront and the other resources to be removed…');aws(['cloudformation','wait','stack-delete-complete','--stack-name',opts.stack]);console.log('Removed. Links to these games no longer work.');process.exit(0);
 }
 const puzzle=opts.puzzle?C.validatePuzzle(JSON.parse(readFileSync(path.resolve(opts.puzzle),'utf8'))):null;
 if(!puzzle)throw new Error('Pass --puzzle with the exported edition JSON.');
 if(action==='deploy'){getStack(false);aws(['cloudformation','validate-template','--template-body','file://'+path.join(root,'infra/games-stack.json')]);aws(['cloudformation','deploy','--template-file',path.join(root,'infra/games-stack.json'),'--stack-name',opts.stack,'--tags','App=WeeklyWinsGames','--no-fail-on-empty-changeset']);}
 const o=outputs(getStack());
 // Immutable edition paths prevent changed answers from reusing an emailed link.
 const temp=mkdtempSync(path.join(os.tmpdir(),'weekly-wins-games-'));try{mkdirSync(path.join(temp,'editions'));for(const name of ['index.html','games.css','core.js','play.js'])copyFileSync(path.join(root,'dist/games',name),path.join(temp,name));writeFileSync(path.join(temp,'editions',`${puzzle.id}.json`),JSON.stringify(puzzle));writeFileSync(path.join(temp,'editions','sample.json'),JSON.stringify(puzzle));aws(['s3','sync',temp,`s3://${o.BucketName}/`,'--cache-control','public,max-age=300']);}finally{rmSync(temp,{recursive:true,force:true});}
 aws(['cloudfront','create-invalidation','--distribution-id',o.DistributionId,'--paths','/index.html','/core.js','/play.js','/games.css','/editions/sample.json']);
 console.log(`Paste into Weekly Wins: ${o.GameURL}?edition=${puzzle.id}`);
}catch(error){console.error(error.message);process.exitCode=1;}
