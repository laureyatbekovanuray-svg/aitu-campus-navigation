import React,{useEffect,useMemo,useState} from 'react';
import{createRoot}from'react-dom/client';
import{createClient}from'@supabase/supabase-js';
import{MapPin,CalendarDays,Shield,Search,Plus,Trash2,Pencil,Navigation,ArrowLeft,BarChart3,AlertTriangle,RefreshCw,Bell}from'lucide-react';
import './style.css';
import {shortestPath,nearestNode,roomLocation,entryPoint,getGraph} from './navigation';
const url=import.meta.env.VITE_SUPABASE_URL,key=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const configured=Boolean(url&&key&&!url.includes('YOUR_PROJECT')&&!key.includes('YOUR_'));
const db=configured?createClient(url,key):null;

async function fetchDemoSchedule() {
  if (!db) return [];

  const { data, error } = await db.rpc(
    'get_demo_schedule'
  );

  if (error) {
    console.error('Demo schedule error:', error);
    return [];
  }

  return data || [];
}

const weekdays=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const floorplan=[{id:'entry',x:90,y:345,label:'ENTRANCE'},{id:'junction1',x:210,y:345},{id:'junction2',x:210,y:235},{id:'junction3',x:420,y:235},{id:'junction4',x:420,y:345},{id:'exit',x:575,y:345}];
const edges=[['entry','junction1'],['junction1','junction2'],['junction2','junction3'],['junction3','junction4'],['junction4','exit'],['junction1','junction4']];
const spots=[{id:'a',x:120,y:190,label:'225P'},{id:'b',x:245,y:190,label:'226P'},{id:'c',x:370,y:190,label:'231P'},{id:'d',x:490,y:190,label:'232P'},{id:'e',x:120,y:395,label:'251L'},{id:'f',x:245,y:395,label:'248'},{id:'g',x:370,y:395,label:'241K'},{id:'h',x:490,y:395,label:'242K'}];

// Visual demo on the original floor-2 illustration (924.69 x 396.16).
// Waypoints are approximate, NOT surveyed/verified walking directions.
const DEMO_MAP_ROOMS = {
  '225P': {x:425,y:102,join:'C'},
  '228P': {x:505,y:101,join:'D'},
  '241K': {x:300,y:242,join:'B'}
};
const DEMO_CORRIDOR = {
  W:{x:57,y:220}, A:{x:155,y:182}, B:{x:300,y:141},
  C:{x:425,y:128}, D:{x:505,y:130}, E:{x:640,y:162}
};
const DEMO_CONNECTIONS = [['W','A'],['A','B'],['B','C'],['C','D'],['D','E']];
function demoRoomPoint(room) {
  if (!room || Number(room.floor)!==2) return null;
  const code=String(room.room_number||'').toUpperCase();
  const suffix=code.match(/(?:^|\.)(225P|228P|241K)$/)?.[1];
  return suffix?DEMO_MAP_ROOMS[suffix]:null;
}
function illustrativeFloor2Path(destination, originRoom) {
  const target=demoRoomPoint(destination);
  if (!target) return null;
  const source=demoRoomPoint(originRoom);
  const startNode=source?.join||'W';
  const endNode=target.join;
  const ids=['W','A','B','C','D','E'];
  const a=ids.indexOf(startNode), b=ids.indexOf(endNode);
  const between=ids.slice(Math.min(a,b),Math.max(a,b)+1);
  if(a>b)between.reverse();
  const pts=[source?{x:source.x,y:source.y}:{x:57,y:220},...between.map(id=>DEMO_CORRIDOR[id]),{x:target.x,y:target.y}];
  return pts.map(p=>`${p.x},${p.y}`).join(' ');
}

