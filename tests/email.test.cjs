const assert=require('node:assert/strict');
const {escapeHTML,safeURL,parseWins,emailHTML,normalizeDraft,newDraft}=require('../dist/app.js');
assert.equal(escapeHTML('<img onerror="x">'),'&lt;img onerror=&quot;x&quot;&gt;');
assert.equal(safeURL('javascript:alert(1)'),'');
assert.equal(safeURL('http://example.com/image.gif'),'');
assert.equal(safeURL('https://example.com/image.gif'),'https://example.com/image.gif');
assert.deepEqual(parseWins('Engineering:\n- Shipped maps\n• Fixed bugs\nSales: Won a deal'),[{team:'Engineering',title:'',body:'Shipped maps'},{team:'Engineering',title:'',body:'Fixed bugs'},{team:'Sales',title:'',body:'Won a deal'}]);
const draft=newDraft();draft.wins=[{team:'A',title:'<script>bad</script>',body:'One'},{team:'B',title:'Two',body:''},{team:'A',title:'Three',body:''}];draft.image='javascript:alert(1)';draft.fact='A fact';draft.factSource='javascript:alert(1)';draft.question='A question';draft.answer='Hidden answer';
let html=emailHTML(draft);assert(!html.includes('<script>'));assert(!html.includes('javascript:'));assert(!html.includes('Hidden answer'));assert(html.indexOf('Three')<html.indexOf('Two'));draft.showAnswer=true;assert(emailHTML(draft).includes('Hidden answer'));
draft.theme='missing';assert.equal(normalizeDraft(draft).theme,'harvest');assert.throws(()=>normalizeDraft({}));
for(const theme of ['harvest','cosmic','confetti','cozy']){draft.theme=theme;assert(emailHTML(draft).includes('WEEKLY WINS'));}
console.log('Email escaping, safe URLs, team grouping, batch parsing, theme rendering, draft validation, and optional answers passed.');
