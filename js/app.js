/* ══════════════════════════════════════
   SISTEMA DE MODOS
   URL params: ?mode=demo  (visitante)  |  ?mode=owner&key=YOURKEY  (dono)
   Sem params: exibe landing page
══════════════════════════════════════ */
const OWNER_KEY = 'studyflow2026'; // ← MUDE ESTA SENHA antes de publicar
const SKEY = 'studyflow_v4';
const DEMO_SKEY = 'studyflow_demo';

const urlParams = new URLSearchParams(location.search);
const urlMode = urlParams.get('mode');
const urlKey  = urlParams.get('key');

// isOwner: URL tem ?mode=owner&key=CORRETO  OU  localStorage tem flag de dono
const isOwner = (urlMode === 'owner' && urlKey === OWNER_KEY) ||
                localStorage.getItem('sf_owner') === OWNER_KEY;

// isDemo: URL tem ?mode=demo
const isDemo  = urlMode === 'demo';

// Se for dono, persiste para não precisar da URL sempre
if (isOwner) localStorage.setItem('sf_owner', OWNER_KEY);

// readOnly = visitante no modo demo (pode ver mas não edita)
let readOnly = false;

/**
 * Entra no app: esconde landing, mostra o app.
 * @param {boolean} asOwner - true = modo dono, false = modo demo
 */
function enterApp(asOwner) {
  document.getElementById('landing').style.display = 'none';
  document.getElementById('app').classList.add('visible');

  if (asOwner) {
    readOnly = false;
    localStorage.setItem('sf_owner', OWNER_KEY);
    boot(false);
  } else {
    readOnly = true;
    document.getElementById('readonly-banner').classList.add('show');
    boot(true);
  }
}

/**
 * Executa uma ação apenas se não estiver em modo somente leitura.
 * @param {Function} fn - função a executar
 */
function guardedAction(fn) {
  if (readOnly) {
    showToast('👀 Modo visualização — entre como dono para editar', 'amber');
    return;
  }
  fn();
}


/* ══════════════════════════════════════
   BANCO DE DADOS (localStorage)
══════════════════════════════════════ */
let DB;
let cH=null, cP=null, cT=null, cTD=null; // instâncias de gráficos Chart.js

/**
 * Carrega dados do localStorage (ou retorna objeto vazio se demo/primeiro acesso).
 */
function load(demo=false){
  if (!demo) {
    try{const r=localStorage.getItem(SKEY);if(r)return JSON.parse(r);}catch(e){}
  }
  return {
    user:{name:'Estudante',xp:0,level:1,streak:0,lastStudied:null},
    plans:[],modules:[],topics:[],tasks:[],
    pomodoro:[],flashcards:[],reviews:[],sessions:[],
    achievements:[],activityLog:[],notes:{},
    prefs:{sound:true,miniWidget:true,focusMins:25,shortMins:5,longMins:15,light:false,notifications:false}
  };
}

/** Persiste DB no localStorage (ignora no modo demo). */
function save(){
  if(readOnly) return;
  localStorage.setItem(SKEY,JSON.stringify(DB));
}

/** Gera ID único baseado em timestamp + random. */
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,6);}


/* ══════════════════════════════════════
   CONQUISTAS (Achievements)
══════════════════════════════════════ */
const ACH=[
  {id:'first_task', icon:'✅', name:'1ª Tarefa',    check:()=>DB.tasks.filter(t=>t.done).length>=1},
  {id:'streak_3',   icon:'🔥', name:'Streak 3x',    check:()=>DB.user.streak>=3},
  {id:'streak_7',   icon:'🔥', name:'Semana 🔥',    check:()=>DB.user.streak>=7},
  {id:'pomo_10',    icon:'⏱️', name:'10 Pomodoros', check:()=>DB.pomodoro.filter(p=>p.type==='FOCUS').length>=10},
  {id:'pomo_50',    icon:'💎', name:'50 Pomodoros', check:()=>DB.pomodoro.filter(p=>p.type==='FOCUS').length>=50},
  {id:'fc_10',      icon:'🃏', name:'10 Flashcards',check:()=>DB.flashcards.length>=10},
  {id:'plan_1',     icon:'📚', name:'Planejador',   check:()=>DB.plans.length>=1},
  {id:'mod_done',   icon:'🏆', name:'Módulo ✓',     check:()=>getCompletedMods().length>=1},
  {id:'xp_100',     icon:'⚡', name:'100 XP',       check:()=>DB.user.xp>=100},
  {id:'xp_500',     icon:'⚡', name:'500 XP',       check:()=>DB.user.xp>=500},
  {id:'tasks_20',   icon:'💪', name:'20 Tarefas',   check:()=>DB.tasks.filter(t=>t.done).length>=20},
  {id:'night',      icon:'🦉', name:'Coruja',       check:()=>DB.pomodoro.some(p=>{const h=new Date(p.createdAt||0).getHours();return h>=22||h<=4;})},
];

/** Concede XP ao usuário e verifica conquistas. */
function grantXP(type, amount){
  if(readOnly)return;
  const g=amount||(type==='task'?10:type==='pomodoro'?20:type==='module'?100:5);
  DB.user.xp+=g;
  DB.user.level=Math.floor(DB.user.xp/100)+1;
  updateStreak();checkAch();save();updateTopbar();
  showToast(`+${g} XP ⚡`,'accent');
}

/** Atualiza o streak do dia. */
function updateStreak(){
  const today=tStr();
  if(DB.user.lastStudied===today)return;
  DB.user.streak=DB.user.lastStudied===dStr(new Date(Date.now()-86400000))
    ? DB.user.streak+1 : 1;
  DB.user.lastStudied=today;
  logAct(today);
}

function logAct(d){if(!DB.activityLog.includes(d))DB.activityLog.push(d);}

/** Verifica e desbloqueia conquistas. */
function checkAch(){
  ACH.forEach(a=>{
    if(!DB.achievements.includes(a.id)&&a.check()){
      DB.achievements.push(a.id);
      showToast('🏆 '+a.name,'amber');
    }
  });
}

function getCompletedMods(){
  return DB.modules.filter(m=>{
    const ts=DB.topics.filter(t=>t.moduleId===m.id);
    return ts.length&&ts.every(t=>{
      const tks=DB.tasks.filter(k=>k.topicId===t.id);
      return tks.length&&tks.every(k=>k.done);
    });
  });
}

/* Funções de cálculo de progresso */
function planPct(pid){
  const tasks=DB.modules.filter(m=>m.planId===pid)
    .flatMap(m=>DB.topics.filter(t=>t.moduleId===m.id))
    .flatMap(t=>DB.tasks.filter(k=>k.topicId===t.id));
  return tasks.length?Math.round(tasks.filter(t=>t.done).length/tasks.length*100):0;
}
function modPct(mid){
  const tasks=DB.topics.filter(t=>t.moduleId===mid)
    .flatMap(t=>DB.tasks.filter(k=>k.topicId===t.id));
  return tasks.length?Math.round(tasks.filter(t=>t.done).length/tasks.length*100):0;
}
function totalPct(){
  return DB.tasks.length?Math.round(DB.tasks.filter(t=>t.done).length/DB.tasks.length*100):0;
}
function topicPomoMins(tid){
  return DB.pomodoro.filter(p=>p.type==='FOCUS'&&p.topicId===tid).length*((DB.prefs?.focusMins)||25);
}

/** Estima quantos dias faltam para concluir o plano. */
function estimatePlan(pid){
  const pending=DB.modules.filter(m=>m.planId===pid)
    .flatMap(m=>DB.topics.filter(t=>t.moduleId===m.id))
    .flatMap(t=>DB.tasks.filter(k=>k.topicId===t.id&&!k.done));
  if(!pending.length)return null;
  const pomosPerDay=last7().reduce((s,d)=>s+DB.pomodoro.filter(p=>p.date===d&&p.type==='FOCUS').length,0)/7||0.5;
  const fm=(DB.prefs?.focusMins)||25;
  const pomosNeeded=Math.ceil(pending.reduce((s,t)=>s+(t.mins||25),0)/fm);
  const days=Math.ceil(pomosNeeded/pomosPerDay);
  if(days>365)return null;
  const eta=new Date(Date.now()+days*86400000);
  return `~${days}d (${eta.toLocaleDateString('pt-BR',{day:'2-digit',month:'short'})})`;
}


/* ══════════════════════════════════════
   NAVEGAÇÃO ENTRE PÁGINAS
══════════════════════════════════════ */
function goto(page, btn){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  document.getElementById('page-'+page).classList.add('active');
  if(btn)btn.classList.add('active');
  const titles={
    dashboard:'Dashboard',planner:'Planejador',pomodoro:'Timer Pomodoro',
    flashcards:'Flashcards',calendar:'Calendário',analytics:'Analytics',settings:'Configurações'
  };
  document.getElementById('topbar-title').textContent=titles[page]||page;
  renderPage(page);
  updateMiniPomo();
}

function renderPage(p){
  if(p==='dashboard')  renderDash();
  if(p==='planner')    renderPlanner();
  if(p==='pomodoro')   renderPomo();
  if(p==='flashcards') renderFC();
  if(p==='calendar')   renderCal();
  if(p==='analytics')  renderAnalytics();
  if(p==='settings')   renderSettings();
}


