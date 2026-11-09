import React,{useEffect,useMemo,useState} from 'react';
import{createRoot}from'react-dom/client';
import{createClient}from'@supabase/supabase-js';
import{MapPin,CalendarDays,Shield,Search,Plus,Trash2,Pencil,Navigation,ArrowLeft,BarChart3,AlertTriangle,RefreshCw}from'lucide-react';
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
function App(){
console.warn("AITU APP UPDATED - TEST");
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
  console.log('Demo schedule:', demoSchedule);
 useEffect(()=>{const timer=setInterval(()=>setClock(new Date()),30000);return()=>clearInterval(timer)},[]);
  const currentDay=weekdays[(clock.getDay()+6)%7];
  const todayLessons=schedule.filter(s=>String(s.day_of_week||'').toLowerCase()===currentDay.toLowerCase()&&studentId&&String(s.user_id)===String(studentId)).map(s=>({...s,course:classes.find(c=>String(c.class_id)===String(s.class_id))}));
  const reminderCandidate=todayLessons.find(s=>{if(!s.course?.start_time)return false;const [h,m]=s.course.start_time.slice(0,5).split(':').map(Number);const remaining=h*60+m-clock.getHours()*60-clock.getMinutes();return remaining>=0&&remaining<=10;});
  const reminderLesson=demoReminder?(todays.find(s=>s.course)||null):reminderCandidate;
  const reminderKey=reminderLesson?`${clock.toDateString()}:${reminderLesson.schedule_id||reminderLesson.class_id}:${demoReminder?'test':'real'}`:'';
  const reminderRoom=reminderLesson?rooms.find(r=>String(r.room_id)===String(reminderLesson.course?.room_id)):null;
 const crowded=logs.filter(l=>String(l.occupancy_status).toLowerCase()==='crowded');
 function go(room){setSelected(room);setFloor(Number(room?.floor)||2);setTab('map');notify(room?'Destination: '+room.room_number:'Select a room to navigate')}
 async function saveRoom(e){e.preventDefault();if(!db||!adminAllowed)return notify('Administrator sign-in required');const payload={room_number:form.room_number.trim(),building:form.building.trim(),floor:Number(form.floor),x_y_coords:form.x_y_coords.trim()};if(!payload.room_number)return notify('Enter room number');try{const q=editing?db.from('room').update(payload).eq('room_id',editing):db.from('room').insert(payload);const {error}=await q;if(error)throw error;notify(editing?'Room updated in Supabase':'Room inserted in Supabase');setEditing(null);setForm({room_number:'',building:'C1',floor:2,x_y_coords:''});await load()}catch(e){notify(e.message)}}
 async function deleteRoom(r){if(!db||!adminAllowed)return notify('Administrator sign-in required');if(!window.confirm('Delete '+r.room_number+' from Supabase?'))return;const{error}=await db.from('room').delete().eq('room_id',r.room_id);if(error)notify(error.message);else{notify('Room deleted from Supabase');load()}}
 function editRoom(r){setEditing(r.room_id);setForm({room_number:r.room_number||'',building:r.building||'',floor:r.floor||1,x_y_coords:String(r.x_y_coords??'')});setTab('admin')}
 async function addSchedule(e){e.preventDefault();if(!db||!adminAllowed)return notify('Administrator sign-in required');const{error}=await db.from('schedule').insert({user_id:Number(studentId),class_id:Number(courseId),day_of_week:newDay});if(error)notify(error.message);else{notify('Schedule entry added');load()}}
 const searchRoom=async()=>{if(!db)return notify('Connect Supabase first');const q=search.trim();const{data,error}=await db.from('room').select('*').ilike('room_number',`%${q}%`);if(error)notify(error.message);else{notify(`${data.length} matching room(s) from Supabase`);if(data.length===1)go(data[0]);else setTab('rooms')}};
 return <div className="app"><aside className="sidebar"><div className="brand">✦ AITU <span>NAVIGATION</span></div><p className="subtitle">SMART CAMPUS PLANNER</p><nav>{[['schedule',CalendarDays,'My Schedule'],['rooms',Search,'Find a Room'],['map',MapPin,'Campus Map'],['analytics',BarChart3,'Campus Insights'],['admin',Shield,'Admin Panel']].map(([id,Icon,label])=><button key={id} className={tab===id?'active':''} onClick={()=>setTab(id)}><Icon size={19}/>{label}</button>)}</nav><div className="sidefoot"><span className={configured?'dot green':'dot'}/>{configured?'Supabase configured':'Supabase not connected'}<button className="refresh" onClick={load}><RefreshCw size={15}/> Refresh data</button></div></aside><main><header><div><small>ASTANA IT UNIVERSITY</small><h1>{({schedule:'My Schedule',rooms:'Find a Room',map:'Campus Navigation',analytics:'Campus Insights',admin:'Room Administration'})[tab]}</h1></div><div className="authHeader">{session?<><span>{session.user.email}</span><button className="ghost" onClick={signOut}>Sign out</button></>:<span>Guest mode</span>}<div className="avatar">AITU</div></div></header>{!configured&&<div className="warning"><AlertTriangle size={18}/> Configure <code>.env</code> to connect your existing Supabase database. No simulated database results are shown.</div>}{notice&&<div className="toast" role="status">{notice}<button onClick={()=>setNotice('')}>×</button></div>}
 {tab==='schedule'&&<>{reminderLesson&&dismissedReminder!==reminderKey&&<section className="panel" role="alert"><h2>🔔 {demoReminder?'Test reminder':'Upcoming class'}</h2><p>{reminderLesson.course?.course_name} · {reminderLesson.course?.start_time?.slice(0,5)} · {reminderRoom?.room_number||'Room unavailable'}</p><button className="primary" disabled={!reminderRoom} onClick={()=>{go(reminderRoom);setDemoReminder(false)}}><Navigation size={17}/> Get Directions</button> <button className="ghost" onClick={()=>{setDismissedReminder(reminderKey);setDemoReminder(false)}}>Dismiss</button></section>}<button className="ghost" onClick={()=>{setDismissedReminder('');setDemoReminder(true);setDay('Monday')}}>Test reminder</button><section className="hero"><div><small>YOUR CAMPUS, SIMPLIFIED</small><h2>Ready for your next class?</h2><p>Find classrooms and get directions in one place.</p></div><button className="primary" onClick={()=>setTab('map')}><Navigation size={17}/> Open campus map</button></section><div className="days">{weekdays.map(d=><button key={d} className={day===d?'chosen':''} onClick={()=>setDay(d)}>{d.slice(0,3)}</button>)}</div><div className="sectionTitle"><h2>{day}</h2><span>{todays.length} classes</span></div><p className="muted">Demo student: AITU Demo Student</p><div className="cards">{todays.length?todays.map((s,i)=><article className="classCard" key={s.schedule_id||i}><div className="time">{s.course?.start_time?.slice(0,5)||'--:--'}<small>{s.course?.end_time?.slice(0,5)||''}</small></div><div className="classInfo"><small>CLASS #{s.class_id}</small><h3>{s.course?.course_name||'Class'}</h3><button className="roomLink" onClick={()=>go(rooms.find(r=>String(r.room_id)===String(s.course?.room_id)))}><MapPin size={16}/>{rooms.find(r=>String(r.room_id)===String(s.course?.room_id))?.room_number||'Room unavailable'} · Get directions</button></div></article>):<div className="empty">{configured?'No classes found for this day and student filter.':'Connect Supabase to load your real timetable.'}</div>}</div></>}
 {tab==='rooms'&&<><section className="searchBar"><Search size={20}/><input placeholder="Search room number or building..." value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==='Enter'&&searchRoom()}/><button className="primary" onClick={searchRoom}>Search database</button></section><p className="muted">SELECT with WHERE · Live room records</p><div className="roomGrid">{filtered.map(r=><article className="roomCard" key={r.room_id}><div className="roomIcon"><MapPin/></div><h3>{r.room_number}</h3><p>{r.building} · Floor {r.floor}</p><small>Coordinates: {r.x_y_coords||'Not set'}</small><button onClick={()=>go(r)} className="primary">Get directions</button></article>)}</div>{!filtered.length&&<div className="empty">No matching room records loaded.</div>}</>}
 {tab==='map'&&<><div className="mapToolbar"><label>Start <select value={origin} onChange={e=>setOrigin(e.target.value)}><option value={entryPoint}>Main entrance · Floor 1</option>{rooms.filter(r=>roomLocation(r)).map(r=>{const loc=roomLocation(r);const node=nearestNode(loc.floor,loc.x,loc.y);return <option key={r.room_id} value={node?.id}>{r.room_number} · Floor {loc.floor}</option>})}</select></label><label>Destination <select value={selected?.room_id||''} onChange={e=>{const r=rooms.find(x=>String(x.room_id)===e.target.value);setSelected(r||null);if(r)setFloor(Number(roomLocation(r)?.floor||r.floor)||2)}}><option value="">Choose room</option>{rooms.map(r=><option value={r.room_id} key={r.room_id}>{r.room_number}</option>)}</select></label><label>Floor <select value={floor} onChange={e=>setFloor(Number(e.target.value))}>{[1,2,3].map(n=><option key={n} value={n}>{n}</option>)}</select></label></div><div className="mapLayout"><div className="mapPanel"><div className="mapCaption">AITU · FLOOR {floor}<span>SCHEMATIC CORRIDOR GRAPH</span></div><svg viewBox="0 0 660 510" className="floorMap" role="img" aria-label="Schematic AITU floor plan with calculated route"><rect width="660" height="510" rx="20" fill="#111c30"/><path d="M62 280 Q110 170 330 170 Q550 170 585 280" fill="none" stroke="#374860" strokeWidth="75" strokeLinecap="round"/><path d="M90 350 Q330 420 560 350" fill="none" stroke="#374860" strokeWidth="64" strokeLinecap="round"/><rect x="240" y="295" width="190" height="90" rx="15" fill="#202e44"/><text x="335" y="344" textAnchor="middle" fill="#9fb2d2" fontSize="17">{floor===1?'ATRIUM':floor===2?'ASSEMBLY HALL':'OPEN SPACE'}</text>{graph.edges.map(([a,b],i)=>{const x=graph.nodes.find(n=>n.id===a),y=graph.nodes.find(n=>n.id===b);return x?.floor===floor&&y?.floor===floor?<line key={i} x1={x.x} y1={x.y} x2={y.x} y2={y.y} stroke="#8090a6" strokeWidth="3" strokeDasharray="5 8"/>:null})}{rooms.filter(r=>Number(roomLocation(r)?.floor)===floor).map(r=>{const loc=roomLocation(r);return <g key={r.room_id} onClick={()=>setSelected(r)} style={{cursor:'pointer'}}><rect x={loc.x-34} y={loc.y-19} width="68" height="38" rx="8" fill={selected?.room_id===r.room_id?'#e56f65':'#2773b9'} stroke="#9bcaff"/><text x={loc.x} y={loc.y+4} fontSize="10" textAnchor="middle" fill="white">{String(r.room_number).split('.').pop()}</text></g>})}{route&&route.path.filter(n=>n.floor===floor).map((n,i,arr)=>i>0?<line key={i} x1={arr[i-1].x} y1={arr[i-1].y} x2={n.x} y2={n.y} stroke="#ffb34e" strokeWidth="9" strokeLinecap="round"/>:null)}{route?.path.filter(n=>n.floor===floor).map((n,i)=><circle key={n.id} cx={n.x} cy={n.y} r={i===0?9:5} fill={i===0?'#34d3b4':'#ffb34e'}/>)}<text x="28" y="475" fill="#b6c5dc" fontSize="14">Orange = calculated corridor path</text></svg><p className="mapNote">Educational graph inferred from screenshots; not a surveyed or safety-certified floor plan. Only rooms with validated X,Y coordinates or mapped demo positions appear.</p></div><div className="routePanel"><h3><Navigation size={20}/> Dijkstra route</h3>{selected?<><h2>{selected.room_number}</h2><p>Floor {targetLocation?.floor??selected.floor} · {selected.building}</p>{!targetLocation?<div className="instruction">This room has no valid map coordinates yet. Set x_y_coords as x,y in Admin or add a mapped location.</div>:route?<><div className="instruction">Shortest path computed across {route.path.length} waypoints · {route.floorChanges} floor changes · graph cost {route.distance} (not meters)</div><p className="muted">{route.path.map(n=>n.label+(n.floor!==floor?' (F'+n.floor+')':'')).join(' → ')}</p><button className="primary" onClick={()=>setFloor(targetLocation.floor)}>Show destination floor</button></>:<p>No connected route found.</p>}</>:<p className="muted">Choose a room to calculate a route from the selected starting point.</p>}<hr/><h3><AlertTriangle size={18}/> Sensor observations</h3>{crowded.slice(0,5).map((l,i)=><div className="alertItem" key={i}>Room ID {l.room_id} <strong>{l.people_count} people</strong><small>{l.timestamp}</small></div>)}{!crowded.length&&<p className="muted">No crowded sensor records loaded.</p>}<small className="muted">Historical logs only. They do not automatically change route costs without verified corridor-to-sensor mappings.</small></div></div></>}
 {tab==='analytics'&&<><h2>Room distribution by floor</h2><p className="muted">COUNT(*) GROUP BY floor, executed in PostgreSQL through a Supabase RPC function.</p><div className="stats">{counts.map(x=><div className="stat" key={x.floor}><small>FLOOR {x.floor}</small><strong>{x.room_count}</strong><span>rooms</span></div>)}</div><h2>Occupancy sensor logs</h2><div className="tableWrap"><table><thead><tr><th>Sensor</th><th>Room ID</th><th>Status</th><th>People</th><th>Timestamp</th></tr></thead><tbody>{logs.map((l,i)=><tr key={i}><td>{l.sensor_id}</td><td>{l.room_id}</td><td>{l.occupancy_status}</td><td>{l.people_count}</td><td>{l.timestamp}</td></tr>)}</tbody></table></div></>}
 {tab==='admin'&&!adminAllowed&&<section className="panel"><h2>Administrator sign-in</h2><p>Use Supabase Auth. Your authenticated email must have role = admin in the existing users table, and database RLS policies must enforce permissions.</p><form onSubmit={signIn} className="form"><label>Email<input type="email" value={loginEmail} onChange={e=>setLoginEmail(e.target.value)} required/></label><label>Password<input type="password" value={loginPassword} onChange={e=>setLoginPassword(e.target.value)} required/></label><button className="primary" disabled={authBusy||!configured}>Sign in</button></form></section>}
 {tab==='admin'&&adminAllowed&&<><div className="adminGrid"><section className="panel"><h2>{editing?'Update room':'Add new room'}</h2><p className="muted">{editing?'UPDATE':'INSERT'} · Supabase room table</p><form onSubmit={saveRoom} className="form"><label>Room number<input required value={form.room_number} onChange={e=>setForm({...form,room_number:e.target.value})} placeholder="C1.2.310"/></label><label>Building<input required value={form.building} onChange={e=>setForm({...form,building:e.target.value})}/></label><label>Floor<input type="number" min="1" required value={form.floor} onChange={e=>setForm({...form,floor:e.target.value})}/></label><label>Coordinates (text)<input value={form.x_y_coords} onChange={e=>setForm({...form,x_y_coords:e.target.value})} placeholder="e.g. 5.1"/></label><button className="primary" disabled={!configured||!adminAllowed}><Plus size={17}/>{editing?'Save changes':'Add room'}</button>{editing&&<button type="button" className="ghost" onClick={()=>{setEditing(null);setForm({room_number:'',building:'C1',floor:2,x_y_coords:''})}}>Cancel edit</button>}</form></section><section className="panel"><h2>Add class to student schedule</h2><p className="muted">INSERT · schedule table</p><form className="form" onSubmit={addSchedule}><label>Student user ID<input type="number" required value={studentId} onChange={e=>setStudentId(e.target.value)}/></label><label>Class ID<input type="number" required value={courseId} onChange={e=>setCourseId(e.target.value)}/></label><label>Day<select value={newDay} onChange={e=>setNewDay(e.target.value)}>{weekdays.map(d=><option key={d}>{d}</option>)}</select></label><button className="primary" disabled={!configured||!adminAllowed}>Add schedule entry</button></form><p className="muted">Use existing IDs from your Supabase users and class tables.</p></section></div><h2>Manage rooms</h2><div className="tableWrap"><table><thead><tr><th>Room</th><th>Building</th><th>Floor</th><th>Coordinates</th><th>Actions</th></tr></thead><tbody>{rooms.map(r=><tr key={r.room_id}><td>{r.room_number}</td><td>{r.building}</td><td>{r.floor}</td><td>{r.x_y_coords}</td><td><button className="iconButton" title="Edit" onClick={()=>editRoom(r)}><Pencil size={17}/></button><button className="iconButton danger" title="Delete" onClick={()=>deleteRoom(r)}><Trash2 size={17}/></button></td></tr>)}</tbody></table></div></>}
 <footer>{loading?'Loading Supabase records…':'AITU Smart Campus Navigation · Final Exam Prototype'}</footer></main></div>
}
createRoot(document.getElementById('root')).render(<App/>);
