(function(){
  const toggle=document.querySelector('.nav-toggle');
  const menu=document.querySelector('.mobile-menu');
  if(toggle&&menu){toggle.addEventListener('click',()=>{const open=menu.classList.toggle('open');toggle.setAttribute('aria-expanded',String(open));});}
  window.addEventListener('scroll',()=>document.getElementById('main-nav')?.classList.toggle('scrolled',window.scrollY>50),{passive:true});
})();