function App(){
  const [mapZoom, setMapZoom] = useState(1);
const [mapOffset, setMapOffset] = useState({ x: 0, y: 0 });
const [mapDragging, setMapDragging] = useState(false);
const mapDragStart = React.useRef(null);

function resetMapView() {
  setMapZoom(1);
  setMapOffset({ x: 0, y: 0 });
}

function changeMapZoom(amount) {
  setMapZoom(z => Math.max(1, Math.min(4, z + amount)));
}

const[tab,setTab]=useState('schedule'),[rooms,setRooms]=useState([]),[classes,setClasses]=useState([]),[schedule,setSchedule]=useState([]),[logs,setLogs]=useState([]),[counts,setCounts]=useState([]),[day,setDay]=useState('Monday'),[floor,setFloor]=useState(2),[search,setSearch]=useState(''),[selected,setSelected]=useState(null),[notice,setNotice]=useState(''),[loading,setLoading]=useState(false),[form,setForm]=useState({room_number:'',building:'C1',floor:2,x_y_coords:''}),[editing,setEditing]=useState(null),[studentId,setStudentId]=useState(''),[courseId,setCourseId]=useState(''),[newDay,setNewDay]=useState('Monday'),[origin,setOrigin]=useState(entryPoint),[route,setRoute]=useState(null),[session,setSession]=useState(null),[loginEmail,setLoginEmail]=useState(''),[loginPassword,setLoginPassword]=useState(''),[authBusy,setAuthBusy]=useState(false),[adminAllowed,setAdminAllowed]=useState(false),[demoReminder,setDemoReminder]=useState(false),[clock,setClock]=useState(()=>new Date()),[dismissedReminder,setDismissedReminder]=useState(''); 
 
const [demoSchedule, setDemoSchedule] = useState([]); 

useEffect(() => {
  async function loadDemoSchedule() {
    if (!db) {
      console.log("Supabase is not connected");
      return;
    }

    const { data, error } = await db.rpc(
      "get_demo_schedule"
    );

    if (error) {
      console.error("DEMO ERROR:", error);
      return;
    }

    console.log("DEMO DATA:", data);
    setDemoSchedule(data || []);
  }

  loadDemoSchedule();
}, []);





 const notify=(msg)=>setNotice(msg);
 async function load(){if(!db)return;setLoading(true);try{const [r,c,s,l]=await Promise.all([db.from('room').select('*').order('room_number'),db.from('class').select('*'),db.from('schedule').select('*'),db.from('sensor_logs').select('*').order('timestamp',{ascending:false}).limit(100)]);for(const result of[r,c,s,l])if(result.error)throw result.error;setRooms(r.data||[]);setClasses(c.data||[]);setSchedule(s.data||[]);setLogs(l.data||[]);const aggregate=await db.rpc('room_counts_by_floor');if(aggregate.error){setCounts([]);notify('Run supabase/aggregation.sql to enable database aggregation')}else setCounts(aggregate.data||[]);}catch(e){notify('Database error: '+e.message)}finally{setLoading(false)}}
 useEffect(()=>{load()},[]);
 useEffect(()=>{if(!db)return;db.auth.getSession().then(({data})=>setSession(data.session));const{data:{subscription}}=db.auth.onAuthStateChange((_event,next)=>setSession(next));return()=>subscription.unsubscribe()},[]);
 useEffect(()=>{let active=true;async function check(){if(!db||!session?.user?.email){setAdminAllowed(false);return}const {data,error}=await db.from('users').select('role').eq('email',session.user.email).limit(1);if(active)setAdminAllowed(!error&&data?.some(u=>String(u.role).toLowerCase()==='admin'))}check();return()=>{active=false}},[session]);
 async function signIn(e){e.preventDefault();if(!db)return;setAuthBusy(true);const{error}=await db.auth.signInWithPassword({email:loginEmail,password:loginPassword});notify(error?error.message:'Signed in');setAuthBusy(false)}
 async function signOut(){if(db){await db.auth.signOut();notify('Signed out')}}
 const graph=getGraph();
 const targetLocation=roomLocation(selected);
  // Resolve the Start dropdown back to a room where possible.
  const visualOriginRoom=rooms.find(r=>{
    const loc=roomLocation(r);
    return loc && nearestNode(loc.floor,loc.x,loc.y)?.id===origin && demoRoomPoint(r);
  });
  const visualPath=floor===2?illustrativeFloor2Path(selected,visualOriginRoom):null;
 useEffect(()=>{if(!targetLocation){setRoute(null);return}const destination=nearestNode(targetLocation.floor,targetLocation.x,targetLocation.y);setRoute(destination?shortestPath(origin,destination.id):null)},[selected,origin]);
 const filtered=rooms.filter(r=>(String(r.room_number||'').toLowerCase().includes(search.toLowerCase())||String(r.building||'').toLowerCase().includes(search.toLowerCase())));
 const todays = demoSchedule
  .filter(s =>
    String(s.day_of_week || '').toLowerCase() === day.toLowerCase()
  )
  .map(s => ({
    ...s,
    course: s
  }))
  .sort((a, b) =>
    String(a.course?.start_time || '').localeCompare(
      String(b.course?.start_time || '')
    )
  );

 useEffect(()=>{const timer=setInterval(()=>setClock(new Date()),30000);return()=>clearInterval(timer)},[]);
  const currentDay=weekdays[(clock.getDay()+6)%7];
  // Planner reminders: live schedule for a selected student, or the demo planner.
  // Only classes starting in the next 10 minutes produce automatic reminders.
  const todayLessons=schedule.filter(s=>String(s.day_of_week||'').toLowerCase()===currentDay.toLowerCase()&&studentId&&String(s.user_id)===String(studentId)).map(s=>({...s,course:classes.find(c=>String(c.class_id)===String(s.class_id))}));
  const todayDemoLessons=demoSchedule.filter(s=>String(s.day_of_week||'').toLowerCase()===currentDay.toLowerCase()).map(s=>({...s,course:s}));
  const upcomingLessons=(todayLessons.length?todayLessons:todayDemoLessons).filter(s=>s.course?.start_time).sort((a,b)=>String(a.course.start_time).localeCompare(String(b.course.start_time)));
  const minutesUntil=s=>{const [h,m]=String(s.course?.start_time||'').slice(0,5).split(':').map(Number);return Number.isFinite(h)&&Number.isFinite(m)?h*60+m-clock.getHours()*60-clock.getMinutes():Infinity;};
  const nextLesson=upcomingLessons.find(s=>minutesUntil(s)>=0)||null;
  const reminderCandidate=upcomingLessons.find(s=>minutesUntil(s)>=0&&minutesUntil(s)<=10)||null;
  const reminderLesson=demoReminder?(upcomingLessons[0]||todays[0]||null):reminderCandidate;
  const reminderKey=reminderLesson?`${clock.toDateString()}:${reminderLesson.schedule_id||reminderLesson.class_id||reminderLesson.course?.course_name||'class'}:${reminderLesson.course?.start_time}:${demoReminder?'test':'real'}`:'';
  const findLessonRoom=lesson=>{if(!lesson)return null;const course=lesson.course||lesson;return rooms.find(r=>String(r.room_id)===String(course.room_id))||rooms.find(r=>String(r.room_number||'').toUpperCase()===String(course.room_number||lesson.room_number||'').toUpperCase())||null;};
  const reminderRoom=findLessonRoom(reminderLesson);
  const reminderVisible=Boolean(reminderLesson&&dismissedReminder!==reminderKey);
 const crowded=logs.filter(l=>String(l.occupancy_status).toLowerCase()==='crowded');
 function go(room){setSelected(room);setFloor(Number(room?.floor)||2);setTab('map');notify(room?'Destination: '+room.room_number:'Select a room to navigate')}
 async function saveRoom(e){e.preventDefault();if(!db||!adminAllowed)return notify('Administrator sign-in required');const payload={room_number:form.room_number.trim(),building:form.building.trim(),floor:Number(form.floor),x_y_coords:form.x_y_coords.trim()};if(!payload.room_number)return notify('Enter room number');try{const q=editing?db.from('room').update(payload).eq('room_id',editing):db.from('room').insert(payload);const {error}=await q;if(error)throw error;notify(editing?'Room updated in Supabase':'Room inserted in Supabase');setEditing(null);setForm({room_number:'',building:'C1',floor:2,x_y_coords:''});await load()}catch(e){notify(e.message)}}
 async function deleteRoom(r){if(!db||!adminAllowed)return notify('Administrator sign-in required');if(!window.confirm('Delete '+r.room_number+' from Supabase?'))return;const{error}=await db.from('room').delete().eq('room_id',r.room_id);if(error)notify(error.message);else{notify('Room deleted from Supabase');load()}}
 function editRoom(r){setEditing(r.room_id);setForm({room_number:r.room_number||'',building:r.building||'',floor:r.floor||1,x_y_coords:String(r.x_y_coords??'')});setTab('admin')}
 async function addSchedule(e){e.preventDefault();if(!db||!adminAllowed)return notify('Administrator sign-in required');const{error}=await db.from('schedule').insert({user_id:Number(studentId),class_id:Number(courseId),day_of_week:newDay});if(error)notify(error.message);else{notify('Schedule entry added');load()}}
 const searchRoom=async()=>{if(!db)return notify('Connect Supabase first');const q=search.trim();const{data,error}=await db.from('room').select('*').ilike('room_number',`%${q}%`);if(error)notify(error.message);else{notify(`${data.length} matching room(s) from Supabase`);if(data.length===1)go(data[0]);else setTab('rooms')}};
 return <div className="app"><aside className="sidebar"><div className="brand">✦ AITU <span>NAVIGATION</span></div><p className="subtitle">SMART CAMPUS PLANNER</p><nav>{[['schedule',CalendarDays,'My Schedule'],['rooms',Search,'Find a Room'],['map',MapPin,'Campus Map'],['analytics',BarChart3,'Campus Insights'],['admin',Shield,'Admin Panel']].map(([id,Icon,label])=><button key={id} className={tab===id?'active':''} onClick={()=>setTab(id)}><Icon size={19}/>{label}</button>)}</nav><div className="sidefoot"><span className={configured?'dot green':'dot'}/>{configured?'Supabase configured':'Supabase not connected'}<button className="refresh" onClick={load}><RefreshCw size={15}/> Refresh data</button></div></aside><main><header><div><small>ASTANA IT UNIVERSITY</small><h1>{({schedule:'My Schedule',rooms:'Find a Room',map:'Campus Navigation',analytics:'Campus Insights',admin:'Room Administration'})[tab]}</h1></div><div className="authHeader">{session?<><span>{session.user.email}</span><button className="ghost" onClick={signOut}>Sign out</button></>:<span>Guest mode</span>}<div className="avatar">AITU</div></div></header>{!configured&&<div className="warning"><AlertTriangle size={18}/> Configure <code>.env</code> to connect your existing Supabase database. No simulated database results are shown.</div>}{notice&&<div className="toast" role="status">{notice}<button onClick={()=>setNotice('')}>×</button></div>}
 {reminderVisible&&<section className="panel" role="alert" aria-live="polite" style={{borderLeft:'5px solid #f59e0b',marginBottom:16}}><h2><Bell size={19}/> {demoReminder?'Test reminder':'Upcoming class in '+minutesUntil(reminderLesson)+' min'}</h2><p>{reminderLesson.course?.course_name||'Class'} · {reminderLesson.course?.start_time?.slice(0,5)||'Time unavailable'} · {reminderRoom?.room_number||'Room not linked'}</p><button className="primary" disabled={!reminderRoom} onClick={()=>{go(reminderRoom);setDemoReminder(false)}}><Navigation size={17}/> Get Directions</button> <button className="ghost" onClick={()=>{setDismissedReminder(reminderKey);setDemoReminder(false)}}>Dismiss</button>{!reminderRoom&&<p className="muted">Link this class to a room in Supabase to enable directions.</p>}</section>}
 {tab==='schedule'&&<><button className="ghost" onClick={()=>{setDismissedReminder('');setDemoReminder(true)}}>Test reminder</button>{nextLesson&&<section className="panel" style={{marginTop:12,marginBottom:14}}><h3>Next class today</h3><p>{nextLesson.course?.course_name||'Class'} · {nextLesson.course?.start_time?.slice(0,5)} · {Math.max(0,minutesUntil(nextLesson))} min remaining</p><button className="ghost" disabled={!findLessonRoom(nextLesson)} onClick={()=>go(findLessonRoom(nextLesson))}><Navigation size={16}/> Show route</button></section>}<section className="hero"><div><small>YOUR CAMPUS, SIMPLIFIED</small><h2>Ready for your next class?</h2><p>Find classrooms and get directions in one place.</p></div><button className="primary" onClick={()=>setTab('map')}><Navigation size={17}/> Open campus map</button></section><div className="days">{weekdays.map(d=><button key={d} className={day===d?'chosen':''} onClick={()=>setDay(d)}>{d.slice(0,3)}</button>)}</div><div className="sectionTitle"><h2>{day}</h2><span>{todays.length} classes</span></div><p className="muted">Demo student: AITU Demo Student</p><div className="cards">{todays.length?todays.map((s,i)=><article className="classCard" key={s.schedule_id||i}><div className="time">{s.course?.start_time?.slice(0,5)||'--:--'}<small>{s.course?.end_time?.slice(0,5)||''}</small></div><div className="classInfo"><small>CLASS #{s.class_id}</small><h3>{s.course?.course_name||'Class'}</h3><button className="roomLink" disabled={!findLessonRoom(s)} onClick={()=>go(findLessonRoom(s))}><MapPin size={16}/>{findLessonRoom(s)?.room_number||'Room unavailable'} · Get directions</button></div></article>):<div className="empty">{configured?'No classes found for this day and student filter.':'Connect Supabase to load your real timetable.'}</div>}</div></>}
 {tab==='rooms'&&<><section className="searchBar"><Search size={20}/><input placeholder="Search room number or building..." value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==='Enter'&&searchRoom()}/><button className="primary" onClick={searchRoom}>Search database</button></section><p className="muted">SELECT with WHERE · Live room records</p><div className="roomGrid">{filtered.map(r=><article className="roomCard" key={r.room_id}><div className="roomIcon"><MapPin/></div><h3>{r.room_number}</h3><p>{r.building} · Floor {r.floor}</p><small>Coordinates: {r.x_y_coords||'Not set'}</small><button onClick={()=>go(r)} className="primary">Get directions</button></article>)}</div>{!filtered.length&&<div className="empty">No matching room records loaded.</div>}</>}
 {tab==='map'&&<><div className="mapToolbar"><label>Start <select value={origin} onChange={e=>setOrigin(e.target.value)}><option value={entryPoint}>Main entrance · Floor 1</option>{rooms.filter(r=>roomLocation(r)).map(r=>{const loc=roomLocation(r);const node=nearestNode(loc.floor,loc.x,loc.y);return <option key={r.room_id} value={node?.id}>{r.room_number} · Floor {loc.floor}</option>})}</select></label><label>Destination <select value={selected?.room_id||''} onChange={e=>{const r=rooms.find(x=>String(x.room_id)===e.target.value);setSelected(r||null);if(r)setFloor(Number(roomLocation(r)?.floor||r.floor)||2)}}><option value="">Choose room</option>{rooms.map(r=><option value={r.room_id} key={r.room_id}>{r.room_number}</option>)}</select></label><label>Floor <select value={floor} onChange={e=>setFloor(Number(e.target.value))}>{[1,2,3].map(n=><option key={n} value={n}>{n}</option>)}</select></label></div><div className="mapLayout"><div className="mapPanel">
  <div className="mapCaption">
    AITU · FLOOR {floor}
    <span>ORIGINAL AITU FLOOR PLAN</span>
  </div>
  <div className="mapZoomControls">
  <button
    type="button"
    onClick={() => changeMapZoom(0.25)}
    title="Zoom in"
  >
    +
  </button>

  <span>{Math.round(mapZoom * 100)}%</span>

  <button
    type="button"
    onClick={() => changeMapZoom(-0.25)}
    title="Zoom out"
  >
    −
  </button>

  <button type="button" onClick={resetMapView}>
    Reset
  </button>
</div>

<div className="originalMapFrame">
  <div
    className="mapZoomViewport"
  onWheel={e => {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    changeMapZoom(e.deltaY < 0 ? 0.1 : -0.1);
  }}
  onPointerDown={e => {
    if (mapZoom <= 1) return;

    e.currentTarget.setPointerCapture(e.pointerId);

    mapDragStart.current = {
      x: e.clientX,
      y: e.clientY,
      offsetX: mapOffset.x,
      offsetY: mapOffset.y
    };

    setMapDragging(true);
  }}
  onPointerMove={e => {
    if (!mapDragStart.current) return;

    setMapOffset({
      x: mapDragStart.current.offsetX +
        e.clientX - mapDragStart.current.x,
      y: mapDragStart.current.offsetY +
        e.clientY - mapDragStart.current.y
    });
  }}
  onPointerUp={e => {
    mapDragStart.current = null;
    setMapDragging(false);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  }}
  onPointerCancel={() => {
    mapDragStart.current = null;
    setMapDragging(false);
  }}
>
  <div style={{position:'relative',width:'100%',transform:`translate(${mapOffset.x}px, ${mapOffset.y}px) scale(${mapZoom})`,transformOrigin:'center center'}}>
    <img
      src={`/maps/aitu-floor-${floor}.svg`}
      alt={`Original AITU floor ${floor} plan`}
      className="originalMapImage"
      draggable={false}
      style={{display:'block',width:'100%',height:'auto',transform:'none'}}
    />
    {visualPath && <svg viewBox="0 0 924.69 396.16" preserveAspectRatio="xMidYMid meet" aria-label="Illustrative route on floor 2" style={{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none',overflow:'visible'}}>
      <polyline points={visualPath} fill="none" stroke="#0b1930" strokeWidth="10" strokeLinejoin="round" strokeLinecap="round" opacity="0.8" />
      <polyline points={visualPath} fill="none" stroke="#ffe16b" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round" strokeDasharray="9 5" />
      {(() => {const pts=visualPath.split(' ').map(p=>p.split(',').map(Number));const first=pts[0],last=pts[pts.length-1];return <>
        <circle cx={first[0]} cy={first[1]} r="9" fill="#22c55e" stroke="white" strokeWidth="3" />
        <circle cx={last[0]} cy={last[1]} r="9" fill="#ef4444" stroke="white" strokeWidth="3" />
      </>})()}
    </svg>}
  </div>
</div>
</div>
<span className="originalMapCredit">Map artwork © 2023 Yuujiso · MIT license</span><p className="mapNote">{visualPath?'Yellow dashed line: illustrative floor-2 route only (not verified on site). Green = start, red = destination. Zoom and drag move the route with the map.':'Visual routes are currently available for floor-2 rooms 225P, 228P and 241K. Other routes remain in the prototype panel.'}</p></div><div className="routePanel"><h3><Navigation size={20}/> Route prototype</h3>{selected?<><h2>{selected.room_number}</h2><p>Floor {targetLocation?.floor??selected.floor} · {selected.building}</p>{!targetLocation?<div className="instruction">This room has no valid map coordinates yet. Set x_y_coords as x,y in Admin or add a mapped location.</div>:route?<><div className="instruction">Prototype graph: {route.path.length} waypoints · {route.floorChanges} floor changes · abstract cost {route.distance}. Graph route is illustrative and not a verified walking route.</div><p className="muted">{route.path.map(n=>n.label+(n.floor!==floor?' (F'+n.floor+')':'')).join(' → ')}</p><button className="primary" onClick={()=>setFloor(targetLocation.floor)}>Show destination floor</button></>:<p>No connected route found.</p>}</>:<p className="muted">Choose a room to calculate a route from the selected starting point.</p>}<hr/><h3><AlertTriangle size={18}/> Sensor observations</h3>{crowded.slice(0,5).map((l,i)=><div className="alertItem" key={i}>Room ID {l.room_id} <strong>{l.people_count} people</strong><small>{l.timestamp}</small></div>)}{!crowded.length&&<p className="muted">No crowded sensor records loaded.</p>}<small className="muted">Historical logs only. They do not automatically change route costs without verified corridor-to-sensor mappings.</small></div></div></>}
 {tab==='analytics'&&<><h2>Room distribution by floor</h2><p className="muted">COUNT(*) GROUP BY floor, executed in PostgreSQL through a Supabase RPC function.</p><div className="stats">{counts.map(x=><div className="stat" key={x.floor}><small>FLOOR {x.floor}</small><strong>{x.room_count}</strong><span>rooms</span></div>)}</div><h2>Occupancy sensor logs</h2><div className="tableWrap"><table><thead><tr><th>Sensor</th><th>Room ID</th><th>Status</th><th>People</th><th>Timestamp</th></tr></thead><tbody>{logs.map((l,i)=><tr key={i}><td>{l.sensor_id}</td><td>{l.room_id}</td><td>{l.occupancy_status}</td><td>{l.people_count}</td><td>{l.timestamp}</td></tr>)}</tbody></table></div></>}
 {tab==='admin'&&!adminAllowed&&<section className="panel"><h2>Administrator sign-in</h2><p>Use Supabase Auth. Your authenticated email must have role = admin in the existing users table, and database RLS policies must enforce permissions.</p><form onSubmit={signIn} className="form"><label>Email<input type="email" value={loginEmail} onChange={e=>setLoginEmail(e.target.value)} required/></label><label>Password<input type="password" value={loginPassword} onChange={e=>setLoginPassword(e.target.value)} required/></label><button className="primary" disabled={authBusy||!configured}>Sign in</button></form></section>}
 {tab==='admin'&&adminAllowed&&<><div className="adminGrid"><section className="panel"><h2>{editing?'Update room':'Add new room'}</h2><p className="muted">{editing?'UPDATE':'INSERT'} · Supabase room table</p><form onSubmit={saveRoom} className="form"><label>Room number<input required value={form.room_number} onChange={e=>setForm({...form,room_number:e.target.value})} placeholder="C1.2.310"/></label><label>Building<input required value={form.building} onChange={e=>setForm({...form,building:e.target.value})}/></label><label>Floor<input type="number" min="1" required value={form.floor} onChange={e=>setForm({...form,floor:e.target.value})}/></label><label>Coordinates (text)<input value={form.x_y_coords} onChange={e=>setForm({...form,x_y_coords:e.target.value})} placeholder="e.g. 5.1"/></label><button className="primary" disabled={!configured||!adminAllowed}><Plus size={17}/>{editing?'Save changes':'Add room'}</button>{editing&&<button type="button" className="ghost" onClick={()=>{setEditing(null);setForm({room_number:'',building:'C1',floor:2,x_y_coords:''})}}>Cancel edit</button>}</form></section><section className="panel"><h2>Add class to student schedule</h2><p className="muted">INSERT · schedule table</p><form className="form" onSubmit={addSchedule}><label>Student user ID<input type="number" required value={studentId} onChange={e=>setStudentId(e.target.value)}/></label><label>Class ID<input type="number" required value={courseId} onChange={e=>setCourseId(e.target.value)}/></label><label>Day<select value={newDay} onChange={e=>setNewDay(e.target.value)}>{weekdays.map(d=><option key={d}>{d}</option>)}</select></label><button className="primary" disabled={!configured||!adminAllowed}>Add schedule entry</button></form><p className="muted">Use existing IDs from your Supabase users and class tables.</p></section></div><h2>Manage rooms</h2><div className="tableWrap"><table><thead><tr><th>Room</th><th>Building</th><th>Floor</th><th>Coordinates</th><th>Actions</th></tr></thead><tbody>{rooms.map(r=><tr key={r.room_id}><td>{r.room_number}</td><td>{r.building}</td><td>{r.floor}</td><td>{r.x_y_coords}</td><td><button className="iconButton" title="Edit" onClick={()=>editRoom(r)}><Pencil size={17}/></button><button className="iconButton danger" title="Delete" onClick={()=>deleteRoom(r)}><Trash2 size={17}/></button></td></tr>)}</tbody></table></div></>}
 <footer>{loading?'Loading Supabase records…':'AITU Smart Campus Navigation · Final Exam Prototype'}</footer></main></div>
}
createRoot(document.getElementById('root')).render(<App/>);
