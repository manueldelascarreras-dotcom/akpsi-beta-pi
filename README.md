# AKPsi Beta Pi Website

The chapter website, a rush application form, and a CMS to manage everything. It is live on Firebase at **https://umiami-akpsi.web.app** (CMS: https://umiami-akpsi.web.app/admin.html). The code is on GitHub at manueldelascarreras-dotcom/akpsi-beta-pi.

## Run it locally

```bash
node server.js
```

- Website: http://localhost:3457
- CMS: http://localhost:3457/admin.html

Locally the site reads and writes the files in `data/` and `private/`. The live site does not use these files: it reads and saves everything in Firebase (see below), so make content changes in the live CMS.

## Pledge Portal (the home page)

The site's home page (`index.html`) is the 8-week pledge program platform, laid out like Google Classroom: **Stream** (announcements, what's due), **Classwork** (Weeks 1–8 as topics, each with assignments to turn in and materials such as PDFs that open right in the page), **Calendar**, **Grades**, and **People**. VPMs post through **Classwork → Create** (assignment, material, announcement). The old chapter homepage is `chapter.html`; `portal.html` forwards to the home page so old links keep working.

**Preview code:** `TEEOFF26` opens the portal with a sample class (pick Pledge, Pledge educator, or VPM). Nothing is saved. Turn it off by setting `PREVIEW_CODE = ''` near the top of `portal.js` once real pledges are in.

One login, three roles:

| Role | Sees |
|---|---|
| Pledge | Their weeks (Week 1–8, each a "hole"), deliverables with due dates and status, feedback, calendar, resources. A deliverable submits in a few clicks: open it (or drag a file onto it), drop the file, Submit. |
| Pledge Educator | Only their assigned pledges. Dashboard → Review queue → file opens in the browser → comment → Approve or Request revision → next one loads. Shortcuts: A approve, R revise, J/K next/previous, ⌘ Enter approve while typing. |
| VPM | Everything: progress matrix (pledges × deliverables, green/yellow/red), completion by week, all reviews, People & access (roles, educator assignments, invite codes), and the Program CMS (weeks, deliverables, resources, announcements, calendar). |

Accounts use Firebase Authentication (email + password, with reset emails). Invite codes are single-use and only for creating an account; the code sets the role. VPMs make codes in **People & access → Invite codes**.

Statuses: Not Started, Submitted, Late, Needs Revision, Approved. The full design and data model are in `docs/pledge-portal-plan.md`.

Try it locally with sample data: run `firebase emulators:start`, then `node scripts/seed-emulator.js`, and open http://127.0.0.1:5002/ (test logins are listed at the top of the seed script; they only exist in the emulator).

## Pages

| Page | What's on it |
|---|---|
| `index.html` | Pledge portal (home page) |
| `chapter.html` | Chapter homepage: hero, apply, network, philanthropy preview, weekly calendar, e-board preview |
| `about.html` | About: video, our story, pillars, core values (BUSIK), gallery, stats |
| `philanthropy.html` | Philanthropy: suicide prevention, 988 support, how to support a friend, philanthropy events |
| `events.html` | Events: week-by-week calendar plus every upcoming and past event, grouped by month |
| `members.html` | E-Board, Pledge Educators, Brothers, NIBs |
| `apply.html` | Rush application form |
| `admin.html` | CMS (password protected) |

## The CMS

| Section | What you can do |
|---|---|
| Applications | See every applicant per semester: how many applied, on time vs. late, applications per day, and status counts. Click anyone to see their headshot, resume, and answers, set a status (New, Reviewing, Interview, Bid extended, Not moving forward), and keep private notes. Export a semester to Excel. |
| Members | Import an Excel sheet to update every member and their LinkedIn at once (download the template to see the columns). You can also add, edit, reorder, or remove people one at a time and upload headshots. |
| Events | Month calendar: click a day to add an event, click an event to edit it. A List view and Excel import are also available. |
| Gallery | Upload photos with a title and description. They show in "Life at Beta Pi" on the About page. |
| Rush Settings | Semester, deadline, open/closed, and the rush timeline. Changing the semester starts a fresh list; older semesters stay in Applications. |
| Site Content | Social links, About video, core value photos, stats, spotlight, philanthropy text, network logos, and an advanced editor for everything else. |