/* ══════════════════════════════════════
   DASHBOARD
══════════════════════════════════════ */
function renderDash(){
  const tp=DB.pomodoro.filter(p=>p.date===tStr()&&p.type==='FOCUS').length;
  const fm=(DB.prefs?.focusMins)||25;
  const tmins=tp*fm;
  const pct=totalPct();
  const done=DB.tasks.filter(t=>t.done).length;
  const total=DB.tasks.length;

  // Cards hero 2x2
  document.getElementById('dash-hero').innerHTML=`
    <div class="dash-hero-card blue">
      <div class="dhc-label">Progresso geral</div>
      <div class="dhc-value" style="color:var(--accent)">${pct}<span style="font-size:20px;letter-spacing:0">%</span></div>
      <div class="dhc-sub">${done} de ${total} tarefas concluídas</div>
      <div class="dhc-bar"><div class="dhc-fill" style="width:${pct}%;background:linear-gradient(90deg,var(--accent2),var(--accent))"></div></div>
    </div>
    <div class="dash-hero-card green">
      <div class="dhc-label">Tempo hoje</div>
      <div class="dhc-value" style="color:var(--green)">${tmins<60?tmins+'<span style="font-size:18px">min</span>':Math.floor(tmins/60)+'<span style="font-size:20px">h</span>'+(tmins%60?tmins%60+'<span style="font-size:16px">m</span>':"")}</div>
      <div class="dhc-sub">${tp} pomodoro${tp!==1?'s':''} de foco</div>
      <div class="dhc-bar"><div class="dhc-fill" style="width:${Math.min(100,tp*12)}%;background:linear-gradient(90deg,var(--green),#19b489)"></div></div>
    </div>
    <div class="dash-hero-card amber">
      <div class="dhc-label">Streak</div>
      <div class="dhc-value" style="color:var(--amber)">${DB.user.streak}<span style="font-size:18px;letter-spacing:0"> dias</span></div>
      <div class="dhc-sub">${DB.user.streak>0?'🔥 Continue assim!':'Estude hoje para começar'}</div>
      <div class="dhc-bar"><div class="dhc-fill" style="width:${Math.min(100,DB.user.streak*7)}%;background:linear-gradient(90deg,var(--amber),#e8960f)"></div></div>
    </div>
    <div class="dash-hero-card purple">
      <div class="dhc-label">Nível</div>
      <div class="dhc-value" style="color:var(--purple)">${DB.user.level}<span style="font-size:18px;letter-spacing:0"> ⚡</span></div>
      <div class="dhc-sub">${DB.user.xp} XP acumulados</div>
      <div class="dhc-bar"><div class="dhc-fill" style="width:${DB.user.xp%100}%;background:linear-gradient(90deg,var(--purple),#8b5cf6)"></div></div>
    </div>`;

  // Métricas secundárias
  const todayPomos=DB.pomodoro.filter(p=>p.date===tStr()).length;
  const pendingTasks=DB.tasks.filter(t=>!t.done).length;
  const dueFC=getDueFC().length;
  const totalPomos=DB.pomodoro.filter(p=>p.type==='FOCUS').length;
  document.getElementById('dash-secondary').innerHTML=`
    <div class="metric-sm"><div class="metric-sm-label">Tarefas pendentes</div><div class="metric-sm-value" style="color:var(--red)">${pendingTasks}</div><div class="metric-sm-sub">${done} concluídas</div></div>
    <div class="metric-sm"><div class="metric-sm-label">Flashcards p/ revisar</div><div class="metric-sm-value" style="color:${dueFC?'var(--red)':'var(--green)'}">${dueFC}</div><div class="metric-sm-sub">${DB.flashcards.length} no total</div></div>
    <div class="metric-sm"><div class="metric-sm-label">Pomodoros (total)</div><div class="metric-sm-value" style="color:var(--accent)">${totalPomos}</div><div class="metric-sm-sub">${totalPomos*fm} minutos</div></div>
    <div class="metric-sm"><div class="metric-sm-label">Planos ativos</div><div class="metric-sm-value" style="color:var(--purple)">${DB.plans.length}</div><div class="metric-sm-sub">${DB.modules.length} módulos</div></div>`;

  // Lista de planos
  const pe=document.getElementById('dash-plans');
  pe.innerHTML=!DB.plans.length
    ?`<div class="empty"><div class="empty-icon">📋</div><div class="empty-text">Nenhum plano ainda</div><button class="btn btn-primary btn-sm" onclick="guardedAction(()=>goto('planner',document.querySelector('[data-page=planner]')))">Criar plano</button></div>`
    :DB.plans.map(p=>{
      const pct=planPct(p.id);const est=estimatePlan(p.id);
      return `<div class="plan-item" onclick="goto('planner',document.querySelector('[data-page=planner]'))"><div class="plan-header"><div class="plan-dot" style="background:${p.color||'#6c8eff'}"></div><div class="plan-name">${p.title}</div><div class="plan-pct">${pct}%</div>${est?`<span class="estimate">${est}</span>`:''}</div><div style="height:4px;background:var(--bg4);border-radius:2px;overflow:hidden;margin-top:4px"><div style="height:100%;width:${pct}%;background:${p.color||'#6c8eff'};border-radius:2px;transition:width .6s ease"></div></div></div>`;
    }).join('');

  // Checklist rápido (top 8 tarefas prioritárias)
  const prioOrder={ALTA:0,MEDIA:1,BAIXA:2};
  const topTasks=[...DB.tasks.filter(t=>!t.done)]
    .sort((a,b)=>(prioOrder[a.priority]||3)-(prioOrder[b.priority]||3)).slice(0,8);
  const pColors={ALTA:'#ff5f5f',MEDIA:'#f5a623',BAIXA:'#22d3a0'};
  document.getElementById('quick-list').innerHTML=!topTasks.length
    ?'<div style="font-size:12px;color:var(--text3);text-align:center;padding:12px">🎉 Nenhuma tarefa pendente!</div>'
    :topTasks.map(t=>`<div class="quick-item"><div class="quick-check" onclick="toggleTask('${t.id}')"><svg width="9" height="9" viewBox="0 0 10 10"><polyline points="1.5 5 4 7.5 8.5 2.5" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round"/></svg></div><div class="quick-prio-dot" style="background:${pColors[t.priority]||'var(--border2)'}"></div><div class="quick-text">${t.title}</div></div>`).join('');

  // Sugestão inteligente
  const sug=getSug();
  document.getElementById('dash-suggestion').innerHTML=`<div class="suggestion"><div class="sug-icon">${sug.icon}</div><div><div class="sug-title">${sug.title}</div><div class="sug-text">${sug.text}</div></div></div>`;

  // Streak mini (30 dias)
  const today=tStr();
  const days30=Array.from({length:30},(_,i)=>{const d=new Date(Date.now()-(29-i)*86400000);return dStr(d);});
  document.getElementById('streak-mini').innerHTML=days30.map(d=>{
    const cnt=DB.pomodoro.filter(p=>p.date===d&&p.type==='FOCUS').length;
    return `<div class="sm-day ${cnt>0?'active':''} ${d===today?'today-dot':''}" title="${d}: ${cnt} pomodoro(s)"></div>`;
  }).join('');

  // Barra de XP e conquistas
  const xi=DB.user.xp%100;
  document.getElementById('dash-xp').innerHTML=`<div class="xp-bar-wrap"><div class="xp-bar-top"><div class="xp-level">Nível ${DB.user.level}</div><div class="xp-pts">${xi}/100 XP</div></div><div class="xp-track"><div class="xp-fill" style="width:${xi}%"></div></div></div>`;
  document.getElementById('dash-ach').innerHTML=ACH.map(a=>`<div class="ach-item ${DB.achievements.includes(a.id)?'unlocked':'locked'}" title="${a.name}"><div class="ach-icon">${a.icon}</div><div class="ach-name">${a.name}</div></div>`).join('');

  // Gráfico de horas estudadas (7 dias)
  if(cH){cH.destroy();cH=null;}
  const l7=last7();
  const hd=l7.map(d=>DB.pomodoro.filter(p=>p.date===d&&p.type==='FOCUS').length*fm/60);
  cH=new Chart(document.getElementById('chart-hours'),{
    type:'bar',
    data:{labels:l7.map(d=>d.slice(5)),datasets:[{data:hd,backgroundColor:'rgba(108,142,255,.45)',borderColor:'#6c8eff',borderWidth:2,borderRadius:4}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{ticks:{color:'#555c75'},grid:{color:'rgba(255,255,255,.03)'}},y:{ticks:{color:'#555c75',callback:v=>v.toFixed(1)+'h'},grid:{color:'rgba(255,255,255,.03)'}}}}
  });
}

/** Gera sugestão com base no estado atual do banco de dados. */
function getSug(){
  const d=getDueFC().length;
  if(d>0)return{icon:'🃏',title:'Revisão pendente',text:`${d} flashcard(s) para revisar hoje!`};
  const prioOrder={ALTA:0,MEDIA:1,BAIXA:2};
  const p=[...DB.tasks.filter(t=>!t.done)].sort((a,b)=>(prioOrder[a.priority]||3)-(prioOrder[b.priority]||3));
  if(p.length){
    const t=p[0];const tp=DB.topics.find(x=>x.id===t.topicId);
    const pl=t.priority?` [${t.priority}]`:'';
    return{icon:'📖',title:'Continue estudando',text:`${pl} "${t.title}"${tp?' em '+tp.title:''}`};
  }
  return{icon:'🏖️',title:'Tudo em dia!',text:'Todas as tarefas concluídas. Crie novos conteúdos.'};
}


/* ══════════════════════════════════════
   PLANEJADOR
══════════════════════════════════════ */
const PRIO_MAP={ALTA:{label:'Alta',cls:'prio-alta'},MEDIA:{label:'Média',cls:'prio-media'},BAIXA:{label:'Baixa',cls:'prio-baixa'}};

function renderPlanner(){
  const hint=document.getElementById('planner-hint');
  if(hint)hint.textContent=readOnly
    ?'👀 Modo visualização — entre como dono para editar'
    :'💡 Duplo clique para editar inline';

  const el=document.getElementById('planner-content');
  if(!DB.plans.length){
    el.innerHTML=`<div class="empty"><div class="empty-icon">📋</div><div class="empty-text">Nenhum plano criado.</div></div>`;
    return;
  }
  el.innerHTML=DB.plans.map(plan=>{
    const pct=planPct(plan.id);const mods=DB.modules.filter(m=>m.planId===plan.id);const est=estimatePlan(plan.id);
    return `<div class="card" style="margin-bottom:0"><div style="display:flex;align-items:center;gap:9px;margin-bottom:11px"><div style="width:9px;height:9px;border-radius:50%;background:${plan.color||'#6c8eff'}"></div><div class="${readOnly?'':'editable'}" style="font-family:'Syne',sans-serif;font-size:15px;font-weight:700;flex:1" ${readOnly?'':` ondblclick="inlineEdit(this,'plans','title','${plan.id}')"`}>${plan.title}</div><span style="font-size:12px;font-weight:700;color:${plan.color||'#6c8eff'}">${pct}%</span>${est?`<span class="estimate">${est}</span>`:''}</div><div style="height:4px;background:var(--bg4);border-radius:2px;overflow:hidden;margin-bottom:13px"><div style="height:100%;width:${pct}%;background:${plan.color||'#6c8eff'};border-radius:2px;transition:width .6s ease"></div></div><div class="module-tree">${mods.map(m=>renderMod(m)).join('')}</div>${!mods.length?'<div class="empty" style="padding:16px"><div class="empty-text" style="font-size:11.5px">Sem módulos.</div></div>':''}</div>`;
  }).join('<div style="height:14px"></div>');
}

function renderMod(mod){
  const topics=DB.topics.filter(t=>t.moduleId===mod.id);const pct=modPct(mod.id);
  return `<div class="mod-item open" id="mod-${mod.id}"><div class="mod-header" onclick="toggleMod('${mod.id}')"><span class="mod-arrow">▶</span><div class="mod-name ${readOnly?'':'editable'}" ${readOnly?'':` ondblclick="event.stopPropagation();inlineEdit(this,'modules','title','${mod.id}')"`}>${mod.title}</div><span style="font-size:10.5px;color:var(--text3)">${pct}%</span></div><div class="mod-topics">${topics.map(t=>renderTopic(t)).join('')}${!topics.length?'<div style="font-size:11.5px;color:var(--text3);padding:5px 0">Sem tópicos.</div>':''}</div></div>`;
}

