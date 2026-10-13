(function(root){
'use strict';
const WORDS=[['PLANT','Something you might grow on a windowsill.'],['CLOUD','Look up.'],['BRAVE','A little courage goes a long way.'],['SHELF','A home for your favorite books.'],['OCEAN','A very big body of water.'],['SPARK','The start of a fire—or an idea.'],['TRAIL','A path worth following.'],['CRISP','A pleasing crunch.'],['LIGHT','It helps you see.'],['GRAIN','Small, but it can feed a crowd.'],['BLOOM','A flower in its moment.'],['MAPLE','A tree with a sweet side.']];
const CATEGORIES=[
 ['Things with keys',['PIANO','LOCK','KEYBOARD','HOTEL ROOM']],
 ['Words before “cake”',['PAN','CUP','CHEESE','SHORT']],
 ['Ways to move through water',['SWIM','PADDLE','ROW','SAIL']],
 ['Types of hat',['BERET','FEDORA','BEANIE','BOWLER']],
 ['Shades of blue',['NAVY','TEAL','CYAN','AZURE']],
 ['Parts of a book',['SPINE','COVER','CHAPTER','INDEX']],
 ['Things you can fold',['LAUNDRY','PAPER','ARMS','CHAIR']],
 ['Words after “snow”',['BALL','MAN','FLAKE','DRIFT']],
 ['Things with hands',['CLOCK','WATCH','PERSON','ROBOT']],
 ['Ways to prepare eggs',['POACH','SCRAMBLE','FRY','BOIL']],
 ['Words before “board”',['SKATE','SURF','DASH','CARD']],
 ['Things in a sewing kit',['NEEDLE','THREAD','THIMBLE','SCISSORS']]
];
function hash(s){let n=2166136261;for(const c of s)n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0;}
function shuffle(items,seed){const out=[...items];let n=hash(String(seed));for(let i=out.length-1;i>0;i--){n=(Math.imul(n,1664525)+1013904223)>>>0;const j=n%(i+1);[out[i],out[j]]=[out[j],out[i]];}return out;}
function validatePuzzle(raw){
 if(!raw||typeof raw!=='object'||!/^\d{4}-\d{2}-\d{2}$/.test(raw.date||'')||typeof raw.title!=='string'||raw.title.length>120||!raw.title.trim()||typeof raw.word!=='string'||!/^[A-Za-z]{5}$/.test(raw.word))throw new Error('Use a title, edition date, and a five-letter answer.');
 if(!Array.isArray(raw.groups)||raw.groups.length!==4)throw new Error('Connections needs exactly four categories.');
 const seen=new Set(),names=new Set();const groups=raw.groups.map(g=>{if(!g||typeof g.name!=='string'||!g.name.trim()||g.name.length>100||!Array.isArray(g.words)||g.words.length!==4)throw new Error('Each category needs a name and exactly four words.');const name=g.name.trim();if(names.has(name.toUpperCase()))throw new Error('Use distinct category names.');names.add(name.toUpperCase());return {name,words:g.words.map(w=>{if(typeof w!=='string'||!w.trim()||w.length>24||/[\r\n|,]/.test(w))throw new Error('Keep each Connections word under 25 characters without commas or pipes.');const text=w.trim().toUpperCase();if(seen.has(text))throw new Error('All 16 Connections words must be different.');seen.add(text);return text;})};});
 const p={version:1,date:raw.date,title:raw.title.trim(),word:raw.word.toUpperCase(),hint:typeof raw.hint==='string'?raw.hint.slice(0,300):'',groups};p.id=`${p.date}-${hash(JSON.stringify(p)).toString(16)}`;return p;
}
function generate(date,variation=0){const seed=`${date}:${variation}`;const [word,hint]=WORDS[hash(seed)%WORDS.length];const picked=shuffle(CATEGORIES,seed).slice(0,4).map(([name,words])=>({name,words}));return validatePuzzle({date,title:'The weekly brain break',word,hint,groups:picked});}
function scoreGuess(guess,answer){if(!/^[A-Z]{5}$/.test(guess)||!/^[A-Z]{5}$/.test(answer))throw new Error('Use five letters.');const result=Array(5).fill('absent'),remaining={};for(let i=0;i<5;i++)if(guess[i]===answer[i])result[i]='correct';else remaining[answer[i]]=(remaining[answer[i]]||0)+1;for(let i=0;i<5;i++)if(result[i]!=='correct'&&remaining[guess[i]]){result[i]='present';remaining[guess[i]]--;}return result;}
function evaluateGroup(puzzle,selected){if(!Array.isArray(selected)||selected.length!==4||new Set(selected).size!==4||selected.some(w=>!puzzle.groups.some(g=>g.words.includes(w))))throw new Error('Choose four different words from the board.');let near=false;for(let index=0;index<4;index++){const matches=selected.filter(w=>puzzle.groups[index].words.includes(w)).length;if(matches===4)return {match:index,near:false};if(matches===3)near=true;}return {match:-1,near};}
function parseGroups(text){return text.split(/\r?\n/).filter(s=>s.trim()).map(line=>{const parts=line.split('|');if(parts.length!==2)throw new Error('Use Category | word, word, word, word on each line.');return {name:parts[0].trim(),words:parts[1].split(',').map(w=>w.trim())};});}
function groupsText(p){return p.groups.map(g=>`${g.name} | ${g.words.join(', ')}`).join('\n');}
const api={hash,shuffle,validatePuzzle,generate,scoreGuess,evaluateGroup,parseGroups,groupsText};if(typeof module!=='undefined')module.exports=api;else root.GameCore=api;
})(typeof window!=='undefined'?window:globalThis);
