
const STORAGE_KEY = 'study_workflow_app_v1';

const nowISO = () => new Date().toISOString();

const defaultData = {
  teams: [],
  members: [],
  tickets: [],
  activity: []
};

const store = {
  read(){
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return JSON.parse(JSON.stringify(defaultData));
    try { return JSON.parse(raw); } catch { return JSON.parse(JSON.stringify(defaultData)); }
  },
  write(data){ localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); },
  reset(){ localStorage.removeItem(STORAGE_KEY); }
};

let db = store.read();


const uid = () => Math.random().toString(36).slice(2,10);
const byId = (id) => document.getElementById(id);
const qs = (sel, el=document) => el.querySelector(sel);
const qsa = (sel, el=document) => Array.from(el.querySelectorAll(sel));

function logActivity(type, message){
  db.activity.unshift({id:uid(), type, message, at: nowISO()});
  db.activity = db.activity.slice(0,200);
}
function save(){ store.write(db); renderAll(); }


function activateTab(id){
  qsa('.section').forEach(s=>s.classList.remove('active'));
  byId(id).classList.add('active');
  qsa('.tab-btn').forEach(b=>b.classList.toggle('active', b.dataset.section===id));
}
qsa('.tab-btn').forEach(btn=>{
  btn.addEventListener('click', ()=> activateTab(btn.dataset.section));
});

const teamList = byId('teamList');
const teamForm = byId('teamForm');
byId('addTeamBtn').onclick = ()=>{ teamForm.classList.remove('hidden'); teamForm.reset(); teamForm.id.value = ''; };
byId('cancelTeam').onclick = ()=> teamForm.classList.add('hidden');

teamForm.addEventListener('submit', (e)=>{
  e.preventDefault();
  const f = new FormData(teamForm);
  const data = Object.fromEntries(f.entries());
  if(data.id){
    const t = db.teams.find(x=>x.id===data.id);
    t.name = data.name; t.description = data.description;
    logActivity('team.update', `Updated team "${t.name}"`);
  } else {
    const t = {id:uid(), name:data.name, description:data.description||'', createdAt:nowISO()};
    db.teams.push(t);
    logActivity('team.create', `Created team "${t.name}"`);
  }
  save(); teamForm.classList.add('hidden');
});

function renderTeams(){

  const teamSel1 = byId('memberTeamSelect');
  const teamSel2 = byId('ticketTeamSelect');
  [teamSel1, teamSel2].forEach(sel=>{
    if(!sel) return;
    sel.innerHTML = '<option value="">-- None --</option>' + db.teams.map(t=>`<option value="${t.id}">${t.name}</option>`).join('');
  });

  if(!db.teams.length){ teamList.innerHTML = '<div class="panel">No teams yet.</div>'; return; }
  const rows = db.teams.map(t=>`
    <tr data-id="${t.id}">
      <td>${t.name}</td>
      <td>${t.description||''}</td>
      <td class="row-actions"></td>
    </tr>`).join('');
  teamList.innerHTML = `<table><thead><tr><th>Name</th><th>Description</th><th></th></tr></thead><tbody>${rows}</tbody></table>`;
  qsa('#teamList tbody tr').forEach(tr=>{
    const cell = tr.querySelector('.row-actions');
    cell.innerHTML = byId('rowActionsTpl').innerHTML;
    cell.querySelector('[data-action="edit"]').onclick = ()=>{
      const t = db.teams.find(x=>x.id===tr.dataset.id);
      teamForm.classList.remove('hidden');
      teamForm.id.value = t.id; teamForm.name.value = t.name; teamForm.description.value = t.description||'';
    };
    cell.querySelector('[data-action="delete"]').onclick = ()=>{
      const t = db.teams.find(x=>x.id===tr.dataset.id);
      if(!confirm(`Delete team "${t.name}"?`)) return;
      db.members.forEach(m=>{ if(m.teamId===t.id) m.teamId=''; });
      db.tickets.forEach(tk=>{ if(tk.teamId===t.id) tk.teamId=''; });
      db.teams = db.teams.filter(x=>x.id!==t.id);
      logActivity('team.delete', `Deleted team "${t.name}"`);
      save();
    };
  });
}


