'use strict';
/* WebWindows 7 — SIMULACIÓN. RAM, CPU y disco son objetos JavaScript; nada toca el ordenador real. */
const $=(s,e=document)=>e.querySelector(s),el=(t,c,h)=>{const e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e},
esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])),
MB=1/1048576,fmt=m=>m>=1024?(m/1024).toFixed(2)+' GB':m>=1?m.toFixed(1)+' MB':Math.max(1,Math.round(m*1024))+' KB',
D=(c={})=>({t:'d',c,cr:Date.now(),mod:Date.now()}),F=(size,data='')=>({t:'f',size,data,cr:Date.now(),mod:Date.now()}),
HOME='C:\\Users\\User',j=(a,b)=>a.replace(/\\$/,'')+'\\'+b,
WP=['radial-gradient(ellipse at 30% 20%,#7ec8f4,#1f6fb5 40%,#0a2a5e)','linear-gradient(135deg,#2c5364,#203a43,#0f2027)','radial-gradient(circle at 70% 30%,#f7b733,#fc4a1a 45%,#2b1055)','linear-gradient(160deg,#3a7d44,#a8d672 60%,#2d5a8a)'];
const OS={state:'BOOTING',cpu:'Intel(R) Core(TM) i5-2500 CPU @ 3.30GHz',ram:8192,disk:512000,log:[]};
let S;try{S=JSON.parse(localStorage.ww7)}catch(e){}
S=S||{user:'User',pw:'',wp:0,apps:[],bin:[],hist:[],fs:D({'Program Files':D(),'Program Files (x86)':D(),Users:D({User:D({Desktop:D(),Documents:D(),Downloads:D(),Pictures:D(),Music:D(),Videos:D()})}),Windows:D({'system.dat':F(25190)}),Temp:D(),System32:D()})};
const log=m=>OS.log.push(new Date().toLocaleTimeString()+' '+m);
/* Sonidos de inicio/apagado (archivos en sounds/). Se pueden silenciar desde la bandeja del sistema. */
const snd=(n,force)=>{if(S.mute&&!force)return;try{const a=snd.a=new Audio('sounds/'+n);a.volume=S.vol??.8;a.play().catch(()=>{})}catch(e){}};
function save(){try{localStorage.ww7=JSON.stringify(S)}catch(e){notify('Storage quota exceeded.')}WM.l.forEach(w=>w.refresh&&w.refresh());renderDesk()}
function notify(m,k){const t=el('div','toast',esc(m));$('#tt').append(t);setTimeout(()=>t.remove(),3500);if(k!='q')snd(k=='e'||/not enough space|quota/i.test(m)?'windows-7-error.mp3':'windows-7-notification.mp3')}
function dlg(title,body,btns,input){if(/^Windows/.test(title)&&/denied|cannot|not a valid|unexpected error|low on memory/i.test(body))snd('windows-7-error.mp3');const o=el('div','ov'),d=el('div','dlg',`<div class=dt>${title}</div><div class=db>${body}${input!=null?`<input class=in value="${esc(input)}">`:''}</div><div class=df></div>`);
 btns.forEach(([l,f])=>{const b=el('button','btn',l);b.onclick=()=>{const v=$('.in',d)?.value;o.remove();f&&f(v)};$('.df',d).append(b)});o.append(d);$('#screen').append(o);$('.in',d)?.focus();return d}
