// agent-02 (AI agent): deterministic, provisional echo/pulse puzzle reference.
// No DOM, timers, network, dependencies, or randomness.
export const ROOM = [
  "#########",
  "#.......#",
  "#.....X.#",
  "#..A.B..#",
  "#.S.....#",
  "#.......#",
  "#########",
];
export const LOOP_LENGTH = 8;
export const MAX_ECHOES = 2;
export const PULSE_RADIUS = 3;
export const PULSE_TICKS = 3;
const MOVES = { U:[0,-1], D:[0,1], L:[-1,0], R:[1,0], W:[0,0], P:[0,0] };
const cell = p => p.x + "," + p.y;
const same = (a,b) => a.x===b.x && a.y===b.y;

export function parseRoom(rows=ROOM) {
  if (!Array.isArray(rows) || rows.length<3 ||
      !rows.every(r => typeof r==="string" && r.length===rows[0].length) ||
      rows[0].length<3) throw Error("Expected rectangular grid at least 3x3");
  const spots = {S:[],X:[],A:[],B:[]}, open=new Set();
  for (let y=0;y<rows.length;y++) for(let x=0;x<rows[y].length;x++){
    const t=rows[y][x], p={x,y};
    if (!"#.SXAB".includes(t)) throw Error("Unknown tile: "+t);
    if(t!=="#") open.add(cell(p));
    if(spots[t]) spots[t].push(p);
  }
  if(Object.values(spots).some(a=>a.length!==1)) throw Error("Exactly one S, X, A and B required");
  const start=spots.S[0], exit=spots.X[0], pads=[spots.A[0],spots.B[0]];
  const seen=new Set([cell(start)]), queue=[start];
  for(let i=0;i<queue.length;i++) for(const [dx,dy] of Object.values(MOVES).slice(0,4)){
    const p={x:queue[i].x+dx,y:queue[i].y+dy};
    if(open.has(cell(p))&&!seen.has(cell(p))){seen.add(cell(p));queue.push(p);}
  }
  if(![exit,...pads].every(p=>seen.has(cell(p)))) throw Error("Pads and exit must be reachable");
  return {rows:[...rows],width:rows[0].length,height:rows.length,open,start,exit,pads};
}
export function start(room=parseRoom()) {
  return {room, player:{...room.start}, turn:0, clock:0, echoes:[],
    recording:[], shownUntil:new Map(), won:false};
}
export function move(room,from,action){
  if(!Object.hasOwn(MOVES,action)) throw Error("Invalid action "+String(action));
  const [dx,dy]=MOVES[action], p={x:from.x+dx,y:from.y+dy};
  return room.open.has(cell(p)) ? p : {...from};
}
export function replay(room,actions,n){
  if(!Number.isInteger(n)||n<0||n>actions.length) throw Error("Invalid replay tick");
  let pos={...room.start};
  for(let i=0;i<n;i++) pos=move(room,pos,actions[i]);
  return pos;
}
export const echoPositions = state => state.echoes.map(actions=>replay(state.room,actions,state.turn));
export function visible(state){
  const result=new Set([cell(state.player)]);
  for(const [name,expiry] of state.shownUntil) if(expiry>=state.clock) result.add(name);
  return result;
}
export function step(s,action){
  if(s.won) throw Error("Session already won; restart to play again");
  if(!Object.hasOwn(MOVES,action)) throw Error("Invalid action "+String(action));
  if(s.turn<0||s.turn>=LOOP_LENGTH) throw Error("Invalid turn counter");
  const turn=s.turn+1, clock=s.clock+1;
  const player=move(s.room,s.player,action), recording=[...s.recording,action];
  const echoes=s.echoes.map(a=>[...a]), positions=echoes.map(a=>replay(s.room,a,turn));
  const sources=action==="P"?[player]:[];
  echoes.forEach((a,i)=>{if(a[turn-1]==="P") sources.push(positions[i]);});
  const shownUntil=new Map(s.shownUntil);
  for(const src of sources) for(let dy=-PULSE_RADIUS;dy<=PULSE_RADIUS;dy++)
    for(let dx=-PULSE_RADIUS;dx<=PULSE_RADIUS;dx++){
      const p={x:src.x+dx,y:src.y+dy};
      if(Math.abs(dx)+Math.abs(dy)<=PULSE_RADIUS && p.x>=0 && p.y>=0 &&
         p.x<s.room.width && p.y<s.room.height)
        shownUntil.set(cell(p),clock+PULSE_TICKS-1);
    }
  // Two stored echoes stand on the two pads while current player reaches exit.
  const won=s.room.pads.every(p=>positions.some(e=>same(p,e))) && same(player,s.room.exit);
  if(turn===LOOP_LENGTH && !won) return {
    room:s.room, player:{...s.room.start}, turn:0, clock,
    echoes:[...echoes,recording].slice(-MAX_ECHOES), recording:[], shownUntil, won:false
  };
  return {room:s.room,player,turn,clock,echoes,recording,shownUntil,won};
}
export const SOLUTION = [
  ["R","U","W","W","W","W","W","W"], // anchor echo A
  ["R","R","R","U","W","W","W","W"], // anchor echo B
  ["R","R","R","R","U","U"],         // reach X while echoes hold A+B
];
