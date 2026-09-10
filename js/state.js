window.App = window.App || {};

App.state = {
  page: 'prospective',
  selected: null,
  activeSection: null,
  activeScenarioIndex: 0,
  search: '',
  openMeetingIds: {},  // meetingId -> bool, tracks which meeting cards are expanded
  openEntryIds: {},     // entryId -> bool, tracks which written-by entries are expanded
   openAppSections: {}
};

App.pendingSelection = null;