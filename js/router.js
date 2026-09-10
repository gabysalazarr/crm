window.App = window.App || {};

App.pages = {
  prospective: App.Companies,
  established: App.Companies,
  archived: App.Archived,
  entrepreneurs: App.Entrepreneurs,
  resources: App.Resources,
  reports: App.Reports,
  import: App.Import,
  lookups: App.Lookups
};

App.navigate = function(page){ location.hash = '#/' + page; };

App.route = function(){
  var hash = location.hash.replace('#/', '') || 'prospective';
  var page = hash.split('/')[0];
  if(!App.pages[page]) page = 'prospective';
  App.state.page = page;

  if(App.pendingSelection){
    App.state.selected = App.pendingSelection.selected;
    App.state.activeSection = App.pendingSelection.activeSection;
    App.pendingSelection = null;
  } else {
    App.state.selected = null;
    App.state.activeSection = null;
  }
  App.state.search = '';

  App.renderNav();
  App.pages[page].render();
};

App.renderNav = function(){
  document.querySelectorAll('.nav-item[data-page]').forEach(function(el){
    el.classList.toggle('active', el.dataset.page === App.state.page);
  });
};

window.addEventListener('hashchange', App.route);