/* ---- VirtualStorage: disco C: de 500 GB virtual (tamaños en MB) ---- */
const FS={
 get(p){let n=S.fs;for(const k of p.split('\\').slice(1).filter(Boolean)){if(n.t!='d'||!n.c[k])return null;n=n.c[k]}return n},
 sz:n=>n.t=='f'?n.size:Object.values(n.c).reduce((a,x)=>a+FS.sz(x),0),
 used:()=>FS.sz(S.fs)+S.bin.reduce((a,b)=>a+FS.sz(b.n),0),/* la Papelera sigue ocupando espacio */
 free:()=>OS.disk-FS.used(),
 put(dir,name,n){const d=FS.get(dir);if(!d||d.t!='d')return false;if(FS.sz(n)>FS.free()){notify('There is not enough space on Local Disk (C:).');return false}d.c[name]=n;save();return true},
 write(p,data,sz){const i=p.lastIndexOf('\\'),d=FS.get(p.slice(0,i)),nm=p.slice(i+1);if(!d||d.t!='d')return false;const o=d.c[nm];
  if(sz>FS.free()+(o?o.size:0)){notify('There is not enough space on Local Disk (C:).');return false}const n=F(sz,data);if(o)n.cr=o.cr;d.c[nm]=n;save();return true},
 del(p){const i=p.lastIndexOf('\\'),dir=p.slice(0,i),name=p.slice(i+1),d=FS.get(dir);if(!d||!d.c[name])return false;S.bin.push({name,from:dir,n:d.c[name]});delete d.c[name];save();return true},
 uniq(dir,name){const d=FS.get(dir);let n=name,i=1;while(d.c[n])n=name.replace(/(\.[^.]*)?$/,` (${++i})$1`);return n}
};
/* ---- ProcessManager: RAM de 8192 MB y CPU simuladas ---- */
const PM={l:[],n:1000,
 reset(){PM.l=[];PM.n=1000;[['System',4,900,2],['csrss.exe',344,18,.4],['svchost.exe',812,120,3],['dwm.exe',1008,95,2],['explorer.exe',1032,280,2.5]].forEach(([name,pid,ram,base])=>PM.l.push({name,pid,ram,ram0:ram,base,cpu:base,sys:1}))},
 used:()=>PM.l.reduce((a,p)=>a+p.ram,0),
 cpu:()=>Math.min(100,PM.l.reduce((a,p)=>a+p.cpu,0)),
 start(name,ram,cpu,win){if(PM.used()+ram>OS.ram){dlg('Windows','Your computer is low on memory.<br>Close some programs and try again.',[['OK']]);return null}
  const p={pid:PM.n+=4,name,ram,ram0:ram,base:cpu,cpu,win};PM.l.push(p);log(name+' started');if(PM.used()>OS.ram*.92)notify('Windows: Your computer is low on memory.');return p},
 kill(pid){const p=PM.l.find(x=>x.pid==pid);if(!p)return;if(p.win)WM.close(p.win);else dlg('Windows Task Manager','Unable to terminate process.<br>Access is denied.',[['OK']])},
 tick(){PM.l.forEach(p=>{p.cpu=+(p.base*(.5+Math.random())).toFixed(1);p.ram=Math.round(p.ram0*(.98+Math.random()*.04))})}
};
/* ---- Gestor de ventanas ---- */
const WM={z:100,l:[],cur:null,
 open(a,arg){const w={a,t:[]};w.p=PM.start(a.exe,a.ram,a.cpu,w);if(!w.p)return;
  const e=w.e=el('div','win',`<div class=tb><span class=ti>${a.i} ${a.n}</span><span class=wb><b class=mn title=Minimize>–</b><b class=mx title=Maximize>▢</b><b class=cl title=Close>✕</b></span></div><div class=wc></div>`),k=WM.l.length%8*24;
  e.style.cssText=`left:${80+k}px;top:${30+k}px;width:${a.w||580}px;height:${a.h||390}px`;w.c=$('.wc',e);
  $('.mn',e).onclick=()=>WM.min(w);$('.mx',e).onclick=()=>WM.tog(w);$('.cl',e).onclick=()=>WM.close(w);
  const tb=$('.tb',e);tb.ondblclick=ev=>{if(!ev.target.closest('.wb'))WM.tog(w)};e.onmousedown=()=>WM.focus(w);
  tb.onmousedown=ev=>{if(ev.target.closest('.wb')||w.max)return;const x=ev.clientX-e.offsetLeft,y=ev.clientY-e.offsetTop,mv=m=>{e.style.left=m.clientX-x+'px';e.style.top=Math.max(0,m.clientY-y)+'px'},up=()=>{$('#wins').classList.remove('dr');document.removeEventListener('mousemove',mv);document.removeEventListener('mouseup',up)};$('#wins').classList.add('dr');document.addEventListener('mousemove',mv);document.addEventListener('mouseup',up)};
  $('#wins').append(e);WM.l.push(w);a.f(w.c,w,arg);WM.focus(w);return w},
 every:(w,f,ms)=>w.t.push(setInterval(f,ms)),
 focus(w){w.e.style.zIndex=++WM.z;w.e.classList.remove('min');w.min=false;WM.cur=w;WM.bar()},
 min(w){w.min=true;w.e.classList.add('min');if(WM.cur===w)WM.cur=null;WM.bar()},
 tog(w){w.max=!w.max;w.e.classList.toggle('max',w.max)},
 close(w){if(!WM.l.includes(w))return;w.onclose&&w.onclose();w.t.forEach(clearInterval);WM.l=WM.l.filter(x=>x!==w);PM.l=PM.l.filter(p=>p!==w.p);log(w.p.name+' closed');w.e.classList.add('cls');setTimeout(()=>w.e.remove(),150);if(WM.cur===w)WM.cur=null;WM.bar()},
 bar(){const b=$('#tasks');b.innerHTML='';WM.l.forEach(w=>{const t=el('div','tk'+(WM.cur===w&&!w.min?' on':''),w.a.i+' '+w.a.n);t.onclick=()=>WM.cur===w&&!w.min?WM.min(w):WM.focus(w);b.append(t)})}
};
/* ---- ApplicationManager ---- */
const APPS={
 explorer:{n:'Windows Explorer',exe:'explorer.exe',ram:60,cpu:1,i:'📁',f:wExplorer},
 notepad:{n:'Notepad',exe:'notepad.exe',ram:80,cpu:.3,i:'📝',f:wNotepad,w:480,h:340},
 calc:{n:'Calculator',exe:'calc.exe',ram:45,cpu:.2,i:'🧮',f:wCalc,w:260,h:340},
 paint:{n:'Paint',exe:'mspaint.exe',ram:110,cpu:.6,i:'🎨',f:wPaint,w:680,h:500},
 cmd:{n:'Command Prompt',exe:'cmd.exe',ram:30,cpu:.1,i:'⬛',f:wCmd,w:600,h:340},
 ie:{n:'Internet Explorer',exe:'iexplore.exe',ram:320,cpu:1.5,i:'🌐',f:wIE},
 cp:{n:'Control Panel',exe:'control.exe',ram:55,cpu:.2,i:'⚙️',f:wCP,w:600,h:380},
 tm:{n:'Windows Task Manager',exe:'taskmgr.exe',ram:35,cpu:.8,i:'📊',f:wTM,w:460,h:420},
 store:{n:'WebSoft Store',exe:'websoft.exe',ram:140,cpu:.5,i:'🛍️',f:wStore,w:560,h:420}
};
const CAT=[
 {id:'pdn',n:'Paint.NET',ver:'4.3',dev:'dotPDN LLC',cat:'Graphics',mb:120,ram:210,cpu:6,i:'🖌️',d:'Image and photo editing.'},
 {id:'rac',n:'Turbo Racer',ver:'1.8',dev:'WebGames',cat:'Games',mb:2500,ram:1400,cpu:18,i:'🏎️',d:'3D racing game.'},
 {id:'wmp',n:'Media Player Plus',ver:'12.0',dev:'WebSoft',cat:'Media',mb:320,ram:180,cpu:4,i:'🎵',exe:'wmplayer.exe',lnk:1,d:'Listen to music and record audio. Recordings are saved in your Music folder.'},
 {id:'wfx',n:'WebFox Browser',ver:'3.6',dev:'WebSoft',cat:'Internet',mb:650,ram:720,cpu:8,i:'🦊',d:'Fast web browser.'},
 {id:'arc',n:'Archiver',ver:'2.1',dev:'ZipCorp',cat:'Utilities',mb:25,ram:40,cpu:1,i:'🗜️',d:'Compress and extract files.'},
 {id:'word',n:'Microsoft Word',ver:'2010',dev:'Microsoft Corporation (simulated)',cat:'Productivity',mb:900,ram:350,cpu:3,i:'📘',exe:'WINWORD.EXE',lnk:1,d:'Create and edit documents. Saves .docx files in Documents.'},
 {id:'dcl',n:'Disk Cleaner',ver:'1.4',dev:'SysTools',cat:'System',mb:18,ram:30,cpu:1,i:'🧹',d:'Tidy up your disk.'}];
const IMPL={wmp:{f:wMedia,w:560,h:440},word:{f:wWord,w:780,h:540}};
function launch(id,arg){if(APPS[id])return WM.open(APPS[id],arg);const a=S.apps.find(x=>x.id==id);if(!a)return;const m=IMPL[id];
 WM.open({id:a.id,n:a.n,exe:a.exe||a.n.replace(/\W+/g,'')+'.exe',ram:a.ram,cpu:a.cpu,i:a.i,w:m?m.w:420,h:m?m.h:240,f:m?m.f:c=>c.innerHTML=`<div class=pad><h3>${a.i} ${esc(a.n)} ${a.ver}</h3>This is a simulated program: it only consumes virtual RAM and CPU while it is open.</div>`},arg)}
function unins(id){const a=S.apps.find(x=>x.id==id);if(!a)return;WM.l.filter(x=>x.a.id==id).forEach(WM.close);delete FS.get('C:\\Program Files').c[a.n];S.apps=S.apps.filter(x=>x.id!=id);save();notify(`Application removed. ${fmt(a.sz)} recovered.`)}
function download(a){if(a.mb>FS.free())return notify('There is not enough space on Local Disk (C:).');
 const d=dlg('WebSoft Store',`Downloading ${esc(a.n)} (${fmt(a.mb)})<div class=pb><i></i></div><span class=pt>0%</span>`,[['Cancel',()=>clearInterval(t)]]),sp=20+Math.random()*30;let p=0;
 const t=setInterval(()=>{p=Math.min(100,p+8);$('i',d).style.width=p+'%';$('.pt',d).textContent=`${p}% — ${sp.toFixed(1)} MB/s`;
  if(p==100){clearInterval(t);d.parentNode.remove();const dir=HOME+'\\Downloads';FS.put(dir,FS.uniq(dir,a.id+'_Setup.exe'),F(a.mb,a.id))&&notify('Download completed.')}},250)}
function installer(path){const f=FS.get(path),a=CAT.find(x=>x.id==f.data);if(!a)return dlg('Windows','This is not a valid Setup package.',[['OK']]);
 if(S.apps.some(x=>x.id==a.id))return dlg('Setup',`${esc(a.n)} is already installed.`,[['OK']]);
 const st=[['Welcome to Setup',`This wizard will install ${esc(a.n)} ${a.ver} on your computer.`],['License Agreement','This is a simulated license agreement. Nothing real is installed.'],['Installation Folder','C:\\Program Files\\'+esc(a.n)]];
 const fin=()=>{const sz=Math.round(a.mb*1.5);if(!FS.put('C:\\Program Files',a.n,D({[a.n+'.exe']:F(sz)})))return;S.apps.push({id:a.id,n:a.n,ver:a.ver,ram:a.ram,cpu:a.cpu,i:a.i,sz,exe:a.exe,lnk:a.lnk});save();notify('Application installed.');dlg('Setup','Completed. '+esc(a.n)+' was installed.'+(a.lnk?'<br>A shortcut was added to the desktop.':''),[['Finish']])};
 const step=i=>{if(i<3)return dlg(st[i][0],st[i][1],[['Next >',()=>step(i+1)],['Cancel']]);
  const d=dlg('Installing...',`Installing ${esc(a.n)}...<div class=pb><i></i></div>`,[]);let p=0;const t=setInterval(()=>{p+=5;$('i',d).style.width=p+'%';if(p>=100){clearInterval(t);d.parentNode.remove();fin()}},120)};step(0)}