### Profile update link

Brothers add their own headshot and LinkedIn at `update.html`. They search for their name, upload a photo, paste their LinkedIn URL, fix their major, pledge class, or graduation year, and enter the chapter code. Their card updates on the Members page right away.

Manage it at the top of **Members** in the CMS: copy the invite message for the group chat, change the code, pause updates, or turn on "Review updates before they go live". Every update is listed there with Undo (or Approve / Reject when review is on). On the live site the code, settings and update log live in Firestore (`private/settings`, `private/updates`).

Edits show a "Save changes" bar. Nothing changes on the website until you save. Excel imports and photo uploads publish right away.

### Excel columns

- **Members:** Name, Group, Role, Major, Minor, Pledge Class, Graduation Year, LinkedIn, Photo. Group can be E-Board, Pledge Educator, Brother, or NIB (several are allowed, separated by commas). Column names don't have to match exactly; "Full Name", "Position", or "Class Of" work too.
- **Events:** Title, Date, Time, Location, Type.

## How applications work

- Applicants fill out `apply.html`: name, email, phone, hometown, major, year, graduation, why they want to rush, plus a PDF resume and a professional headshot (JPG/PNG).
- Each application is filed under the semester set in Rush Settings. Submissions after the deadline are accepted and marked late.
- If someone applies twice in the same semester with the same email, their latest submission replaces the earlier one (marked "Updated").
- Applications, resumes, and headshots are stored in `private/`, which the server never serves publicly. Only someone logged into the CMS can see them.

## Files

| Path | What's in it |
|---|---|
| `data/site.json` | Site text, links, rush settings, philanthropy, values, stats, network |
| `data/members.json` | `eboard`, `pledgeEducators`, `brothers`, `nibs` |
| `data/events.json` | Events |
| `data/gallery.json` | Gallery photos and captions |
| `images/` | Crest and uploaded photos (`gallery/`, `members/`, `values/`, `site/`) |
| `private/` | Applications, applicant files, CMS password, automatic backups. **Keep this folder private and back it up.** |

Every CMS save keeps a backup of the previous version in `private/backups/` (the last 30 per file).

Styles: `styles.css` (base, nav, footer, member cards), `sections.css` (page sections), `admin.css` (CMS). Scripts: `site.js` (nav, theme, member cards), `sections.js` (renders sections from data), `admin.js` (CMS).

## Live site (Firebase)

Firebase project: **umiami-akpsi** (Blaze plan, same billing account as the soccer site).

| Piece | Where |
|---|---|
| Pages, CSS, JS, crest | Firebase Hosting |
| API (`/api/**`): applications, CMS login and saves, uploads, profile updates | Cloud Function `api` in `functions/index.js` (same routes as `server.js`) |
| Site content (site, members, events, gallery) | Firestore `content/{name}`, publicly readable; only the API writes it |
| Applications, CMS password, update code and log, backups | Firestore `applications`, `private`, `backups` (not readable from the browser) |
| Uploaded photos and video | Storage `public/...` |
| Resumes and headshots | Storage `private/uploads/...` (only through the logged-in CMS) |

Deploy after changing code:

```bash
firebase deploy --project umiami-akpsi
```

Uploads through the live CMS are limited to 30 MB each. For the About video, paste a YouTube or Vimeo link instead of uploading a large file.

## Themes

The site has two themes, Professional (dark marine blue, the default) and Miami Vice (neon pink and teal). Visitors switch with the toggle at the bottom of the home hero or in the footer. Theme colors are the CSS variables at the top of `styles.css`.