function renderTopic(topic){
  const tasks=DB.tasks.filter(t=>t.topicId===topic.id);
  const done=tasks.filter(t=>t.done).length;
  const note=(DB.notes||{})[topic.id]||'';
  const topicMins=topicPomoMins(topic.id);
  return `<div><div class="topic-item" onclick="toggleTopTasks('${topic.id}')"><div class="topic-icon">📌</div><div class="topic-name ${readOnly?'':'editable'}" ${readOnly?'':` ondblclick="event.stopPropagation();inlineEdit(this,'topics','title','${topic.id}')"`}>${topic.title}</div><div class="topic-count">${done}/${tasks.length}</div>${topicMins?`<div class="topic-mins">⏱ ${topicMins}min</div>`:''}</div><div id="tasks-${topic.id}" style="display:none;padding:7px 9px 4px;flex-direction:column;gap:3px">${tasks.sort((a,b)=>(a.done?1:-1)).map(t=>renderTI(t)).join('')}<div style="margin-top:7px"><div style="font-size:10.5px;color:var(--text3);margin-bottom:3px;font-weight:600;text-transform:uppercase;letter-spacing:.04em">Notas</div><textarea class="notes-area" rows="3" placeholder="Anote aqui…" ${readOnly?'readonly':''} oninput="saveNote('${topic.id}',this.value)">${note}</textarea></div></div></div>`;
}

function renderTI(t){
  const p=PRIO_MAP[t.priority];
  return `<div class="task-item ${t.done?'done':''}"><div class="task-check ${t.done?'done':''}" onclick="toggleTask('${t.id}');event.stopPropagation()"><svg width="9" height="9" viewBox="0 0 10 10"><polyline points="1.5 5 4 7.5 8.5 2.5" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round"/></svg></div><div class="task-text ${readOnly?'':'editable'}" ${readOnly?'':` ondblclick="event.stopPropagation();inlineEdit(this,'tasks','title','${t.id}')"`}>${t.title}</div>${p?`<span class="prio ${p.cls}">${p.label}</span>`:''}<div class="task-mins">${t.mins?t.mins+'min':''}</div><div class="task-xp">+${t.priority==='ALTA'?15:t.priority==='MEDIA'?12:10} XP</div></div>`;
}

function toggleMod(id){document.getElementById('mod-'+id).classList.toggle('open');}
function toggleTopTasks(id){const el=document.getElementById('tasks-'+id);el.style.display=el.style.display==='flex'?'none':'flex';}
function saveNote(tid,v){if(readOnly)return;if(!DB.notes)DB.notes={};DB.notes[tid]=v;save();}

/** Edição inline ao dar duplo clique em um campo. */
function inlineEdit(el,coll,field,id){
  if(readOnly)return;
  const cur=el.textContent;const inp=document.createElement('input');
  inp.className='inline-edit';inp.value=cur;
  inp.style.cssText=`font-size:${getComputedStyle(el).fontSize};font-weight:${getComputedStyle(el).fontWeight}`;
  el.replaceWith(inp);inp.focus();inp.select();
  const commit=()=>{
    const val=inp.value.trim()||cur;
    const item=DB[coll]?.find(x=>x.id===id);
    if(item){item[field]=val;save();}
    inp.replaceWith(el);el.textContent=val;
  };
  inp.onblur=commit;
  inp.onkeydown=e=>{if(e.key==='Enter')inp.blur();if(e.key==='Escape')inp.replaceWith(el);};
}

/** Marca/desmarca uma tarefa e concede XP. */
function toggleTask(id){
  const t=DB.tasks.find(t=>t.id===id);if(!t)return;
  if(readOnly){showToast('👀 Modo visualização — entre como dono para editar','amber');return;}
  t.done=!t.done;t.doneAt=t.done?new Date().toISOString():null;
  if(t.done){
    const xpBonus=t.priority==='ALTA'?15:t.priority==='MEDIA'?12:10;
    grantXP('task',xpBonus);
    const tp=DB.topics.find(x=>x.id===t.topicId);
    const m=tp?DB.modules.find(x=>x.id===tp.moduleId):null;
    if(m){
      const all=DB.topics.filter(x=>x.moduleId===m.id).flatMap(x=>DB.tasks.filter(k=>k.topicId===x.id));
      if(all.length&&all.every(k=>k.done)){grantXP('module');launchConfetti();}
    }
    logAct(tStr());
  }
  save();
  renderPage(document.querySelector('.page.active').id.replace('page-',''));
  updateTopbar();
}

/* Deleções em cascata */
function delPlan(id){if(readOnly)return;DB.modules.filter(m=>m.planId===id).forEach(m=>{DB.topics.filter(t=>t.moduleId===m.id).forEach(t=>{DB.tasks=DB.tasks.filter(k=>k.topicId!==t.id);});DB.topics=DB.topics.filter(t=>t.moduleId!==m.id);});DB.modules=DB.modules.filter(m=>m.planId!==id);DB.plans=DB.plans.filter(p=>p.id!==id);save();renderPlanner();}
function delMod(id){if(readOnly)return;DB.topics.filter(t=>t.moduleId===id).forEach(t=>{DB.tasks=DB.tasks.filter(k=>k.topicId!==t.id);});DB.topics=DB.topics.filter(t=>t.moduleId!==id);DB.modules=DB.modules.filter(m=>m.id!==id);save();renderPlanner();}
function delTopic(id){if(readOnly)return;DB.tasks=DB.tasks.filter(t=>t.topicId!==id);DB.topics=DB.topics.filter(t=>t.id!==id);save();renderPlanner();}
function delTask(id){if(readOnly)return;DB.tasks=DB.tasks.filter(t=>t.id!==id);save();renderPlanner();}


/* ══════════════════════════════════════
   POMODORO — Timer, fases, widget
══════════════════════════════════════ */
let pomoTimer=null, pomoState={phase:'FOCUS',timeLeft:0,running:false,cycles:0};
const getPD=()=>({
  FOCUS:      ((DB.prefs?.focusMins)||25)*60,
  SHORT_BREAK:((DB.prefs?.shortMins)||5)*60,
  LONG_BREAK: ((DB.prefs?.longMins)||15)*60
});

function renderPomo(){
  const sel=document.getElementById('pomo-topic-sel');
  sel.innerHTML='<option value="">— selecionar tópico —</option>'+
    DB.topics.map(t=>`<option value="${t.id}">${t.title}</option>`).join('');
  updateDots();renderPomoSess();renderHours();renderTopicTime();
}

function updateDots(){
  const el=document.getElementById('pomo-dots');if(!el)return;
  el.innerHTML=[0,1,2,3].map(i=>`<div class="pomo-dot ${i<pomoState.cycles%4?'done':i===pomoState.cycles%4&&pomoState.running&&pomoState.phase==='FOCUS'?'active':''}"></div>`).join('');
}

function updatePomoDisplay(){
  const t=pomoState.timeLeft;
  const str=String(Math.floor(t/60)).padStart(2,'0')+':'+String(t%60).padStart(2,'0');
  const d=document.getElementById('pomo-display');if(d)d.textContent=str;
  const ph=document.getElementById('pomo-phase');if(ph)ph.textContent={FOCUS:'Foco 🎯',SHORT_BREAK:'Pausa ☕',LONG_BREAK:'Pausa longa 🛌'}[pomoState.phase];
  const arc=document.getElementById('pomo-arc');
  if(arc){
    arc.setAttribute('stroke-dashoffset',540*(1-pomoState.timeLeft/getPD()[pomoState.phase]));
    arc.setAttribute('stroke',{FOCUS:'#6c8eff',SHORT_BREAK:'#22d3a0',LONG_BREAK:'#a78bfa'}[pomoState.phase]);
  }
  document.getElementById('pomo-ring')?.classList.toggle('pomo-running',pomoState.running&&pomoState.phase==='FOCUS');
  updateFD();updateMiniPomo();
  document.title=pomoState.running?str+' — StudyFlow':'StudyFlow';
}

function pomodoroToggle(){
  if(pomoState.running){
    clearInterval(pomoTimer);pomoTimer=null;pomoState.running=false;
    const b=document.getElementById('pomo-btn');if(b)b.textContent='▶ Continuar';
  } else {
    if(pomoState.timeLeft===0)pomoState.timeLeft=getPD()[pomoState.phase];
    pomoState.running=true;
    const b=document.getElementById('pomo-btn');if(b)b.textContent='⏸ Pausar';
    pomoTimer=setInterval(()=>{
      pomoState.timeLeft--;
      updatePomoDisplay();updateDots();
      if(pomoState.timeLeft<=0)completePhase();
    },1000);
  }
  updatePomoDisplay();
}

function pomodoroReset(){
  clearInterval(pomoTimer);pomoTimer=null;
  pomoState={phase:'FOCUS',timeLeft:getPD().FOCUS,running:false,cycles:pomoState.cycles};
  const b=document.getElementById('pomo-btn');if(b)b.textContent='▶ Iniciar';
  updatePomoDisplay();updateDots();document.title='StudyFlow';
}

function completePhase(){
  clearInterval(pomoTimer);pomoTimer=null;pomoState.running=false;
  const tid=document.getElementById('pomo-topic-sel')?.value||null;
  if(!readOnly){DB.pomodoro.push({id:uid(),type:pomoState.phase,date:tStr(),topicId:tid,createdAt:new Date().toISOString()});save();}
  if(DB.prefs?.sound)playBeep();
  sendBrowserNotif(pomoState.phase==='FOCUS'?'🎯 Pomodoro concluído! Hora da pausa.':'☕ Pausa encerrada! Hora de focar.');
  if(pomoState.phase==='FOCUS'){
    pomoState.cycles++;
    if(!readOnly)grantXP('pomodoro');
    showToast('Pomodoro concluído! 🎯','green');
    pomoState.phase=pomoState.cycles%4===0?'LONG_BREAK':'SHORT_BREAK';
  } else {
    showToast('Pausa encerrada! 💪','accent');
    pomoState.phase='FOCUS';
  }
  pomoState.timeLeft=getPD()[pomoState.phase];
  const b=document.getElementById('pomo-btn');if(b)b.textContent='▶ Iniciar';
  updatePomoDisplay();updateDots();renderPomoSess();renderTopicTime();exitFocus();
}

