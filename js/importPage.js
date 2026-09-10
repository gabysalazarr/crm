window.App = window.App || {};

App.Import = {
  render: function(){
    var self = this;
    var el = document.getElementById('page-content');
    var rows = App.data.importStaging.map(function(row){
      var match = row.match ? App.data.companies.find(function(c){ return c.id === row.match; }) : null;
      return '<div class="import-row">' +
        '<div class="import-col"><div class="field-label">Incoming</div><div class="field-value">' + App.escapeHtml(row.name) + '</div><div class="field-value mono">NAICS ' + App.escapeHtml(row.naics) + '</div></div>' +
        '<div class="import-col"><div class="field-label">' + (match ? 'Possible match' : 'No match found') + '</div>' +
          (match ? '<div class="field-value">' + App.escapeHtml(match.name) + '</div><div class="field-value mono">NAICS ' + App.escapeHtml(match.naics) + '</div>' : '<div class="field-value">&mdash;</div>') +
        '</div>' +
        '<div class="import-col import-actions">' +
          (match ? '<button class="btn btn-sm btn-outline" data-action="skip" data-id="' + row.id + '">Skip (duplicate)</button>' : '') +
          '<button class="btn btn-sm btn-primary" data-action="import" data-id="' + row.id + '">' + (match ? 'Import anyway' : 'Import as new') + '</button>' +
        '</div>' +
      '</div>';
    }).join('');

    el.innerHTML =
      '<div class="detail-panel" style="width:100%;">' +
        '<div class="detail-header"><div><div class="detail-title">Import review</div><div class="detail-status">' + App.data.importStaging.length + ' staged records</div></div></div>' +
        '<div class="detail-body-full">' +
          (App.data.importStaging.length ? '<div class="import-list">' + rows + '</div>' : App.emptyState('No records staged for import. Use "Import Companies" from an Excel file to stage new records.')) +
        '</div>' +
      '</div>';

    el.querySelectorAll('[data-action]').forEach(function(btn){
      btn.addEventListener('click', function(){
        var id = parseInt(btn.dataset.id, 10);
        var idx = App.data.importStaging.findIndex(function(r){ return r.id === id; });
        if(idx > -1){
          var row = App.data.importStaging[idx];
          if(btn.dataset.action === 'import'){
            App.data.companies.push({ id:App.nextId(App.data.companies), name:row.name, status:'prospective', contact:'', phone:'', email:'', naics:row.naics, naicsLabel:'', address:'', notes:'', tags:[] });
          }
          App.data.importStaging.splice(idx, 1);
        }
        self.render();
      });
    });
  }
};
