/** ISTQB CTFL practice engine. Pure functions support regression tests. */
export const STORAGE_KEY = 'istqb-ctfl-learning-v1';
export const SESSION_MS = 60 * 60 * 1000;
export const QUESTION_COUNT = 40;
export const CORRECT_NEXT_MS = 3000;
export const WRONG_NEXT_MS = 5000;
export const MAX_HISTORY = 50;
export const freshState = () => ({ version: 1, progress: {}, history: [], active: null, bookmarkedQuestions: [], bookmarkedTopics: [], readTopics: [] });
export const unique = arr => Array.from(new Set(arr));
export const shuffled = (arr, random = Math.random) => {const copy = [...arr]; for(let i=copy.length-1;i>0;i--){const k=Math.floor(random()*(i+1));[copy[i],copy[k]]=[copy[k],copy[i]];}return copy;};
export const getProgress = (state,id) => state.progress[id] || {points:0,attempts:0,correct:0,wrong:0,lastOutcome:null,lastAt:0};
export function questionStatus(p){
 if(!p||!p.attempts)return 'unseen';
 if(p.points===3)return 'mastered';
 if(['wrong','skipped','timeout'].includes(p.lastOutcome))return 'review';
 return 'learning';
}
export function normalizeState(v){
 if(!v || typeof v!=='object' || v.version!==1 || !v.progress || !Array.isArray(v.history))return freshState();
 const ret=freshState();
 for(const [id,val] of Object.entries(v.progress)){
  if(!/^[A-D]-(?:\d{1,2}|A\d{1,2})$/.test(id) || !val || typeof val!=='object')continue;
  const points=Number.isFinite(val.points)?Math.max(0,Math.min(3,Math.floor(val.points))):0;
  const attempts=Number.isFinite(val.attempts)?Math.max(0,Math.floor(val.attempts)):0;
  const correct=Number.isFinite(val.correct)?Math.max(0,Math.floor(val.correct)):0;
  const wrong=Number.isFinite(val.wrong)?Math.max(0,Math.floor(val.wrong)):0;
  ret.progress[id]={points,attempts,correct,wrong,lastOutcome:typeof val.lastOutcome==='string'?val.lastOutcome:null,lastAt:Number(val.lastAt)||0};
 }
 ret.history=v.history.slice(-MAX_HISTORY).filter(x=>x&&typeof x==='object');
 ret.active=v.active&&typeof v.active==='object'&&Array.isArray(v.active.ids)&&v.active.ids.length===QUESTION_COUNT&&v.active.mode&&Number.isFinite(v.active.deadline)?v.active:null;
 ret.bookmarkedQuestions=unique((v.bookmarkedQuestions||[]).filter(x=>typeof x==='string')).slice(0,186);
 ret.bookmarkedTopics=unique((v.bookmarkedTopics||[]).filter(x=>typeof x==='string')).slice(0,200);
 ret.readTopics=unique((v.readTopics||[]).filter(x=>typeof x==='string')).slice(0,200);
 return ret;
}
export function applyMastery(state,qid,correct,reason='answer',now=Date.now()){
 const old=getProgress(state,qid); const pts=Math.max(0,Math.min(3,old.points + (correct?1:-1)));
 const next={points:pts,attempts:old.attempts+1,correct:old.correct+(correct?1:0),wrong:old.wrong+(correct?0:1),lastOutcome:correct?'correct':reason==='answer'?'wrong':reason,lastAt:now};
 state.progress[qid]=next;return next;
}
export function isCorrect(q,answers){
 if(!Array.isArray(answers))return false;
 return answers.length===q.answers.length && q.answers.every(a=>answers.includes(a));
}
export function selectPractice(questions,state,size=QUESTION_COUNT,random=Math.random){
 const pool=questions.filter(q=>!q.multiple);if(pool.length<size)throw Error('Not enough official single-answer questions for a full 40-question practice.');
 const mastered=pool.filter(q=>getProgress(state,q.id).points===3);
 const others=pool.filter(q=>getProgress(state,q.id).points!==3);
 const targetMastered=Math.min(Math.floor(size*0.2),mastered.length);
 // Prefer older, less frequently encountered mastered questions, keeping some randomness.
 const rankMastered=arr=>arr.map(q=>({q,weight:(getProgress(state,q.id).lastAt||0) +random()*3*86400000})).sort((a,b)=>a.weight-b.weight).map(x=>x.q);
 const masterPick=rankMastered(mastered).slice(0,targetMastered);
 const otherSlots=Math.min(size-masterPick.length,others.length);
 // Avoid recently repeated questions while still putting missed work first.
 const prior=(q)=>{const p=getProgress(state,q.id),s=questionStatus(p);return s==='review'?0:s==='learning'?1:2;};
 const otherPick=others.map(q=>({q,rank:prior(q),recent:getProgress(state,q.id).lastAt||0,rand:random()})).sort((a,b)=> a.rank-b.rank || a.recent-b.recent || a.rand-b.rand).slice(0,otherSlots).map(x=>x.q);
 const fill=rankMastered(mastered.filter(q=>!masterPick.includes(q))).slice(0,size-masterPick.length-otherPick.length);
 const selection=shuffled([...masterPick,...otherPick,...fill],random);
 if(selection.length!==size||new Set(selection.map(q=>q.id)).size!==size)throw Error('Invalid practice selection');
 return selection;
}
export function startSession(state,bank,mode,set=null,random=Math.random,now=Date.now()){
 if(state.active)throw Error('Complete or discard the current session before starting a new one.');
 if(mode!=='practice'&&mode!=='exam')throw Error('Unsupported session mode');
 const chosen=mode==='practice'?selectPractice(bank,state):bank.filter(q=>q.set===set&&!q.isExtra).sort((a,b)=>Number(a.number)-Number(b.number));
 if(chosen.length!==QUESTION_COUNT)throw Error('A session requires exactly 40 questions.');
 const ids=chosen.map(q=>q.id);
 const choiceOrders=Object.fromEntries(chosen.map(q=>[q.id,shuffled(q.choices.map(c=>c.letter),random)]));
 state.active={mode,set,ids,choiceOrders,answers:{},drafts:{},index:0,startedAt:now,deadline:now+SESSION_MS,autoNext:null};
 return state.active;
}
export function answerPractice(state,bank,qid,letter,now=Date.now()){
 const a=state.active;if(!a||a.mode!=='practice'||!a.ids.includes(qid)||a.answers[qid])throw Error('Question is no longer answerable');
 if(now>=a.deadline)throw Error('Session time has ended');
 const q=bank.find(x=>x.id===qid);
 if(!q||q.multiple||!q.choices.some(c=>c.letter===letter))throw Error('Practice question requires one valid answer');
 const correct=isCorrect(q,[letter]);const reason='answer';
 a.answers[qid]={selected:[letter],correct,reason,at:now};applyMastery(state,qid,correct,reason,now);
 a.autoNext={questionId:qid,deadline:now+(correct?CORRECT_NEXT_MS:WRONG_NEXT_MS),paused:false};
 return a.answers[qid];
}
export function skipPractice(state,bank,qid,now=Date.now()){
 const a=state.active;if(!a||a.mode!=='practice'||a.answers[qid])return;
 const q=bank.find(x=>x.id===qid);if(!q)return;
 a.answers[qid]={selected:[],correct:false,reason:'skipped',at:now};applyMastery(state,qid,false,'skipped',now);
 a.autoNext=null;
}
export function setExamAnswer(state,bank,qid,letters,now=Date.now()){
 const a=state.active;if(!a||a.mode!=='exam'||!a.ids.includes(qid))throw Error('No exam session');
 if(now>=a.deadline)throw Error('Session time has ended');
 const q=bank.find(x=>x.id===qid);
 if(!q||!Array.isArray(letters)||new Set(letters).size!==letters.length||letters.length!==q.answers.length||letters.some(s=>!q.choices.find(c=>c.letter===s)))throw Error(`Select exactly ${q.answers.length} answer(s).`);
 a.answers[qid]={selected:[...letters],correct:isCorrect(q,letters),reason:'answer',at:now};
}
export function finishSession(state,bank,now=Date.now(),reason='submitted'){
 const a=state.active;if(!a)return null;
 if(a.mode==='practice'){
  for(const id of a.ids){if(!a.answers[id]){
   const kind=reason==='timeout'?'timeout':'skipped';a.answers[id]={selected:[],correct:false,reason:kind,at:now};applyMastery(state,id,false,kind,now);
  }}
 }
 const total=a.ids.length,correct=a.ids.filter(id=>a.answers[id]?.correct).length;
 const record={id:`${a.startedAt}-${a.mode}-${a.set||'random'}`,mode:a.mode,set:a.set,startedAt:a.startedAt,finishedAt:now,reason,correct,total,answers:structuredClone(a.answers),ids:[...a.ids]};
 state.history.push(record);state.history=state.history.slice(-MAX_HISTORY);state.active=null;
 return record;
}
export function stats(state,bank){
 const all={total:bank.filter(q=>!q.multiple).length,mastered:0,review:0,learning:0,unseen:0,practiced:0};
 const chapters=Array.from({length:6},(_,i)=>({chapter:i+1,questions:0,mastered:0,attempts:0,correct:0,accuracy:null}));
 for(const q of bank){if(q.multiple)continue;const p=getProgress(state,q.id),status=questionStatus(p),ch=chapters[q.chapter-1];all[status]++;ch.questions++;ch.mastered+=status==='mastered'?1:0;ch.attempts+=p.attempts;ch.correct+=p.correct;if(status!=='unseen')all.practiced++;}
 chapters.forEach(c=>c.accuracy=c.attempts?Math.round(c.correct/c.attempts*100):null);
 return {all,chapters};
}
export function recommendation(chapters){
 const practiced=chapters.filter(ch=>ch.attempts>0);
 if(!practiced.length)return 1;
 return [...practiced].sort((a,b)=>a.accuracy-b.accuracy || b.attempts-a.attempts)[0].chapter;
}