function renderPomoSess(){
  const today=DB.pomodoro.filter(p=>p.date===tStr());
  const el=document.getElementById('pomo-sessions');if(!el)return;
  el.innerHTML=!today.length
    ?'<div style="font-size:12px;color:var(--text3)">Nenhuma sessão hoje.</div>'
    :[...today].reverse().map(p=>{
      const tp=DB.topics.find(t=>t.id===p.topicId);
      return `<div style="display:flex;align-items:center;gap:7px;padding:7px 9px;background:var(--bg3);border-radius:7px;font-size:11.5px"><span>${{FOCUS:'🎯 Foco',SHORT_BREAK:'☕ Pausa curta',LONG_BREAK:'🛌 Pausa longa'}[p.type]}</span>${tp?`<span style="color:var(--text3)">— ${tp.title}</span>`:''}</div>`;
    }).join('');
  const se=document.getElementById('pomo-stats');
  if(se){const tf=DB.pomodoro.filter(p=>p.type==='FOCUS').length;se.innerHTML=`<div class="badge badge-xp">🎯 ${tf} foco</div><div class="badge badge-green">⏱ ${tf*((DB.prefs?.focusMins)||25)}min</div>`;}
}

function renderHours(){
  const el=document.getElementById('hour-bars');if(!el)return;
  const c=Array(24).fill(0);
  DB.pomodoro.filter(p=>p.type==='FOCUS').forEach(p=>{c[new Date(p.createdAt||0).getHours()]++;});
  const mx=Math.max(...c,1);
  el.innerHTML=c.map((v,h)=>`<div class="hour-bar" style="height:${Math.max(4,Math.round(v/mx*100))}%;background:${v?'rgba(108,142,255,'+(0.3+v/mx*0.7)+')':'rgba(108,142,255,.06)'}" title="${h}h — ${v}x"></div>`).join('');
}

function renderTopicTime(){
  const el=document.getElementById('topic-time-list');if(!el)return;
  const data=DB.topics.map(t=>({name:t.title,mins:topicPomoMins(t.id)})).filter(x=>x.mins>0).sort((a,b)=>b.mins-a.mins).slice(0,6);
  if(!data.length){el.innerHTML='<div style="font-size:11.5px;color:var(--text3)">Estude com um tópico selecionado para ver o tempo aqui.</div>';return;}
  const mx=Math.max(...data.map(x=>x.mins),1);
  el.innerHTML=data.map(x=>`<div class="topic-time-row"><div class="tt-name">${x.name}</div><div class="tt-bar"><div class="tt-fill" style="width:${Math.round(x.mins/mx*100)}%"></div></div><div class="tt-time">${x.mins}min</div></div>`).join('');
}

/* Modo foco (overlay imersivo) */
function enterFocus(){if(!pomoState.running)pomodoroToggle();document.getElementById('focus-overlay').classList.add('open');spawnP();updateFD();}
function exitFocus(){document.getElementById('focus-overlay').classList.remove('open');}

function updateFD(){
  const t=pomoState.timeLeft;
  const str=String(Math.floor(t/60)).padStart(2,'0')+':'+String(t%60).padStart(2,'0');
  const e=document.getElementById('focus-time');if(e)e.textContent=str;
  const l=document.getElementById('focus-lbl');if(l)l.textContent={FOCUS:'Foco profundo',SHORT_BREAK:'Pausa curta',LONG_BREAK:'Pausa longa'}[pomoState.phase];
  const tl=document.getElementById('focus-topic');if(tl){const tid=document.getElementById('pomo-topic-sel')?.value;const tp=tid?DB.topics.find(t=>t.id===tid):null;tl.textContent=tp?tp.title:'';}
  const fb=document.getElementById('focus-btn');if(fb)fb.textContent=pomoState.running?'⏸ Pausar':'▶ Continuar';
}

/** Cria partículas flutuantes no modo foco. */
function spawnP(){
  const c=document.getElementById('fp');c.innerHTML='';
  const cols=['#6c8eff','#a78bfa','#22d3a0','#ff6eb4'];
  for(let i=0;i<18;i++){
    const p=document.createElement('div');p.className='particle';
    const sz=Math.random()*5+2;
    p.style.cssText=`width:${sz}px;height:${sz}px;background:${cols[i%4]};left:${Math.random()*100}%;animation-delay:${Math.random()*6}s;animation-duration:${6+Math.random()*4}s`;
    c.appendChild(p);
  }
}

function updateMiniPomo(){
  const onP=document.getElementById('page-pomodoro')?.classList.contains('active');
  const mp=document.getElementById('mini-pomo');
  if(pomoState.running&&!onP&&DB.prefs?.miniWidget!==false)mp.classList.add('visible');
  else mp.classList.remove('visible');
  const t=pomoState.timeLeft;
  const str=String(Math.floor(t/60)).padStart(2,'0')+':'+String(t%60).padStart(2,'0');
  const mt=document.getElementById('mini-time');if(mt)mt.textContent=str;
  const mp2=document.getElementById('mini-ph');if(mp2)mp2.textContent={FOCUS:'Foco 🎯',SHORT_BREAK:'Pausa ☕',LONG_BREAK:'Pausa longa'}[pomoState.phase];
  const dot=document.getElementById('mini-dot');if(dot)dot.classList.toggle('run',pomoState.running);
}

/** Emite 3 bipes via Web Audio API. */
function playBeep(){
  try{
    const ctx=new(window.AudioContext||window.webkitAudioContext)();
    [0,.15,.3].forEach(d=>{
      const o=ctx.createOscillator(),g=ctx.createGain();
      o.connect(g);g.connect(ctx.destination);
      o.type='sine';o.frequency.value=880;
      g.gain.setValueAtTime(.3,ctx.currentTime+d);
      g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+d+.2);
      o.start(ctx.currentTime+d);o.stop(ctx.currentTime+d+.25);
    });
  }catch(e){}
}

function sendBrowserNotif(msg){
  if(!DB.prefs?.notifications)return;
  if(Notification.permission==='granted')new Notification('StudyFlow',{body:msg});
}

async function toggleNotif(on){
  if(!DB.prefs)DB.prefs={};
  if(on&&Notification.permission!=='granted'){
    const perm=await Notification.requestPermission();
    if(perm!=='granted'){showToast('Permissão negada','red');const el=document.getElementById('set-notif');if(el)el.checked=false;return;}
  }
  DB.prefs.notifications=on;save();
  showToast(on?'Notificações ativadas 🔔':'Notificações desativadas','accent');
}


/* ══════════════════════════════════════
   FLASHCARDS — SRS (Revisão Espaçada)
══════════════════════════════════════ */
let reviewQ=[], reviewI=0, fcTagFilter='';

function getAllFCTags(){
  const tags=new Set();
  DB.flashcards.forEach(f=>(f.tags||[]).forEach(t=>tags.add(t)));
  return [...tags];
}

/** Retorna flashcards com revisão pendente para hoje. */
function getDueFC(){
  const today=tStr();
  return DB.flashcards.filter(fc=>{
    if(fcTagFilter&&!(fc.tags||[]).includes(fcTagFilter))return false;
    const revs=DB.reviews.filter(r=>r.fcId===fc.id);
    if(!revs.length)return true;
    const last=revs.sort((a,b)=>new Date(b.reviewedAt)-new Date(a.reviewedAt))[0];
    return last.nextReview<=today;
  });
}

function filterFC(tag){
  fcTagFilter=tag;
  document.getElementById('tag-all')?.classList.toggle('active',tag==='');
  document.querySelectorAll('[data-tag]').forEach(el=>el.classList.toggle('active',el.dataset.tag===tag));
  renderFC();
}

function renderFC(){
  const due=getDueFC();const db=document.getElementById('fc-due-badge');
  if(due.length){db.style.display='inline-flex';db.textContent=due.length+' para revisar';}
  else db.style.display='none';
  document.getElementById('fc-review-area').style.display=reviewQ.length?'block':'none';
  document.getElementById('fc-count').textContent=DB.flashcards.length;
  const tags=getAllFCTags();
  document.getElementById('tag-list-filter').innerHTML=tags.map(tag=>`<span class="fc-tag ${fcTagFilter===tag?'active':''}" data-tag="${tag}" onclick="filterFC('${tag}')">${tag}</span>`).join('');
  const show=fcTagFilter?DB.flashcards.filter(f=>(f.tags||[]).includes(fcTagFilter)):DB.flashcards;
  const el=document.getElementById('fc-list');
  if(!show.length){el.innerHTML=`<div class="empty" style="grid-column:1/-1"><div class="empty-icon">🃏</div><div class="empty-text">${fcTagFilter?'Nenhum flashcard com essa tag.':'Nenhum flashcard.'}</div></div>`;return;}
  el.innerHTML=show.map(fc=>{
    const isDue=due.find(d=>d.id===fc.id);
    const revs=DB.reviews.filter(r=>r.fcId===fc.id);
    const last=revs.length?revs.sort((a,b)=>new Date(b.reviewedAt)-new Date(a.reviewedAt))[0]:null;
    const ftags=(fc.tags||[]).map(t=>`<span class="fc-tag" style="font-size:9px;padding:1px 6px">${t}</span>`).join('');
    return `<div style="background:var(--bg3);border:1px solid ${isDue?'rgba(108,142,255,.28)':'var(--border)'};border-radius:var(--r);padding:12px"><div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:.04em;margin-bottom:5px">Pergunta</div><div style="font-size:12.5px;font-weight:500;margin-bottom:7px">${fc.front}</div><div style="font-size:10.5px;color:var(--text2);margin-bottom:8px">${fc.back}</div>${ftags?`<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:7px">${ftags}</div>`:''}<div style="display:flex;align-items:center;gap:6px">${isDue?'<span class="badge badge-xp" style="font-size:9.5px">Revisão pendente</span>':''}${last?`<span style="font-size:9.5px;color:var(--text3)">Próx: ${last.nextReview}</span>`:'<span style="font-size:9.5px;color:var(--text3)">Nunca revisado</span>'}</div></div>`;
  }).join('');
}

function startReview(){
  reviewQ=getDueFC();
  if(!reviewQ.length){showToast('Nenhum flashcard para revisar!','amber');return;}
  reviewI=0;showRC();
  document.getElementById('fc-review-area').style.display='block';
}

function showRC(){
  if(reviewI>=reviewQ.length){
    document.getElementById('fc-review-area').style.display='none';
    showToast('Revisão completa! 🎉','green');
    reviewQ=[];return;
  }
  const fc=reviewQ[reviewI];
  document.getElementById('fc-front').textContent=fc.front;
  document.getElementById('fc-back-text').textContent=fc.back;
  document.getElementById('fc-card').classList.remove('flipped');
  document.getElementById('fc-progress').textContent=`${reviewI+1} / ${reviewQ.length}`;
}

function flipCard(){document.getElementById('fc-card').classList.toggle('flipped');}

function rateCard(d){
  const fc=reviewQ[reviewI];
  const nr=dStr(new Date(Date.now()+({EASY:7,MEDIUM:3,HARD:1}[d])*86400000));
  if(!readOnly){DB.reviews.push({id:uid(),fcId:fc.id,difficulty:d,reviewedAt:new Date().toISOString(),nextReview:nr});grantXP('flashcard');save();}
  reviewI++;showRC();renderFC();
}

function delFC(id){if(readOnly)return;DB.flashcards=DB.flashcards.filter(f=>f.id!==id);DB.reviews=DB.reviews.filter(r=>r.fcId!==id);save();renderFC();}


