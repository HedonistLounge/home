
const frame = document.getElementById('playerFrame');
const overlay = document.getElementById('loading');
const refreshBtn = document.getElementById('refreshBtn');

function hideOverlaySoon(){
  setTimeout(()=> overlay.style.opacity = '0', 150);
  setTimeout(()=> overlay.style.display = 'none', 350);
}

frame.addEventListener('load', hideOverlaySoon);
refreshBtn.addEventListener('click', ()=>{
  overlay.style.display = 'flex';
  overlay.style.opacity = '1';
  const src = frame.getAttribute('src');
  frame.setAttribute('src', src.split('?')[0] + '?t=' + Date.now());
});
