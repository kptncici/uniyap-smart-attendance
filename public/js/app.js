const API='/api';
const app=document.getElementById('app');
const sidebar=document.getElementById('sidebar');
const navUser=document.getElementById('nav-user');

function setUserUI(){
  const user=JSON.parse(localStorage.getItem('user')||'null');
  navUser.innerHTML = user ? `${user.name} (${user.role}) <button id="logoutBtn" class="ml-3 text-red-600">Logout</button>` : '';
  if(user) document.getElementById('logoutBtn')?.addEventListener('click', ()=>{ localStorage.clear(); renderLogin(); });
}

function navFor(role){
  sidebar.innerHTML='';
  const items = [{id:'dashboard',label:'Dashboard'}];
  if(role==='ADMIN') items.push({id:'admin',label:'Admin: Manage Master'});
  if(role==='LECTURER') items.push({id:'lecturer',label:'Dosen: Buat Sesi'});
  if(role==='STUDENT') items.push({id:'student',label:'Mahasiswa: Scan QR'});
  items.forEach(it=>{
    const li=document.createElement('li');
    li.innerHTML=`<button class="w-full text-left" data-id="${it.id}">${it.label}</button>`;
    li.querySelector('button').addEventListener('click', ()=>route(it.id));
    sidebar.appendChild(li);
  });
}

function route(page){
  const user = JSON.parse(localStorage.getItem('user')||'null');
  if(!user && page!=='login') return renderLogin();
  if(!page || page==='dashboard') return renderDashboard();
  if(page==='admin') return renderAdmin();
  if(page==='lecturer') return renderLecturer();
  if(page==='student') return renderStudent();
  if(page==='login') return renderLogin();
}