/* ══════════════════════════════════════
   CALENDÁRIO
══════════════════════════════════════ */
let calDate=new Date();

function renderCal(){
  const yr=calDate.getFullYear(),mo=calDate.getMonth();
  document.getElementById('cal-title').textContent=calDate.toLocaleDateString('pt-BR',{month:'long',year:'numeric'});
  document.getElementById('cal-wdays').innerHTML=['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(d=>`<div class="cal-weekday">${d}</div>`).join('');
  const fd=new Date(yr,mo,1).getDay(),dim=new Date(yr,mo+1,0).getDate();
  const td=tStr(),sd=DB.sessions.map(s=>s.date);
  let days=[];const pd=new Date(yr,mo,0).getDate();
  for(let i=fd-1;i>=0;i--)days.push({day:pd-i,other:true});
  for(let d=1;d<=dim;d++){const ds=`${yr}-${String(mo+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;days.push({day:d,ds,isToday:ds===td,hasSess:sd.includes(ds)});}
  for(let d=1;days.length<42;d++)days.push({day:d,other:true});
  document.getElementById('cal-days').innerHTML=days.map(d=>`<div class="cal-day ${d.other?'other-month':''} ${d.isToday?'today':''} ${d.hasSess&&!d.other?'has-session':''}">${d.day}</div>`).join('');
  const s=[...DB.sessions].sort((a,b)=>b.date.localeCompare(a.date));
  document.getElementById('cal-sessions').innerHTML=!s.length
    ?'<div style="font-size:12px;color:var(--text3)">Nenhuma sessão.</div>'
    :s.map(x=>`<div style="display:flex;align-items:center;gap:9px;padding:9px 11px;background:var(--bg3);border-radius:var(--r)"><div style="font-size:11.5px;color:var(--text3);min-width:78px">${x.date}</div><div style="flex:1;font-size:12.5px">${x.title}</div><div class="badge badge-green">${x.duration}min</div></div>`).join('');
}

function calNav(d){calDate=new Date(calDate.getFullYear(),calDate.getMonth()+d,1);renderCal();}


/* ══════════════════════════════════════
   ANALYTICS
══════════════════════════════════════ */
function renderAnalytics(){
  const fm=(DB.prefs?.focusMins)||25;
  const tf=DB.pomodoro.filter(p=>p.type==='FOCUS').length;
  document.getElementById('analytics-metrics').innerHTML=`
    <div class="metric-sm"><div class="metric-sm-label">Total estudado</div><div class="metric-sm-value" style="color:var(--accent)">${(tf*fm/60).toFixed(1)}h</div><div class="metric-sm-sub">${tf} pomodoros</div></div>
    <div class="metric-sm"><div class="metric-sm-label">Tarefas concluídas</div><div class="metric-sm-value" style="color:var(--green)">${DB.tasks.filter(t=>t.done).length}</div><div class="metric-sm-sub">de ${DB.tasks.length} totais</div></div>
    <div class="metric-sm"><div class="metric-sm-label">Streak atual</div><div class="metric-sm-value" style="color:var(--amber)">${DB.user.streak}</div><div class="metric-sm-sub">dias seguidos</div></div>
    <div class="metric-sm"><div class="metric-sm-label">Revisões FC</div><div class="metric-sm-value" style="color:var(--pink)">${DB.reviews.length}</div><div class="metric-sm-sub">flashcards revisados</div></div>`;

  // Gráfico de progresso por plano (doughnut)
  if(cP){cP.destroy();cP=null;}
  if(DB.plans.length)cP=new Chart(document.getElementById('chart-plans'),{
    type:'doughnut',
    data:{labels:DB.plans.map(p=>p.title),datasets:[{data:DB.plans.map(p=>planPct(p.id)||0),backgroundColor:DB.plans.map(p=>p.color||'#6c8eff'),borderWidth:0}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:'#8b91a8',font:{size:11}}}}}
  });

  // Gráfico de tempo por tópico (bar horizontal)
  if(cTD){cTD.destroy();cTD=null;}
  const topicData=DB.topics.map(t=>({label:t.title,mins:topicPomoMins(t.id)})).filter(x=>x.mins>0).sort((a,b)=>b.mins-a.mins).slice(0,8);
  if(topicData.length)cTD=new Chart(document.getElementById('chart-topic-dist'),{
    type:'bar',
    data:{labels:topicData.map(x=>x.label.length>12?x.label.slice(0,12)+'…':x.label),datasets:[{data:topicData.map(x=>x.mins),backgroundColor:'rgba(167,139,250,.5)',borderColor:'#a78bfa',borderWidth:2,borderRadius:4}]},
    options:{responsive:true,maintainAspectRatio:false,indexAxis:'y',plugins:{legend:{display:false}},scales:{x:{ticks:{color:'#555c75',callback:v=>v+'min'},grid:{color:'rgba(255,255,255,.03)'}},y:{ticks:{color:'#555c75'},grid:{display:false}}}}
  });

  // Gráfico de tarefas concluídas por dia (line)
  if(cT){cT.destroy();cT=null;}
  const l7=last7();
  cT=new Chart(document.getElementById('chart-tasks'),{
    type:'line',
    data:{labels:l7.map(d=>d.slice(5)),datasets:[{data:l7.map(d=>DB.tasks.filter(t=>t.doneAt&&dStr(new Date(t.doneAt))===d).length),borderColor:'#22d3a0',backgroundColor:'rgba(34,211,160,.08)',fill:true,tension:.4,pointBackgroundColor:'#22d3a0',pointRadius:4}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{ticks:{color:'#555c75'},grid:{color:'rgba(255,255,255,.03)'}},y:{ticks:{color:'#555c75',stepSize:1},grid:{color:'rgba(255,255,255,.03)'}}}}
  });

  // Heatmap de atividade (56 dias)
  const d56=Array.from({length:56},(_,i)=>{const d=new Date(Date.now()-(55-i)*86400000);return dStr(d);});
  document.getElementById('streak-heatmap').innerHTML=d56.map(d=>{
    const c=DB.pomodoro.filter(p=>p.date===d&&p.type==='FOCUS').length;
    return `<div class="streak-day ${c>=3?'active':c>=1?'partial':''}" title="${d}: ${c} pomodoros"></div>`;
  }).join('');
}


/* ══════════════════════════════════════
   CONFIGURAÇÕES
══════════════════════════════════════ */
function renderSettings(){
  const ni=document.getElementById('set-name');if(ni)ni.value=DB.user.name||'';
  const sl=document.getElementById('set-light');if(sl)sl.checked=DB.prefs?.light||false;
  const ss=document.getElementById('set-sound');if(ss)ss.checked=DB.prefs?.sound!==false;
  const sn=document.getElementById('set-notif');if(sn)sn.checked=DB.prefs?.notifications||false;
  const sw=document.getElementById('set-widget');if(sw)sw.checked=DB.prefs?.miniWidget!==false;
  const vals={focus:DB.prefs?.focusMins||25,short:DB.prefs?.shortMins||5,long:DB.prefs?.longMins||15};
  Object.entries(vals).forEach(([k,v])=>{const e=document.getElementById('set-'+k);if(e)e.value=v;const l=document.getElementById('lbl-'+k);if(l)l.textContent=v;});
}
function saveSettings(){if(readOnly){showToast('Modo visualização','amber');return;}const n=document.getElementById('set-name')?.value.trim();if(n){DB.user.name=n;updateTopbar();}save();showToast('Perfil salvo!','green');}
function savePomoDurations(){if(readOnly)return;if(!DB.prefs)DB.prefs={};DB.prefs.focusMins=parseInt(document.getElementById('set-focus').value)||25;DB.prefs.shortMins=parseInt(document.getElementById('set-short').value)||5;DB.prefs.longMins=parseInt(document.getElementById('set-long').value)||15;save();pomodoroReset();showToast('Durações atualizadas!','green');}
function updateRangeLabel(k,v){const l=document.getElementById('lbl-'+k)||document.getElementById('lbl-short2');if(l)l.textContent=v;}
function toggleTheme(b){document.body.classList.toggle('light',b);if(!DB.prefs)DB.prefs={};DB.prefs.light=b;save();}

/* Export/Import/Reset de dados */
function exportData(){if(readOnly){showToast('Não disponível no modo demo','amber');return;}const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(DB,null,2)],{type:'application/json'}));a.download=`studyflow-${tStr()}.json`;a.click();showToast('Exportado!','green');}
function importData(inp){
  if(readOnly){showToast('Não disponível no modo demo','amber');return;}
  const f=inp.files[0];if(!f)return;
  const r=new FileReader();
  r.onload=e=>{
    try{
      const d=JSON.parse(e.target.result);
      if(!d.plans||!d.tasks){showToast('Arquivo inválido','red');return;}
      const isFullBackup=!!(d.user&&d.prefs);
      if(isFullBackup){openImportModal(d);}else{mergeImport(d);}
    }catch(err){showToast('Erro ao ler o arquivo','red');}
  };
  r.readAsText(f);inp.value='';
}
function openImportModal(d){
  const planNames=(d.plans||[]).map(p=>`<span style="display:inline-block;background:var(--bg4);border-radius:6px;padding:2px 8px;font-size:11px;margin:2px">${p.title}</span>`).join('');
  document.getElementById('modal-title').textContent='📥 Importar dados';
  document.getElementById('modal-body').innerHTML=`<div style="font-size:13px;color:var(--text2);margin-bottom:12px">O arquivo contém <strong style="color:var(--text)">${(d.plans||[]).length} plano(s)</strong>:</div><div style="margin-bottom:16px;line-height:2">${planNames}</div><div style="display:flex;flex-direction:column;gap:8px"><button class="btn btn-primary" onclick="mergeImport(window._importData);closeModal()" style="justify-content:flex-start;gap:10px"><span style="font-size:16px">➕</span><div style="text-align:left"><div style="font-weight:600">Adicionar aos meus dados</div><div style="font-size:11px;opacity:.7">Mantém seus planos existentes</div></div></button><button class="btn btn-danger" onclick="if(confirm('Isso apaga TODOS os seus dados atuais. Tem certeza?')){fullImport(window._importData);closeModal()}" style="justify-content:flex-start;gap:10px"><span style="font-size:16px">🔄</span><div style="text-align:left"><div style="font-weight:600">Substituir tudo</div><div style="font-size:11px;opacity:.7">Apaga dados atuais e carrega o backup</div></div></button></div>`;
  document.querySelector('.modal-actions').style.display='none';
  window._importData=d;
  document.getElementById('modal-bg').classList.add('open');
}
function mergeImport(d){
  const arrays=['plans','modules','topics','tasks','flashcards','reviews','sessions'];
  arrays.forEach(key=>{const existing=new Set((DB[key]||[]).map(x=>x.id));(d[key]||[]).forEach(item=>{if(!existing.has(item.id))DB[key].push(item);});});
  if(d.notes)Object.assign(DB.notes,d.notes);
  if(d.activityLog)d.activityLog.forEach(date=>{if(!DB.activityLog.includes(date))DB.activityLog.push(date);});
  if(d.achievements)d.achievements.forEach(a=>{if(!DB.achievements.includes(a))DB.achievements.push(a);});
  save();showToast(`✅ ${(d.plans||[]).length} plano(s) importado(s)!`,'green');
  setTimeout(()=>location.reload(),1200);
}
function fullImport(d){Object.assign(DB,d);save();showToast('Backup restaurado!','green');setTimeout(()=>location.reload(),1000);}
function resetData(){if(readOnly)return;localStorage.removeItem(SKEY);location.reload();}


/* ══════════════════════════════════════
   MODAL — Criar novos itens
══════════════════════════════════════ */
let mType='';

function openModal(type){
  mType=type;
  const titles={plan:'Novo Plano',module:'Novo Módulo',topic:'Novo Tópico',task:'Nova Tarefa',fc:'Novo Flashcard',session:'Registrar Sessão'};
  document.getElementById('modal-title').textContent=titles[type]||type;
  document.getElementById('modal-body').innerHTML=buildMB(type);
  document.getElementById('modal-bg').classList.add('open');
  setTimeout(()=>document.querySelector('.modal input,.modal textarea')?.focus(),50);
}
function closeModal(){document.getElementById('modal-bg').classList.remove('open');const ma=document.querySelector('.modal-actions');if(ma)ma.style.display='';window._importData=null;}

/** Constrói o HTML interno do modal de acordo com o tipo. */
function buildMB(t){
  if(t==='plan')return`<div class="field"><label>Título *</label><input id="m-title" placeholder="Ex: Desenvolvimento Web"/></div><div class="field"><label>Descrição</label><textarea id="m-desc" rows="2" placeholder="Opcional"></textarea></div><div class="field"><label>Cor</label><input type="color" id="m-color" value="#6c8eff" style="height:34px;padding:3px;cursor:pointer"/></div>`;
  if(t==='module'){const o=DB.plans.map(p=>`<option value="${p.id}">${p.title}</option>`).join('');return !DB.plans.length?'<p style="color:var(--text2)">Crie um plano primeiro.</p>':`<div class="field"><label>Plano *</label><select id="m-plan">${o}</select></div><div class="field"><label>Nome *</label><input id="m-title" placeholder="Ex: HTML & CSS"/></div>`;}
  if(t==='topic'){const o=DB.modules.map(m=>`<option value="${m.id}">${m.title}</option>`).join('');return !DB.modules.length?'<p style="color:var(--text2)">Crie um módulo primeiro.</p>':`<div class="field"><label>Módulo *</label><select id="m-mod">${o}</select></div><div class="field"><label>Nome *</label><input id="m-title" placeholder="Ex: Flexbox"/></div>`;}
  if(t==='task'){const o=DB.topics.map(x=>`<option value="${x.id}">${x.title}</option>`).join('');return !DB.topics.length?'<p style="color:var(--text2)">Crie um tópico primeiro.</p>':`<div class="field"><label>Tópico *</label><select id="m-topic">${o}</select></div><div class="field"><label>Tarefa *</label><input id="m-title" placeholder="Ex: Estudar display flex"/></div><div class="field"><label>Prioridade</label><select id="m-prio"><option value="">— sem prioridade —</option><option value="ALTA">🔴 Alta (+15 XP)</option><option value="MEDIA">🟡 Média (+12 XP)</option><option value="BAIXA">🟢 Baixa (+10 XP)</option></select></div><div class="field"><label>Tempo estimado (min)</label><input type="number" id="m-mins" placeholder="25"/></div>`;}
  if(t==='fc'){const o=DB.topics.length?DB.topics.map(x=>`<option value="${x.id}">${x.title}</option>`).join(''):'';return`<div class="field"><label>Pergunta *</label><textarea id="m-front" rows="2" placeholder="O que é...?"></textarea></div><div class="field"><label>Resposta *</label><textarea id="m-back" rows="2" placeholder="É a..."></textarea></div><div class="field"><label>Tags (separe por vírgula)</label><input id="m-tags" placeholder="Ex: JavaScript, fundamentos"/></div>${o?`<div class="field"><label>Tópico</label><select id="m-topic"><option value="">—</option>${o}</select></div>`:''}`;}
  if(t==='session')return`<div class="field"><label>Título *</label><input id="m-title" placeholder="Ex: Estudei React Hooks"/></div><div class="field"><label>Data</label><input type="date" id="m-date" value="${tStr()}"/></div><div class="field"><label>Duração (min) *</label><input type="number" id="m-mins" placeholder="60"/></div>`;
  return '';
}

function saveModal(){
  if(readOnly){showToast('👀 Modo visualização','amber');closeModal();return;}
  const v=id=>{const e=document.getElementById(id);return e?e.value.trim():null;};
  if(mType==='plan'){const t=v('m-title');if(!t)return showToast('Título obrigatório','amber');DB.plans.push({id:uid(),title:t,description:v('m-desc')||'',color:v('m-color')||'#6c8eff',createdAt:new Date().toISOString()});save();closeModal();renderPlanner();showToast('Plano criado!','green');}
  else if(mType==='module'){const t=v('m-title'),p=v('m-plan');if(!t||!p)return showToast('Preencha todos os campos','amber');DB.modules.push({id:uid(),planId:p,title:t,createdAt:new Date().toISOString()});save();closeModal();renderPlanner();showToast('Módulo criado!','green');}
  else if(mType==='topic'){const t=v('m-title'),m=v('m-mod');if(!t||!m)return showToast('Preencha todos os campos','amber');DB.topics.push({id:uid(),moduleId:m,title:t,createdAt:new Date().toISOString()});save();closeModal();renderPlanner();showToast('Tópico criado!','green');}
  else if(mType==='task'){const t=v('m-title'),tp=v('m-topic');if(!t||!tp)return showToast('Preencha todos os campos','amber');DB.tasks.push({id:uid(),topicId:tp,title:t,priority:v('m-prio')||null,mins:parseInt(v('m-mins'))||null,done:false,doneAt:null,createdAt:new Date().toISOString()});save();closeModal();renderPlanner();showToast('Tarefa adicionada!','green');}
  else if(mType==='fc'){const f=v('m-front'),b=v('m-back');if(!f||!b)return showToast('Preencha frente e verso','amber');const tags=(v('m-tags')||'').split(',').map(x=>x.trim()).filter(Boolean);DB.flashcards.push({id:uid(),front:f,back:b,tags,topicId:v('m-topic')||null,createdAt:new Date().toISOString()});save();closeModal();renderFC();showToast('Flashcard criado!','green');}
  else if(mType==='session'){const t=v('m-title'),dur=parseInt(v('m-mins'));if(!t||!dur)return showToast('Preencha todos os campos','amber');const date=v('m-date')||tStr();DB.sessions.push({id:uid(),title:t,date,duration:dur,createdAt:new Date().toISOString()});logAct(date);save();closeModal();renderCal();showToast('Sessão registrada!','green');}
}


/* ══════════════════════════════════════
   BUSCA GLOBAL (Ctrl+K)
══════════════════════════════════════ */
function openSearch(){
  document.getElementById('search-overlay').classList.add('open');
  const i=document.getElementById('search-input');i.value='';i.focus();renderSearch('');
}
function closeSearch(){document.getElementById('search-overlay').classList.remove('open');}

function renderSearch(q){
  const el=document.getElementById('search-results');const query=q.toLowerCase().trim();
  if(!query){el.innerHTML='<div class="search-empty">Digite para buscar…</div>';return;}
  const results=[];
  DB.tasks.filter(t=>t.title.toLowerCase().includes(query)).slice(0,5).forEach(t=>{const tp=DB.topics.find(x=>x.id===t.topicId);results.push({icon:t.done?'✅':'☐',label:t.title,type:'Tarefa'+(tp?' · '+tp.title:''),go:'planner'});});
  DB.topics.filter(t=>t.title.toLowerCase().includes(query)).slice(0,4).forEach(t=>{results.push({icon:'📌',label:t.title,type:'Tópico',go:'planner'});});
  DB.flashcards.filter(f=>f.front.toLowerCase().includes(query)||f.back.toLowerCase().includes(query)).slice(0,4).forEach(f=>{results.push({icon:'🃏',label:f.front,type:'Flashcard',go:'flashcards'});});
  DB.plans.filter(p=>p.title.toLowerCase().includes(query)).forEach(p=>{results.push({icon:'📚',label:p.title,type:'Plano',go:'planner'});});
  if(!results.length){el.innerHTML=`<div class="search-empty">Nenhum resultado para "${q}"</div>`;return;}
  el.innerHTML=results.map(r=>`<div class="search-result" onclick="closeSearch();goto('${r.go}',document.querySelector('[data-page=${r.go}]'))"><div class="search-result-icon">${r.icon}</div><div class="search-result-label">${r.label}</div><div class="search-result-type">${r.type}</div></div>`).join('');
}


/* ══════════════════════════════════════
   CONFETTI — Animação ao completar módulo
══════════════════════════════════════ */
function launchConfetti(){
  const cv=document.getElementById('confetti-canvas');cv.width=innerWidth;cv.height=innerHeight;
  const ctx=cv.getContext('2d');
  const ps=Array.from({length:80},()=>({
    x:Math.random()*cv.width,y:-10,
    vx:(Math.random()-.5)*4,vy:Math.random()*3+2,
    color:['#6c8eff','#22d3a0','#f5a623','#ff6eb4','#a78bfa'][Math.floor(Math.random()*5)],
    size:Math.random()*8+3,rot:Math.random()*360,vr:(Math.random()-.5)*6,life:1
  }));
  let f=0;
  (function tick(){
    ctx.clearRect(0,0,cv.width,cv.height);
    ps.forEach(p=>{
      p.x+=p.vx;p.y+=p.vy;p.vy+=.05;p.rot+=p.vr;p.life-=.008;
      ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot*Math.PI/180);
      ctx.globalAlpha=Math.max(0,p.life);ctx.fillStyle=p.color;
      ctx.fillRect(-p.size/2,-p.size/4,p.size,p.size/2);ctx.restore();
    });
    f++;if(f<200&&ps.some(p=>p.life>0))requestAnimationFrame(tick);
    else ctx.clearRect(0,0,cv.width,cv.height);
  })();
  showToast('🏆 Módulo completo! +100 XP','amber');
}


/* ══════════════════════════════════════
   TOPBAR & TOAST
══════════════════════════════════════ */
function updateTopbar(){
  document.getElementById('tb-streak').textContent='🔥 '+DB.user.streak;
  document.getElementById('tb-xp').textContent='⚡ '+DB.user.xp+' XP';
  document.getElementById('tb-lvl').textContent='Nível '+DB.user.level;
  document.getElementById('sb-level').textContent='Nível '+DB.user.level+' · '+DB.user.xp+' XP';
  const n=DB.user.name||'Estudante';
  document.getElementById('sb-av').textContent=n.split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase();
  document.getElementById('sb-name').textContent=n;
}

function showToast(msg, type='accent'){
  const t=document.createElement('div');
  t.className='toast-item '+type;
  t.textContent=msg;
  document.getElementById('toast').appendChild(t);
  setTimeout(()=>t.remove(),3200);
}


/* ══════════════════════════════════════
   HELPERS DE DATA
══════════════════════════════════════ */
function tStr(){return dStr(new Date());}
function dStr(d){return d.toISOString().slice(0,10);}
function last7(){
  return Array.from({length:7},(_,i)=>{
    const d=new Date();d.setDate(d.getDate()-6+i);return dStr(d);
  });
}


/* ══════════════════════════════════════
   ATALHOS DE TECLADO
══════════════════════════════════════ */
document.addEventListener('keydown',e=>{
  if((e.ctrlKey||e.metaKey)&&e.key==='k'){e.preventDefault();openSearch();}
  if(e.key==='Escape'){closeSearch();closeModal();exitFocus();}
  // Espaço pausa/continua o pomodoro quando na página do timer
  if(e.key===' '&&document.getElementById('page-pomodoro')?.classList.contains('active')&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)){e.preventDefault();pomodoroToggle();}
});


/* ══════════════════════════════════════
   DADOS DE DEMONSTRAÇÃO
══════════════════════════════════════ */
function buildDemoData(){
  const d=load(true);
  d.user={name:'Demo',xp:1340,level:14,streak:12,lastStudied:tStr()};
  d.achievements=['first_task','streak_3','pomo_10','plan_1','xp_100','xp_500','tasks_20'];

  // Plano 1 — Desenvolvimento Web
  const pid1='pdemo1',m1a='mdemo1a',m1b='mdemo1b',t1a='tdemo1a',t1b='tdemo1b',t1c='tdemo1c',t1d='tdemo1d';
  d.plans.push({id:pid1,title:'Desenvolvimento Web',description:'Full stack moderno',color:'#6c8eff',createdAt:new Date().toISOString()});
  d.modules.push({id:m1a,planId:pid1,title:'HTML & CSS'},{id:m1b,planId:pid1,title:'JavaScript'});
  d.topics.push({id:t1a,moduleId:m1a,title:'Flexbox'},{id:t1b,moduleId:m1a,title:'Grid Layout'},{id:t1c,moduleId:m1b,title:'Promises & Async'},{id:t1d,moduleId:m1b,title:'Fetch API'});
  [{topicId:t1a,title:'Entender display flex',done:true,priority:'ALTA',mins:30},
   {topicId:t1a,title:'Praticar align-items',done:true,priority:'MEDIA',mins:20},
   {topicId:t1a,title:'Praticar justify-content',done:true,priority:'MEDIA',mins:20},
   {topicId:t1b,title:'grid-template-columns',done:true,priority:'ALTA',mins:30},
   {topicId:t1b,title:'Criar layout com grid',done:false,priority:'ALTA',mins:40},
   {topicId:t1c,title:'Entender Promise.then',done:true,priority:'ALTA',mins:30},
   {topicId:t1c,title:'Async/Await na prática',done:false,priority:'ALTA',mins:35},
   {topicId:t1d,title:'GET e POST com Fetch',done:false,priority:'MEDIA',mins:30}
  ].forEach(x=>d.tasks.push({id:uid(),...x,doneAt:x.done?new Date().toISOString():null,createdAt:new Date().toISOString()}));

  // Plano 2 — Inglês
  const pid2='pdemo2',m2a='mdemo2a',m2b='mdemo2b',t2a='tdemo2a',t2b='tdemo2b',t2c='tdemo2c';
  d.plans.push({id:pid2,title:'🇺🇸 Inglês do Zero ao Real',description:'7 módulos progressivos',color:'#22d3a0',createdAt:new Date().toISOString()});
  d.modules.push({id:m2a,planId:pid2,title:'Módulo 1 — Fundação'},{id:m2b,planId:pid2,title:'Módulo 2 — Listening'});
  d.topics.push({id:t2a,moduleId:m2a,title:'Verbos essenciais'},{id:t2b,moduleId:m2a,title:'Presente simples'},{id:t2c,moduleId:m2b,title:'Shadowing'});
  [{topicId:t2a,title:'Conjugar to be',done:true,priority:'ALTA',mins:20},
   {topicId:t2a,title:'Conjugar to have / to do',done:true,priority:'ALTA',mins:20},
   {topicId:t2b,title:'Criar 5 frases diárias',done:true,priority:'ALTA',mins:15},
   {topicId:t2b,title:'Transformar afirmativa → negativa',done:false,priority:'MEDIA',mins:20},
   {topicId:t2c,title:'Escolher áudio de 1 min',done:false,priority:'ALTA',mins:10},
   {topicId:t2c,title:'Praticar shadowing por 7 dias',done:false,priority:'ALTA',mins:15}
  ].forEach(x=>d.tasks.push({id:uid(),...x,doneAt:x.done?new Date().toISOString():null,createdAt:new Date().toISOString()}));

  // Flashcards de demonstração
  [{front:'O que é uma Promise?',back:'Objeto que representa a conclusão (ou falha) de uma operação assíncrona.',tags:['JavaScript','async'],topicId:t1c},
   {front:'Diferença entre == e === ?',back:'== faz coerção de tipo. === compara sem coerção. Prefira ===.',tags:['JavaScript','fundamentos'],topicId:t1c},
   {front:'Como fazer GET com Fetch?',back:"fetch('url').then(r=>r.json()).then(data=>console.log(data))",tags:['JavaScript','Fetch'],topicId:t1d},
   {front:'gonna / wanna / gotta',back:'gonna = going to | wanna = want to | gotta = have got to',tags:['Inglês','contrações'],topicId:t2c},
   {front:'Verbos irregulares: go, do, have',back:'go → went | do → did | have → had',tags:['Inglês','verbos'],topicId:t2a}
  ].forEach(f=>d.flashcards.push({id:uid(),...f,createdAt:new Date().toISOString()}));

  // Histórico de pomodoros (14 dias)
  const topicIds=[t1a,t1b,t1c,t1d,t2a,t2b,t2c];
  for(let i=0;i<14;i++){
    const day=new Date();day.setDate(day.getDate()-i);
    const cnt=i===0?6:i===1?4:i===2?5:i===3?0:i===4?3:i===5?6:i===6?4:Math.floor(Math.random()*5)+1;
    for(let j=0;j<cnt;j++){
      const h=new Date(day);h.setHours(Math.floor(Math.random()*12)+8);
      d.pomodoro.push({id:uid(),type:'FOCUS',date:dStr(day),topicId:topicIds[j%topicIds.length],createdAt:h.toISOString()});
    }
  }

  // Sessões de estudo
  for(let i=1;i<=10;i++){
    const day=new Date();day.setDate(day.getDate()-i*2);
    d.sessions.push({id:uid(),title:i%3===0?'Sessão de revisão geral':i%2===0?'Flashcards + Planner':'Foco em código',date:dStr(day),duration:i%2===0?90:120,createdAt:day.toISOString()});
  }

  d.activityLog=Array.from({length:14},(_,i)=>{const d2=new Date();d2.setDate(d2.getDate()-i);return dStr(d2);}).filter((_,i)=>i!==3&&i!==6);
  d.prefs={sound:true,miniWidget:true,focusMins:25,shortMins:5,longMins:15,light:false,notifications:false};
  d.notes={};
  return d;
}


/* ══════════════════════════════════════
   SEED — Dados iniciais do dono
══════════════════════════════════════ */
function seed(){
  if(DB.plans.length)return; // já tem dados, não reaplica seed
  const pid=uid(),m1=uid(),t1=uid();
  DB.plans.push({id:pid,title:'Meu primeiro plano',description:'Clique em + Módulo para começar',color:'#6c8eff',createdAt:new Date().toISOString()});
  DB.modules.push({id:m1,planId:pid,title:'Fundamentos'});
  DB.topics.push({id:t1,moduleId:m1,title:'Meu primeiro tópico'});
  DB.tasks.push({id:uid(),topicId:t1,title:'Criar minha primeira tarefa ✅',priority:'ALTA',mins:5,done:false,doneAt:null,createdAt:new Date().toISOString()});
  DB.user.xp=0;DB.user.level=1;DB.user.streak=0;
  Object.assign(DB.prefs,{sound:true,miniWidget:true,focusMins:25,shortMins:5,longMins:15,light:false,notifications:false});
  save();
}


/* ══════════════════════════════════════
   BOOT — Inicializa o app
══════════════════════════════════════ */
function boot(demoMode){
  if(demoMode){
    DB = buildDemoData();
  } else {
    DB = load(false);
    if(!DB.prefs)DB.prefs={sound:true,miniWidget:true,focusMins:25,shortMins:5,longMins:15,light:false,notifications:false};
    if(!DB.notes)DB.notes={};
    seed();
  }
  if(DB.prefs?.light)document.body.classList.add('light');
  pomoState={phase:'FOCUS',timeLeft:getPD().FOCUS,running:false,cycles:0};
  updateTopbar();updatePomoDisplay();renderDash();
}


/* ══════════════════════════════════════
   ENTRY POINT — Decide o que mostrar
══════════════════════════════════════ */
if(isOwner){
  // Dono acessando via URL ou localStorage
  document.getElementById('landing').style.display='none';
  document.getElementById('app').classList.add('visible');
  readOnly=false;
  boot(false);
} else if(isDemo){
  // Link direto ?mode=demo — pula landing, entra no demo
  document.getElementById('landing').style.display='none';
  document.getElementById('app').classList.add('visible');
  readOnly=true;
  document.getElementById('readonly-banner').classList.add('show');
  boot(true);
} else {
  // Todo mundo mais — mostra landing page
  // Landing já é visível por padrão (sem JS necessário)
  // DB não inicializado ainda — vai inicializar quando o usuário clicar num CTA
}


/* ══════════════════════════════════════
   GERADOR DE PLANO COM IA
   Fluxo: input → API Anthropic → parse → JSON → importar
══════════════════════════════════════ */

// Estado do gerador
let aiOptions = { level: 'iniciante', duration: '1 mes', focus: 'teoria e pratica' };
let aiLastParsed = null; // guarda o plano parseado para importar depois

/** Abre o overlay do gerador de IA. */
function openAIPanel() {
  document.getElementById('ai-overlay').classList.add('open');
  setTimeout(() => document.getElementById('ai-input')?.focus(), 100);
}

/** Fecha o overlay. */
function closeAIPanel() {
  document.getElementById('ai-overlay').classList.remove('open');
  resetAIPanel();
}

/** Reseta o painel ao estado inicial. */
function resetAIPanel() {
  document.getElementById('ai-result').style.display = 'none';
  document.getElementById('ai-loading').style.display = 'none';
  document.getElementById('ai-input-section').style.display = 'flex';
  const btn = document.getElementById('ai-gen-btn');
  if (btn) { btn.disabled = false; document.getElementById('ai-btn-text').textContent = 'Gerar Plano Agora'; }
  aiLastParsed = null;
}

/** Preenche o input com sugestão rápida. */
function fillAIInput(text) {
  const inp = document.getElementById('ai-input');
  if (inp) { inp.value = text; autoResizeAI(inp); }
}

/** Auto-resize do textarea conforme o conteúdo. */
function autoResizeAI(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 160) + 'px';
}

/** Seleciona uma opção (nível, duração, foco). */
function selectAIOption(type, btn) {
  const groupId = { level: 'ai-level-chips', duration: 'ai-duration-chips', focus: 'ai-focus-chips' }[type];
  document.querySelectorAll(`#${groupId} .ai-opt-chip`).forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
  aiOptions[type] = btn.dataset.val;
}

/** Ponto de entrada — chama a API e importa o plano. */
async function generateAIPlan() {
  const input = document.getElementById('ai-input').value.trim();
  if (!input) { showToast('Digite o que quer aprender 📝', 'amber'); return; }

  // Mudar estado para loading
  setAILoading(true);

  try {
    const rawText = await fetchAIPlanFromClaude(input);
    const parsed  = parseAIResponse(rawText);

    if (!parsed || !parsed.modules || parsed.modules.length === 0) {
      showToast('Não consegui estruturar o plano. Tente novamente.', 'amber');
      setAILoading(false);
      return;
    }

    aiLastParsed = parsed;
    showAIPreview(parsed);

  } catch (err) {
    console.error('Erro ao gerar plano:', err);
    showToast('Erro ao conectar com a IA. Verifique sua conexão.', 'red');
    setAILoading(false);
  }
}

/** Regenera chamando a mesma função. */
function regenerateAIPlan() {
  document.getElementById('ai-result').style.display = 'none';
  document.getElementById('ai-input-section').style.display = 'flex';
  aiLastParsed = null;
}

/** Alterna entre loading e input. */
function setAILoading(on) {
  const inputSec = document.getElementById('ai-input-section');
  const loading  = document.getElementById('ai-loading');
  const result   = document.getElementById('ai-result');
  if (on) {
    inputSec.style.display = 'none';
    result.style.display   = 'none';
    loading.style.display  = 'flex';
  } else {
    loading.style.display  = 'none';
    inputSec.style.display = 'flex';
  }
}

/** Mostra o preview do plano gerado antes de importar. */
function showAIPreview(parsed) {
  document.getElementById('ai-loading').style.display = 'none';

  // Escolhe uma cor baseada no título
  const colors = ['#6c8eff','#22d3a0','#a78bfa','#f5a623','#ff6eb4'];
  const color = colors[Math.abs(parsed.title.length) % colors.length];

  // Monta HTML do preview
  let html = `<div class="ai-prev-plan-title">
    <div style="width:10px;height:10px;border-radius:50%;background:${color};flex-shrink:0"></div>
    ${parsed.title}
  </div>`;

  parsed.modules.forEach((mod, mi) => {
    html += `<div class="ai-prev-module">
      <div class="ai-prev-mod-title">
        <div style="width:6px;height:6px;border-radius:50%;background:var(--accent)"></div>
        Módulo ${mi + 1}: ${mod.title}
      </div>`;
    mod.topics.forEach(topic => {
      html += `<div class="ai-prev-topic">
        <div class="ai-prev-topic-name">📌 ${topic.title}</div>`;
      topic.tasks.forEach(task => {
        html += `<div class="ai-prev-task">${task}</div>`;
      });
      html += `</div>`;
    });
    html += `</div>`;
  });

  document.getElementById('ai-result-preview').innerHTML = html;
  document.getElementById('ai-result').style.display = 'flex';
}

/**
 * Importa o plano parseado para o DB usando a função generateStudyPlan.
 * Depois chama mergeImport para integrar ao sistema existente.
 */
function importAIPlan() {
  if (!aiLastParsed) return;

  const json = generateStudyPlan(aiLastParsed.title, aiLastParsed.modules);
  mergeImport(json);

  closeAIPanel();
  goto('planner', document.querySelector('[data-page=planner]'));
  showToast('🚀 Plano criado com sucesso!', 'green');
  launchConfetti();
}


/* ══════════════════════════════════════
   CHAMADA REAL À API DA ANTHROPIC
   Usa o endpoint /v1/messages diretamente
   (sem precisar de chave — funciona no contexto Claude)
══════════════════════════════════════ */
async function fetchAIPlanFromClaude(userInput) {
  const level    = aiOptions.level    || 'iniciante';
  const duration = aiOptions.duration || '1 mês';
  const focus    = aiOptions.focus    || 'teoria e pratica';

  const systemPrompt = `Você é um especialista em criação de planos de estudo personalizados.
Crie um plano de estudos estruturado e detalhado com base no pedido do usuário.

Regras obrigatórias de formato — siga EXATAMENTE:
Plano: [Nome do plano]

Módulo: [Nome do módulo 1]
- Tópico: [Nome do tópico]
  - [tarefa específica e acionável]
  - [tarefa específica e acionável]
- Tópico: [Nome do tópico 2]
  - [tarefa]
  - [tarefa]

Módulo: [Nome do módulo 2]
...

Diretrizes:
- Nível: ${level}
- Duração total: ${duration}
- Foco: ${focus}
- Crie entre 3 e 6 módulos
- Cada módulo deve ter 2 a 4 tópicos
- Cada tópico deve ter 2 a 4 tarefas concretas e acionáveis
- As tarefas devem ser específicas: "Criar um componente Button com props" em vez de "Estudar componentes"
- NÃO escreva introduções, explicações ou textos fora do formato acima
- Responda APENAS com o plano no formato especificado`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: systemPrompt,
      messages: [{ role: 'user', content: userInput }]
    })
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text || '';
}


