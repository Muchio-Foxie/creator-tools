/* boot.js — tiny bootstrap with no inline code */
(function(){
  function $(id){return document.getElementById(id)}
  var badge = $('js-badge'), logEl = $('log');
  function setBadge(state, msg){
    badge && badge.classList.remove('ok','err');
    if(badge && state==='ok') badge.classList.add('ok');
    if(badge && state==='err') badge.classList.add('err');
    if(badge) badge.textContent = 'JS: ' + msg;
  }
  window.addEventListener('error', function(e){
    if(logEl){ logEl.textContent += (e.message + '\n'); }
    setBadge('err','有錯誤（boot）');
  });
  setBadge('ok','載入中…');
  // Basic tab switch binding (so至少能切頁)
  document.querySelectorAll('.tab').forEach(function(btn){
    btn.addEventListener('click', function(){
      document.querySelectorAll('.tab').forEach(function(b){ b.setAttribute('aria-selected','false'); });
      btn.setAttribute('aria-selected','true');
      var tab = btn.getAttribute('data-tab');
      $('panel-char').hidden = (tab!=='char');
      $('panel-commission').hidden = (tab!=='commission');
      $('panel-settings').hidden = (tab!=='settings');
    });
  });
})();