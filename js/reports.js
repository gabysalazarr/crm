window.App = window.App || {};

App.Reports = {
  types: ['Company Profile','Contact Info','Meeting History','Meeting Activity','Tag Search','Payback Calculation','Full Company Summary'],
  selectedType: null,

  render: function(){
    var self = this;
    if(!this.selectedType) this.selectedType = this.types[0];
    var el = document.getElementById('page-content');
    var listHtml = this.types.map(function(t){
      return '<div class="list-item' + (t === self.selectedType ? ' active' : '') + '" data-type="' + App.escapeHtml(t) + '" style="border-left-color:var(--brass)">' +
        '<div class="list-item-title">' + t + '</div></div>';
    }).join('');

    el.innerHTML =
      '<div class="split-page">' +
        '<div class="list-panel"><div class="list-header"><div class="list-title">Reports</div></div><div class="list-scroll">' + listHtml + '</div></div>' +
        '<div class="detail-panel">' +
          '<div class="detail-header"><div><div class="detail-title">' + self.selectedType + '</div><div class="detail-status">Report</div></div></div>' +
          '<div class="detail-body-full">' +
            '<div class="field" style="margin-bottom:20px; max-width:320px;">' +
              '<div class="field-label">Scope</div>' +
              '<select class="field-input" id="report-scope">' +
                '<option value="selected">Current record</option>' +
                '<option value="prospective">All Prospective</option>' +
                '<option value="established">All Established</option>' +
                '<option value="archived">All Archived</option>' +
              '</select>' +
            '</div>' +
            '<div style="display:flex; gap:10px;">' +
              '<button class="btn btn-primary" id="export-pdf">Export as PDF</button>' +
              '<button class="btn btn-outline" id="export-xls">Export as Excel</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    el.querySelectorAll('.list-item').forEach(function(item){
      item.addEventListener('click', function(){ self.selectedType = item.dataset.type; self.render(); });
    });
    el.querySelector('#export-pdf').addEventListener('click', function(){
      alert('Would export "' + self.selectedType + '" as PDF once connected to the backend.');
    });
    el.querySelector('#export-xls').addEventListener('click', function(){
      alert('Would export "' + self.selectedType + '" as Excel once connected to the backend.');
    });
  }
};
