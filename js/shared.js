window.App = window.App || {};

App.Shared = {

  renderContacts: function(parentType, parentId, el, entityForNotes){
    var self = this;
    var notesHtml = entityForNotes ? (
      '<div class="field" style="margin-bottom:20px;"><div class="field-label">Notes</div>' +
      '<textarea class="field-input" data-field="notes" rows="2">' + App.escapeHtml(entityForNotes.notes || '') + '</textarea></div>'
    ) : '';

    var contacts = App.data.contacts.filter(function(c){ return c.parentType === parentType && c.parentId === parentId; });
    var rows = contacts.length ? contacts.map(function(c){
      var header = '<span>' + App.escapeHtml(c.name) + (c.primary ? ' <span class="primary-badge">Primary</span>' : '') + '</span>';
      var body =
        '<div class="field-grid">' +
          '<div class="field"><div class="field-label">Role</div><div class="field-value">' + (App.escapeHtml(c.role) || '&mdash;') + '</div></div>' +
          '<div class="field"><div class="field-label">Phone</div><div class="field-value mono">' + (App.escapeHtml(c.phone) || '&mdash;') + '</div></div>' +
          '<div class="field"><div class="field-label">Email</div><div class="field-value mono">' + (App.escapeHtml(c.email) || '&mdash;') + '</div></div>' +
          '<div class="field"><div class="field-label">First contact w/ Smart Start</div><div class="field-value mono">' + (App.escapeHtml(c.firstContact) || '&mdash;') + '</div></div>' +
          '<div class="field"><div class="field-label">Referred by</div><div class="field-value">' + (App.escapeHtml(c.referredBy) || '&mdash;') + '</div></div>' +
          '<div class="field"><div class="field-label">Inquiry type</div><div class="field-value">' + (App.escapeHtml(c.inquiryType) || '&mdash;') + '</div></div>' +
        '</div>' +
        '<button class="btn btn-sm btn-outline" data-remove-contact="' + c.id + '" style="margin-top:12px;">Remove</button>';
      return App.collapseWrap(header, body, false);
    }).join('') : '<div class="table-row muted">No contacts added yet.</div>';

    el.innerHTML = notesHtml +
      '<div class="section-toolbar-title">Contacts</div>' +
      '<div style="margin:8px 0 10px;">' + rows + '</div>' +
      '<div id="contact-add-slot"></div>';

    if(entityForNotes) App.bindFields(el, entityForNotes);
    App.wireCollapsibles(el);

    el.querySelectorAll('[data-remove-contact]').forEach(function(btn){
      btn.addEventListener('click', function(){
        var id = parseInt(btn.dataset.removeContact, 10);
        App.data.contacts = App.data.contacts.filter(function(c){ return c.id !== id; });
        self.refresh();
      });
    });

    App.addRow(el.querySelector('#contact-add-slot'), [
      {key:'name', placeholder:'Contact Name'},
      {key:'role', placeholder:'Job Title/Role'},
      {key:'phone', placeholder:'Phone'},
      {key:'email', placeholder:'Email'},
      {key:'firstContact', placeholder:'First Contact with Smart Start', type:'date'},
      {key:'referredBy', placeholder:'Referred By'},
      {key:'inquiryType', placeholder:'Inquiry Type'}
    ], 'Add contact', function(data){
      if(!data.name) return;
      var siblings = App.data.contacts.filter(function(c){ return c.parentType === parentType && c.parentId === parentId; });
      App.data.contacts.push({ id:App.nextId(App.data.contacts), parentType:parentType, parentId:parentId,
        name:data.name, role:data.role, phone:data.phone, email:data.email,
        firstContact:data.firstContact, referredBy:data.referredBy, inquiryType:data.inquiryType,
        primary: siblings.length === 0 });
      self.refresh();
    });
  },

  // ---- Meetings ----
  // Meeting: { id, title, date, attendees:[], entries:[] }
  // Entry:   { id, writtenBy, note, actionItem, recommendation, tags:[] }
  // Each meeting can have multiple entries, one per person who wrote something up.

  renderMeetings: function(parentType, parentId, el){
    var self = this;
    var meetings = App.data.meetings.filter(function(m){ return m.parentType === parentType && m.parentId === parentId; })
      .sort(function(a,b){ return b.date.localeCompare(a.date); });
    var cards = meetings.map(function(m){ return self.meetingCardHtml(m); }).join('');

    el.innerHTML = '<div class="section-toolbar-title">Meetings</div>' +
      '<div id="meeting-add-slot" style="margin:8px 0 14px;"></div>' +
      '<div class="meeting-list">' + (cards || '<div class="table-row muted">No meetings logged yet.</div>') + '</div>';

    App.addRow(el.querySelector('#meeting-add-slot'), [
      {key:'title', placeholder:'Meeting title'},
      {key:'date', placeholder:'Date', type:'date'}
    ], 'New meeting', function(data){
      if(!data.title) return;
      var id = App.nextId(App.data.meetings);
      App.data.meetings.push({ id:id, parentType:parentType, parentId:parentId,
        title:data.title, date:data.date || new Date().toISOString().slice(0,10),
        attendees:[], entries:[] });
      App.state.openMeetingIds[id] = true;
      self.refresh();
    });

    this.wireMeetingCards(el);
  },

  meetingCardHtml: function(m){
    var self = this;
    var attendeeChips = m.attendees.map(function(a,i){
      return '<span class="tag-chip removable" data-attendee-meeting="' + m.id + '" data-idx="' + i + '">' + App.escapeHtml(a) + ' <i class="ti ti-x"></i></span>';
    }).join(' ');
    var entries = m.entries || [];
    var entriesHtml = entries.length ? entries.map(function(entry){ return self.entryCardHtml(entry); }).join('') : '<div class="table-row muted">No entries yet.</div>';

    var body =
      '<div class="field-label">Attendees</div>' +
      '<div class="meeting-attendees">' + (attendeeChips || '<span class="muted-inline">No attendees</span>') + '</div>' +
      '<div id="attendee-add-' + m.id + '" style="margin:6px 0 16px;"></div>' +

      '<div class="field-label">Entries</div>' +
      '<div id="entry-add-' + m.id + '" style="margin:6px 0 12px;"></div>' +
      entriesHtml +

      '<button class="btn btn-sm btn-outline" data-remove-meeting="' + m.id + '" style="margin-top:16px;">Remove meeting</button>';

    var header = '<span class="meeting-title">' + App.escapeHtml(m.title) + '</span><span class="mono">' + App.escapeHtml(m.date) + '</span>';
    var isOpen = !!App.state.openMeetingIds[m.id];
    return App.collapseWrap(header, body, isOpen, ' data-meeting-id="' + m.id + '"');
  },

  entryCardHtml: function(entry){
    var tagChips = (entry.tags || []).map(function(t,i){
      return '<span class="tag-chip removable" data-entry-tag="' + entry.id + '" data-idx="' + i + '">' + App.escapeHtml(t) + ' <i class="ti ti-x"></i></span>';
    }).join(' ');

    var body =
      '<div class="field" style="margin-bottom:10px;"><div class="field-label">Written by</div>' +
      '<input class="field-input" data-field="writtenBy" value="' + App.escapeHtml(entry.writtenBy || '') + '"></div>' +

      '<div class="field" style="margin-bottom:10px;"><div class="field-label">Note</div>' +
      '<textarea class="field-input" data-field="note" rows="2">' + App.escapeHtml(entry.note || '') + '</textarea></div>' +

      '<div class="field" style="margin-bottom:10px;"><div class="field-label">Action Item</div>' +
      '<textarea class="field-input" data-field="actionItem" rows="2">' + App.escapeHtml(entry.actionItem || '') + '</textarea></div>' +

      '<div class="field" style="margin-bottom:12px;"><div class="field-label">Recommendation</div>' +
      '<textarea class="field-input" data-field="recommendation" rows="2">' + App.escapeHtml(entry.recommendation || '') + '</textarea></div>' +

      '<div class="field-label">Tags</div>' +
      '<div class="meeting-attendees">' + (tagChips || '<span class="muted-inline">No tags</span>') +
      ' <input type="text" class="chip-input" placeholder="+ tag, Enter" data-add-entry-tag="' + entry.id + '"></div>' +

      '<button class="btn btn-sm btn-outline" data-remove-entry="' + entry.id + '" style="margin-top:10px;">Remove entry</button>';

    var header = '<span class="entry-header-name">' + (App.escapeHtml(entry.writtenBy) || 'Unnamed') + '</span>';
    var isOpen = !!App.state.openEntryIds[entry.id];
    return App.collapseWrap(header, body, isOpen, ' data-entry-id="' + entry.id + '"');
  },

  wireMeetingCards: function(el){
    var self = this;
    App.wireCollapsibles(el);

    el.querySelectorAll('.collapse-item[data-meeting-id]').forEach(function(item){
      var meetingId = parseInt(item.dataset.meetingId, 10);
      var header = item.querySelector('.collapse-header');
      if(header) header.addEventListener('click', function(){
        App.state.openMeetingIds[meetingId] = item.classList.contains('open');
      });
    });

    el.querySelectorAll('.collapse-item[data-entry-id]').forEach(function(entryItem){
      var entryId = parseInt(entryItem.dataset.entryId, 10);
      var meeting = App.data.meetings.find(function(mm){ return (mm.entries || []).some(function(e){ return e.id === entryId; }); });
      var entry = meeting ? meeting.entries.find(function(e){ return e.id === entryId; }) : null;
      if(!entry) return;
      var header = entryItem.querySelector('.collapse-header');
      if(header) header.addEventListener('click', function(){
        App.state.openEntryIds[entryId] = entryItem.classList.contains('open');
      });
      App.bindFields(entryItem, entry);

      var writtenByInput = entryItem.querySelector('[data-field="writtenBy"]');
      var headerNameEl = entryItem.querySelector('.entry-header-name');
      if(writtenByInput && headerNameEl){
        writtenByInput.addEventListener('input', function(){
          headerNameEl.textContent = writtenByInput.value.trim() || 'Unnamed';
        });
      }
    });

    el.querySelectorAll('[data-remove-meeting]').forEach(function(btn){
      btn.addEventListener('click', function(){
        if(!confirm('Remove this meeting?')) return;
        App.data.meetings = App.data.meetings.filter(function(m){ return m.id !== parseInt(btn.dataset.removeMeeting, 10); });
        self.refresh();
      });
    });

    el.querySelectorAll('[data-attendee-meeting]').forEach(function(chip){
      chip.addEventListener('click', function(){
        var m = App.data.meetings.find(function(x){ return x.id === parseInt(chip.dataset.attendeeMeeting, 10); });
        m.attendees.splice(parseInt(chip.dataset.idx, 10), 1);
        self.refresh();
      });
    });
    el.querySelectorAll('[id^="attendee-add-"]').forEach(function(slot){
      var meetingId = parseInt(slot.id.replace('attendee-add-', ''), 10);
      App.addRow(slot, [{key:'attendee', placeholder:'Attendee name'}], 'Add attendee', function(data){
        if(!data.attendee) return;
        var m = App.data.meetings.find(function(x){ return x.id === meetingId; });
        m.attendees.push(data.attendee);
        self.refresh();
      });
    });

    el.querySelectorAll('[data-entry-tag]').forEach(function(chip){
      chip.addEventListener('click', function(){
        var entryId = parseInt(chip.dataset.entryTag, 10);
        var idx = parseInt(chip.dataset.idx, 10);
        App.data.meetings.forEach(function(mm){
          var e = (mm.entries || []).find(function(x){ return x.id === entryId; });
          if(e) e.tags.splice(idx, 1);
        });
        self.refresh();
      });
    });
    el.querySelectorAll('[data-add-entry-tag]').forEach(function(inp){
      inp.addEventListener('keydown', function(ev){
        if(ev.key === 'Enter' && inp.value.trim()){
          var entryId = parseInt(inp.dataset.addEntryTag, 10);
          App.data.meetings.forEach(function(mm){
            var e = (mm.entries || []).find(function(x){ return x.id === entryId; });
            if(e){ e.tags = e.tags || []; e.tags.push(inp.value.trim()); }
          });
          self.refresh();
        }
      });
    });
    el.querySelectorAll('[data-remove-entry]').forEach(function(btn){
      btn.addEventListener('click', function(){
        if(!confirm('Remove this entry?')) return;
        var entryId = parseInt(btn.dataset.removeEntry, 10);
        App.data.meetings.forEach(function(mm){ if(mm.entries) mm.entries = mm.entries.filter(function(e){ return e.id !== entryId; }); });
        self.refresh();
      });
    });
    el.querySelectorAll('[id^="entry-add-"]').forEach(function(slot){
      var meetingId = parseInt(slot.id.replace('entry-add-', ''), 10);
      App.addRow(slot, [{key:'writtenBy', placeholder:'Written by'}], 'Add entry', function(data){
        var m = App.data.meetings.find(function(x){ return x.id === meetingId; });
        var eid = Date.now() + Math.floor(Math.random()*1000);
        m.entries = m.entries || [];
        m.entries.push({ id:eid, writtenBy:data.writtenBy || '', note:'', actionItem:'', recommendation:'', tags:[] });
        App.state.openEntryIds[eid] = true;
        self.refresh();
      });
    });
  },

  refresh: function(){
    if(App.state.page === 'prospective' || App.state.page === 'established') App.Companies.renderDetail();
    else if(App.state.page === 'entrepreneurs') App.Entrepreneurs.renderDetail();
    else if(App.state.page === 'resources') App.Resources.renderDetail();
    else if(App.state.page === 'archived') App.Archived.renderDetail();
  }
};