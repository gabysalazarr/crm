window.App = window.App || {};

App.Entrepreneurs = {
  render: function(){
    var el = document.getElementById('page-content');
    el.innerHTML = '<div class="split-page"><div class="list-panel" id="en-list-panel"></div><div class="detail-panel" id="en-detail-panel"></div></div>';
    this.renderList();
    this.renderDetail();
  },

  getFiltered: function(){
    var search = (App.state.search || '').toLowerCase();
    return App.data.entrepreneurs.filter(function(e){ return !e.transitioned && !e.archived && (!search || e.name.toLowerCase().indexOf(search) > -1); });
  },

  renderList: function(){
    var self = this;
    var panel = document.getElementById('en-list-panel');
    var list = this.getFiltered();
    var listHtml = list.length ? list.map(function(e){
      var primary = App.data.contacts.find(function(c){ return c.parentType === 'entrepreneur' && c.parentId === e.id && c.primary; });
      return App.listItem({ id:e.id, title:e.name, subtitle: primary ? primary.phone : '', active: App.state.selected && App.state.selected.type === 'entrepreneur' && App.state.selected.id === e.id, statusColor:'var(--brass)' });
    }).join('') : App.emptyState('No entrepreneurs yet.');

    panel.innerHTML =
      '<div class="list-header"><div class="list-header-top"><div class="list-title">Entrepreneurs</div><button class="btn btn-sm btn-outline" id="list-reports-btn">Reports</button></div>' +
      '<input type="text" class="search-input" placeholder="Search entrepreneurs" value="' + App.escapeHtml(App.state.search || '') + '"></div>' +
      '<div class="list-scroll">' + listHtml + '</div>' +
      '<div class="list-footer" id="new-en-slot"></div>';

    panel.querySelectorAll('.list-item').forEach(function(item){ item.addEventListener('click', function(){ self.select(parseInt(item.dataset.id, 10)); }); });
    var search = panel.querySelector('.search-input');
    if(search) search.addEventListener('input', function(){ App.state.search = search.value; self.renderList(); });
    panel.querySelector('#list-reports-btn').addEventListener('click', function(){ App.navigate('reports'); });

    App.addRow(panel.querySelector('#new-en-slot'), [{key:'name', placeholder:'Entrepreneur name'}], 'New entrepreneur', function(d){
      if(!d.name) return;
      var id = App.nextId(App.data.entrepreneurs);
      App.data.entrepreneurs.push({ id:id, name:d.name, notes:'', archived:false });
      App.data.contacts.push({ id:App.nextId(App.data.contacts), parentType:'entrepreneur', parentId:id, name:d.name, role:'', phone:'', email:'', primary:true });
      self.select(id);
    });
  },

  select: function(id){
    App.state.selected = { type:'entrepreneur', id:id };
    App.state.activeSection = 'meetings';
    this.renderList(); this.renderDetail();
  },

  getSelected: function(){
    if(!App.state.selected || App.state.selected.type !== 'entrepreneur') return null;
    return App.data.entrepreneurs.find(function(e){ return e.id === App.state.selected.id; });
  },

  renderDetail: function(){
    var self = this;
    var panel = document.getElementById('en-detail-panel');
    var e = this.getSelected();
    if(!e){ panel.innerHTML = App.emptyState('Select an entrepreneur to view their record.'); return; }

    var sections = [{key:'meetings', label:'Meetings'}, {key:'contacts', label:'Contacts'}];
    if(!App.state.activeSection || !sections.find(function(s){ return s.key === App.state.activeSection; })) App.state.activeSection = 'meetings';
    var navHtml = sections.map(function(s){ return '<div class="section-item' + (App.state.activeSection === s.key ? ' active' : '') + '" data-section="' + s.key + '">' + s.label + '</div>'; }).join('');

    var companyOptions = App.data.companies.filter(function(c){ return c.status !== 'archived'; })
      .map(function(c){ return '<option value="' + c.id + '">' + App.escapeHtml(c.name) + ' (' + App.statusMeta[c.status].label + ')</option>'; }).join('');

    panel.innerHTML =
      '<div class="detail-header"><div><input class="detail-title-input" data-field="name" value="' + App.escapeHtml(e.name) + '"><div class="detail-status">Entrepreneur</div></div>' +
      '<div class="detail-actions">' +
        '<button class="btn btn-outline" id="transfer-toggle">Transfer</button>' +
        '<div class="inline-form" id="transfer-form">' +
          '<select id="trans-mode" class="inline-select"><option value="new">New Company</option><option value="existing">Existing Company</option><option value="archive">Archive</option></select>' +
          '<select id="trans-existing" class="inline-select" style="display:none;">' + companyOptions + '</select>' +
          '<button class="btn btn-sm btn-primary" id="transfer-confirm">Confirm</button>' +
        '</div>' +
      '</div></div>' +
      '<div class="detail-body"><div class="section-nav">' + navHtml + '</div><div class="section-content" id="section-content"></div></div>';

    App.bindFields(panel.querySelector('.detail-header'), e);
    panel.querySelectorAll('.section-item').forEach(function(s){ s.addEventListener('click', function(){ App.state.activeSection = s.dataset.section; self.renderDetail(); }); });

    App.toggleForm(panel.querySelector('#transfer-toggle'), panel.querySelector('#transfer-form'));
    var modeSelect = panel.querySelector('#trans-mode');
    var existingSelect = panel.querySelector('#trans-existing');
    modeSelect.addEventListener('change', function(){ existingSelect.style.display = modeSelect.value === 'existing' ? 'inline-block' : 'none'; });
    panel.querySelector('#transfer-confirm').addEventListener('click', function(){ self.handleTransition(e, modeSelect.value, existingSelect.value); });

    this.renderSection(e);
  },

  renderSection: function(e){
    var el = document.getElementById('section-content');
    if(App.state.activeSection === 'contacts') App.Shared.renderContacts('entrepreneur', e.id, el, e);
    else App.Shared.renderMeetings('entrepreneur', e.id, el);
  },

  handleTransition: function(e, mode, existingCompanyId){
    if(mode === 'archive'){
      e.archived = true;
      e.archiveReason = '';
      App.pendingSelection = { selected:{ type:'entrepreneur', id:e.id }, activeSection:'reason' };
      location.hash = '#/archived';
      return;
    }
    if(mode === 'new'){
      var id = App.nextId(App.data.companies);
      App.data.companies.push({ id:id, name:e.name, status:'prospective', naics:'', naicsLabel:'', address:'', notes:e.notes, tags:[] });
      this.reparent(e.id, id);
      e.transitioned = true; e.companyId = id;
      App.pendingSelection = { selected:{ type:'company', id:id }, activeSection:'overview' };
      location.hash = '#/prospective';
      return;
    }
    if(mode === 'existing'){
      var companyId = parseInt(existingCompanyId, 10);
      if(!companyId) return;
      this.reparent(e.id, companyId);
      e.transitioned = true; e.companyId = companyId;
      var co = App.data.companies.find(function(c){ return c.id === companyId; });
      App.pendingSelection = { selected:{ type:'company', id:companyId }, activeSection:'contacts' };
      location.hash = '#/' + co.status;
    }
  },

  reparent: function(entrepreneurId, companyId){
    App.data.contacts.forEach(function(c){ if(c.parentType === 'entrepreneur' && c.parentId === entrepreneurId){ c.parentType = 'company'; c.parentId = companyId; } });
    App.data.meetings.forEach(function(m){ if(m.parentType === 'entrepreneur' && m.parentId === entrepreneurId){ m.parentType = 'company'; m.parentId = companyId; } });
  }
};
