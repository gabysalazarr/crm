window.App = window.App || {};

App.Lookups = {
  activeTab: 'companyTypes',
  tabs: [
    {key:'companyTypes', label:'Company Types'},
    {key:'categories', label:'Categories'},
    {key:'naicsCodes', label:'NAICS Codes'},
    {key:'users', label:'Users'}
  ],

  render: function(){
    var self = this;
    var el = document.getElementById('page-content');
    var tabsHtml = this.tabs.map(function(t){
      return '<span class="status-tab' + (self.activeTab === t.key ? ' active' : '') + '" data-tab="' + t.key + '">' + t.label + '</span>';
    }).join('');
    var items = App.data.lookups[this.activeTab];
    var isNaics = this.activeTab === 'naicsCodes';
    var rows = items.map(function(item, idx){
      var label = isNaics ? item.code + ' \u2013 ' + App.escapeHtml(item.label) : App.escapeHtml(item);
      return '<div class="table-row"><span>' + label + '</span><button class="btn btn-sm btn-outline" data-idx="' + idx + '">Remove</button></div>';
    }).join('');

    el.innerHTML =
      '<div class="detail-panel" style="width:100%;">' +
        '<div class="detail-header"><div><div class="detail-title">Manage Lookups</div></div></div>' +
        '<div class="list-header" style="border-bottom:0.5px solid var(--line);"><div class="status-tabs">' + tabsHtml + '</div></div>' +
        '<div class="detail-body-full">' +
          '<div class="section-toolbar-title">' + this.tabs.find(function(t){ return t.key === self.activeTab; }).label + '</div>' +
          '<div class="table" style="margin:8px 0;">' + (rows || '<div class="table-row muted">No entries yet.</div>') + '</div>' +
          '<div id="lookup-add-slot"></div>' +
        '</div>' +
      '</div>';

    el.querySelectorAll('.status-tab').forEach(function(t){ t.addEventListener('click', function(){ self.activeTab = t.dataset.tab; self.render(); }); });
    el.querySelectorAll('[data-idx]').forEach(function(btn){
      btn.addEventListener('click', function(){ App.data.lookups[self.activeTab].splice(parseInt(btn.dataset.idx, 10), 1); self.render(); });
    });

    var fields = isNaics ? [{key:'code', placeholder:'NAICS code'}, {key:'label', placeholder:'Label'}] : [{key:'value', placeholder:'New value'}];
    App.addRow(el.querySelector('#lookup-add-slot'), fields, 'Add', function(d){
      if(isNaics){
        if(!d.code) return;
        App.data.lookups.naicsCodes.push({ code:d.code, label:d.label || '' });
      } else {
        if(!d.value) return;
        App.data.lookups[self.activeTab].push(d.value);
      }
      self.render();
    });
  }
};
