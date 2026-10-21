import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {freshState,normalizeState,applyMastery,getProgress,questionStatus,selectPractice,startSession,answerPractice,skipPractice,setExamAnswer,finishSession,stats,recommendation,SESSION_MS,QUESTION_COUNT,isCorrect} from '../js/quiz-core.mjs';
const bank=JSON.parse(fs.readFileSync(new URL('../data/questions.json',import.meta.url),'utf8'));
const random=()=>0.314159;
test('official source bank consists of 186 items including 9 multiple answers',()=>{assert.equal(bank.length,186);assert.equal(new Set(bank.map(q=>q.id)).size,186);assert.equal(bank.filter(q=>q.multiple).length,9);for(const l of 'ABCD')assert.equal(bank.filter(q=>q.set===l&&!q.isExtra).length,40);assert.equal(bank.filter(q=>q.isExtra).length,26);});
test('practice excludes all select TWO questions',()=>{let s=freshState();const p=selectPractice(bank,s);assert.equal(p.length,40);assert.equal(new Set(p.map(x=>x.id)).size,40);assert.ok(p.every(x=>!x.multiple));});
test('practice uses up to twenty percent mastered questions',()=>{let s=freshState();for(const q of bank.filter(x=>!x.multiple).slice(0,80))s.progress[q.id]={points:3,attempts:3,lastOutcome:'correct',lastAt:1};let qs=selectPractice(bank,s);assert.equal(qs.filter(q=>getProgress(s,q.id).points===3).length,8);});
test('mastery scores capped at 0 and 3; missed previously mastered loses point',()=>{let s=freshState();for(let i=0;i<5;i++)applyMastery(s,'A-1',true);assert.equal(getProgress(s,'A-1').points,3);assert.equal(questionStatus(getProgress(s,'A-1')),'mastered');applyMastery(s,'A-1',false);assert.equal(getProgress(s,'A-1').points,2);assert.equal(questionStatus(getProgress(s,'A-1')),'review');for(let i=0;i<10;i++)applyMastery(s,'A-1',false);assert.equal(getProgress(s,'A-1').points,0);});
test('40 question practice 60m session and correct / wrong scoring',()=>{const s=freshState();const now=500000;const a=startSession(s,bank,'practice',null,random,now);assert.equal(a.ids.length,40);assert.equal(a.deadline-now,SESSION_MS);const first=bank.find(q=>q.id===a.ids[0]);assert.equal(first.multiple,false);const right=first.answers[0];answerPractice(s,bank,first.id,right,now+1000);assert.equal(getProgress(s,first.id).points,1);assert.equal(a.autoNext.deadline,now+4000);const second=bank.find(q=>q.id===a.ids[1]);skipPractice(s,bank,second.id,now+2000);assert.equal(getProgress(s,second.id).points,0);assert.equal(getProgress(s,second.id).wrong,1);const done=finishSession(s,bank,now+4000,'submitted');assert.equal(done.total,40);assert.equal(done.correct,1);assert.equal(s.active,null);assert.equal(s.history.length,1);});
test('exam A-D keep exact 40 official questions; multiple answer requires complete combination',()=>{for(const L of 'ABCD'){let s=freshState(),a=startSession(s,bank,'exam',L,random,1000);assert.equal(a.ids.length,40);assert.deepEqual(a.ids,bank.filter(q=>q.set===L&&!q.isExtra).map(q=>q.id));const multi=a.ids.map(id=>bank.find(q=>q.id===id)).find(q=>q.multiple);assert.ok(multi);assert.throws(()=>setExamAnswer(s,bank,multi.id,[multi.answers[0]],1001));setExamAnswer(s,bank,multi.id,multi.answers,1002);assert.ok(s.active.answers[multi.id].correct);finishSession(s,bank,5000);assert.equal(Object.keys(s.progress).length,0);}});
test('session answer positions preserve the same source letters on resume',()=>{let s=freshState();startSession(s,bank,'practice',null,random,123);const a=JSON.parse(JSON.stringify(s.active));const restored=normalizeState(JSON.parse(JSON.stringify(s)));assert.deepEqual(restored.active.choiceOrders,a.choiceOrders);});
test('all source questions are real text; only specific semantic visuals are included',()=>{
 let tables=0,diagrams=0;
 for(const q of bank){
  assert.ok(q.id&&q.stem.length>10);
  assert.ok(q.choices.length===4||q.choices.length===5);
  assert.equal(q.choices.length,new Set(q.choices.map(c=>c.letter)).size);
  assert.ok(q.answers.every(a=>q.choices.some(c=>c.letter===a)));
  assert.ok(q.sourcePage>0); assert.ok(!('sourceVisual' in q)&&!('showVisualByDefault' in q));
  if(q.visual?.type==='diagram'){diagrams++;assert.ok(fs.existsSync(new URL('../'+q.visual.src,import.meta.url)));assert.ok(q.visual.alt)}
  if(q.visual?.type==='table'){tables++;assert.ok(q.visual.rows.every(row=>row.length===q.visual.headers.length));assert.ok(q.visual.title)}
 }
 assert.equal(tables,10);assert.equal(diagrams,6);
});
test('recommend lowest accuracy practiced chapter',()=>{let s=freshState();const low=bank.find(q=>q.chapter===4),high=bank.find(q=>q.chapter===2);applyMastery(s,low.id,false);applyMastery(s,high.id,true);assert.equal(recommendation(stats(s,bank).chapters),4);});
