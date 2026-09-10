window.App = window.App || {};

App.Companies = {
  sectionsByStatus: {
    prospective: [{ key: 'overview', label: 'Overview' }, { key: 'application', label: 'Application' }, { key: 'meetings', label: 'Meetings' }, { key: 'contacts', label: 'Contacts' }],
    established: [{ key: 'overview', label: 'Overview' }, { key: 'meetings', label: 'Meetings' }, { key: 'contacts', label: 'Contacts' }]
  },

  render: function () {
    var el = document.getElementById('page-content');
    el.innerHTML = '<div class="split-page"><div class="list-panel" id="co-list-panel"></div><div class="detail-panel" id="co-detail-panel"></div></div>';
    this.renderList();
    this.renderDetail();
  },

  getFiltered: function () {
    var status = App.state.page;
    var search = (App.state.search || '').toLowerCase();
    return App.data.companies.filter(function (c) { return c.status === status && (!search || c.name.toLowerCase().indexOf(search) > -1); });
  },

  renderList: function () {
    var self = this;
    var panel = document.getElementById('co-list-panel');
    var companies = this.getFiltered();
    var status = App.state.page;

    var listHtml = companies.length ? companies.map(function (c) {
      return App.listItem({
        id: c.id, title: c.name, subtitle: c.naics ? 'NAICS ' + c.naics : '',
        active: App.state.selected && App.state.selected.type === 'company' && App.state.selected.id === c.id,
        statusColor: App.statusMeta[status].color
      });
    }).join('') : App.emptyState('No ' + App.statusMeta[status].label.toLowerCase() + ' companies yet.');

    panel.innerHTML =
      '<div class="list-header">' +
      '<div class="list-header-top"><div class="list-title">' + App.statusMeta[status].label + '</div><button class="btn btn-sm btn-outline" id="list-reports-btn">Reports</button></div>' +
      '<input type="text" class="search-input" placeholder="Search ' + App.statusMeta[status].label.toLowerCase() + '" value="' + App.escapeHtml(App.state.search || '') + '">' +
      '</div>' +
      '<div class="list-scroll">' + listHtml + '</div>' +
      '<div class="list-footer" id="new-company-slot"></div>';

    panel.querySelectorAll('.list-item').forEach(function (item) { item.addEventListener('click', function () { self.select(parseInt(item.dataset.id, 10)); }); });
    var search = panel.querySelector('.search-input');
    if (search) search.addEventListener('input', function () { App.state.search = search.value; self.renderList(); });
    panel.querySelector('#list-reports-btn').addEventListener('click', function () { App.navigate('reports'); });

    App.addRow(panel.querySelector('#new-company-slot'), [
      { key: 'name', placeholder: 'Company name' }
    ], 'New company', function (d) {
      if (!d.name) return;
      var id = App.nextId(App.data.companies);
      App.data.companies.push({
        id: id, name: d.name, status: status, naics: '', naicsLabel: '',
        address: '', cityStateZip: '', email: '', phoneNumber: '', website: '',
        numEmploy: '', companyType: '', district: '', notes: '', tags: []
      });
      self.select(id);
    });
  },

  select: function (id) {
    App.state.selected = { type: 'company', id: id };
    App.state.activeSection = null;
    App.state.activeScenarioIndex = 0;
    this.renderList();
    this.renderDetail();
  },

  getSelected: function () {
    if (!App.state.selected || App.state.selected.type !== 'company') return null;
    return App.data.companies.find(function (c) { return c.id === App.state.selected.id; });
  },

  renderDetail: function () {
    var self = this;
    var panel = document.getElementById('co-detail-panel');
    var co = this.getSelected();
    if (!co) { panel.innerHTML = App.emptyState('Select a company to view its record.'); return; }

    var sections = this.sectionsByStatus[co.status];
    if (!App.state.activeSection || !sections.find(function (s) { return s.key === App.state.activeSection; })) App.state.activeSection = sections[0].key;
    var navHtml = sections.map(function (s) {
      return '<div class="section-item' + (App.state.activeSection === s.key ? ' active' : '') + '" data-section="' + s.key + '">' + s.label + '</div>';
    }).join('');

    var transferHtml = co.status === 'prospective'
      ? '<button class="btn btn-outline" id="transfer-toggle">Transfer</button>' +
      '<div class="inline-form" id="transfer-form">' +
      '<select id="transfer-target" class="inline-select"><option value="established">Established</option><option value="archived">Archived</option></select>' +
      '<textarea id="transfer-reason" class="field-input inline-input" placeholder="Why Archived" style="display:none; min-width:200px;"></textarea>' +
      '<button class="btn btn-sm btn-primary" id="transfer-confirm">Confirm</button>' +
      '</div>'
      : '<button class="btn btn-outline" id="transfer-toggle">Transfer</button>' +
      '<div class="inline-form" id="transfer-form">' +
      '<textarea id="transfer-reason" class="field-input inline-input" placeholder="Why Archived" style="min-width:200px;"></textarea>' +
      '<button class="btn btn-sm btn-primary" id="transfer-confirm">Archive</button>' +
      '</div>';

    panel.innerHTML =
      '<div class="detail-header"><div><input class="detail-title-input" data-field="name" value="' + App.escapeHtml(co.name) + '">' +
      '<div class="detail-status"><span class="status-dot" style="background:' + App.statusMeta[co.status].color + '"></span>' + App.statusMeta[co.status].label + '</div></div>' +
      '<div class="detail-actions">' + transferHtml + '</div></div>' +
      '<div class="detail-body"><div class="section-nav">' + navHtml + '</div><div class="section-content" id="section-content"></div></div>';

    App.bindFields(panel.querySelector('.detail-header'), co);
    panel.querySelectorAll('.section-item').forEach(function (s) { s.addEventListener('click', function () { App.state.activeSection = s.dataset.section; self.renderDetail(); }); });

    App.toggleForm(panel.querySelector('#transfer-toggle'), panel.querySelector('#transfer-form'));
    if (co.status === 'prospective') {
      var targetSel = panel.querySelector('#transfer-target');
      var reasonBox = panel.querySelector('#transfer-reason');
      targetSel.addEventListener('change', function () { reasonBox.style.display = targetSel.value === 'archived' ? 'block' : 'none'; });
    }
    panel.querySelector('#transfer-confirm').addEventListener('click', function () {
      var target = co.status === 'prospective' ? panel.querySelector('#transfer-target').value : 'archived';
      if (target === 'archived') co.archiveReason = panel.querySelector('#transfer-reason').value || '';
      co.status = target;
      App.pendingSelection = { selected: { type: 'company', id: co.id }, activeSection: null };
      location.hash = '#/' + target;
    });

    this.renderSection(co);
  },

  renderSection: function (co) {
    var el = document.getElementById('section-content');
    var s = App.state.activeSection;
    if (s === 'overview') this.renderOverview(co, el);
    else if (s === 'application') this.renderApplication(co, el);
    else if (s === 'contacts') App.Shared.renderContacts('company', co.id, el);
    else if (s === 'meetings') App.Shared.renderMeetings('company', co.id, el);
  },

  renderOverview: function (co, el) {
    function field(label, key) {
      return '<div class="field"><div class="field-label">' + label + '</div><input class="field-input" data-field="' + key + '" value="' + App.escapeHtml(co[key] || '') + '"></div>';
    }
    el.innerHTML =
      '<div class="field-grid">' +
      field('Address', 'address') +
      field('City, State, Zip', 'cityStateZip') +
      field('Email', 'email') +
      field('Phone Number', 'phoneNumber') +
      field('Website', 'website') +
      field('# of Employees', 'numEmploy') +
      field('Company Type', 'companyType') +
      field('District', 'district') +
      field('NAICS', 'naics') +
      '</div>';
    App.bindFields(el, co);
  },

  renderApplication: function (co, el) {
    var self = this;
    co.calcToggles = co.calcToggles || { propertyTax: true, salesTax: true, inventoryTax: true, water: true, wastewater: true, bpl: true, workerSpending: true };

    function rowsOrEmpty(list, mapFn) { return list.length ? list.map(mapFn).join('') : '<div class="table-row muted">None added yet.</div>'; }
    function subsection(title, slotId, rows) {
      return App.collapseWrap('<span>' + title + '</span>', '<div class="table" style="margin-bottom:8px;">' + rows + '</div><div id="' + slotId + '"></div>', false);
    }
    function field(label, key) {
      return '<div class="field"><div class="field-label">' + label + '</div><input class="field-input" data-field="' + key + '" value="' + App.escapeHtml(co[key] || '') + '"></div>';
    }
    function groupHeader(label) {
      return '<div style="font-weight:600; font-size:12px; text-transform:uppercase; letter-spacing:0.02em; color:var(--slate); margin:16px 0 8px;">' + label + '</div>';
    }

    var inv = App.data.investmentSchedules.filter(function (i) { return i.companyId === co.id; });
    if (inv.length === 0) {
      for (var y = 1; y <= 10; y++) {
        App.data.investmentSchedules.push({
          id: App.nextId(App.data.investmentSchedules), companyId: co.id,
          year: y, land: 0, building: 0, feAndMe: 0, taxableInventory: 0
        });
      }
      inv = App.data.investmentSchedules.filter(function (i) { return i.companyId === co.id; });
    }
    var util = App.data.utilities.filter(function (u) { return u.companyId === co.id; });
    var jobs = App.data.jobs.filter(function (j) { return j.companyId === co.id; });
    if (jobs.length === 0) {
      for (var jy = 1; jy <= 10; jy++) {
        App.data.jobs.push({ id: App.nextId(App.data.jobs), companyId: co.id, year: jy, totalJobs: 0 });
      }
      jobs = App.data.jobs.filter(function (j) { return j.companyId === co.id; });
    }
    var abate = App.data.abatements.filter(function (a) { return a.companyId === co.id; });
    var reb = App.data.rebates.filter(function (r) { return r.companyId === co.id; });
    var inc = App.data.incentives.filter(function (i) { return i.companyId === co.id; });

    var toggleDefs = [['incentives', 'Include Incentives'], ['abatements', 'Include Abatements'], ['rebates', 'Include Rebates'], ['propertyTax', 'Include Property Tax'], ['salesTax', 'Include Sales tax'], ['inventoryTax', 'Include Property Inventory Tax'], ['inventoryTax', 'Include Sales Inventory Tax'], ['water', 'Inlcude Worker'], ['water', 'Include Water'], ['wastewater', 'Inlcude Wastewater'], ['bpl', 'Include Electric']];
    var togglesBody = '<div class="toggle-list">' + toggleDefs.map(function (t) {
      return '<label class="toggle-row">' + t[1] + '<input type="checkbox" class="toggle-switch" data-toggle="' + t[0] + '"' + (co.calcToggles[t[0]] ? ' checked' : '') + '></label>';
    }).join('') + '</div>';

    var scenarios = App.data.calculations.filter(function (c) { return c.companyId === co.id; });
    var totalInvestment = inv.reduce(function (s, i) { return s + i.amount; }, 0);
    function computedField(label, value) {
      return '<div class="field"><div class="field-label">' + label + '</div><div class="field-value mono">' + (value || '\u2014') + '</div></div>';
    }

    var calcBody =

      '<div class="field-grid" style="margin-bottom:14px;">' +
      computedField('Payback Period') +

      computedField('Total Annual Return') +
      computedField('Annual Property Tax') +
      computedField('Annual Sales Tax: City') +
      computedField('Annual Sales Tax: Street') +
      computedField('Annual Sales Tax: EDC') +
      computedField('Annual Inventory Tax') +
      computedField('Annual Workers') +
      computedField('Annual Water') +
      computedField('Annual Wastewater') +
      computedField('Total City Outlays') +
      computedField('Total Incentives') +
      computedField('Total Abatements') +
      computedField('Total Rebates') +
      '</div>' +
      '<div id="calc-scenarios"></div>';
    var generalQuestionsHtml = App.collapseWrap('<span>General Questions</span>',
      groupHeader('Authorized Business Representative') +
      '<div class="field-grid">' +
      field('Owner Name', 'ownerName') +
      field('Job Title/Role', 'jobTitle') +
      field('Company Name', 'companyName') +
      field('Address of Business', 'addyOfBusiness') +
      field('Phone Number', 'phoneNum') +
      field('Website', 'website') +
      field('Email Address', 'emailAddy') +
      field('Consultant Name', 'conName') +
      field('Consultant Phone', 'conPhone') +
      field('Consultant Email', 'conEmail') +
      '</div>' +

      groupHeader('Project Information') +
      '<div class="field-grid">' +
      field('Project Description', 'projectDescription') +
      field('Considering Other TX Locations', 'txLoc') +
      field('Considering Other US Locations', 'usLoc') +
      field('Considering Other Global Locations', 'globalLoc') +
      field('Location of Planned Investment', 'plannedInvestmentLoc') +
      field('Market for Product of Activity', 'marketProdActivity') +
      field('Expected Start Date', 'startDate') +
      field('Expected Completion Date', 'completeDate') +
      field('Total Acres', 'totalAcres') +
      field('Land Value ($)', 'landValue') +
      field('Total Sqft', 'totalSqft') +
      field('Building Value ($)', 'buildingValue') +
      field('Is Leasing?', 'isLeasing') +
      '</div>' +

      groupHeader('Business Applicant Information') +
      '<div class="field-grid">' +
      field('Exact Legal Name for Entity Applying for Incentive', 'legalName') +
      field('Federal Tax ID Number', 'taxID') +
      '</div>' +

      groupHeader('Property and Sales Tax') +
      '<div class="field-grid">' +
      field('Owes Property Tax: Land', 'propTaxLand') +
      field('Owes Property Tax: Building', 'propTaxBuilding') +
      field('Owes Property Tax: ME and FE', 'propTaxMFE') +
      field('Owes Property Tax: Inventory', 'propTaxInv') +
      field('Property Tax Rate ($)', 'propTaxRate') +
      field('Sales Tax: City (%)', 'salesTaxCity') +
      field('Sales Tax: Street (%)', 'salesTaxStreet') +
      field('Sales Tax: EDC (%)', 'salesTaxEDC') +
      '</div>',
      false);
    var investmentHtml = App.collapseWrap('<span>Investment Schedule</span>',
      '<div class="field-grid">' +
      field('Project Years', 'projectYears') +
      field('Total Annual Company Purchases Subject to Sales Tax', 'totalAnnualPurchases') +
      '</div>' +
      '<div class="calc-table" style="margin-top:14px;">' +
      '<div class="calc-row calc-header"><span>Year</span><span>Land</span><span>Building</span><span>FE and ME</span><span>Taxable Inventory</span></div>' +
      inv.map(function (r) {
        return '<div class="calc-row">' +
          '<span class="mono">' + r.year + '</span>' +
          '<span><input class="cell-input" type="number" data-record="' + r.id + '" data-key="land" value="' + r.land + '"></span>' +
          '<span><input class="cell-input" type="number" data-record="' + r.id + '" data-key="building" value="' + r.building + '"></span>' +
          '<span><input class="cell-input" type="number" data-record="' + r.id + '" data-key="feAndMe" value="' + r.feAndMe + '"></span>' +
          '<span><input class="cell-input" type="number" data-record="' + r.id + '" data-key="taxableInventory" value="' + r.taxableInventory + '"></span>' +
          '</div>';
      }).join('') +
      '</div>',
      false);

    var jobsHtml = App.collapseWrap('<span>Jobs</span>',
      '<div class="field-grid">' +
      field('Number of new full time jobs to be included in City Agreement', 'fullTimeCityAgreement') +
      field('What is the expected average wage for the lowest paid 10% of workers?', 'expectedAvgWage') +
      field('Estimated annual median wage of new jobs to be created?', 'annualMedianWage') +
      '</div>' +
      '<div class="calc-table" style="margin-top:8px;">' +
      '<div class="calc-row calc-header" style="grid-template-columns:1fr 1fr;"><span>Year</span><span>Total Jobs</span></div>' +
      jobs.map(function (r) {
        return '<div class="calc-row" style="grid-template-columns:1fr 1fr;">' +
          '<span class="mono">' + r.year + '</span>' +
          '<span><input class="cell-input" type="number" data-jobs-record="' + r.id + '" data-key="totalJobs" value="' + r.totalJobs + '"></span>' +
          '</div>';
      }).join('') +
      '</div>',
      false);
    var taxTypes = [
      ['propTaxLand', 'Property Tax: Land'],
      ['propTaxBuilding', 'Property Tax: Building'],
      ['propTaxME', 'Property Tax: ME'],
      ['propTaxFE', 'Property Tax: FE'],
      ['propTaxInventory', 'Property Tax: Inventory'],
      ['localSalesTax', 'Local Sales and Use Tax'],
      ['stateSalesUseTax', 'State Sales and Use Tax']
    ];
    function taxTypeLabel(key) { var f = taxTypes.find(function (t) { return t[0] === key; }); return f ? f[1] : key; }

    var abate = App.data.abatements.filter(function (a) { return a.companyId === co.id; });
    if (abate.length === 0) {
      taxTypes.forEach(function (t) {
        App.data.abatements.push({ id: App.nextId(App.data.abatements), companyId: co.id, taxType: t[0], applicable: false, pct: 0, startYear: 0, endYear: 0 });
      });
      abate = App.data.abatements.filter(function (a) { return a.companyId === co.id; });
    }

    var reb = App.data.rebates.filter(function (r) { return r.companyId === co.id; });
    if (reb.length === 0) {
      taxTypes.forEach(function (t) {
        App.data.rebates.push({ id: App.nextId(App.data.rebates), companyId: co.id, taxType: t[0], applicable: false, pct: 0, startYear: 0, endYear: 0 });
      });
      reb = App.data.rebates.filter(function (r) { return r.companyId === co.id; });
    }

    function taxTypeTableHtml(rows, pctLabel, recordAttr) {
      return '<div class="calc-table" style="margin-top:8px;">' +
        '<div class="calc-row calc-header" style="grid-template-columns:2fr 0.8fr 1fr 1fr 1fr;"><span>Tax Type</span><span>Applicable</span><span>' + pctLabel + '</span><span>Start Year</span><span>End Year</span></div>' +
        rows.map(function (r) {
          return '<div class="calc-row" style="grid-template-columns:2fr 0.8fr 1fr 1fr 1fr;">' +
            '<span>' + taxTypeLabel(r.taxType) + '</span>' +
            '<span><input type="checkbox" class="toggle-switch" data-' + recordAttr + '="' + r.id + '" data-key="applicable"' + (r.applicable ? ' checked' : '') + '></span>' +
            '<span><input class="cell-input" type="number" data-' + recordAttr + '="' + r.id + '" data-key="pct" value="' + r.pct + '"></span>' +
            '<span><input class="cell-input" type="number" data-' + recordAttr + '="' + r.id + '" data-key="startYear" value="' + r.startYear + '"></span>' +
            '<span><input class="cell-input" type="number" data-' + recordAttr + '="' + r.id + '" data-key="endYear" value="' + r.endYear + '"></span>' +
            '</div>';
        }).join('') +
        '</div>';
    }

    var inc = App.data.incentives.filter(function (i) { return i.companyId === co.id; });
    function incentiveRowHtml(r) {
      return '<div class="calc-row" style="grid-template-columns:1.6fr 1fr 1fr 1fr 1fr;">' +
        '<span><select class="cell-input" data-inc-record="' + r.id + '" data-key="incentiveType">' +
        '<option value="upfront"' + (r.incentiveType === 'upfront' ? ' selected' : '') + '>Upfront</option>' +
        '<option value="ongoing"' + (r.incentiveType === 'ongoing' ? ' selected' : '') + '>Ongoing</option>' +
        '</select></span>' +
        '<span><input class="cell-input" type="number" data-inc-record="' + r.id + '" data-key="upfrontAmount" value="' + r.upfrontAmount + '"></span>' +
        '<span><input class="cell-input" type="number" data-inc-record="' + r.id + '" data-key="startYear" value="' + r.startYear + '"></span>' +
        '<span><input class="cell-input" type="number" data-inc-record="' + r.id + '" data-key="endYear" value="' + r.endYear + '"></span>' +
        '<span><input class="cell-input" type="number" data-inc-record="' + r.id + '" data-key="annualAmount" value="' + r.annualAmount + '"></span>' +
        '</div>';
    }

    var incentivesHtml = App.collapseWrap('<span>Incentives</span>',
      '<div class="calc-table" style="margin-top:8px;">' +
      '<div class="calc-row calc-header" style="grid-template-columns:1.6fr 1fr 1fr 1fr 1fr;"><span>Incentive Type</span><span>Upfront Amount</span><span>Start Year</span><span>End Year</span><span>Annual Amount</span></div>' +
      inc.map(incentiveRowHtml).join('') +
      '</div>' +
      '<button class="btn btn-sm btn-outline" id="add-incentive-row-btn" style="margin-top:8px;">+ Add incentive</button>',
      !!App.state.openAppSections['incentives'],
      ' data-app-section="incentives"'
    );

    var abatementsHtml = App.collapseWrap('<span>Abatements</span>', taxTypeTableHtml(abate, 'Abatement %', 'ab-record'), false);
    var rebatesHtml = App.collapseWrap('<span>Rebates</span>', taxTypeTableHtml(reb, 'Rebate %', 'reb-record'), false);

    var utilitiesHtml = App.collapseWrap('<span>Utilities</span>',
      groupHeader('Electricity') +
      '<div class="field-grid">' +
      field('Average Monthly Usage in kWh', 'avgElectric') +
      field('Pays Electrical Through Bastrop', 'paysElectricBastrop') +
      '</div>' +
      groupHeader('Water') +
      '<div class="field-grid">' +
      field('In City Limits', 'cityLimits') +
      field('Average Monthly Usage (G)', 'avgWater') +
      field('Meter Size', 'meterSize') +
      '</div>' +
      groupHeader('Wastewater') +
      '<div class="field-grid">' +
      field('Average Monthly Discharge (G)', 'avgWasteWater') +
      '</div>',
      false);

    el.innerHTML =
      generalQuestionsHtml +
      investmentHtml +
      utilitiesHtml +
      jobsHtml +
      abatementsHtml +
      rebatesHtml +
      incentivesHtml +
      App.collapseWrap('<span>Formula toggles</span>', togglesBody, false) +
      App.collapseWrap('<span>Calculations</span>', calcBody, false);

    App.wireCollapsibles(el);
    el.querySelectorAll('.collapse-item[data-app-section] > .collapse-header').forEach(function (h) {
      h.addEventListener('click', function () {
        var item = h.parentElement;
        App.state.openAppSections[item.dataset.appSection] = item.classList.contains('open');
      });
    });
    App.bindFields(el, co);
    el.querySelectorAll('[data-toggle]').forEach(function (cb) { cb.addEventListener('change', function () { co.calcToggles[cb.dataset.toggle] = cb.checked; }); });
    el.querySelectorAll('.cell-input').forEach(function (inp) {
      inp.addEventListener('input', function () {
        var rec = App.data.investmentSchedules.find(function (r) { return r.id === parseInt(inp.dataset.record, 10); });
        if (rec) rec[inp.dataset.key] = parseFloat(inp.value) || 0;
      });
    });
    App.addRow(el.querySelector('#util-slot'), [{ key: 'type', placeholder: 'Utility (Water, BPL, etc.)' }, { key: 'amount', placeholder: 'Est. annual $', type: 'number' }], 'Add utility', function (d) {
      App.data.utilities.push({ id: App.nextId(App.data.utilities), companyId: co.id, type: d.type || '', amount: parseFloat(d.amount) || 0 });
      self.renderDetail();
    });
    App.addRow(el.querySelector('#job-slot'), [{ key: 'jobTitle', placeholder: 'Job title' }, { key: 'count', placeholder: '# positions', type: 'number' }, { key: 'avgWage', placeholder: 'Avg wage $/hr', type: 'number' }], 'Add job category', function (d) {
      App.data.jobs.push({ id: App.nextId(App.data.jobs), companyId: co.id, jobTitle: d.jobTitle || '', count: parseInt(d.count, 10) || 0, avgWage: parseFloat(d.avgWage) || 0 });
      self.renderDetail();
    });
    App.addRow(el.querySelector('#ab-slot'), [{ key: 'type', placeholder: 'Abatement type' }, { key: 'percent', placeholder: 'Percent %', type: 'number' }, { key: 'years', placeholder: 'Years', type: 'number' }], 'Add abatement', function (d) {
      App.data.abatements.push({ id: App.nextId(App.data.abatements), companyId: co.id, type: d.type || '', percent: parseFloat(d.percent) || 0, years: parseInt(d.years, 10) || 0 });
      self.renderDetail();
    });
    App.addRow(el.querySelector('#reb-slot'), [{ key: 'type', placeholder: 'Rebate type' }, { key: 'amount', placeholder: 'Amount $', type: 'number' }, { key: 'years', placeholder: 'Years', type: 'number' }], 'Add rebate', function (d) {
      App.data.rebates.push({ id: App.nextId(App.data.rebates), companyId: co.id, type: d.type || '', amount: parseFloat(d.amount) || 0, years: parseInt(d.years, 10) || 0 });
      self.renderDetail();
    });
    App.addRow(el.querySelector('#inc-slot'), [{ key: 'type', placeholder: 'Incentive type' }, { key: 'amount', placeholder: 'Amount $', type: 'number' }], 'Add incentive', function (d) {
      App.data.incentives.push({ id: App.nextId(App.data.incentives), companyId: co.id, type: d.type || '', amount: parseFloat(d.amount) || 0 });
      self.renderDetail();
    });
    el.querySelectorAll('[data-jobs-record]').forEach(function (inp) {
      inp.addEventListener('input', function () {
        var rec = App.data.jobs.find(function (r) { return r.id === parseInt(inp.dataset.jobsRecord, 10); });
        if (rec) rec.totalJobs = parseFloat(inp.value) || 0;
      });
    });
    el.querySelectorAll('[data-ab-record]').forEach(function (inp) {
      var evt = inp.type === 'checkbox' ? 'change' : 'input';
      inp.addEventListener(evt, function () {
        var rec = App.data.abatements.find(function (r) { return r.id === parseInt(inp.dataset.abRecord, 10); });
        if (rec) rec[inp.dataset.key] = inp.type === 'checkbox' ? inp.checked : (parseFloat(inp.value) || 0);
      });
    });
    el.querySelectorAll('[data-reb-record]').forEach(function (inp) {
      var evt = inp.type === 'checkbox' ? 'change' : 'input';
      inp.addEventListener(evt, function () {
        var rec = App.data.rebates.find(function (r) { return r.id === parseInt(inp.dataset.rebRecord, 10); });
        if (rec) rec[inp.dataset.key] = inp.type === 'checkbox' ? inp.checked : (parseFloat(inp.value) || 0);
      });
    });
    el.querySelectorAll('[data-inc-record]').forEach(function (inp) {
      var evt = inp.tagName === 'SELECT' ? 'change' : 'input';
      inp.addEventListener(evt, function () {
        var rec = App.data.incentives.find(function (r) { return r.id === parseInt(inp.dataset.incRecord, 10); });
        if (!rec) return;
        rec[inp.dataset.key] = inp.dataset.key === 'incentiveType' ? inp.value : (parseFloat(inp.value) || 0);
      });
    });
    var addIncBtn = el.querySelector('#add-incentive-row-btn');
    if (addIncBtn) addIncBtn.addEventListener('click', function () {
      App.data.incentives.push({ id: App.nextId(App.data.incentives), companyId: co.id, incentiveType: 'upfront', upfrontAmount: 0, startYear: 0, endYear: 0, annualAmount: 0 });
      self.renderDetail();
    });

    this.renderScenarios(co, el.querySelector('#calc-scenarios'));
  },


  computePaybackLabel: function (scenarios, totalInvestment) {
    if (!scenarios.length || !totalInvestment) return '\u2014';
    var hit = scenarios[0].annual.find(function (y) { return y.cumulative >= totalInvestment; });
    return hit ? ('Year ' + hit.year) : 'Not within projected years';
  },

  renderScenarios: function (co, el) {
    var self = this;
    if (!el) return;
    var scenarios = App.data.calculations.filter(function (c) { return c.companyId === co.id; });
    var idx = App.state.activeScenarioIndex || 0;
    if (idx >= scenarios.length) idx = 0;
    var tabs = scenarios.map(function (s, i) { return '<span class="chip' + (i === idx ? ' active' : '') + '" data-idx="' + i + '">' + App.escapeHtml(s.name) + '</span>'; }).join('');
    var tableHtml = '';
    if (scenarios.length) {
      var current = scenarios[idx];
      var rows = current.annual.length ? current.annual.map(function (y) {
        return '<div class="calc-row"><span class="mono">Yr ' + y.year + '</span><span class="mono">' + App.formatCurrency(y.propertyTax) + '</span><span class="mono">' + App.formatCurrency(y.salesTax) + '</span><span class="mono">' + App.formatCurrency(y.inventoryTax) + '</span><span class="mono">' + App.formatCurrency(y.water + y.wastewater + y.bpl) + '</span><span class="mono">' + App.formatCurrency(y.workerSpending) + '</span><span class="mono strong">' + App.formatCurrency(y.cumulative) + '</span></div>';
      }).join('') : '<div class="table-row muted">No annual projections yet.</div>';
      tableHtml = '<div class="calc-table"><div class="calc-row calc-header"><span>Year</span><span>Property tax</span><span>Sales tax</span><span>Inventory tax</span><span>Utility rev.</span><span>Worker spend</span><span>Cumulative</span></div>' + rows + '</div>';
    }
    el.innerHTML = '<div class="chip-row" style="margin-bottom:10px;">' + tabs + '</div><div id="scenario-add-slot" style="margin-bottom:10px;"></div>' + tableHtml;

    el.querySelectorAll('.chip').forEach(function (c) { c.addEventListener('click', function () { App.state.activeScenarioIndex = parseInt(c.dataset.idx, 10); self.renderScenarios(co, el); }); });
  }
};
