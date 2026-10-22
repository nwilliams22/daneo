/** Feasibility probe only. No sentence-derived lexicon, fitting, or app imports.
 * node reference/eval/measure-segmentation.mjs [--failures]
 * Optional B: LINDERA_BIN=/absolute/lindera LINDERA_DICT=/absolute/dict node ...
 * Inputs are local; this script never downloads anything.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
const root = new URL('../../', import.meta.url);
const read = (p) => readFileSync(new URL(p, root));
const wordsBytes = read('src/content/words.json');
const words = JSON.parse(wordsBytes);
const predicate = w => ['verb', 'adj'].includes(w.pos);
const tidy = s => s.normalize('NFC').trim().replace(/\s+/gu, ' ');
const clean = s => tidy(s).replace(/[\p{P}\p{S}]/gu, '').trim();
const sha = b => createHash('sha256').update(b).digest('hex');
const sorted = s => [...new Set(s)].sort();
const eq = (a,b) => JSON.stringify(a) === JSON.stringify(b);
const rate = (n,d) => `${n}/${d} (${(100*n/d).toFixed(2)}%)`;

// Bounded baseline: ordinary vowel contraction + 하다, present/past polite,
// common consonant endings and modifiers. No irregular inference from prose.
const split = c => { const n=c.charCodeAt(0)-0xac00; return n>=0 && n<11172 ? [Math.floor(n/588),Math.floor(n%588/28),n%28] : null; };
const syllable = ([l,v,t]) => String.fromCharCode(0xac00+l*588+v*28+t);
const lastWith = (s,v,t=0) => {const a=split(s.at(-1)); return s.slice(0,-1)+syllable([a[0],v,t]);};
function regularForms(w) {
  const stem = w.ko.slice(0,-1), a=split(stem.at(-1));
  if (!a) return [];
  let connective;
  if (stem.endsWith('하')) connective=stem.slice(0,-1)+'해';
  else if(a[2]) connective=stem+([0,8].includes(a[1])?'아':'어');
  else if([0,4,1,5].includes(a[1])) connective=stem;
  else if(a[1]===8) connective=lastWith(stem,9);
  else if(a[1]===13) connective=lastWith(stem,14);
  else if(a[1]===18) connective=lastWith(stem,15);
  else if(a[1]===20) connective=lastWith(stem,6);
  else connective=stem+'어'; // Deliberately does not implement ㅡ/르 etc.
  const c=split(connective.at(-1));
  const past=c && c[2]===0 ? lastWith(connective,c[1],20) : null;
  const forms=[...['고','지','지만','게','네요','거든요','잖아요','겠어요','기','다가','더라고요'].map(e=>stem+e),connective,connective+'요',connective+'서',connective+'도'];
  if(past) forms.push(...['어요','고','지만','다','던'].map(e=>past+e));
  if(a[2]===0) forms.push(stem+'세요',stem+'면',lastWith(stem,a[1],4),lastWith(stem,a[1],8),lastWith(stem,a[1],17)+'니다');
  else forms.push(stem+'으세요',stem+'으면',stem+'은',stem+'을',stem+'습니다');
  if(w.pos==='verb') forms.push(stem+'는');
  return forms;
}
const lexicon = new Map(), dictionary = new Map();
function add(map,form,id) {form=tidy(form); if(!form)return; if(!map.has(form))map.set(form,new Set());map.get(form).add(id);}
for(const w of words) {
  if(w.pos==='particle') continue; // Grammar tags are not lexical IDs in this probe.
  add(dictionary,w.ko,w.id); add(lexicon,w.ko,w.id);
  if(predicate(w) && w.ko.endsWith('다')) for(const f of regularForms(w))add(lexicon,f,w.id);
}
const particles = ['은','는','이','가','을','를','에','에서','에게','한테','께','께서','의','도','만','부터','까지','으로','로','와','과','하고','이랑','랑','보다','처럼','마다','조차','마저','밖에','이나','나','씩'];
const copulas = ['이에요','예요','입니다','이었어요','였어요','이다','인','이고','이라서','라서'];
function grammarTail(t) {
  if(!t)return true;
  if(copulas.includes(t))return true;
  return particles.some(p=>t.startsWith(p) && grammarTail(t.slice(p.length)));
}
function analyseA(surface) {
  const chunks=tidy(surface).split(' '), ids=[], unknown=[], ambiguous=[];
  // Longest lexical form at each eojeol start; the remainder must be a full
  // particle/copula chain. Never consult gold IDs to resolve a homograph.
  for(const chunk of chunks) {
    const token=clean(chunk); if(!token)continue;
    let found=false;
    for(let n=token.length;n>0;n--) {
      const candidates=lexicon.get(token.slice(0,n));
      if(candidates && grammarTail(token.slice(n))) {
        if(candidates.size===1) ids.push(...candidates); else ambiguous.push({token,ids:sorted(candidates)});
        found=true;break;
      }
    }
    if(!found)unknown.push(token);
  }
  return {chunks,ids:sorted(ids),unknown,ambiguous};
}
// Small invariants catch plumbing mistakes, not a fitted corpus success target.
assert(analyseA('물을 마셔요').ids.includes('w_masida'));
assert.deepEqual(analyseA('외계신조어XYZ').ids,[]);
assert(analyseA('외계신조어XYZ').unknown.length===1);

// Prose audit: these exclusions are documented human review, not conjugation data.
const notOwnIrregular = new Set(['w_kyeoda','w_jopda','w_joyonghada','w_iljeonghada','w_kkada','w_sillida','w_heulleonaerida','w_deoreowojida','w_gakkawojida','w_eoduwojida']);
const preds=words.filter(predicate);
const mentions=preds.filter(w=>/irregular/i.test(w.notes??''));
const own=mentions.filter(w=>!notOwnIrregular.has(w.id));
const namedClasses=['ㄷ','ㅂ','ㅅ','르','러','ㅡ','ㅎ','우','여','ㄹ'];
const broaderExclusions = new Set([...notOwnIrregular,'w_heulleonaoda','w_nappajida','w_geomda','w_gippeohada','w_heulleogada','w_bulleoireukida']);
const broadMentions=preds.filter(w=>/(irregular|[ㄷㅂㅅ르러ㅡㅎ우여ㄹ]-(?:drop|family|rule))/i.test(w.notes??''));
const ownBroad= broadMentions.filter(w=>!broaderExclusions.has(w.id));
const proseClasses=Object.fromEntries(namedClasses.map(c=>[c,preds.filter(w=>new RegExp(`${c}[- ](?:irregular|drop|family|rule)`,'i').test(w.notes??'')).map(w=>w.id)]));
console.log('DATA words sha256',sha(wordsBytes));
console.log('WORDS',words.length,'verbs',preds.filter(w=>w.pos==='verb').length,'adjectives',preds.filter(w=>w.pos==='adj').length,'predicates',preds.length);
console.log('IRREGULAR prose keyword mentions',mentions.length,'own irregular descriptions after exclusions',own.length,'structured conjugation fields',preds.filter(w=>Object.keys(w).some(k=>/conjug|irregular/i.test(k))).length);
console.log('IRREGULAR labelled-note occurrences',JSON.stringify(Object.fromEntries(Object.entries(proseClasses).map(([k,v])=>[k,v.length]))));
console.log('IRREGULAR broad markers',broadMentions.length,'own-inflection descriptions',ownBroad.length,'engineering cases',namedClasses.length);
console.log('IRREGULAR broad audit',JSON.stringify({included:ownBroad.map(w=>w.id),excluded:broadMentions.filter(w=>broaderExclusions.has(w.id)).map(w=>w.id)}));
console.log('IRREGULAR keyword audit',JSON.stringify({included:own.map(w=>w.id),excluded:mentions.filter(w=>notOwnIrregular.has(w.id)).map(w=>w.id)}));

// Only now load labels. Predictor inputs contain surface text alone.
const sentenceBytes=read('src/content/sentences.json'), sentences=JSON.parse(sentenceBytes);
console.log('DATA sentences sha256',sha(sentenceBytes));
console.log('LABELS multiword-chunk sentences',sentences.filter(s=>s.ko.some(c=>/\s/.test(tidy(c.t)))).length,'empty-ko-chunk sentences',sentences.filter(s=>s.ko.some(c=>!tidy(c.t))).length);
const surfaces=sentences.map(s=>s.ko.map(c=>tidy(c.t)).filter(Boolean).join(' '));
function score(name,predictions) {
  assert.equal(predictions.length,sentences.length);
  let chunks=0,exact=0,complete=0,intersection=0,expected=0,emitted=0;
  const counts={boundaryOnly:0,idsOnly:0,both:0,unknownSentences:0,ambiguousSentences:0,missingIds:0,extraIds:0};
  const missingByPos={}, failures=[];
  for(let i=0;i<sentences.length;i++) {
    const s=sentences[i],p=predictions[i], goldChunks=s.ko.map(c=>tidy(c.t)).filter(Boolean), gold=sorted(s.wordIds);
    const boundaryOK=eq(p.chunks,goldChunks), idOK=eq(p.ids,gold);
    const missing=gold.filter(x=>!p.ids.includes(x)),extra=p.ids.filter(x=>!gold.includes(x));
    chunks+=boundaryOK;exact+=idOK;complete+=boundaryOK&&idOK;
    intersection+=gold.length-missing.length;expected+=gold.length;emitted+=p.ids.length;
    counts.unknownSentences+=p.unknown.length>0;counts.ambiguousSentences+=p.ambiguous.length>0;
    counts.missingIds+=missing.length;counts.extraIds+=extra.length;
    for(const id of missing){const pos=words.find(w=>w.id===id)?.pos??'invalid';missingByPos[pos]=(missingByPos[pos]??0)+1;}
    if(!boundaryOK||!idOK){counts[!boundaryOK&&!idOK?'both':!boundaryOK?'boundaryOnly':'idsOnly']++;failures.push({id:s.id,surface:surfaces[i],goldChunks,predictedChunks:p.chunks,missing,extra,unknown:p.unknown,ambiguous:p.ambiguous});}
  }
  console.log(name,'exact chunk boundaries',rate(chunks,sentences.length));
  console.log(name,'exact wordId sets',rate(exact,sentences.length));
  console.log(name,'both',rate(complete,sentences.length));
  console.log(name,'wordId micro recall',rate(intersection,expected),'precision',rate(intersection,emitted));
  console.log(name,'failure breakdown',JSON.stringify(counts),'missing by POS',JSON.stringify(missingByPos));
  console.log(name,'failure rows',failures.length,'(all emitted with --failures)');
  if(process.argv.includes('--failures'))for(const f of failures)console.log(name,JSON.stringify(f));
}
score('A',surfaces.map(analyseA));

if(process.env.LINDERA_BIN || process.env.LINDERA_DICT) {
  assert(process.env.LINDERA_BIN && process.env.LINDERA_DICT,'Both B paths required');
  const dict=process.env.LINDERA_DICT;
  console.log('B dictionary files',JSON.stringify(readdirSync(dict).sort().map(n=>({name:n,bytes:statSync(`${dict}/${n}`).size,sha256:sha(readFileSync(`${dict}/${n}`))}))));
  const files=readdirSync(dict).sort().map(n=>readFileSync(`${dict}/${n}`));
  console.log('B payload installed bytes',files.reduce((n,b)=>n+b.length,0),'per-file gzip-9 bytes (installer proxy)',files.reduce((n,b)=>n+gzipSync(b,{level:9}).length,0));
  const result=spawnSync(process.env.LINDERA_BIN,['tokenize','--dict',dict,'--output','json'],{input:surfaces.join('\n')+'\n',encoding:'utf8',maxBuffer:64*1024*1024});
  assert.equal(result.status,0,result.stderr || result.error?.message);
  // CLI emits one pretty JSON array per line of input. Parse the complete stream.
  const tokenRows=JSON.parse('['+result.stdout.trim().replace(/\]\s*\[/g,'],[')+']');
  const predictions=tokenRows.map((tokens,i)=> {
    const ids=[],unknown=[],ambiguous=[];
    const take=(lemma,token)=>{const matches=dictionary.get(lemma);if(!matches)unknown.push(token);else if(matches.size===1)ids.push(...matches);else ambiguous.push({token,ids:sorted(matches)});};
    for(const t of tokens){
      const pieces=t.type==='Inflect' && t.expression!=='*' ? t.expression.split('+').map(x=>{const [form,pos]=x.split('/');return {form,pos};}) : [{form:t.surface,pos:t.part_of_speech_tag}];
      for(const {form,pos} of pieces){
        if(/^(J|E|S)/.test(pos))continue;
        if(/^(VV|VA|VX|VCP|VCN)$/.test(pos))take(form+'다',t.surface);
        else take(form,t.surface);
      }
    }
    // Attach morphology within the original eojeol; no syntactic phrase parser.
    return {chunks:surfaces[i].split(' '),ids:sorted(ids),unknown,ambiguous};
  });
  score('B',predictions);
} else console.log('B not run: set LINDERA_BIN and LINDERA_DICT to local 6.2.0 assets (no automatic download).');
