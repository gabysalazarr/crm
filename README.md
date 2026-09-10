# Bastrop Economic Development — Frontend Prototype

A fully working click-through prototype of the redesigned dashboard, built in
plain HTML/CSS/JS with no build step. Open `index.html` directly in a
browser — no server required.

## What's here

- All 6 sections: Companies (Prospective/Established/Archived), Entrepreneurs,
  Resources, Reports, Import, Lookups
- Full company detail with the status-specific section sets we agreed on:
  - Prospective: General, Investment, Jobs, Abatements, Rebates, Incentives, Calculate
  - Established: Contact Info, Meetings
  - Archived: Company Details, Company History (read-only)
- Edit/Save/Cancel with field locking, and navigation disabled while editing
- Entrepreneur → Company transition (entrepreneur record persists but drops
  off the list, per your spec)
- Payback calculator with multiple named scenarios per company
- Search scoped to the current status tab
- Empty states ("Add a company to get started")
- Everything runs off mock data in `js/mockData.js`

## Structure

```
index.html          Page shell + persistent nav
css/style.css        All design tokens and styling
js/mockData.js        Stand-in for the future backend — all data lives here
js/state.js            Shared app state (selected record, edit mode, etc.)
js/render.js           Shared render helpers (empty states, formatting)
js/companies.js         Companies page (list, detail, all 7 sections, calculator)
js/entrepreneurs.js      Entrepreneurs page
js/resources.js           Resources page
js/reports.js               Report selector + export placeholders
js/importPage.js             Bulk import staging review
js/lookups.js                  Manage dropdown values
js/router.js                    Hash-based routing (#/companies, #/reports, etc.)
js/app.js                        Entry point
```

## Known shortcuts (intentional, for this prototype stage)

- **`prompt()`/`confirm()` for quick-add flows** (new meeting, new job
  category, transition confirmation, etc.) — these are placeholders standing
  in for proper modal forms. Fine for testing flow and data shape; swap for
  real modals before this goes to real users.
- **No persistence** — refreshing the page resets all mock data. That's
  expected; there's no backend yet.
- **Reports/Import export buttons** just show an alert — actual PDF/Excel
  generation happens once the backend exists.

## Next step

Everything in `App.data` (mockData.js) is written to look like what the real
Access tables will become. The cleanest path from here is:
1. Confirm the real field names against your Access schema
2. Build the Node/Express + PostgreSQL backend we scoped out earlier
3. Replace `App.data` reads/writes with `fetch()` calls to that API —
   nothing else in the other files should need to change, since they all
   already read `App.data` as if it were already asynchronous-safe.