function renderLogin(){
  setUserUI();
  app.innerHTML=`
    <div class="max-w-md mx-auto bg-white p-6 rounded shadow">
      <h2 class="text-xl font-semibold mb-4">Login</h2>
      <form id="loginForm" class="space-y-3">
        <input id="email" class="w-full border p-2" placeholder="email"/>
        <input id="password" type="password" class="w-full border p-2" placeholder="password"/>
        <button class="bg-green-600 text-white px-4 py-2 rounded">Login</button>
      </form>
      <p class="text-sm text-gray-500 mt-2">Default admin: admin@admin.com / admin123</p>
    </div>`;
  document.getElementById('loginForm').addEventListener('submit', async (e)=>{
    e.preventDefault();
    const email=document.getElementById('email').value, password=document.getElementById('password').value;
    const res=await fetch(API+'/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password})});
    const data=await res.json();
    if(res.ok){ localStorage.setItem('token', data.token); localStorage.setItem('user', JSON.stringify(data.user)); setUserUI(); navFor(data.user.role); route('dashboard'); } else { alert(data.error||'Login failed'); }
  });
}

function renderDashboard(){
  const user=JSON.parse(localStorage.getItem('user')||'null');
  app.innerHTML=`<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
    <div class="p-4 bg-white rounded shadow"><h3 class="font-medium">Welcome</h3><p class="text-sm">Halo ${user?user.name:'Tamu'}</p></div>
    <div class="p-4 bg-white rounded shadow" id="statsBox"><h3 class="font-medium">Stats</h3><p class="text-sm">Klik tombol untuk muat</p><button id="btnLoadStats" class="mt-2 bg-blue-600 text-white px-3 py-1 rounded">Muat Statistik</button></div>
    <div class="p-4 bg-white rounded shadow"><h3 class="font-medium">Info</h3><p class="text-sm">Sidebar untuk navigasi</p></div>
  </div>`;
  document.getElementById('btnLoadStats').addEventListener('click', async ()=>{
    const token=localStorage.getItem('token');
    const res=await fetch(API+'/admin/stats',{headers:{Authorization:'Bearer '+token}});
    const data=await res.json();
    if(res.ok) alert(JSON.stringify(data,null,2)); else alert(data.error||'Error');
  });
}

async function renderAdmin(){
  app.innerHTML=`
  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Admin - Manage</h2>
    <div class="grid md:grid-cols-3 gap-4">
      <div class="p-4 bg-white rounded shadow">
        <h3 class="font-medium">Tambah Dosen</h3>
        <form id="formAddLect" class="space-y-2 mt-2"><input id="lnip" placeholder="NIP" class="w-full border p-2"/><input id="lname" placeholder="Nama" class="w-full border p-2"/><input id="lemail" placeholder="Email" class="w-full border p-2"/><button class="bg-green-600 text-white px-3 py-1 rounded">Tambah</button></form>
      </div>
      <div class="p-4 bg-white rounded shadow">
        <h3 class="font-medium">Tambah Mahasiswa</h3>
        <form id="formAddStu" class="space-y-2 mt-2"><input id="snim" placeholder="NIM" class="w-full border p-2"/><input id="sname" placeholder="Nama" class="w-full border p-2"/><input id="sclass" placeholder="Kelas" class="w-full border p-2"/><button class="bg-green-600 text-white px-3 py-1 rounded">Tambah</button></form>
      </div>
      <div class="p-4 bg-white rounded shadow">
        <h3 class="font-medium">Tambah Mata Kuliah</h3>
        <form id="formAddSub" class="space-y-2 mt-2"><input id="scode" placeholder="Kode" class="w-full border p-2"/><input id="snamek" placeholder="Nama MK" class="w-full border p-2"/><input id="slect" placeholder="Lecturer NIP" class="w-full border p-2"/><button class="bg-green-600 text-white px-3 py-1 rounded">Tambah</button></form>
      </div>
    </div>
    <div class="mt-6 bg-white p-4 rounded shadow">
      <h3 class="font-medium mb-2">List Dosen</h3>
      <input id="searchLect" placeholder="Cari..." class="w-full border p-2 mb-2"/>
      <div id="lectTable"></div>
    </div>
  </div>`;
  // handlers
  document.getElementById('formAddLect').addEventListener('submit', async (e)=>{ e.preventDefault(); const token=localStorage.getItem('token'); const nip=document.getElementById('lnip').value, name=document.getElementById('lname').value, email=document.getElementById('lemail').value; const res=await fetch(API+'/admin/lecturers',{method:'POST',headers:{'Content-Type':'application/json', Authorization:'Bearer '+token}, body:JSON.stringify({nip,name,email})}); if(res.ok){ alert('Dosen ditambahkan'); loadLecturers(); } else { const d=await res.json(); alert(d.error||'Error'); } });
  document.getElementById('formAddStu').addEventListener('submit', async (e)=>{ e.preventDefault(); const token=localStorage.getItem('token'); const nim=document.getElementById('snim').value, name=document.getElementById('sname').value, cls=document.getElementById('sclass').value; const res=await fetch(API+'/admin/students',{method:'POST',headers:{'Content-Type':'application/json', Authorization:'Bearer '+token}, body:JSON.stringify({nim,name,class:cls})}); if(res.ok){ alert('Mahasiswa ditambahkan'); loadStudents(); } else { alert('Error'); } });
  document.getElementById('formAddSub').addEventListener('submit', async (e)=>{ e.preventDefault(); const token=localStorage.getItem('token'); const code=document.getElementById('scode').value, name=document.getElementById('snamek').value, lect=document.getElementById('slect').value; const res=await fetch(API+'/admin/subjects',{method:'POST',headers:{'Content-Type':'application/json', Authorization:'Bearer '+token}, body:JSON.stringify({code,name,lecturerNip:lect,lecturerName:'-'})}); if(res.ok){ alert('Mata kuliah ditambahkan'); loadSubjects(); } else { alert('Error'); } });
  loadLecturers(); loadStudents(); loadSubjects();
  document.getElementById('searchLect').addEventListener('input', ()=>{ filterLect(); });
}

async function loadLecturers(){
  const token=localStorage.getItem('token'); const res=await fetch(API+'/admin/lecturers',{headers:{Authorization:'Bearer '+token}}); const data=await res.json(); renderLectTable(data);
}
function renderLectTable(data){
  const container=document.getElementById('lectTable'); container.innerHTML='';
  const table=document.createElement('table'); table.className='min-w-full';
  table.innerHTML=`<thead><tr class="text-left"><th>NIP</th><th>Nama</th><th>Email</th><th>Aksi</th></tr></thead>`;
  const tbody=document.createElement('tbody');
  data.forEach(r=>{ const tr=document.createElement('tr'); tr.innerHTML=`<td class="pr-4">${r.nip}</td><td class="pr-4">${r.name}</td><td class="pr-4">${r.email}</td><td><button data-id="${r.id}" class="btnEdit mr-2">Edit</button><button data-id="${r.id}" class="btnDel">Hapus</button></td>`; tbody.appendChild(tr); });
  table.appendChild(tbody); container.appendChild(table);
  container.querySelectorAll('.btnDel').forEach(b=>b.addEventListener('click', async (e)=>{ if(!confirm('Hapus?')) return; const id=e.target.dataset.id; const token=localStorage.getItem('token'); const res=await fetch(API+'/admin/lecturers/'+id,{method:'DELETE',headers:{Authorization:'Bearer '+token}}); if(res.ok){ alert('Terhapus'); loadLecturers(); } else alert('Error'); }));
  container.querySelectorAll('.btnEdit').forEach(b=>b.addEventListener('click', async (e)=>{ const id=e.target.dataset.id; const name=prompt('Nama baru?'); if(!name) return; const token=localStorage.getItem('token'); const res=await fetch(API+'/admin/lecturers/'+id,{method:'PUT',headers:{'Content-Type':'application/json', Authorization:'Bearer '+token}, body:JSON.stringify({name})}); if(res.ok){ alert('Diupdate'); loadLecturers(); } else alert('Error'); }));
}

async function loadStudents(){ const token=localStorage.getItem('token'); const res=await fetch(API+'/admin/students',{headers:{Authorization:'Bearer '+token}}); const data=await res.json(); console.log('students',data); }
async function loadSubjects(){ const token=localStorage.getItem('token'); const res=await fetch(API+'/admin/subjects',{headers:{Authorization:'Bearer '+token}}); const data=await res.json(); console.log('subjects',data); }

// Lecturer page
async function renderLecturer(){
  app.innerHTML=`<div><h2 class="text-xl font-semibold">Dosen - Buat Sesi</h2><div class="mt-4 grid md:grid-cols-2 gap-4"><div class="p-4 bg-white rounded shadow"><form id="formSession" class="space-y-2"><select id="subjectSelect" class="w-full border p-2"></select><input id="sdate" type="date" class="w-full border p-2"/><input id="stime" type="time" class="w-full border p-2"/><select id="sdur" class="w-full border p-2"><option value="15">15</option><option value="30" selected>30</option><option value="60">60</option></select><button class="bg-green-600 text-white px-3 py-1 rounded">Buat QR</button></form></div><div class="p-4 bg-white rounded shadow"><h3 class="font-medium">QR</h3><div id="qrBox" class="mt-2"></div></div></div><div class="mt-4 bg-white p-4 rounded shadow"><h3 class="font-medium">Kehadiran Sesi</h3><div id="attendanceList" class="mt-2"></div></div></div>`;
  await populateSubjectsForLecturer();
  document.getElementById('formSession').addEventListener('submit', async (e)=>{ e.preventDefault(); const token=localStorage.getItem('token'); const subjectCode=document.getElementById('subjectSelect').value; const date=document.getElementById('sdate').value; const time=document.getElementById('stime').value; const duration=document.getElementById('sdur').value; const res=await fetch(API+'/lecturer/session',{method:'POST',headers:{'Content-Type':'application/json', Authorization:'Bearer '+token}, body:JSON.stringify({subjectCode,date,time,duration})}); const data=await res.json(); if(res.ok){ document.getElementById('qrBox').innerHTML=`<img src="${data.qrImage}" alt="qr" class="w-64"/><div class="mt-2"><button id="dlqr" class="bg-blue-600 text-white px-3 py-1 rounded">Download QR</button></div>`; document.getElementById('dlqr').addEventListener('click', ()=>{ const a=document.createElement('a'); a.href=data.qrImage; a.download='qr-'+data.session.id+'.png'; a.click(); }); loadAttendanceForSession(data.session.id); } else alert(data.error||'Error'); });
}

async function populateSubjectsForLecturer(){ const token=localStorage.getItem('token'); const res=await fetch(API+'/admin/subjects',{headers:{Authorization:'Bearer '+token}}); const subs=await res.json(); const sel=document.getElementById('subjectSelect'); sel.innerHTML=''; subs.forEach(s=>sel.innerHTML+=`<option value="${s.code}">${s.code} - ${s.name}</option>`); }

async function loadAttendanceForSession(sessionId){ const token=localStorage.getItem('token'); const res=await fetch(API+`/lecturer/session/${sessionId}/attendance`,{headers:{Authorization:'Bearer '+token}}); const list=await res.json(); const box=document.getElementById('attendanceList'); if(!Array.isArray(list)) return; box.innerHTML = list.map(l=>`<div class="p-2 border-b">${l.studentName} (${l.studentNim}) - ${new Date(l.attendanceTime).toLocaleString()}</div>`).join(''); }

// Student page (scanner)
function renderStudent(){
  app.innerHTML=`<div><h2 class="text-xl font-semibold">Mahasiswa - Scan QR</h2><div class="mt-4 grid md:grid-cols-2 gap-4"><div class="p-4 bg-white rounded shadow"><video id="video" autoplay class="w-full rounded"></video><canvas id="canvas" class="hidden"></canvas><div class="mt-2"><button id="startBtn" class="bg-green-600 text-white px-3 py-1 rounded">Mulai Scan</button><button id="stopBtn" class="bg-red-600 text-white px-3 py-1 rounded hidden">Stop</button></div></div><div class="p-4 bg-white rounded shadow"><h3 class="font-medium">Manual Input</h3><form id="manualForm" class="mt-2"><input id="msession" placeholder="Session ID" class="w-full border p-2"/><button class="bg-blue-600 text-white px-3 py-1 rounded mt-2">Kirim</button></form></div></div><div id="history" class="mt-4 bg-white p-4 rounded shadow"></div></div>`;
  const video=document.getElementById('video'); const canvas=document.getElementById('canvas'); const ctx=canvas.getContext('2d'); let stream=null; let scanning=false;
  document.getElementById('startBtn').addEventListener('click', async ()=>{ try{ stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}}); video.srcObject=stream; scanning=true; document.getElementById('startBtn').classList.add('hidden'); document.getElementById('stopBtn').classList.remove('hidden'); tick(); }catch(e){alert('Tidak dapat akses kamera: '+e.message);} });
  document.getElementById('stopBtn').addEventListener('click', ()=>{ if(stream){ stream.getTracks().forEach(t=>t.stop()); } scanning=false; document.getElementById('startBtn').classList.remove('hidden'); document.getElementById('stopBtn').classList.add('hidden'); });

  async function tick(){ if(!scanning) return; if(video.readyState===video.HAVE_ENOUGH_DATA){ canvas.width=video.videoWidth; canvas.height=video.videoHeight; ctx.drawImage(video,0,0,canvas.width,canvas.height); const img=ctx.getImageData(0,0,canvas.width,canvas.height); const code=jsQR(img.data,img.width,img.height); if(code){ try{ const data=JSON.parse(code.data); await submitAttendance(data.sessionId); scanning=false; stream.getTracks().forEach(t=>t.stop()); document.getElementById('startBtn').classList.remove('hidden'); document.getElementById('stopBtn').classList.add('hidden'); alert('Absensi terkirim!'); loadHistory(); return; }catch(e){ alert('QR tidak valid'); } } } requestAnimationFrame(tick); }

  document.getElementById('manualForm').addEventListener('submit', async (e)=>{ e.preventDefault(); const id=document.getElementById('msession').value; await submitAttendance(id); loadHistory(); });

  async function submitAttendance(sessionId){ const token=localStorage.getItem('token'); const res=await fetch(API+'/student/attend',{method:'POST',headers:{'Content-Type':'application/json', Authorization:'Bearer '+token}, body:JSON.stringify({sessionId})}); const d=await res.json(); if(res.ok) alert('Berhasil'); else alert(d.error||'Error'); }

  loadHistory();
}

async function loadHistory(){ const token=localStorage.getItem('token'); const res=await fetch(API+'/student/history',{headers:{Authorization:'Bearer '+token}}); const data=await res.json(); const box=document.getElementById('history'); if(!Array.isArray(data)){ box.innerHTML='No history'; return;} box.innerHTML = '<h3 class="font-medium">Riwayat Absensi</h3>' + data.map(d=>`<div class="p-2 border-b">${d.subjectName} - ${new Date(d.attendanceTime).toLocaleString()}</div>`).join(''); }

// init
(function(){ const user=JSON.parse(localStorage.getItem('user')||'null'); setUserUI(); if(user){ navFor(user.role); route('dashboard'); } else { navFor('STUDENT'); renderLogin(); } })();
