window.App = window.App || {};

document.addEventListener('DOMContentLoaded', function(){
  document.querySelectorAll('.nav-item[data-page]').forEach(function(el){
    el.addEventListener('click', function(){ App.navigate(el.dataset.page); });
  });

  var settingsToggle = document.getElementById('settings-toggle');
  var settingsMenu = document.getElementById('settings-menu');
  if(settingsToggle && settingsMenu){
    settingsToggle.addEventListener('click', function(ev){ ev.stopPropagation(); settingsMenu.classList.toggle('open'); });
    document.addEventListener('click', function(){ settingsMenu.classList.remove('open'); });
  }
  document.querySelectorAll('.dropdown-item[data-page]').forEach(function(el){
    el.addEventListener('click', function(){ App.navigate(el.dataset.page); });
  });

  App.route();
});
