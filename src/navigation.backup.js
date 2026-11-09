// AITU corridor graph: hand-authored illustrative waypoints based on supplied floor screenshots.
// Coordinates are relative to the app's SVG viewBox, NOT GPS or a surveyed building plan.
const lanes = [
  {id:'west',x:115,y:280},{id:'westUpper',x:145,y:220},{id:'midWest',x:255,y:210},
  {id:'center',x:335,y:205},{id:'midEast',x:420,y:215},{id:'eastUpper',x:515,y:230},
  {id:'east',x:555,y:285},{id:'westLower',x:155,y:345},{id:'midLower',x:325,y:350},{id:'eastLower',x:505,y:345},
  {id:'liftWest',x:230,y:270},{id:'liftEast',x:450,y:275}
];
const links=[['west','westUpper'],['westUpper','midWest'],['midWest','center'],['center','midEast'],['midEast','eastUpper'],['eastUpper','east'],['west','westLower'],['westLower','midLower'],['midLower','eastLower'],['eastLower','east'],['midWest','liftWest'],['liftWest','westLower'],['midEast','liftEast'],['liftEast','eastLower'],['liftWest','liftEast']];
export const floors=[1,2,3];
export const entryPoint='entrance:1';
export function makeGraph(){
 const nodes=[]; const edges=[];
 for(const floor of floors){
   for(const n of lanes)nodes.push({...n,id:`${n.id}:${floor}`,floor,label:n.id});
   for(const [a,b] of links)edges.push([`${a}:${floor}`,`${b}:${floor}`]);
   nodes.push({id:`entrance:${floor}`,x:62,y:280,floor,label:floor===1?'Main entrance':'West lobby'});
   edges.push([`entrance:${floor}`,`west:${floor}`]);
 }
 for(let floor=1;floor<3;floor++)for(const lift of ['liftWest','liftEast'])edges.push([`${lift}:${floor}`,`${lift}:${floor+1}`]);
 return {nodes,edges};
}
const {nodes,edges}=makeGraph();
const byId=new Map(nodes.map(n=>[n.id,n]));
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y)+(a.floor===b.floor?0:180*Math.abs(a.floor-b.floor));
export function shortestPath(from,to,blocked=[]){
 if(!byId.has(from)||!byId.has(to))return null;
 const forbidden=new Set(blocked), remaining=new Set(nodes.map(n=>n.id)),cost=new Map([[from,0]]),prev=new Map();
 while(remaining.size){
  let u=null,best=Infinity;
  for(const id of remaining){const d=cost.get(id)??Infinity;if(d<best){best=d;u=id}}
  if(u===null||best===Infinity)break;
  remaining.delete(u);if(u===to)break;
  for(const [a,b] of edges){const v=a===u?b:b===u?a:null;if(!v||!remaining.has(v)||forbidden.has(v))continue;
   const next=best+dist(byId.get(u),byId.get(v));if(next<(cost.get(v)??Infinity)){cost.set(v,next);prev.set(v,u)}
  }
 }
 if(!cost.has(to))return null;
 const path=[to];while(path[0]!==from){const p=prev.get(path[0]);if(!p)return null;path.unshift(p)}
 return {path:path.map(id=>byId.get(id)),distance:Math.round(cost.get(to)),floorChanges:path.filter((id,i)=>i>0&&byId.get(id).floor!==byId.get(path[i-1]).floor).length};
}
export function nearestNode(floor,x,y){return nodes.filter(n=>n.floor===Number(floor)&&!n.id.startsWith('entrance')).sort((a,b)=>dist(a,{x,y,floor:Number(floor)})-dist(b,{x,y,floor:Number(floor)}))[0]}
export function parseCoords(raw){if(typeof raw!=='string')return null;const m=raw.trim().match(/^\s*(\d+(?:\.\d+)?)\s*[,;]\s*(\d+(?:\.\d+)?)\s*$/);if(!m)return null;const x=Number(m[1]),y=Number(m[2]);return x>=0&&x<=660&&y>=0&&y<=510?{x,y}:null}
// A few demonstrative positions verified only against the user's floor screenshots.

export const demoLocations = {
  
  'C1.2.225P': { floor: 2, x: 310, y: 155 },
  'C1.1.241K': { floor: 2, x: 170, y: 380 },
  'C1.2.228P': { floor: 2, x: 430, y: 155 },

  // Other demonstration rooms
  'C1.2.223': { floor: 2, x: 235, y: 155 },
  'C1.2.241K': { floor: 2, x: 275, y: 375 },
  'C1.1.143': { floor: 1, x: 180, y: 150 },
  'C1.2.124K': { floor: 1, x: 270, y: 370 },
  'C1.3.337': { floor: 3, x: 510, y: 150 }
};

export function roomLocation(room){if(!room)return null;const code=String(room.room_number||'').trim().toUpperCase();const manual=demoLocations[code];if(manual)return manual;const coords=parseCoords(room.x_y_coords);return coords?{...coords,floor:Number(room.floor)||2}:null}
export function getGraph(){return {nodes,edges}}
