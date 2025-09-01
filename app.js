/* app.js — v0.2.4 */
(function(){
  function $(id){return document.getElementById(id)}
  var badge = $('js-badge'), logEl = $('log');
  function setBadge(state, msg){
    if(!badge) return;
    badge.classList.remove('ok','err');
    if(state==='ok') badge.classList.add('ok');
    if(state==='err') badge.classList.add('err');
    badge.textContent = 'JS: ' + msg;
  }
  function log(s){ if(logEl){ logEl.textContent += (s + '\n'); setBadge('err','有錯誤（app）'); } }

  window.addEventListener('error', function(e){
    log('GlobalError: '+ e.message + ' @ ' + (e.filename||'app') + ':' + (e.lineno||0));
  });

  function rr(ctx,x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  function setup(){
    setBadge('ok','運作中');
    // 診斷
    var diag = $('diag');
    if(diag){
      try{
        localStorage.setItem('_t','1'); localStorage.removeItem('_t'); var l='OK';
      }catch(e){ var l='BLOCKED' }
      diag.textContent = [
        'UA: ' + navigator.userAgent,
        'localStorage: ' + l
      ].join('\n');
    }

    // 綁定角色卡按鈕
    bind('btn-render', renderCard);
    bind('btn-download', downloadCard);
    bind('btn-reset', resetCard);
    bind('btn-save', saveCard);
    bind('btn-load', loadSelected);
    bind('btn-del-card', deleteSelected);
    // 委託
    bind('btn-add-job', addJob);
    bind('btn-export', exportJSON);
    bind('btn-import', function(){ $('importFile').click(); });
    $('importFile') && $('importFile').addEventListener('change', importJSON);
    bind('btn-public', generatePublic);
    bind('btn-clear', function(){ localStorage.removeItem('cards_v2'); localStorage.removeItem('jobs_v2'); refreshCardList(); drawJobs(); log('已清除本機資料'); });

    // 即時套用
    $('theme') && $('theme').addEventListener('change', renderCard);
    $('titleSize') && $('titleSize').addEventListener('input', renderCard);

    try{ renderCard(); refreshCardList(); drawJobs(); }catch(e){ log('Init Error: '+ e.message); }
  }

  function bind(id, fn){ var el=$(id); if(el) el.addEventListener('click', fn); }

  // === 角色卡 ===
  var themes = {
    midnight:{bg:'#0b1024',grad1:'#12204a',grad2:'#09122a',accent:'#7aa2ff'},
    sunset:{bg:'#1a1010',grad1:'#6b2b10',grad2:'#2b0f0f',accent:'#ffd166'},
    forest:{bg:'#0e1712',grad1:'#1d3a2a',grad2:'#0a120d',accent:'#7bdcb5'},
    rose:{bg:'#140e16',grad1:'#3a2142',grad2:'#110912',accent:'#ffb3d9'}
  };
  var cv, ctx;
  function ensureCanvas(){ if(!cv){ cv=$('cardCanvas'); ctx=cv.getContext('2d'); } }
  function get(id){ var el=$(id); return el?el.value:''; }
  function set(id,v){ var el=$(id); if(el) el.value=v||''; }

  function wrap(ctx, text,x,y,maxWidth,lineHeight){
    var words = (text||'').split(/\s+/), line='';
    for(var n=0;n<words.length;n++){
      var test = line + words[n] + ' ';
      if(ctx.measureText(test).width > maxWidth && n>0){ ctx.fillText(line, x, y); line = words[n] + ' '; y += lineHeight; }
      else { line = test; }
    }
    ctx.fillText(line, x, y);
  }
  function section(ctx,x,y,title,content,maxW,lineH){
    ctx.fillStyle='#7aa2ff'; ctx.font='600 16px system-ui'; ctx.fillText(title,x,y);
    ctx.fillStyle='#e6e9f2'; ctx.font='14px system-ui';
    wrap(ctx, content||'', x, y+24, maxW, lineH);
  }
  function pill(ctx,text,x,y){
    var pad=10; ctx.font='12px system-ui'; var w=ctx.measureText(text).width+pad*2;
    ctx.fillStyle='rgba(255,255,255,.08)'; rr(ctx,x,y-16,w,24,12); ctx.fill();
    ctx.fillStyle='#d7dcf0'; ctx.fillText(text,x+pad,y);
  }
  function swatch(ctx,x,y,col){
    ctx.fillStyle=col||'#999'; ctx.beginPath(); ctx.arc(x+18,y+18,18,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,.2)'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(x+18,y+18,18,0,Math.PI*2); ctx.stroke();
  }

  function renderCard(){
    try{
      ensureCanvas();
      var themeKey = ($('theme')||{}).value || 'midnight';
      var t = themes[themeKey];
      var titleSize = parseInt(get('titleSize')||'44',10);

      var name = get('c-name') || '角色名稱';
      var alias = get('c-alias');
      var age = get('c-age');
      var pron = get('c-pron');
      var traits = (get('c-traits')||'').split(',');
      var colors = (get('c-colors')||'').split(',');
      var looks = get('c-looks');
      var voice = get('c-voice');
      var must = get('c-must');
      var mistakes = get('c-mistakes');
      var nope = get('c-nope');

      var w=cv.width,h=cv.height;
      var g=ctx.createLinearGradient(0,0,w,h); g.addColorStop(0,t.grad1); g.addColorStop(1,t.grad2);
      ctx.fillStyle=g; ctx.fillRect(0,0,w,h);
      ctx.strokeStyle='rgba(255,255,255,0.15)'; ctx.lineWidth=4; rr(ctx,20,20,w-40,h-40,24); ctx.stroke();

      ctx.fillStyle='#e6e9f2'; ctx.font='700 '+titleSize+'px system-ui'; ctx.fillText(name, 48, 96);
      ctx.fillStyle=t.accent; ctx.font='600 18px system-ui'; ctx.fillText(alias, 52, 126);

      ctx.fillStyle='#aab0c0'; ctx.font='14px system-ui';
      ctx.fillText('年齡/種族： '+ (age||''), 52, 156);
      ctx.fillText('代名詞： '+ (pron||''), 300, 156);

      var x=48,y=188;
      for(var i=0;i<traits.length;i++){ var tr=(traits[i]||'').trim(); if(!tr) continue; pill(ctx,tr,x,y); x+=ctx.measureText(tr).width+40; if(x> w-200){ x=48; y+=28; } }

      y+=40; x=48;
      for(var j=0;j<Math.min(colors.length,6);j++){ var col=(colors[j]||'').trim(); if(!col) continue; swatch(ctx,x,y,col); x+=60; }
      ctx.fillStyle='#aab0c0'; ctx.font='12px system-ui'; ctx.fillText('代表色',48,y+70);

      section(ctx,48,y+100,'外觀',looks, w-96, 16);
      section(ctx,48,y+300,'語氣/口頭禪',voice, w-96, 16);
      section(ctx,48,y+460,'不可忽略特徵',must, w-96, 16);
      section(ctx,48,y+620,'常被畫錯',mistakes, w-96, 16);
      section(ctx,48,y+780,'避雷事項',nope, w-96, 16);
    }catch(e){ log('renderCard Error: '+ e.message); }
  }
  function downloadCard(){
    try{
      ensureCanvas();
      var link = document.createElement('a');
      link.download = (get('c-name') || 'character') + '_card.png';
      link.href = cv.toDataURL('image/png'); link.click();
    }catch(e){ log('downloadCard Error: '+ e.message); }
  }
  function resetCard(){
    ['c-name','c-alias','c-age','c-pron','c-traits','c-colors','c-looks','c-voice','c-must','c-mistakes','c-nope']
      .forEach(function(id){ set(id,''); });
    renderCard();
  }
  window.renderCard = renderCard;
  window.downloadCard = downloadCard;
  window.resetCard = resetCard;

  function getCards(){ try{return JSON.parse(localStorage.getItem('cards_v2')||'[]')}catch(_){return []} }
  function setCards(a){ localStorage.setItem('cards_v2', JSON.stringify(a||[])); }
  function refreshCardList(){
    var sel = $('cardList'); if(!sel) return; sel.innerHTML='';
    var arr=getCards(); for(var i=0;i<arr.length;i++){ var c=arr[i]; var opt=document.createElement('option'); opt.value=i; opt.textContent=(c.name||'未命名'); sel.appendChild(opt); }
  }
  function saveCard(){
    var obj = { name:get('c-name'), alias:get('c-alias'), age:get('c-age'), pron:get('c-pron'),
      traits:get('c-traits'), colors:get('c-colors'), looks:get('c-looks'), voice:get('c-voice'),
      must:get('c-must'), mistakes:get('c-mistakes'), nope:get('c-nope'),
      theme:get('theme'), titleSize:get('titleSize') };
    var arr=getCards(); arr.push(obj); setCards(arr); refreshCardList();
  }
  function loadSelected(){
    var sel=$('cardList'); if(!sel) return;
    var idx=parseInt(sel.value||'-1',10); var arr=getCards(); var c=arr[idx]; if(!c) return;
    set('c-name',c.name); set('c-alias',c.alias); set('c-age',c.age); set('c-pron',c.pron);
    set('c-traits',c.traits); set('c-colors',c.colors); set('c-looks',c.looks); set('c-voice',c.voice);
    set('c-must',c.must); set('c-mistakes',c.mistakes); set('c-nope',c.nope);
    var themeEl=$('theme'); if(themeEl) themeEl.value=c.theme||'midnight';
    var titleEl=$('titleSize'); if(titleEl) titleEl.value=c.titleSize||44;
    renderCard();
  }
  function deleteSelected(){
    var sel=$('cardList'); if(!sel) return;
    var idx=parseInt(sel.value||'-1',10); if(isNaN(idx)) return;
    var arr=getCards(); arr.splice(idx,1); setCards(arr); refreshCardList();
  }
  window.refreshCardList=refreshCardList;
  window.saveCard=saveCard;
  window.loadSelected=loadSelected;
  window.deleteSelected=deleteSelected;

  // 排單
  var jobListEl;
  function getJobs(){ try{return JSON.parse(localStorage.getItem('jobs_v2')||'[]')}catch(_){return []} }
  function setJobs(a){ localStorage.setItem('jobs_v2', JSON.stringify(a||[])); }
  function uniq(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,7); }
  function esc(s){ return (s||'').replace(/[&<>]/g, function(m){ return {'&':'&amp;','<':'&lt;','>':'&gt;'}[m]; }); }

  function drawJobs(){
    if(!jobListEl) jobListEl=$('jobList');
    var arr=getJobs(); jobListEl.innerHTML='';
    if(arr.length===0){ var d=document.createElement('div'); d.className='hint'; d.textContent='目前沒有委託，新增一筆吧！'; jobListEl.appendChild(d); return; }
    for(var i=0;i<arr.length;i++){
      var job=arr[i];
      var row=document.createElement('div'); row.className='item';
      var meta=document.createElement('div'); meta.className='meta';
      var t1=document.createElement('div'); t1.innerHTML='<b>'+esc(job.client||'委託人')+'</b> — '+esc(job.desc||'未填寫');
      var badgeClass='status-'+(job.status||'Queued');
      var t2=document.createElement('div'); t2.innerHTML='狀態： <span class="pill '+badgeClass+'">'+esc(job.status||'Queued')+'</span>　金額：NT$ '+(job.price||0)+'　期限：'+esc(job.due||'—');
      var t3=document.createElement('div'); t3.className='hint'; t3.textContent=job.notes||'';
      meta.appendChild(t1); meta.appendChild(t2); meta.appendChild(t3);
      var acts=document.createElement('div'); acts.className='acts';
      function mk(txt,fn,cls){ var b=document.createElement('button'); b.className='btn'+(cls?' '+cls:''); b.textContent=txt; b.addEventListener('click',fn); return b; }
      acts.appendChild(mk('編輯', (function(id){return function(){editJob(id);};})(job.id)));
      acts.appendChild(mk('刪除', (function(id){return function(){delJob(id);};})(job.id), 'bad'));
      acts.appendChild(mk('上移', (function(id){return function(){moveJob(id,-1);};})(job.id)));
      acts.appendChild(mk('下移', (function(id){return function(){moveJob(id,1);};})(job.id)));
      row.appendChild(meta); row.appendChild(acts); jobListEl.appendChild(row);
    }
  }
  function addJob(){
    var job={ id:uniq(), client:get('m-client'), desc:get('m-desc'),
      price:parseInt(get('m-price')||'0',10), status:get('m-status'), start:get('m-start'),
      due:get('m-due'), ref:get('m-ref'), invoice:get('m-invoice'), notes:get('m-notes') };
    var arr=getJobs(); arr.unshift(job); setJobs(arr); drawJobs(); clearJobForm();
  }
  function clearJobForm(){ ['m-client','m-desc','m-price','m-start','m-due','m-ref','m-invoice','m-notes'].forEach(function(id){ set(id,''); }); var s=$('m-status'); if(s) s.value='Queued'; }
  function editJob(id){
    var arr=getJobs(); var idx=-1; for(var i=0;i<arr.length;i++){ if(arr[i].id===id){ idx=i; break; } }
    if(idx<0) return; var j=arr[idx];
    set('m-client',j.client); set('m-desc',j.desc); set('m-price',j.price);
    var se=$('m-status'); if(se) se.value=j.status;
    set('m-start',j.start); set('m-due',j.due);
    set('m-ref',j.ref); set('m-invoice',j.invoice); set('m-notes',j.notes);
    arr.splice(idx,1); setJobs(arr); drawJobs();
  }
  function delJob(id){ var arr=getJobs().filter(function(j){return j.id!==id}); setJobs(arr); drawJobs(); }
  function moveJob(id,dir){
    var arr=getJobs(); var idx=-1; for(var i=0;i<arr.length;i++){ if(arr[i].id===id){ idx=i; break; } }
    var ni=idx+dir; if(idx<0||ni<0||ni>=arr.length) return; var it=arr.splice(idx,1)[0]; arr.splice(ni,0,it); setJobs(arr); drawJobs();
  }
  function exportJSON(){
    try{
      var data={cards:getCards(), jobs:getJobs()};
      var blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
      var a=document.createElement('a'); a.download='creator_tools_backup_v0_2_4.json'; a.href=URL.createObjectURL(blob); a.click();
    }catch(e){ log('exportJSON Error: '+ e.message); }
  }
  function importJSON(ev){
    var file=ev.target.files[0]; if(!file) return;
    var reader=new FileReader();
    reader.onload=function(){
      try{
        var data=JSON.parse(reader.result||'{}');
        if(data.cards) localStorage.setItem('cards_v2', JSON.stringify(data.cards));
        if(data.jobs) localStorage.setItem('jobs_v2', JSON.stringify(data.jobs));
        refreshCardList(); drawJobs();
      }catch(e){ log('匯入失敗：'+ e.message); }
    };
    reader.readAsText(file);
  }
  function generatePublic(){
    try{
      var includePrice=$('pub-price').checked;
      var includeNotes=$('pub-notes').checked;
      var includeLinks=$('pub-links').checked;
      var data=getJobs();
      var html='<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>委託進度追蹤</title>';
      html+='<style>body{font-family:ui-sans-serif,system-ui,\\'Noto Sans TC\\';background:#0f1320;color:#e6e9f2;margin:0;padding:20px}.wrap{max-width:900px;margin:0 auto}h1{font-size:22px;margin:0 0 10px}.hint{color:#aab0c0;font-size:12px;margin-bottom:12px}.item{border:1px solid #23305a;border-radius:12px;padding:10px;margin:8px 0;background:#0e1430}.pill{padding:4px 8px;border-radius:999px;font-weight:700;font-size:12px;display:inline-block;margin-left:6px}.status-Queued{background:#2b335a;color:#b8c0ff}.status-Sketch{background:#233a2e;color:#b7f5c6}.status-WIP{background:#3c2d0f;color:#ffdca8}.status-Review{background:#3f2142;color:#ffc5f3}.status-Final{background:#213b45;color:#b8f4ff}.status-Delivered{background:#233a2e;color:#b7f5c6}.status-OnHold{background:#3a3823;color:#fff0a8}.status-Canceled{background:#402020;color:#ffb3b3}a{color:#7aa2ff}</style>';
      html+='<div class="wrap"><h1>委託進度追蹤</h1><div class="hint">最後更新：'+ new Date().toLocaleString() +'</div>';
      for(var i=0;i<data.length;i++){
        var j=data[i];
        html+='<div class="item"><div><b>'+esc(j.client||'委託人')+'</b> — '+esc(j.desc||'未填寫')+' <span class="pill status-'+esc(j.status||'Queued')+'">'+esc(j.status||'Queued')+'</span></div>';
        html+='<div style="font-size:14px;margin-top:4px">期限：'+esc(j.due||'—')+'　開始：'+esc(j.start||'—')+(includePrice?('　金額：NT$ '+esc(String(j.price||0))):'')+'</div>';
        if(includeLinks && (j.ref||j.invoice)){
          html+='<div style="font-size:14px;margin-top:2px">';
          if(j.ref){ html+='參考：<a href="'+(j.ref||'')+'" target="_blank">連結</a>　'; }
          if(j.invoice){ html+='金流：<a href="'+(j.invoice||'')+'" target="_blank">連結</a>'; }
          html+='</div>';
        }
        if(includeNotes && j.notes){ html+='<div style="color:#aab0c0;font-size:12px;margin-top:6px)">'+esc(j.notes)+'</div>'; }
        html+='</div>';
      }
      html+='<div class="hint" style="margin-top:12px">Powered by 角色卡 & 委託排單（離線版）</div></div>';
      var blob=new Blob([html],{type:'text/html'});
      var a=document.createElement('a'); a.download='commission_status.html'; a.href=URL.createObjectURL(blob); a.click();
    }catch(e){ log('generatePublic Error: '+ e.message); }
  }
  window.refreshCardList=refreshCardList;
  window.saveCard=saveCard;
  window.loadSelected=loadSelected;
  window.deleteSelected=deleteSelected;
  window.addJob=addJob;
  window.drawJobs=drawJobs;
  window.exportJSON=exportJSON;
  window.importJSON=importJSON;
  window.generatePublic=generatePublic;

  document.addEventListener('DOMContentLoaded', setup);
})();