const memberList = byId('memberList');
const memberForm = byId('memberForm');
byId('addMemberBtn').onclick = ()=>{ memberForm.classList.remove('hidden'); memberForm.reset(); memberForm.id.value=''; };
byId('cancelMember').onclick = ()=> memberForm.classList.add('hidden');

memberForm.addEventListener('submit', (e)=>{
  e.preventDefault();
  const f = new FormData(memberForm);
  const data = Object.fromEntries(f.entries());
  if(data.id){
    const m = db.members.find(x=>x.id===data.id);
    Object.assign(m, {name:data.name, email:data.email, role:data.role, position:data.position, teamId:data.teamId});
    logActivity('member.update', `Updated member ${m.name}`);
  } else {
    const m = {id:uid(), name:data.name, email:data.email, role:data.role, position:data.position||'', teamId:data.teamId||'', createdAt:nowISO()};
    db.members.push(m);
    logActivity('member.create', `Added member ${m.name}`);
  }
  save(); memberForm.classList.add('hidden');
});

function renderMembers(){
  if(!db.members.length){ memberList.innerHTML = '<div class="panel">No members yet.</div>'; return; }
  const rows = db.members.map(m=>{
    const teamName = db.teams.find(t=>t.id===m.teamId)?.name || '-';
    return `<tr data-id="${m.id}">
      <td>${m.name}</td>
      <td>${m.email}</td>
      <td>${m.role}</td>
      <td>${m.position||''}</td>
      <td>${teamName}</td>
      <td class="row-actions"></td>
    </tr>`
  }).join('');
  memberList.innerHTML = `<table><thead><tr><th>Name</th><th>Gmail</th><th>Role</th><th>Position</th><th>Team</th><th></th></tr></thead><tbody>${rows}</tbody></table>`;
  qsa('#memberList tbody tr').forEach(tr=>{
    const cell = tr.querySelector('.row-actions');
    cell.innerHTML = byId('rowActionsTpl').innerHTML;
    cell.querySelector('[data-action="edit"]').onclick = ()=>{
      const m = db.members.find(x=>x.id===tr.dataset.id);
      memberForm.classList.remove('hidden');
      memberForm.id.value=m.id; memberForm.name.value=m.name; memberForm.email.value=m.email; memberForm.role.value=m.role; memberForm.position.value=m.position||''; memberForm.teamId.value=m.teamId||'';
    };
    cell.querySelector('[data-action="delete"]').onclick = ()=>{
      const m = db.members.find(x=>x.id===tr.dataset.id);
      if(!confirm(`Delete member ${m.name}?`)) return;
      db.tickets.forEach(tk=>{ if(tk.assigneeId===m.id) tk.assigneeId=''; });
      db.members = db.members.filter(x=>x.id!==m.id);
      logActivity('member.delete', `Deleted member ${m.name}`);
      save();
    };
  });
}


const ticketList = byId('ticketList');
const ticketForm = byId('ticketForm');
byId('addTicketBtn').onclick = ()=>{ ticketForm.classList.remove('hidden'); ticketForm.reset(); ticketForm.id.value=''; syncAssigneeOptions(); };
byId('cancelTicket').onclick = ()=> ticketForm.classList.add('hidden');

byId('ticketTeamSelect').addEventListener('change', syncAssigneeOptions);

function syncAssigneeOptions(){
  const teamId = byId('ticketTeamSelect').value;
  const assSel = byId('ticketAssigneeSelect');
  const members = teamId ? db.members.filter(m=>m.teamId===teamId) : db.members;
  assSel.innerHTML = '<option value="">-- Unassigned --</option>' + members.map(m=>`<option value="${m.id}">${m.name}</option>`).join('');
}

