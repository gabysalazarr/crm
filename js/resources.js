window.App = window.App || {};

App.Resources = {
  render: function(){
    var el = document.getElementById('page-content');
    el.innerHTML = '<div class="split-page"><div class="list-panel" id="re-list-panel"></div><div class="detail-panel" id="re-detail-panel"></div></div>';
    this.renderList();
    this.renderDetail();
  },

  getFiltered: function(){
    var search = (App.state.search || '').toLowerCase();
    return App.data.resources.filter(function(r){ return !search || r.name.toLowerCase().indexOf(search) > -1; });
  },

  renderList: function(){
    var self = this;
    var panel = document.getElementById('re-list-panel');
    var list = this.getFiltered();
    var listHtml = list.length ? list.map(function(r){
      var primary = App.data.contacts.find(function(c){ return c.parentType === 'resource' && c.parentId === r.id && c.primary; });
      return App.listItem({ id:r.id, title:r.name, subtitle: primary ? primary.name : '', active: App.state.selected && App.state.selected.type === 'resource' && App.state.selected.id === r.id, statusColor:'var(--brass)' });
    }).join('') : App.emptyState('No resources yet.');

    panel.innerHTML =
      '<div class="list-header"><div class="list-header-top"><div class="list-title">Resources</div><button class="btn btn-sm btn-outline" id="list-reports-btn">Reports</button></div>' +
      '<input type="text" class="search-input" placeholder="Search resources" value="' + App.escapeHtml(App.state.search || '') + '"></div>' +
      '<div class="list-scroll">' + listHtml + '</div>' +
      '<div class="list-footer" id="new-re-slot"></div>';

    panel.querySelectorAll('.list-item').forEach(function(item){ item.addEventListener('click', function(){ self.select(parseInt(item.dataset.id, 10)); }); });
    var search = panel.querySelector('.search-input');
    if(search) search.addEventListener('input', function(){ App.state.search = search.value; self.renderList(); });
    panel.querySelector('#list-reports-btn').addEventListener('click', function(){ App.navigate('reports'); });

    App.addRow(panel.querySelector('#new-re-slot'), [
      { key: 'name', placeholder: 'Resource name' }
    ], 'New resource', function(d){
      if(!d.name) return;
      var id = App.nextId(App.data.resources);
      App.data.resources.push({ id:id, name:d.name, address:'', cityStateZip:'', naics:'',
        numEmploy:'', phoneNumber:'', email:'', notes:'' });
      self.select(id);
    });
  },

  select: function(id){
    App.state.selected = { type:'resource', id:id };
    App.state.activeSection = 'overview';
    this.renderList(); this.renderDetail();
  },

  getSelected: function(){
    if(!App.state.selected || App.state.selected.type !== 'resource') return null;
    return App.data.resources.find(function(r){ return r.id === App.state.selected.id; });
  },

  renderDetail: function(){
    var self = this;
    var panel = document.getElementById('re-detail-panel');
    var r = this.getSelected();
    if(!r){ panel.innerHTML = App.emptyState('Select a resource to view its record.'); return; }

    var sections = [{key:'overview', label:'Overview'}, {key:'meetings', label:'Meetings'}, {key:'contacts', label:'Contacts'}];
    if(!App.state.activeSection || !sections.find(function(s){ return s.key === App.state.activeSection; })) App.state.activeSection = 'overview';
    var navHtml = sections.map(function(s){ return '<div class="section-item' + (App.state.activeSection === s.key ? ' active' : '') + '" data-section="' + s.key + '">' + s.label + '</div>'; }).join('');

    panel.innerHTML =
      '<div class="detail-header"><div><input class="detail-title-input" data-field="name" value="' + App.escapeHtml(r.name) + '"><div class="detail-status">Resource</div></div></div>' +
      '<div class="detail-body"><div class="section-nav">' + navHtml + '</div><div class="section-content" id="section-content"></div></div>';

    App.bindFields(panel.querySelector('.detail-header'), r);
    panel.querySelectorAll('.section-item').forEach(function(s){ s.addEventListener('click', function(){ App.state.activeSection = s.dataset.section; self.renderDetail(); }); });

    this.renderSection(r);
  },

  renderSection: function(r){
    var el = document.getElementById('section-content');
    var s = App.state.activeSection;
    if(s === 'overview') this.renderOverview(r, el);
    else if(s === 'contacts') App.Shared.renderContacts('resource', r.id, el);
    else App.Shared.renderMeetings('resource', r.id, el);
  },

  renderOverview: function(r, el){
    function field(label, key){
      return '<div class="field"><div class="field-label">' + label + '</div><input class="field-input" data-field="' + key + '" value="' + App.escapeHtml(r[key] || '') + '"></div>';
    }
    el.innerHTML =
      '<div class="field-grid">' +
        field('Address of Business','address') +
        field('City, State, Zip','cityStateZip') +
        field('NAICS','naics') +
        field('# of Employees','numEmploy') +
        field('Phone Number','phoneNumber') +
        field('Email','email') 
    App.bindFields(el, r);
  }
};
