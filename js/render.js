window.App = window.App || {};

App.statusMeta = {
  prospective: { label:'Prospective', color:'var(--brass)' },
  established: { label:'Established', color:'var(--forest)' },
  archived:    { label:'Archived',    color:'var(--slate)' }
};

App.escapeHtml = function(str){
  if(str === undefined || str === null) return '';
  return String(str).replace(/[&<>"']/g, function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
  });
};

App.formatCurrency = function(n){
  return '$' + Number(n||0).toLocaleString('en-US', { maximumFractionDigits:0 });
};

App.emptyState = function(message){
  return '<div class="empty-state"><p>' + App.escapeHtml(message) + '</p></div>';
};

App.listItem = function(opts){
  return '<div class="list-item' + (opts.active ? ' active' : '') + '" data-id="' + opts.id + '" style="border-left-color:' + (opts.statusColor || 'transparent') + '">' +
    '<div class="list-item-title">' + App.escapeHtml(opts.title) + '</div>' +
    '<div class="list-item-subtitle">' + App.escapeHtml(opts.subtitle || '') + '</div>' +
  '</div>';
};

App.chipsDisplay = function(list){
  if(!list || !list.length) return '<span class="muted-inline">&mdash;</span>';
  return list.map(function(t){ return '<span class="tag-chip">' + App.escapeHtml(t) + '</span>'; }).join(' ');
};

App.bindFields = function(el, obj){
  el.querySelectorAll('[data-field]').forEach(function(input){
    input.addEventListener('input', function(){ obj[input.dataset.field] = input.value; });
  });
};

App.toggleForm = function(btn, form){
  btn.addEventListener('click', function(){
    form.classList.toggle('open');
    if(form.classList.contains('open')){
      var first = form.querySelector('input,textarea,select');
      if(first) first.focus();
    }
  });
};

App.addRow = function(container, fields, label, onAdd){
  if(!container) return;
  var uid = 'f' + Math.random().toString(36).slice(2,8);
  var inputsHtml = fields.map(function(f){
    return '<input class="field-input inline-input" data-key="' + f.key + '" type="' + (f.type || 'text') + '" placeholder="' + f.placeholder + '">';
  }).join('');
  container.innerHTML =
    '<button type="button" class="btn btn-sm btn-outline" id="btn-' + uid + '"><i class="ti ti-plus"></i> ' + label + '</button>' +
    '<div class="inline-form" id="form-' + uid + '">' + inputsHtml + '<button type="button" class="btn btn-sm btn-primary" id="save-' + uid + '">Add</button></div>';
  var btn = document.getElementById('btn-' + uid);
  var form = document.getElementById('form-' + uid);
  App.toggleForm(btn, form);
  document.getElementById('save-' + uid).addEventListener('click', function(){
    var data = {};
    form.querySelectorAll('[data-key]').forEach(function(inp){ data[inp.dataset.key] = inp.value; });
    onAdd(data);
  });
};

// Collapsible "title only, click to expand" wrapper used for Contacts, Meetings, and Application subsections.
App.collapseWrap = function(headerHtml, bodyHtml, isOpen, extraAttr){
  return '<div class="collapse-item' + (isOpen ? ' open' : '') + '"' + (extraAttr || '') + '>' +
    '<div class="collapse-header"><div class="collapse-header-content">' + headerHtml + '</div><i class="ti ti-chevron-right chev"></i></div>' +
    '<div class="collapse-body">' + bodyHtml + '</div>' +
  '</div>';
};
App.wireCollapsibles = function(el){
  el.querySelectorAll('.collapse-header').forEach(function(h){
    h.addEventListener('click', function(){ h.parentElement.classList.toggle('open'); });
  });
};