/* ---- Aplicaciones ---- */
function wExplorer(c,w,p0){let path=p0||HOME+'\\Documents',hist=[path],sel=new Set();
 c.innerHTML=`<div class=tl><button class=btn data-a=b>◀</button><button class=btn data-a=u>▲ Up</button><input class=addr readonly aria-label=Address>${[['n','New folder','no'],['f','New file','no'],['r','Rename','no'],['d','Delete','no'],['p','Properties','no'],['re','Restore','bo'],['x','Delete permanently','bo'],['e','Empty Recycle Bin','bo']].map(([a,t,k])=>`<button class="btn ${k}" data-a=${a}>${t}</button>`).join('')}</div><div class=sp><div class=sd></div><div class=ls></div></div><div class=sb></div>`;
 const ls=$('.ls',c),sb=$('.sb',c),ad=$('.addr',c);
 const go=p=>{hist.push(p);path=p;sel.clear();R()};
 [['Desktop',HOME+'\\Desktop'],['Documents',HOME+'\\Documents'],['Downloads',HOME+'\\Downloads'],['Pictures',HOME+'\\Pictures'],['Music',HOME+'\\Music'],['Computer (C:)','C:\\'],['Recycle Bin','BIN']].forEach(([n,p])=>{const d=el('div','si',n);d.onclick=()=>go(p);$('.sd',c).append(d)});
 const open=r=>{if(path=='BIN')return;const p=j(path,r.name);if(r.n.t=='d')return go(p);
  if(/_Setup( \(\d+\))?\.exe$/.test(r.name))return installer(p);if(/\.txt$/i.test(r.name))return WM.open(APPS.notepad,{path:p});
  if(/\.docx$/i.test(r.name))return S.apps.some(x=>x.id=='word')?launch('word',{path:p}):dlg('Windows','Windows cannot open this file: no program is associated with .docx files. Install Microsoft Word from the WebSoft Store.',[['OK']]);
  if(AUD.test(r.name))return S.apps.some(x=>x.id=='wmp')?launch('wmp',{path:p}):dlg('Windows','Windows cannot play this file. Install Media Player Plus from the WebSoft Store.',[['OK']]);
  if(String(r.n.data).startsWith('data:image'))return dlg(esc(r.name),`<img src="${r.n.data}" style="max-width:100%">`,[['Close']]);dlg('Windows','Windows cannot open this file.',[['OK']])};
 const R=()=>{const bin=path=='BIN';c.classList.toggle('bin',bin);ad.value=bin?'Recycle Bin':path;let rows;
  if(bin)rows=S.bin.map((b,i)=>({name:b.name,n:b.n,k:i}));else{const d=FS.get(path);if(!d||d.t!='d'){path=HOME;return R()}rows=Object.entries(d.c).sort((a,b)=>(b[1].t=='d')-(a[1].t=='d')||a[0].localeCompare(b[0])).map(([k,n])=>({name:k,n,k}))}
  ls.innerHTML='<div class="r h"><span>Name</span><span>Size</span><span>Modified</span></div>';
  rows.forEach(r=>{const d=el('div','r'+(sel.has(r.k)?' s':''),`<span>${r.n.t=='d'?'📁':'📄'} ${esc(r.name)}</span><span>${r.n.t=='f'?fmt(r.n.size):''}</span><span>${new Date(r.n.mod).toLocaleString()}</span>`);d.onclick=e=>{if(!e.ctrlKey)sel.clear();sel.add(r.k);R()};d.ondblclick=()=>open(r);ls.append(d)});
  sb.textContent=`${rows.length} items | Local Disk (C:) free: ${fmt(FS.free())} of 500 GB`};
 c.onclick=e=>{const a=e.target.dataset.a;if(!a)return;const ks=[...sel],bi=ks.map(Number).sort((x,y)=>y-x);
  if(a=='b'&&hist.length>1){hist.pop();path=hist[hist.length-1];sel.clear();R()}
  if(a=='u'&&path!='BIN'&&path!='C:\\'){const i=path.lastIndexOf('\\');go(i<3?'C:\\':path.slice(0,i))}
  if(a=='n')FS.put(path,FS.uniq(path,'New folder'),D());if(a=='f')FS.put(path,FS.uniq(path,'New Text Document.txt'),F(0));
  if(a=='r'&&ks.length==1)dlg('Rename','New name:',[['OK',v=>{const d=FS.get(path);if(v&&!d.c[v]){d.c[v]=d.c[ks[0]];delete d.c[ks[0]];save()}}],['Cancel']],ks[0]);
  if(a=='d'){ks.forEach(k=>FS.del(j(path,k)));sel.clear();save()}
  if(a=='p'&&ks.length){const n=FS.get(j(path,ks[0]));dlg('Properties: '+esc(ks[0]),`Type: ${n.t=='d'?'File folder':'File'}<br>Location: ${esc(path)}<br>Size: ${fmt(FS.sz(n))}<br>Created: ${new Date(n.cr).toLocaleString()}<br>Modified: ${new Date(n.mod).toLocaleString()}<br>Attributes: ${n.t=='d'?'Directory':'Archive'}`,[['OK']])}
  if(a=='re'){bi.forEach(i=>{const b=S.bin[i],dir=FS.get(b.from)?b.from:HOME+'\\Documents';FS.get(dir).c[FS.uniq(dir,b.name)]=b.n;S.bin.splice(i,1)});sel.clear();save()}
  if(a=='x'){bi.forEach(i=>{purge(S.bin[i].n);S.bin.splice(i,1)});sel.clear();save()}
  if(a=='e'){S.bin.forEach(b=>purge(b.n));S.bin=[];sel.clear();save()}};
 w.refresh=R;R()}
function wNotepad(c,w,arg){let path=arg&&arg.path;c.innerHTML='<div class=tl><button class=btn data-a=o>Open</button><button class=btn data-a=s>Save</button><button class=btn data-a=sa>Save As</button></div><textarea class=np spellcheck=false aria-label=Text></textarea>';
 const t=$('textarea',c),ttl=()=>$('.ti',w.e).textContent='📝 '+(path?path.split('\\').pop():'Untitled')+' - Notepad';
 if(path){const f=FS.get(path);t.value=f?f.data:''}ttl();
 const sv=p=>{if(FS.write(p,t.value,t.value.length*MB)){path=p;ttl()}},
 as=()=>dlg('Save As','File name (saved in Documents):',[['Save',v=>v&&sv(HOME+'\\Documents\\'+(/\.\w+$/.test(v)?v:v+'.txt'))],['Cancel']],path?path.split('\\').pop():'Untitled.txt');
 c.onclick=e=>{const a=e.target.dataset.a;if(a=='s')path?sv(path):as();if(a=='sa')as();
  if(a=='o'){const d=dlg('Open','<div class=ol>Text files in Documents:</div>',[['Cancel']]),dd=FS.get(HOME+'\\Documents').c;
   Object.keys(dd).filter(k=>dd[k].t=='f'&&/\.txt$/i.test(k)).forEach(k=>{const r=el('div','si',esc(k));r.onclick=()=>{t.value=dd[k].data;path=HOME+'\\Documents\\'+k;ttl();d.parentNode.remove()};$('.ol',d).append(r)})}}}