/* ══════════════════════════════════════
   PARSER — Converte texto da IA → objeto estruturado
══════════════════════════════════════ */
/**
 * Converte o texto retornado pela IA no formato:
 * { title: string, modules: [{ title, topics: [{ title, tasks: [] }] }] }
 */
function parseAIResponse(text) {
  const lines = text.split('\n');

  let title = 'Novo Plano de Estudos';
  const modules = [];
  let currentModule = null;
  let currentTopic  = null;

  lines.forEach(rawLine => {
    const line = rawLine.trim();
    if (!line) return;

    // Título do plano
    if (/^Plano\s*:/i.test(line)) {
      title = line.replace(/^Plano\s*:\s*/i, '').trim();
      return;
    }

    // Novo módulo
    if (/^Módulo\s*:/i.test(line) || /^Module\s*:/i.test(line)) {
      currentTopic = null;
      currentModule = {
        title: line.replace(/^Módulo\s*:\s*/i, '').replace(/^Module\s*:\s*/i, '').trim(),
        topics: []
      };
      modules.push(currentModule);
      return;
    }

    // Novo tópico (linha com "- Tópico:" ou "- Topic:")
    if (/^-\s*Tópico\s*:/i.test(line) || /^-\s*Topic\s*:/i.test(line)) {
      if (!currentModule) {
        // Se não há módulo ainda, cria um genérico
        currentModule = { title: 'Módulo 1', topics: [] };
        modules.push(currentModule);
      }
      currentTopic = {
        title: line.replace(/^-\s*Tópico\s*:\s*/i, '').replace(/^-\s*Topic\s*:\s*/i, '').trim(),
        tasks: []
      };
      currentModule.topics.push(currentTopic);
      return;
    }

    // Tarefa (linha com "-" simples ou "  -")
    if (/^\s*-\s+/.test(rawLine) && currentTopic) {
      const task = line.replace(/^-+\s*/, '').trim();
      if (task && !/^Tópico\s*:/i.test(task)) {
        currentTopic.tasks.push(task);
      }
      return;
    }

    // Linha simples sem prefixo dentro de um tópico = tarefa implícita
    if (currentTopic && line.length > 3 && !line.startsWith('Módulo') && !line.startsWith('Plano')) {
      currentTopic.tasks.push(line);
    }
  });

  // Garante que cada tópico tem pelo menos uma tarefa
  modules.forEach(mod => {
    mod.topics.forEach(topic => {
      if (topic.tasks.length === 0) {
        topic.tasks.push(`Estudar ${topic.title}`);
      }
    });
    if (mod.topics.length === 0) {
      mod.topics.push({ title: 'Fundamentos', tasks: [`Aprender ${mod.title}`] });
    }
  });

  return { title, modules };
}


