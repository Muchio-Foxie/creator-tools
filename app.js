(function(){
  function $(id){return document.getElementById(id)}
  var badge = $('badge');
  function setBadge(msg){ if(badge) badge.textContent = 'JS：' + msg; }

  // 全域錯誤 → 顯示在徽章上
  window.addEventListener('error', function(e){
    setBadge('錯誤：' + (e.message || 'unknown'));
  });

  function draw(){
    var cv = $('cv');
    var ctx = cv && cv.getContext && cv.getContext('2d');
    if(!ctx){ setBadge('getContext 失敗（Canvas 被擋）'); return; }
    ctx.clearRect(0,0,cv.width,cv.height);
    ctx.fillStyle = '#2244aa';
    ctx.fillRect(20,20,200,120);
    ctx.fillStyle = '#fff';
    ctx.font = '16px system-ui';
    ctx.fillText('Canvas OK at ' + new Date().toLocaleTimeString(), 28, 60);
    setBadge('運作中');
  }

  function setup(){
    setBadge('載入完成');
    var btn = $('btn');
    if(btn) btn.addEventListener('click', draw);
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', setup);
  }else{
    setup();
  }
})();
