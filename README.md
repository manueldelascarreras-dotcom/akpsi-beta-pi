# AKPsi Beta Pi Website

The chapter website, a rush application form, and a CMS to manage everything. It runs on a small Node server (`server.js`) with no other dependencies.

## Run it

```bash
node server.js
```

- Website: http://localhost:3457
- CMS: http://localhost:3457/admin.html

The first time you open the CMS it asks you to create the admin password. Share it only with the e-board.

## Pages

| Page | What's on it |
|---|---|
| `index.html` | Home: hero, apply, network, philanthropy preview, weekly calendar, e-board preview |
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

Manage it at the top of **Members** in the CMS: copy the invite message for the group chat, change the code, pause updates, or turn on "Review updates before they go live". Every update is listed there with Undo (or Approve / Reject when review is on). The code and settings live in `private/settings.json`, and the update log in `private/updates.json`.

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

## Putting it online

Because the CMS saves data and files, the site needs a host that runs Node and keeps files on disk (for example Render, Railway, or Fly.io with a persistent disk, or any small VPS). A static-only host like GitHub Pages or plain Firebase Hosting can't run the CMS or accept applications. The server reads the `PORT` environment variable if the host sets one.

## Themes

The site has two themes, Professional (dark marine blue, the default) and Miami Vice (neon pink and teal). Visitors switch with the toggle at the bottom of the home hero or in the footer. Theme colors are the CSS variables at the top of `styles.css`.