ticketForm.addEventListener('submit', (e)=>{
  e.preventDefault();
  const f = new FormData(ticketForm);
  const data = Object.fromEntries(f.entries());
  if(data.id){
    const t = db.tickets.find(x=>x.id===data.id);
    Object.assign(t, {title:data.title, description:data.description, status:data.status, priority:data.priority, teamId:data.teamId, assigneeId:data.assigneeId});
    logActivity('ticket.update', `Updated ticket "${t.title}"`);
  } else {
    const t = {id:uid(), title:data.title, description:data.description||'', status:data.status, priority:data.priority, teamId:data.teamId||'', assigneeId:data.assigneeId||'', createdAt:nowISO()};
    db.tickets.push(t);
    logActivity('ticket.create', `Created ticket "${t.title}"`);
  }
  save(); ticketForm.classList.add('hidden');
});

function renderTickets(){
  if(!db.tickets.length){ ticketList.innerHTML = '<div class="panel">No tickets yet.</div>'; return; }
  const rows = db.tickets.map(t=>{
    const teamName = db.teams.find(x=>x.id===t.teamId)?.name || '-';
    const assignee = db.members.find(x=>x.id===t.assigneeId)?.name || '-';
    return `<tr data-id="${t.id}">
      <td>${t.title}</td>
      <td>${t.status}</td>
      <td>${t.priority}</td>
      <td>${teamName}</td>
      <td>${assignee}</td>
      <td class="row-actions"></td>
    </tr>`
  }).join('');
  ticketList.innerHTML = `<table><thead><tr><th>Title</th><th>Status</th><th>Priority</th><th>Team</th><th>Assignee</th><th></th></tr></thead><tbody>${rows}</tbody></table>`;
  qsa('#ticketList tbody tr').forEach(tr=>{
    const cell = tr.querySelector('.row-actions');
    cell.innerHTML = byId('rowActionsTpl').innerHTML;
    cell.querySelector('[data-action="edit"]').onclick = ()=>{
      const t = db.tickets.find(x=>x.id===tr.dataset.id);
      ticketForm.classList.remove('hidden');
      ticketForm.id.value=t.id; ticketForm.title.value=t.title; ticketForm.description.value=t.description||''; ticketForm.status.value=t.status; ticketForm.priority.value=t.priority; ticketForm.teamId.value=t.teamId||''; syncAssigneeOptions(); ticketForm.assigneeId.value=t.assigneeId||'';
    };
    cell.querySelector('[data-action="delete"]').onclick = ()=>{
      const t = db.tickets.find(x=>x.id===tr.dataset.id);
      if(!confirm(`Delete ticket "${t.title}"?`)) return;
      db.tickets = db.tickets.filter(x=>x.id!==t.id);
      logActivity('ticket.delete', `Deleted ticket "${t.title}"`);
      save();
    };
  });
}


function renderDashboard(){
  byId('totalEmployees').textContent = db.members.length;
  const active = db.tickets.filter(t=>!['Done'].includes(t.status)).length;
  byId('activeTasks').textContent = active;
  const avg = db.members.length ? (db.tickets.length / db.members.length) : 0;
  byId('avgWorkload').textContent = avg.toFixed(2);
  const high = db.tickets.filter(t=>['High','Critical'].includes(t.priority)).length;
  byId('highPriorityCount').textContent = high;

  drawBars('statusChart', countBy(db.tickets, 'status'));
  drawBars('priorityChart', countBy(db.tickets, 'priority'));
  drawBars('teamLoad', countBy(db.tickets, 'teamId', (id)=> db.teams.find(t=>t.id===id)?.name || 'Unassigned'));

  const list = byId('recentActivity');
  list.innerHTML = db.activity.slice(0,10).map(a=>`<li><div>${a.message}</div><div class="activity-time">${new Date(a.at).toLocaleString()}</div></li>`).join('');
}

