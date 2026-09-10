window.App = window.App || {};

App.Archived = {
  render: function(){
    var el = document.getElementById('page-content');
    el.innerHTML = '<div class="split-page"><div class="list-panel" id="ar-list-panel"></div><div class="detail-panel" id="ar-detail-panel"></div></div>';
    this.renderList();
    this.renderDetail();
  },

  getItems: function(){
    var search = (App.state.search || '').toLowerCase();
    var companies = App.data.companies.filter(function(c){ return c.status === 'archived'; }).map(function(c){ return {type:'company', id:c.id, name:c.name}; });
    var ents = App.data.entrepreneurs.filter(function(e){ return e.archived; }).map(function(e){ return {type:'entrepreneur', id:e.id, name:e.name}; });
    return companies.concat(ents).filter(function(x){ return !search || x.name.toLowerCase().indexOf(search) > -1; });
  },

  renderList: function(){
    var self = this;
    var panel = document.getElementById('ar-list-panel');
    var items = this.getItems();
    var listHtml = items.length ? items.map(function(x){
      var active = App.state.selected && App.state.selected.type === x.type && App.state.selected.id === x.id;
      return App.listItem({ id:x.type + '-' + x.id, title:x.name, subtitle: x.type === 'company' ? 'Company' : 'Entrepreneur', active:active, statusColor:'var(--slate)' });
    }).join('') : App.emptyState('Nothing archived yet.');

    panel.innerHTML = '<div class="list-header"><div class="list-header-top"><div class="list-title">Archived</div><button class="btn btn-sm btn-outline" id="list-reports-btn">Reports</button></div><input type="text" class="search-input" placeholder="Search archived" value="' + App.escapeHtml(App.state.search || '') + '"></div><div class="list-scroll">' + listHtml + '</div>';
    panel.querySelector('#list-reports-btn').addEventListener('click', function(){ App.navigate('reports'); });
    panel.querySelectorAll('.list-item').forEach(function(item){
      item.addEventListener('click', function(){
        var parts = item.dataset.id.split('-');
        App.state.selected = { type:parts[0], id:parseInt(parts[1], 10) };
        App.state.activeSection = 'reason';
        self.renderList(); self.renderDetail();
      });
    });
    var search = panel.querySelector('.search-input');
    if(search) search.addEventListener('input', function(){ App.state.search = search.value; self.renderList(); });
  },

  getSelected: function(){
    if(!App.state.selected) return null;
    if(App.state.selected.type === 'company') return { record: App.data.companies.find(function(c){ return c.id === App.state.selected.id; }), type:'company' };
    if(App.state.selected.type === 'entrepreneur') return { record: App.data.entrepreneurs.find(function(e){ return e.id === App.state.selected.id; }), type:'entrepreneur' };
    return null;
  },

  renderDetail: function(){
    var self = this;
    var panel = document.getElementById('ar-detail-panel');
    var sel = this.getSelected();
    if(!sel || !sel.record){ panel.innerHTML = App.emptyState('Select an archived record to view it.'); return; }
    var record = sel.record;
    var sections = [{key:'reason', label:'Reason for Archive'}, {key:'existing', label:'Existing Tables'}];
    if(!App.state.activeSection || !sections.find(function(s){ return s.key === App.state.activeSection; })) App.state.activeSection = 'reason';
    var navHtml = sections.map(function(s){ return '<div class="section-item' + (App.state.activeSection === s.key ? ' active' : '') + '" data-section="' + s.key + '">' + s.label + '</div>'; }).join('');

    panel.innerHTML =
      '<div class="detail-header"><div><div class="detail-title">' + App.escapeHtml(record.name) + '</div>' +
      '<div class="detail-status"><span class="status-dot" style="background:var(--slate)"></span>Archived ' + (sel.type === 'company' ? 'Company' : 'Entrepreneur') + '</div></div>' +
      '<div class="detail-actions"><button class="btn btn-outline" id="unarchive-btn">Unarchive</button></div></div>' +
      '<div class="detail-body"><div class="section-nav">' + navHtml + '</div><div class="section-content" id="section-content"></div></div>';

    panel.querySelectorAll('.section-item').forEach(function(s){ s.addEventListener('click', function(){ App.state.activeSection = s.dataset.section; self.renderDetail(); }); });
    panel.querySelector('#unarchive-btn').addEventListener('click', function(){ self.unarchive(record, sel.type); });
    this.renderSection(record, sel.type);
  },

  unarchive: function(record, type){
    if(type === 'company'){
      record.status = 'established';
      App.pendingSelection = { selected:{ type:'company', id:record.id }, activeSection:null };
      location.hash = '#/established';
    } else {
      record.archived = false;
      App.pendingSelection = { selected:{ type:'entrepreneur', id:record.id }, activeSection:'contacts' };
      location.hash = '#/entrepreneurs';
    }
  },

  renderSection: function(record, type){
    var el = document.getElementById('section-content');
    if(App.state.activeSection === 'reason'){
      el.innerHTML = '<div class="field"><div class="field-label">Reason for archive</div><textarea class="field-input" data-field="archiveReason" rows="3">' + App.escapeHtml(record.archiveReason || '') + '</textarea></div>';
      App.bindFields(el, record);
    } else {
      this.renderExisting(record, type, el);
    }
  },

  renderExisting: function(record, type, el){
    var contacts = App.data.contacts.filter(function(c){ return c.parentType === type && c.parentId === record.id; });
    var meetings = App.data.meetings.filter(function(m){ return m.parentType === type && m.parentId === record.id; });
    var html = '<div class="app-block"><div class="section-toolbar-title">Contacts (' + contacts.length + ')</div><div class="table">' +
      (contacts.length ? contacts.map(function(c){ return '<div class="table-row"><span>' + App.escapeHtml(c.name) + (c.role ? ' \u2014 ' + App.escapeHtml(c.role) : '') + '</span><span class="mono">' + App.escapeHtml(c.phone || c.email || '') + '</span></div>'; }).join('') : '<div class="table-row muted">None on file.</div>') +
      '</div></div>' +
      '<div class="app-block"><div class="section-toolbar-title">Meetings (' + meetings.length + ')</div><div class="table">' +
      (meetings.length ? meetings.map(function(m){ return '<div class="table-row"><span>' + App.escapeHtml(m.title) + '</span><span class="mono">' + App.escapeHtml(m.date) + '</span></div>'; }).join('') : '<div class="table-row muted">None on file.</div>') +
      '</div></div>';
    if(type === 'company'){
      var inv = App.data.investmentSchedules.filter(function(i){ return i.companyId === record.id; });
      var jobs = App.data.jobs.filter(function(j){ return j.companyId === record.id; });
      html += '<div class="app-block"><div class="section-toolbar-title">Investment schedule (' + inv.length + ')</div><div class="table">' +
        (inv.length ? inv.map(function(r){ return '<div class="table-row"><span>Year ' + r.year + ' \u2013 ' + App.escapeHtml(r.category) + '</span><span class="mono">' + App.formatCurrency(r.amount) + '</span></div>'; }).join('') : '<div class="table-row muted">None on file.</div>') +
        '</div></div><div class="app-block"><div class="section-toolbar-title">Jobs (' + jobs.length + ')</div><div class="table">' +
        (jobs.length ? jobs.map(function(r){ return '<div class="table-row"><span>' + App.escapeHtml(r.jobTitle) + '</span><span class="mono">' + r.count + '</span></div>'; }).join('') : '<div class="table-row muted">None on file.</div>') +
        '</div></div>';
    }
    el.innerHTML = html;
  }
};