function wCalc(c,w){let e='';c.innerHTML='<input class=cd readonly value=0 aria-label=Display><div class=cg></div>';const d=$('.cd',c);
 ['C','(',')','⌫','7','8','9','/','4','5','6','*','1','2','3','-','0','.','=','+'].forEach(k=>{const b=el('button','btn',k);b.onclick=()=>{
  if(k=='C')e='';else if(k=='⌫')e=e.slice(0,-1);else if(k=='='){try{if(!/^[\d+\-*/.() ]+$/.test(e))throw 0;const r=Function('return '+e)();e=isFinite(r)?String(+r.toFixed(10)):'Cannot divide by zero'}catch(x){e='Error'}}else e+=k;d.value=e||'0'};$('.cg',c).append(b)})}
function wPaint(c,w){c.innerHTML='<div class=tl><button class=btn data-a=p>Pencil</button><button class=btn data-a=e>Eraser</button><input type=color value="#000000" aria-label=Color><input type=range min=1 max=30 value=3 aria-label="Brush size"><button class=btn data-a=u>Undo</button><button class=btn data-a=n>New</button><button class=btn data-a=s>Save</button></div><div class=cs><canvas width=640 height=400></canvas></div>';
 const cv=$('canvas',c),x=cv.getContext('2d'),col=$('[type=color]',c),sz=$('[type=range]',c),snap=()=>x.getImageData(0,0,640,400),clr=()=>{x.fillStyle='#fff';x.fillRect(0,0,640,400)};let tool='p',dr=0,U=[];clr();x.lineCap='round';
 cv.onmousedown=e=>{U.push(snap());U=U.slice(-10);dr=1;x.beginPath();x.moveTo(e.offsetX,e.offsetY)};
 cv.onmousemove=e=>{if(!dr)return;x.strokeStyle=tool=='e'?'#fff':col.value;x.lineWidth=sz.value;x.lineTo(e.offsetX,e.offsetY);x.stroke()};cv.onmouseup=cv.onmouseleave=()=>dr=0;
 c.onclick=e=>{const a=e.target.dataset.a;if(a=='p'||a=='e')tool=a;if(a=='u'&&U.length)x.putImageData(U.pop(),0,0);if(a=='n'){U.push(snap());clr()}
  if(a=='s')dlg('Save','File name (saved in Pictures):',[['Save',v=>{if(!v)return;const u=cv.toDataURL();FS.write(HOME+'\\Pictures\\'+v.replace(/\.png$/i,'')+'.png',u,u.length*.75*MB)}],['Cancel']],'Untitled.png')}}
function wCmd(c,w){let cwd=HOME;c.classList.add('cmd');c.innerHTML='<div class=co>Microsoft Windows [Version 6.1.7601]\nVirtual shell: commands only affect the virtual PC.\n\n</div><div class=cl2><span></span><input aria-label=Command></div>';
 const o=$('.co',c),i=$('input',c),pr=$('span',c),P=()=>pr.textContent=cwd+'>',out=t=>{o.innerHTML+=t+'\n'},rel=p=>/^[A-Za-z]:/.test(p)?p:j(cwd,p),nf='The system cannot find the file specified.';P();
 const run=(k,a)=>{const m={
  dir:()=>{const n=FS.get(cwd).c;Object.entries(n).forEach(([k,v])=>out(`${new Date(v.mod).toLocaleDateString()}  ${v.t=='d'?'&lt;DIR&gt;':fmt(FS.sz(v))}  ${esc(k)}`));out(`${Object.keys(n).length} item(s), ${fmt(FS.free())} free`)},
  cd:()=>{if(!a)return out(esc(cwd));const i=cwd.lastIndexOf('\\'),p=a=='..'?(cwd.length>3?(i<3?'C:\\':cwd.slice(0,i)):cwd):rel(a),n=FS.get(p);n&&n.t=='d'?cwd=p:out('The system cannot find the path specified.')},
  cls:()=>o.innerHTML='',echo:()=>out(esc(a)),mkdir:()=>a&&FS.put(cwd,a,D()),
  rmdir:()=>FS.del(rel(a))||out(nf),del:()=>FS.del(rel(a))||out(nf),
  type:()=>{const n=FS.get(rel(a));n&&n.t=='f'?out(esc(n.data)):out(nf)},
  tasklist:()=>{out('Image Name          PID   Mem Usage');PM.l.forEach(p=>out(p.name.padEnd(18)+String(p.pid).padStart(5)+'   '+p.ram+' MB'))},
  ipconfig:()=>out('Ethernet adapter Local Area Connection:\n   IPv4 Address. . . : 192.168.0.2 (virtual)\n   Link speed. . . . : 100 Mbps'),
  systeminfo:()=>out(`OS Name:             Microsoft Windows 7 Ultimate\nOS Version:          6.1.7601 Service Pack 1\nSystem Manufacturer: Virtual PC\nProcessor:           ${OS.cpu}\nInstalled Memory:    8192 MB\nSystem Type:         x64-based PC`),
  ver:()=>out('Microsoft Windows [Version 6.1.7601]'),whoami:()=>out('webwindows\\'+esc(S.user.toLowerCase())),exit:()=>WM.close(w),
  help:()=>out('dir cd cls echo mkdir rmdir del type tasklist ipconfig systeminfo ver whoami exit')};
  m[k]?m[k]():k&&out(`'${esc(k)}' is not recognized as an internal or external command.`)};
 c.onclick=()=>i.focus();i.focus();
 i.onkeydown=e=>{if(e.key!='Enter')return;const [k,...r]=i.value.trim().split(/\s+/);out(esc(cwd+'>'+i.value));i.value='';run(k.toLowerCase(),r.join(' '));P();c.scrollTop=1e9}}