function countBy(arr, key, labelMap){
  const map = new Map();
  arr.forEach(it=>{
    const k = it[key] || '';
    map.set(k, (map.get(k)||0)+1);
  });
  const entries = Array.from(map.entries()).map(([k,v])=>({label: labelMap?labelMap(k): (k||'Unassigned'), value:v}));
  entries.sort((a,b)=>b.value-a.value);
  return entries;
}

function drawBars(elId, entries){
  const el = byId(elId);
  if(!entries.length){ el.innerHTML = '<div class="sub">No data</div>'; return; }
  const max = Math.max(...entries.map(e=>e.value));
  el.innerHTML = entries.map(e=>{
    const pct = max ? (e.value/max*100).toFixed(0) : 0;
    return `<div class="bar"><div class="label">${e.label}</div><div class="track"><div class="fill" style="width:${pct}%"></div></div><div class="value">${e.value}</div></div>`;
  }).join('');
}


function renderActivity(){
  const list = byId('activityList');
  if(!db.activity.length){ list.innerHTML = '<li class="panel">No activity yet.</li>'; return; }
  list.innerHTML = db.activity.map(a=>`<li><div>${a.message}</div><div class="activity-time">${new Date(a.at).toLocaleString()}</div></li>`).join('');
}


byId('exportBtn').onclick = ()=>{
  const blob = new Blob([JSON.stringify(db,null,2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'study-workflow-data.json'; a.click();
  URL.revokeObjectURL(url);
};

byId('importBtn').onclick = ()=> byId('importFile').click();
byId('importFile').addEventListener('change', (e)=>{
  const file = e.target.files?.[0]; if(!file) return;
  const reader = new FileReader();
  reader.onload = ()=>{
    try{
      const data = JSON.parse(reader.result);
      if(!('teams' in data && 'members' in data && 'tickets' in data && 'activity' in data)) throw new Error('Invalid file');
      db = data; save(); alert('Data imported!');
    }catch(err){ alert('Import failed: ' + err.message); }
  };
  reader.readAsText(file);
});

byId('resetBtn').onclick = ()=>{
  if(!confirm('This will erase all local data. Continue?')) return;
  store.reset(); db = store.read(); renderAll();
};


(function seed(){
  if(db.teams.length || db.members.length || db.tickets.length) return;
  const teamA = {id:uid(), name:'Alpha', description:'Core platform', createdAt:nowISO()};
  const teamB = {id:uid(), name:'Beta', description:'Growth & UX', createdAt:nowISO()};
  db.teams.push(teamA, teamB);
  const m1 = {id:uid(), name:'Jane Doe', email:'jane.doe@gmail.com', role:'Frontend Dev', position:'Senior', teamId:teamA.id, createdAt:nowISO()};
  const m2 = {id:uid(), name:'John Smith', email:'john.smith@gmail.com', role:'Backend Dev', position:'Mid', teamId:teamA.id, createdAt:nowISO()};
  const m3 = {id:uid(), name:'Amina Ali', email:'amina.ali@gmail.com', role:'Designer', position:'Lead', teamId:teamB.id, createdAt:nowISO()};
  db.members.push(m1,m2,m3);
  db.tickets.push(
    {id:uid(), title:'Fix login bug', description:'Safari issue', status:'In Progress', priority:'High', teamId:teamA.id, assigneeId:m1.id, createdAt:nowISO()},
    {id:uid(), title:'Refactor API v2', description:'', status:'Backlog', priority:'Medium', teamId:teamA.id, assigneeId:m2.id, createdAt:nowISO()},
    {id:uid(), title:'Landing page revamp', description:'', status:'Review', priority:'High', teamId:teamB.id, assigneeId:m3.id, createdAt:nowISO()},
    {id:uid(), title:'Analytics setup', description:'', status:'Done', priority:'Low', teamId:teamB.id, assigneeId:'', createdAt:nowISO()}
  );
  logActivity('seed', 'Loaded sample data');
  save();
})();


function renderAll(){
  renderTeams(); renderMembers(); renderTickets(); renderDashboard(); renderActivity();
}


renderAll();
