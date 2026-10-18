// agent-02 (AI agent). Reproducible acceptance tests for the occupancy baseline.
import test from 'node:test';
import assert from 'node:assert/strict';
import { ROOM, parseRoom, start, step, replay, echoPositions, visible, SOLUTION } from './echo-rules.mjs';
const run=(s,a)=>a.reduce((state,action)=>step(state,action),s);
test('room validation catches malformed or unreachable targets',()=>{
  assert.equal(parseRoom().width,9);
  assert.throws(()=>parseRoom(['###','#S#']),/rectangular/);
  assert.throws(()=>parseRoom(ROOM.map(r=>r.replace('B','.'))),/Exactly one/);
  assert.throws(()=>parseRoom(['#########','#S#...X.#','###A.B###','#.......#','#########']),/reachable/);
});
test('movement into walls uses an action without crossing them',()=>{
  const s=run(start(),['U','U','U','U']);
  assert.deepEqual(s.player,{x:2,y:1});assert.equal(s.turn,4);
});
test('eight beat recording resets the player and creates an echo',()=>{
  const s=run(start(),SOLUTION[0]);
  assert.equal(s.turn,0);assert.equal(s.clock,8);
  assert.deepEqual(s.echoes,[SOLUTION[0]]);
  assert.deepEqual(s.player,{x:2,y:4});
});
test('a pulse reveals 3 ticks and expires',()=>{
  let s=step(start(),'P');
  assert(visible(s).has('4,4'));
  assert(!visible(s).has('7,4'));
  s=step(s,'W');assert(visible(s).has('4,4'));
  s=step(s,'W');assert(visible(s).has('4,4'));
  s=step(s,'W');assert(!visible(s).has('4,4'));
});
test('echoes repeat the recorded pulse beat',()=>{
  let s=run(start(),['P','W','W','W','W','W','W','W']);
  s=step(s,'W');
  assert(visible(s).has('4,4'));
  assert.deepEqual(echoPositions(s)[0],{x:2,y:4});
});
test('unassisted exit does not win',()=>{
  const s=run(start(),SOLUTION[2]);
  assert.deepEqual(s.player,{x:6,y:2});assert.equal(s.won,false);
});
test('verified 22-beat solution wins with both echo relays occupied',()=>{
  let s=start();
  for(const actions of SOLUTION) s=run(s,actions);
  assert.equal(s.clock,22);assert.equal(s.won,true);
  assert.deepEqual(echoPositions(s),[{x:3,y:3},{x:5,y:3}]);
  assert.throws(()=>step(s,'W'),/already won/);
});
test('echoes move independently of current player',()=>{
  let s=run(start(),SOLUTION[0]);
  s=step(s,'L');
  assert.deepEqual(s.player,{x:1,y:4});
  assert.deepEqual(echoPositions(s)[0],{x:3,y:4});
});
test('two most recent echoes retained while snapshots remain immutable',()=>{
  const a=run(start(),Array(8).fill('W'));
  const b=run(a,Array(8).fill('R'));
  const c=run(b,Array(8).fill('U'));
  assert.equal(a.echoes.length,1);assert.equal(b.echoes.length,2);
  assert.deepEqual(c.echoes,[Array(8).fill('R'),Array(8).fill('U')]);
});
test('bad actions rejected without spending a beat',()=>{
  const s=start();assert.throws(()=>step(s,'J'),/Invalid action/);assert.equal(s.turn,0);
});
test('deterministic output and replay bounds',()=>{
  const shape=s=>JSON.stringify({...s,room:s.room.rows,shownUntil:[...s.shownUntil]});
  assert.equal(shape(run(start(),SOLUTION.flat())),shape(run(start(),SOLUTION.flat())));
  assert.throws(()=>replay(parseRoom(),['U'],2),/Invalid replay tick/);
});