/* ══════════════════════════════════════
   GERADOR DE JSON — Converte estrutura → formato do DB
══════════════════════════════════════ */
/**
 * Gera o JSON no formato compatível com o mergeImport existente.
 * @param {string} planName - nome do plano
 * @param {Array}  modulesData - [{ title, topics: [{ title, tasks: [] }] }]
 * @returns {Object} { plans, modules, topics, tasks }
 */
function generateStudyPlan(planName, modulesData) {
  const planId = 'plan_' + Date.now();
  const colors = ['#6c8eff','#22d3a0','#a78bfa','#f5a623','#ff6eb4','#ff5f5f'];
  const color  = colors[Math.abs(planName.length) % colors.length];

  const plan = {
    id: planId,
    title: planName,
    description: 'Plano gerado com IA',
    color,
    createdAt: new Date().toISOString()
  };

  const modules = [];
  const topics  = [];
  const tasks   = [];

  modulesData.forEach((mod, mIndex) => {
    // IDs com timestamp + índice para garantir unicidade
    const moduleId = `m_${mIndex}_${Date.now() + mIndex}`;

    modules.push({
      id: moduleId,
      planId,
      title: mod.title,
      createdAt: new Date().toISOString()
    });

    (mod.topics || []).forEach((top, tIndex) => {
      const topicId = `t_${mIndex}_${tIndex}_${Date.now() + tIndex}`;

      topics.push({
        id: topicId,
        moduleId,
        title: top.title,
        createdAt: new Date().toISOString()
      });

      (top.tasks || []).forEach((taskTitle, tkIndex) => {
        // Define prioridade automática: primeiras tarefas são ALTA
        const priority = tkIndex === 0 ? 'ALTA' : tkIndex === 1 ? 'MEDIA' : 'BAIXA';

        tasks.push({
          id: `task_${mIndex}_${tIndex}_${tkIndex}_${Date.now() + tkIndex}`,
          topicId,
          title: taskTitle,
          priority,
          mins: 25,
          done: false,
          doneAt: null,
          createdAt: new Date().toISOString()
        });
      });
    });
  });

  return { plans: [plan], modules, topics, tasks };
}
