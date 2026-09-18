(function(){
  const toggle=document.querySelector('.nav-toggle');
  const menu=document.querySelector('.mobile-menu');
  if(toggle&&menu){toggle.addEventListener('click',()=>{const open=menu.classList.toggle('open');toggle.setAttribute('aria-expanded',String(open));});}
  window.addEventListener('scroll',()=>document.getElementById('main-nav')?.classList.toggle('scrolled',window.scrollY>50),{passive:true});
})();

function getCookiePreference(){
  try{return localStorage.getItem('cookies_accepted')}catch{return null}
}
function isCookieConsentCurrent(){
  try{return localStorage.getItem('cookies_consent_version') === window.__COOKIE_CONSENT_VERSION}catch{return false}
}
function getCookieLauncherState(){
  try{return localStorage.getItem('cookies_launcher_visible') === 'true'}catch{return false}
}
function setCookieLauncherState(value){
  try{localStorage.setItem('cookies_launcher_visible', value ? 'true' : 'false')}catch{}
}
function showCookieLauncher(){
  const launcher = document.getElementById('cookie-launcher');
  if(!launcher) return;
  launcher.style.display = 'inline-flex';
  launcher.setAttribute('aria-hidden', 'false');
  launcher.classList.add('visible');
}
function hideCookieLauncher(){
  const launcher = document.getElementById('cookie-launcher');
  if(!launcher) return;
  launcher.classList.remove('visible');
  launcher.setAttribute('aria-hidden', 'true');
}
function hideCookieBanner(){
  const banner = document.getElementById('cookie-banner');
  if(!banner) return;
  banner.classList.remove('visible');
  banner.classList.add('hiding');
  setTimeout(() => {
    if(banner.classList.contains('hiding')) banner.style.display = 'none';
  }, 420);
}
function refreshConsentUI(){
  const btn = document.getElementById('consent-toggle-analytics');
  if(!btn) return;
  const on = getCookiePreference() === 'all' && isCookieConsentCurrent();
  btn.textContent = on ? 'Analytics — aan (klik om uit te zetten)' : 'Analytics — uit (klik om aan te zetten)';
  btn.className = on ? 'btn btn-primary' : 'btn btn-ghost';
  btn.setAttribute('aria-pressed', on ? 'true' : 'false');
}
function toggleAnalyticsConsent(){
  const on = getCookiePreference() === 'all' && isCookieConsentCurrent();
  setCookiePreference(on ? 'minimal' : 'all');
}
function setCookiePreference(value){
  try{localStorage.setItem('cookies_accepted', value)}catch{}
  try{localStorage.setItem('cookies_consent_version', window.__COOKIE_CONSENT_VERSION)}catch{}
  if(value === 'all' && typeof window.__loadGtag === 'function'){
    window.__loadGtag();
  } else if(typeof gtag === 'function'){
    gtag('consent', 'update', { 'analytics_storage': 'denied' });
  }
  setCookieLauncherState(true);
  showCookieLauncher();
  hideCookieBanner();
  refreshConsentUI();
}
function closeCookieBannerAsMinimal(){
  try{localStorage.setItem('cookies_accepted', 'minimal')}catch{}
  try{localStorage.setItem('cookies_consent_version', window.__COOKIE_CONSENT_VERSION)}catch{}
  if(typeof gtag === 'function'){
    gtag('consent', 'update', { 'analytics_storage': 'denied' });
  }
  setCookieLauncherState(true);
  showCookieLauncher();
  hideCookieBanner();
  refreshConsentUI();
}
function reopenCookieBanner(){
  const banner = document.getElementById('cookie-banner');
  if(!banner) return;
  setCookieLauncherState(false);
  hideCookieLauncher();
  banner.style.display = 'block';
  banner.classList.remove('hiding');
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      banner.classList.add('visible');
    });
  });
}
function initCookieBanner(){
  const banner = document.getElementById('cookie-banner');
  if(!banner) return;
  if(getCookieLauncherState()) showCookieLauncher();
  refreshConsentUI();
  if(getCookiePreference() && isCookieConsentCurrent()){
    banner.style.display = 'none';
    return;
  }
  banner.style.display = 'block';
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      banner.classList.add('visible');
    });
  });
}
initCookieBanner();