const FAV=[['Google','https://www.google.com/webhp?igu=1'],['Bing','https://www.bing.com'],['Wikipedia','https://en.wikipedia.org'],['YouTube','https://www.youtube.com'],['Friv Classic','https://www.frivclassic.com'],['Y8 Games','https://www.y8.com'],['Poki','https://poki.com'],['CrazyGames','https://www.crazygames.com'],['Coolmath Games','https://www.coolmathgames.com'],['Miniclip','https://www.miniclip.com'],['Newgrounds','https://www.newgrounds.com'],['Armor Games','https://armorgames.com']];
function wIE(c,w,u0){const T=[{h:['about:home'],i:0}];let cur=0;
 c.innerHTML='<div class=tl><button class=btn data-a=bk>◀</button><button class=btn data-a=fw>▶</button><button class=btn data-a=rf>⟳</button><input class=addr aria-label=Address placeholder="Search or enter an address"><button class=btn data-a=go>Go</button><button class=btn data-a=ex>Open in browser tab</button></div><div class=tl><span class=ietabs></span><button class=btn data-a=nt>+ Tab</button> <select class=fav aria-label=Favorites></select><button class=btn data-a=hs>History</button></div><div class=pg><div class=home><h2>Internet Explorer (simulated)</h2>Type an address or a search in the bar, or pick a favorite. Paste a YouTube video link to watch it here.<h4>Browser games</h4><div class=gm></div></div></div><div class=sb>Pages load through your own browser. Some sites (Google included) refuse to be shown inside another page: if it looks blocked, use "Open in browser tab".</div>';
 const pg=$('.pg',c),home=$('.home',pg),ad=$('.addr',c),tabs=$('.ietabs',c),ti=u=>{try{return new URL(u).hostname||'Home'}catch(e){return 'Home'}},
 norm=q=>{q=q.trim();if(/^https?:\/\//i.test(q))return q;if(/^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(q))return 'https://'+q;return 'https://www.google.com/search?igu=1&q='+encodeURIComponent(q)};
 const load=t=>{const u=t.h[t.i];if(u=='about:home')return;if(!t.f){t.f=el('iframe');t.f.setAttribute('sandbox','allow-scripts allow-forms allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-pointer-lock');t.f.referrerPolicy='strict-origin-when-cross-origin';t.f.allow='fullscreen; autoplay; gamepad; encrypted-media; picture-in-picture';t.f.title='Web page';pg.append(t.f)}t.f.src=u};
 const show=()=>{const t=T[cur],u=t.h[t.i];ad.value=u=='about:home'?'':u;home.style.display=u=='about:home'?'block':'none';T.forEach((x,k)=>{if(x.f)x.f.style.display=k==cur&&u!='about:home'?'block':'none'});
  tabs.innerHTML=T.map((x,k)=>`<span class="tab${k==cur?' on':''}" data-t=${k}>${esc(ti(x.h[x.i]))} <b data-x=${k}>✕</b></span>`).join('')};
 const nav=url=>{const t=T[cur],y=url.match(/(?:youtube\.com\/(?:watch\?(?:[^#]*&)?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/);
  if(y)url='https://www.youtube.com/embed/'+y[1]+'?autoplay=1';
  else if(/^https?:\/\/(www\.|m\.)?youtube\.com(\/?$|\/results)/i.test(url)){window.open(url,'_blank','noopener');return notify('YouTube cannot be shown inside another page, so it opened in a browser tab. Paste a video link in the address bar to watch it here.','q')}
  t.h=t.h.slice(0,t.i+1);t.h.push(url);t.i++;if(url!='about:home'){S.hist.unshift({q:url});S.hist=S.hist.slice(0,50);save()}load(t);show()};
 const go=()=>nav(ad.value.trim()?norm(ad.value):'about:home');
 const fv=$('.fav',c);fv.innerHTML='<option value="">Favorites</option>'+FAV.map(([n,u])=>`<option value="${u}">${n}</option>`).join('');fv.onchange=e=>{if(e.target.value)nav(e.target.value);e.target.value=''};
 $('.gm',c).innerHTML=FAV.slice(4).map(([n,u])=>`<button class=btn data-f="${u}">${n}</button>`).join(' ');
 c.onclick=e=>{const d=e.target.dataset,t=T[cur];
  if(d.a=='go')go();if(d.f)nav(d.f);if(d.a=='hs')dlg('History',S.hist.map(h=>esc(h.q)).join('<br>')||'(empty)',[['Close']]);
  if(d.a=='bk'&&t.i>0){t.i--;load(t);show()}if(d.a=='fw'&&t.i<t.h.length-1){t.i++;load(t);show()}if(d.a=='rf'){load(t);show()}
  if(d.a=='ex'){const u=t.h[t.i];window.open(u=='about:home'?'https://www.google.com':u,'_blank','noopener')}
  if(d.a=='nt'){T.push({h:['about:home'],i:0});cur=T.length-1;show()}
  if(d.x!=null){const k=+d.x;T[k].f&&T[k].f.remove();T.splice(k,1);if(!T.length)return WM.close(w);cur=Math.min(cur,T.length-1);show();return}
  if(d.t!=null){cur=+d.t;show()}};
 ad.onkeydown=e=>e.key=='Enter'&&go();show();if(u0)nav(u0)}
function wCP(c,w,s0){let sec=s0||'Programs and Features';
 const R=()=>{c.innerHTML=`<div class=sp><div class=sd>${['Programs and Features','Personalization','User Accounts','Sound','System'].map(x=>`<div class="si${x==sec?' on':''}" data-s="${x}">${x}</div>`).join('')}</div><div class="ls pad"></div></div>`;const b=$('.ls',c);
  if(sec=='Programs and Features')b.innerHTML=S.apps.length?S.apps.map(a=>`<div class=cd2>${a.i} <b>${esc(a.n)}</b> ${a.ver} — ${fmt(a.sz)} <button class=btn data-u="${a.id}">Uninstall</button></div>`).join(''):'No programs installed from WebSoft Store.';
  if(sec=='Personalization')b.innerHTML='Desktop background:<br>'+WP.map((x,i)=>`<div class=wp data-w=${i} style="background:${x}"></div>`).join('');
  if(sec=='User Accounts')b.innerHTML=`User name: <input class=un value="${esc(S.user)}"> <button class=btn data-a=un>Save</button><br><br>Password: <input type=password class=pw2> <button class=btn data-a=pw>Set password</button>`;
  if(sec=='Sound')b.innerHTML=`<label><input type=checkbox class=sm ${S.mute?'':'checked'}> Play Windows sounds</label><br><br>Volume: <input type=range class=sv min=0 max=100 value=${Math.round((S.vol??.8)*100)} aria-label=Volume><br><br><b>Sound test</b>${[['windows-7-startup.mp3','Windows Startup'],['windows-7-shutdown.mp3','Windows Shutdown'],['windows-7-notification.mp3','Notification'],['windows-7-error.mp3','Critical Stop (error)']].map(([f,t])=>`<div class=cd2>🔊 ${t} <button class=btn data-snd="${f}">Test</button></div>`).join('')}<br><button class=btn data-a=stp>Stop</button>`;
  if(sec=='System')b.innerHTML=`<b>Windows 7 Ultimate</b><br>Version 6.1, Service Pack 1<br><br>Processor: ${OS.cpu}<br>Installed memory (RAM): 8.00 GB<br>System type: 64-bit<br>Local Disk (C:): ${fmt(FS.used())} used, ${fmt(FS.free())} free of 500 GB<br><br><i>This is a web simulation: everything shown is virtual.</i>`};
 c.onclick=e=>{const d=e.target.dataset;if(d.s){sec=d.s;R()}if(d.u)unins(d.u);if(d.snd){snd.a&&snd.a.pause();snd(d.snd,true)}if(d.a=='stp'&&snd.a)snd.a.pause();if(d.w!=null){S.wp=+d.w;applyWP();save()}
  if(d.a=='un'){S.user=$('.un',c).value||'User';save();notify('User name changed.')}if(d.a=='pw'){S.pw=$('.pw2',c).value;save();notify('Password updated.')}};c.onchange=e=>{const k=e.target.className;if(k=='sm'){S.mute=!e.target.checked;$('#snd').textContent=S.mute?'🔇':'🔊';save()}if(k=='sv'){S.vol=e.target.value/100;save()}};w.refresh=R;R()}
function wTM(c,w){let tab='Applications',sa=-1,sp=0;const hc=[],hm=[];c.innerHTML='<div class=tabs></div><div class=tp></div>';const tabs=$('.tabs',c),tp=$('.tp',c);
 const gr=(a,max,col)=>{const cv=el('canvas'),x=cv.getContext('2d');cv.width=300;cv.height=70;x.fillStyle='#000';x.fillRect(0,0,300,70);x.strokeStyle='#143';for(let i=0;i<300;i+=15){x.beginPath();x.moveTo(i,0);x.lineTo(i,70);x.stroke()}x.strokeStyle=col;x.beginPath();a.forEach((v,i)=>x[i?'lineTo':'moveTo'](i*5,70-v/max*68));x.stroke();return cv};
 const R=()=>{const cpu=PM.cpu(),mem=PM.used(),st=tp.scrollTop;hc.push(cpu);hm.push(mem);if(hc.length>60){hc.shift();hm.shift()}
  tabs.innerHTML=['Applications','Processes','Performance'].map(t=>`<span class="tab${t==tab?' on':''}">${t}</span>`).join('');
  if(tab=='Applications')tp.innerHTML=WM.l.map((x,i)=>`<div class="r1${i==sa?' s':''}" data-i=${i}>${x.a.i} ${x.a.n}</div>`).join('')+'<div class=tl><button class=btn data-a=et>End Task</button><button class=btn data-a=sw>Switch To</button><button class=btn data-a=nt>New Task...</button></div>';
  if(tab=='Processes')tp.innerHTML='<div class="r4 h"><span>Image Name</span><span>PID</span><span>CPU</span><span>Memory</span></div>'+PM.l.map(p=>`<div class="r4${p.pid==sp?' s':''}" data-p=${p.pid}><span>${p.name}</span><span>${p.pid}</span><span>${p.cpu.toFixed(1)}%</span><span>${p.ram} MB</span></div>`).join('')+'<div class=tl><button class=btn data-a=ep>End Process</button></div>';
  if(tab=='Performance'){tp.innerHTML=`<div class=pad><b>CPU Usage: ${cpu.toFixed(0)}%</b><div class=g1></div><b>Memory: ${fmt(mem)}</b><div class=g2></div>Physical Memory — Total: 8.00 GB &nbsp; Used: ${(mem/1024).toFixed(2)} GB &nbsp; Available: ${((OS.ram-mem)/1024).toFixed(2)} GB<br>${OS.cpu}, 4 cores, 3.30 GHz &nbsp; Processes: ${PM.l.length}<br>Disk 0 — 500 GB &nbsp; Used: ${fmt(FS.used())} &nbsp; Free: ${fmt(FS.free())}<br>Network: Ethernet, connected, 100 Mbps</div>`;$('.g1',tp).append(gr(hc,100,'#0f0'));$('.g2',tp).append(gr(hm,OS.ram,'#0af'))}
  tp.scrollTop=st};
 tabs.onclick=e=>{if(e.target.classList.contains('tab')){tab=e.target.textContent;R()}};
 tp.onclick=e=>{const t=e.target,a=t.dataset.a,r=t.closest('[data-i]'),q=t.closest('[data-p]');if(r)sa=+r.dataset.i;if(q)sp=+q.dataset.p;
  if(a=='et'&&WM.l[sa]){WM.close(WM.l[sa]);sa=-1}if(a=='sw'&&WM.l[sa])WM.focus(WM.l[sa]);if(a=='ep')PM.kill(sp);
  if(a=='nt')dlg('Create New Task','Type the name of a program:',[['OK',v=>{const k=Object.keys(APPS).find(k=>APPS[k].exe.replace('.exe','')==(v||'').toLowerCase().replace('.exe',''));k?launch(k):dlg('Windows',`Windows cannot find '${esc(v||'')}'.`,[['OK']])}],['Cancel']],'notepad');R()};
 WM.every(w,R,1000);R()}
function wStore(c,w){let cat='All';const R=()=>{c.innerHTML=`<div class=tl>Category: <select aria-label=Category>${['All','Utilities','Games','Internet','Graphics','System','Media','Productivity'].map(x=>`<option${x==cat?' selected':''}>${x}</option>`).join('')}</select></div><div class=ls>${CAT.filter(a=>cat=='All'||a.cat==cat).map(a=>{const ins=S.apps.some(x=>x.id==a.id);return `<div class=cd2><b>${a.i} ${a.n}</b> — Version ${a.ver} — ${a.dev}<br>${a.d}<br>Size: ${fmt(a.mb)} <button class=btn data-i=${a.id}${ins?' disabled':''}>${ins?'Installed':'Download'}</button></div>`}).join('')}</div>`;$('select',c).onchange=e=>{cat=e.target.value;R()}};
 c.onclick=e=>{const a=CAT.find(x=>x.id==e.target.dataset.i);a&&download(a)};w.refresh=R;R()}
/* ---- Audio/documentos: los blobs grandes van a IndexedDB (localStorage solo guarda una referencia 'idb:<id>') ---- */
const IDB={open(){return IDB.p||(IDB.p=new Promise((res,rej)=>{const r=indexedDB.open('ww7blobs',1);r.onupgradeneeded=()=>r.result.createObjectStore('b');r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)}))},
 async put(k,b){const d=await IDB.open();return new Promise((res,rej)=>{const t=d.transaction('b','readwrite');t.objectStore('b').put(b,k);t.oncomplete=res;t.onerror=()=>rej(t.error)})},
 async get(k){const d=await IDB.open();return new Promise((res,rej)=>{const q=d.transaction('b').objectStore('b').get(k);q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error)})},
 async del(k){try{(await IDB.open()).transaction('b','readwrite').objectStore('b').delete(k)}catch(e){}}};
const purge=n=>n.t=='f'?(String(n.data).startsWith('idb:')&&IDB.del(n.data.slice(4))):Object.values(n.c).forEach(purge);
async function saveBlob(dir,name,blob){if(blob.size*MB>FS.free()){notify('There is not enough space on Local Disk (C:).');return false}
 const id='b'+Date.now()+Math.random().toString(36).slice(2,6);try{await IDB.put(id,blob)}catch(e){notify('Storage quota exceeded.');return false}
 const nm=FS.uniq(dir,name);if(FS.put(dir,nm,F(blob.size*MB,'idb:'+id)))return nm;IDB.del(id);return false}
const clean=h=>{const d=new DOMParser().parseFromString(h,'text/html');d.querySelectorAll('script,iframe,object,embed,link,meta,style').forEach(n=>n.remove());d.querySelectorAll('*').forEach(n=>[...n.attributes].forEach(a=>{if(/^on/i.test(a.name)||/javascript:/i.test(a.value))n.removeAttribute(a.name)}));return d.body.innerHTML};
const MUSIC=HOME+'\\Music',AUD=/\.(mp3|ogg|wav|m4a|webm|aac|flac)$/i,p2=n=>String(n).padStart(2,'0');
function tfs(){if(document.fullscreenElement){S.nofs=true;save();document.exitFullscreen()}else{S.nofs=false;save();document.documentElement.requestFullscreen?.().catch(()=>{})}}
/* Media Player Plus: reproductor de música + grabadora (micrófono real solo con permiso del navegador). Los audios se guardan en C:\Users\User\Music */
function wMedia(c,w,arg){let cur='',url='',mr=null,t0=0;
 c.innerHTML='<div class=tl><button class=btn data-a=add>Add music...</button><input type=file accept="audio/*" multiple hidden><button class=btn data-a=rec>● Record</button><span class=rt></span></div><div class=sp><div class=ls></div></div><div class=mpb><b class=np2>Nothing playing</b><audio controls></audio><button class=btn data-a=pv>⏮ Previous</button> <button class=btn data-a=nx>Next ⏭</button></div>';
 const au=$('audio',c),ls=$('.ls',c),rt=$('.rt',c),fi=$('input',c),rb=$('[data-a=rec]',c),
 names=()=>{const d=FS.get(MUSIC);return d?Object.keys(d.c).filter(k=>d.c[k].t=='f'&&AUD.test(k)).sort().map(k=>j(MUSIC,k)):[]},
 R=()=>{ls.innerHTML=names().map(p=>`<div class="si${p==cur?' on':''}" data-p="${esc(p)}">🎵 ${esc(p.split('\\').pop())} <small>${fmt(FS.get(p).size)}</small></div>`).join('')||'<div class=pad>No audio in your Music folder yet. Add music or record something.</div>'},
 play=async p=>{const n=FS.get(p);if(!n||!String(n.data).startsWith('idb:'))return dlg('Windows','Windows cannot play this file.',[['OK']]);let b;try{b=await IDB.get(n.data.slice(4))}catch(e){}
  if(!b)return dlg('Windows','Windows cannot find the audio data for this file.',[['OK']]);url&&URL.revokeObjectURL(url);url=URL.createObjectURL(b);au.src=url;cur=p;$('.np2',c).textContent='▶ '+p.split('\\').pop();au.play().catch(()=>{});R()},
 step=d=>{const L=names();if(L.length)play(L[(L.indexOf(cur)+d+L.length)%L.length])};
 au.onended=()=>{if(names().length>1)step(1)};
 c.onclick=async e=>{const d=e.target.dataset,r=e.target.closest('[data-p]');if(r)play(r.dataset.p);if(d.a=='add')fi.click();if(d.a=='pv')step(-1);if(d.a=='nx')step(1);
  if(d.a=='rec'){if(mr&&mr.state=='recording')return mr.stop();
   try{const s=await navigator.mediaDevices.getUserMedia({audio:true}),ch=[],m=mr=new MediaRecorder(s);m.ondataavailable=ev=>ev.data.size&&ch.push(ev.data);
    m.onstop=async()=>{s.getTracks().forEach(t=>t.stop());rb.textContent='● Record';rt.textContent='';const ty=m.mimeType||'audio/webm',nm=await saveBlob(MUSIC,'Recording.'+(/ogg/.test(ty)?'ogg':/mp4/.test(ty)?'m4a':'webm'),new Blob(ch,{type:ty}));nm&&notify('Recording saved in Music: '+nm)};
    m.start();t0=Date.now();rb.textContent='■ Stop'}catch(x){dlg('Windows','Windows cannot access the microphone. Allow microphone access in your browser to record.',[['OK']])}}};
 fi.onchange=async()=>{let n=0;for(const f of fi.files)if(await saveBlob(MUSIC,f.name,f))n++;fi.value='';n&&notify(n+' file(s) added to Music.')};
 WM.every(w,()=>{if(mr&&mr.state=='recording'){const q=(Date.now()-t0)/1000|0;rt.textContent='● REC '+p2(q/60|0)+':'+p2(q%60)}},500);
 w.onclose=()=>{au.pause();url&&URL.revokeObjectURL(url);mr&&mr.state=='recording'&&mr.stop()};
 w.refresh=R;R();if(arg&&arg.path)play(arg.path)}
/* Microsoft Word (simulado): editor de texto enriquecido; guarda .docx virtuales (HTML) en Documents */
function wWord(c,w,arg){let path=arg&&arg.path,rg;
 c.innerHTML='<div class=tl><button class=btn data-a=nw>New</button><button class=btn data-a=op>Open</button><button class=btn data-a=sv>Save</button><button class=btn data-a=sa>Save As</button><button class=btn data-a=ex>Export .doc</button></div><div class=tl>'+[['bold','<b>B</b>'],['italic','<i>I</i>'],['underline','<u>U</u>'],['justifyLeft','Left'],['justifyCenter','Center'],['justifyRight','Right'],['insertUnorderedList','• List'],['insertOrderedList','1. List'],['undo','Undo'],['redo','Redo']].map(([k,t])=>`<button class=btn data-c=${k}>${t}</button>`).join('')+'<select class=ff aria-label=Font>'+['Calibri','Cambria','Times New Roman','Arial','Courier New'].map(f=>`<option>${f}</option>`).join('')+'</select><select class=fz aria-label="Font size">'+[8,10,12,14,18,24,36].map((n,i)=>`<option value=${i+1}${n==12?' selected':''}>${n} pt</option>`).join('')+'</select><input type=color class=fc value="#000000" aria-label="Font color"></div><div class=doc><div class=page contenteditable=true spellcheck=true role=textbox aria-multiline=true aria-label=Document></div></div><div class=sb></div>';
 const ed=$('.page',c),sb=$('.sb',c),
 ttl=()=>$('.ti',w.e).textContent='📘 '+(path?path.split('\\').pop():'Document1')+' - Microsoft Word',
 cnt=()=>{const t=ed.innerText.trim();sb.textContent=`Words: ${t?t.split(/\s+/).length:0}   Characters: ${t.length}`},
 ex=(k,v)=>{if(document.activeElement!==ed){ed.focus();if(rg){const s=getSelection();s.removeAllRanges();s.addRange(rg)}}document.execCommand(k,false,v);cnt()},
 sv=p=>{const h=ed.innerHTML;if(FS.write(p,h,h.length*MB+.012)){path=p;ttl();notify('Document saved.','q')}},
 as=()=>dlg('Save As','File name (saved in Documents):',[['Save',v=>v&&sv(HOME+'\\Documents\\'+(/\.docx$/i.test(v)?v:v+'.docx'))],['Cancel']],path?path.split('\\').pop():'Document1.docx');
 if(path){const f=FS.get(path);if(f)ed.innerHTML=clean(f.data)}ttl();cnt();
 ed.onblur=()=>{const s=getSelection();if(s.rangeCount&&ed.contains(s.anchorNode))rg=s.getRangeAt(0).cloneRange()};
 ed.oninput=cnt;ed.onkeydown=e=>{if(e.ctrlKey&&e.key=='s'){e.preventDefault();path?sv(path):as()}};
 c.onmousedown=e=>{if(e.target.dataset.c||e.target.dataset.a)e.preventDefault()};
 c.onclick=e=>{const d=e.target.dataset;if(d.c)ex(d.c);
  if(d.a=='nw'){ed.innerHTML='';path=null;ttl();cnt()}if(d.a=='sv')path?sv(path):as();if(d.a=='sa')as();
  if(d.a=='op'){const q=dlg('Open','<div class=ol>Word documents in Documents:</div>',[['Cancel']]),dd=FS.get(HOME+'\\Documents').c;
   Object.keys(dd).filter(k=>dd[k].t=='f'&&/\.docx$/i.test(k)).forEach(k=>{const r=el('div','si',esc(k));r.onclick=()=>{ed.innerHTML=clean(dd[k].data);path=HOME+'\\Documents\\'+k;ttl();cnt();q.parentNode.remove()};$('.ol',q).append(r)})}
  if(d.a=='ex'){const b=new Blob(['<html><head><meta charset="utf-8"></head><body>'+ed.innerHTML+'</body></html>'],{type:'application/msword'}),a=el('a');a.href=URL.createObjectURL(b);a.download=(path?path.split('\\').pop().replace(/\.docx$/i,''):'Document1')+'.doc';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000)}};
 c.onchange=e=>{const k=e.target.className;if(k=='ff')ex('fontName',e.target.value);if(k=='fz')ex('fontSize',e.target.value);if(k=='fc')ex('foreColor',e.target.value)}}
/* ---- Escritorio, menú Inicio y energía ---- */
function renderDesk(){const d=$('#icons');if(!d)return;d.innerHTML='';const dk=FS.get(HOME+'\\Desktop').c,E=p=>()=>WM.open(APPS.explorer,p);
 [['💻','Computer',E('C:\\')],['📂',S.user+"'s Files",E(HOME)],['🗑️','Recycle Bin',E('BIN')],['🌐','Internet Explorer',()=>launch('ie')],...S.apps.filter(a=>a.lnk).map(a=>[a.i,a.n,()=>launch(a.id)]),...Object.entries(dk).map(([k,n])=>[n.t=='d'?'📁':'📄',k,E(HOME+'\\Desktop')])].forEach(([i,n,f])=>{
  const e=el('div','di',`<b>${i}</b>${esc(n)}`);e.tabIndex=0;e.ondblclick=f;e.onkeydown=k=>k.key=='Enter'&&f();e.onclick=()=>{$('.di.on')?.classList.remove('on');e.classList.add('on')};d.append(e)})}
function ctx(x,y,items){$('.ctx')?.remove();const m=el('div','ctx');m.style.cssText=`left:${x}px;top:${y}px`;items.forEach(([t,f])=>{const i=el('div','',t);i.onclick=()=>{m.remove();f()};m.append(i)});$('#screen').append(m)}
function mp(q){const L=$('#mp');L.innerHTML='';[...Object.entries(APPS),...S.apps.map(a=>[a.id,a])].filter(([,a])=>a.n.toLowerCase().includes(q.toLowerCase())).forEach(([id,a])=>{const d=el('div','mi',`${a.i} ${esc(a.n)}`);d.onclick=()=>{launch(id);hideMenu()};L.append(d)})}
const hideMenu=()=>$('#menu').classList.remove('show');
function showMenu(){const m=$('#menu');if(!m.classList.toggle('show'))return;$('#ms').value='';mp('');$('#pwr').classList.remove('show');const E=p=>()=>WM.open(APPS.explorer,p);
 $('#ml').innerHTML=`<div><b>👤 ${esc(S.user)}</b></div>`;[['Documents',E(HOME+'\\Documents')],['Pictures',E(HOME+'\\Pictures')],['Music',E(HOME+'\\Music')],['Computer',E('C:\\')],['Control Panel',()=>launch('cp')],['Task Manager',()=>launch('tm')]].forEach(([t,f])=>{const d=el('div','',t);d.onclick=()=>{f();hideMenu()};$('#ml').append(d)})}
function scr(h,k){$('#os')?.remove();const o=el('div','scr'+(k||''),h);o.id='os';$('#screen').append(o);return o}
const closeAll=()=>WM.l.slice().forEach(w=>WM.close(w));
function boot(){OS.state='BOOTING';closeAll();PM.reset();scr('<div class=bt style="text-align:center"><span class=flag></span><br>Starting Windows<div class=pb><i></i></div></div>',' k');$('#os .flag').innerHTML='<i></i><i></i><i></i><i></i>';setTimeout(()=>login(),2700)}
function login(lock){OS.state=lock?'LOCKED':'LOGIN';const o=scr(`<div class=lg><div class=av>👤</div><h2>${esc(S.user)}</h2>${lock?'<p>Press Ctrl + Alt + Delete to log on (simulated)</p>':''}<input type=password class=pw placeholder=Password aria-label=Password><button class=btn>Log on</button><div class=er></div></div>`),
 go=()=>{if($('.pw',o).value===S.pw){o.remove();OS.state='RUNNING';log('User logged on');if(!lock){snd('windows-7-startup.mp3');if(!S.nofs&&!document.fullscreenElement)document.documentElement.requestFullscreen?.().catch(()=>{});notify('Network connected.','q')}}else $('.er',o).textContent='The user name or password is incorrect.'};
 $('button',o).onclick=go;$('.pw',o).onkeydown=e=>e.key=='Enter'&&go();$('.pw',o).focus()}
function power(k){hideMenu();if(k=='lock')return login(true);if(k=='sleep')return scr('<p>Sleeping... click to wake up</p>',' k').onclick=()=>login(true);if(k=='logoff'){closeAll();PM.reset();return login()}
 const rs=k=='restart';OS.state=rs?'RESTARTING':'SHUTTING_DOWN';closeAll();snd('windows-7-shutdown.mp3');scr(`<div class=off><p>${rs?'Restarting...':'Shutting down...'}</p></div>`,' k');
 setTimeout(()=>{if(rs)boot();else{scr('<div class=off><p>Windows is shutting down.</p><button class=btn>Power on</button></div>',' k');$('#os button').onclick=boot}},4800)}
const applyWP=()=>$('#screen').style.setProperty('--wp',WP[S.wp]||WP[0]),
clock=()=>{const d=new Date();$('#clk').innerHTML=d.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'})+'<br>'+d.toLocaleDateString('en-US')};
function init(){$('#screen').innerHTML='<div id=desk><div id=icons></div></div><div id=menu></div><div id=tt></div><div id=bar><div id=orb role=button tabindex=0 aria-label=Start><span class=flag><i></i><i></i><i></i><i></i></span></div><div id=tasks></div><div id=tray><span id=fs title="Fullscreen" role=button tabindex=0>⛶</span><span id=snd title="Sound on/off" role=button tabindex=0>🔊</span><span id=net title=Network>🖧</span><span id=clk></span><div id=sd title="Show desktop"></div></div></div>';
 $('#desk').append(Object.assign(el('div'),{id:'wins'}));
 $('#menu').innerHTML='<div class=mt><div id=mp></div><div id=ml></div></div><div class=mb><input id=ms placeholder="Search programs" aria-label=Search><button class=btn id=sdn>Shut down</button><button class=btn id=sda aria-label="More options">▶</button></div><div id=pwr></div>';
 $('#pwr').innerHTML=[['restart','Restart'],['logoff','Log off'],['lock','Lock'],['sleep','Sleep']].map(([k,t])=>`<div data-k=${k}>${t}</div>`).join('');
 $('#ms').oninput=e=>mp(e.target.value);$('#sdn').onclick=()=>power('off');$('#sda').onclick=()=>$('#pwr').classList.toggle('show');$('#pwr').onclick=e=>e.target.dataset.k&&power(e.target.dataset.k);
 $('#orb').onclick=showMenu;$('#orb').onkeydown=e=>e.key=='Enter'&&showMenu();$('#snd').textContent=S.mute?'🔇':'🔊';$('#fs').onclick=tfs;$('#snd').onclick=()=>{S.mute=!S.mute;save();$('#snd').textContent=S.mute?'🔇':'🔊'};$('#net').onclick=()=>notify('Ethernet: Connected, 100 Mbps (virtual)');$('#sd').onclick=()=>WM.l.forEach(w=>WM.min(w));
 document.addEventListener('mousedown',e=>{if(!e.target.closest('#menu,#orb'))hideMenu();if(!e.target.closest('.ctx'))$('.ctx')?.remove()});
 $('#desk').oncontextmenu=e=>{e.preventDefault();ctx(e.clientX,e.clientY,[['New folder',()=>FS.put(HOME+'\\Desktop',FS.uniq(HOME+'\\Desktop','New folder'),D())],['Refresh',renderDesk],[document.fullscreenElement?'Exit Fullscreen':'Enter Fullscreen',tfs],['Personalize',()=>launch('cp','Personalization')],['Task Manager',()=>launch('tm')]])};
 S.apps.forEach(a=>{if(a.id=='wmp'||a.id=='word')a.lnk=1});applyWP();renderDesk();clock();
 setInterval(()=>{if(OS.state=='BOOTING')return;PM.tick();clock();if(FS.free()<5120&&!OS.lowd){OS.lowd=1;notify('Low disk space on Local Disk (C:).')}},1000)}
window.onerror=m=>{try{dlg('Windows',`The virtual application encountered an unexpected error.<br><small>${esc(m)}</small>`,[['Continue']])}catch(e){}return true};
window.VirtualOS={OS,FS,PM,WM,get state(){return S}};/* consola de depuración: VirtualOS en las DevTools */
init();boot();
