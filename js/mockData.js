window.App = window.App || {};

App.data = {
  companies: [
  ],
  entrepreneurs: [
  ],
  resources: [

  ],
  contacts: [
   
  ],
  meetings: [
   
  ],
  investmentSchedules: [],
  utilities: [],
  jobs: [],
  abatements: [],
  rebates: [],
  incentives: [],
  calculations: [],
  lookups: {
    companyTypes: ['Manufacturing','Retail','Logistics','Food & Bev','Professional Services'],
    categories: ['High Priority','New Market','Existing Employer','Referral'],
    naicsCodes: [
      {code:'3311', label:'Primary metal manufacturing'},
      {code:'3121', label:'Beverage manufacturing'},
      {code:'4931', label:'Warehousing and storage'},
      {code:'3118', label:'Bakeries'}
    ],
    users: ['J. Alvarez','M. Kim']
  },
  importStaging: [
    { id:1, name:'Hill Country Robotics', naics:'3339', match:null },
    { id:2, name:'Redwood Manufacturing', naics:'3311', match:1 }
  ]
};

App.nextId = function(arr){
  return Math.max(0, ...arr.map(function(x){ return x.id; })) + 1;
};
