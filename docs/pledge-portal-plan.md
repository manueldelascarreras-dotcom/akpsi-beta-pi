# Pledge Portal: analysis and plan

## What exists today

| Piece | Files | Notes |
|---|---|---|
| Public website | `index.html`, `about.html`, `philanthropy.html`, `events.html`, `members.html`, `apply.html`, `update.html`, `site.js`, `sections.js`, `styles.css`, `sections.css` | Static pages that read content from Firestore `content/*` (live) or `data/*.json` (local). |
| Chapter CMS | `admin.html`, `admin.js`, `admin.css` | One shared password. Manages rush applications, members, events, gallery, and site text. |
| API | `functions/index.js` (live), `server.js` (local) | One Cloud Function behind `/api/**`. It validates every write, sniffs uploaded files by their first bytes, and streams private files only to signed-in admins. |
| Data | Firestore `content`, `applications`, `private`, `backups`; Storage `public/`, `private/uploads/` | Browsers can read only `content/*` and `public/*`. Everything else goes through the API. |

## What stays

- **The public website, unchanged.** The portal is a new area at `/portal.html`, linked from the footer.
- **The chapter CMS (rush applications, site content).** It still uses its own password for now (see "Later").
- **The API pattern.** All portal data goes through the one Cloud Function, and Firestore and Storage rules keep denying direct browser access. Role checks happen on the server in one place.
- **Shared code and assets.** File sniffing, upload limits, the private-file streaming approach, the fonts (Instrument Serif + Inter), and the CDN-free, no-build setup.

## What changes or gets added

1. **Accounts.** The portal uses Firebase Authentication (email + password, with password-reset emails). The browser sends its Firebase ID token to the API, and the API verifies it and looks up `users/{uid}` to get the role.
   - Invite codes are single-use and only work at sign-up. A code carries a role (and, for pledges, an optional educator), and it is burned once claimed.
   - Accounts without a role see nothing.
2. **One portal page, three dashboards.** The role decides which dashboard you get: `portal.html` + `portal.js` + `portal.css`.
3. **New Firestore collections**, all server-only:

| Collection | Shape |
|---|---|
| `users/{uid}` | name, email, role (`pledge` · `educator` · `vpm`), educatorUid (pledges), active, createdAt |
| `invites/{code}` | role, name, educatorUid, createdBy, createdAt, expiresAt, usedBy, usedAt |
| `portal/program` | className, startDate (Monday of Week 1), weeks[8]: { title, hole, summary, image } |
| `deliverables/{id}` | week, name, instructions, dueAt, resources[{ name, url \| path }], order |
| `submissions/{deliverableId__pledgeUid}` | files[{ name, path, type, size }], note, link, status (`submitted` · `needs_revision` · `approved`), late, submittedAt, educatorUid, history[{ at, by, byName, action, comment }] |
| `resources/{id}` | title, week (0 = general), description, url or file path |
| `announcements/{id}` | title, body, pinned, author, createdAt |
| `portalEvents/{id}` | title, date, time, location, week, kind (meeting · event · deadline) |

4. **Status is worked out, not stored twice:**
   - Approved, then Needs Revision, then Submitted (shown as Late if it came in after the due date).
   - With no submission: Late if past due, otherwise Not Started.
5. **Files.** Submissions go to Storage `private/portal/submissions/{pledgeUid}/{deliverableId}/…` and resources to `private/portal/resources/…`. They're streamed back through the API only to people allowed to see them: the pledge, their assigned educator, or VPMs. Resources are visible to any signed-in member.

## New API routes (`/api/portal/...`)

| Route | Who | Purpose |
|---|---|---|
| `POST /claim` | signed-in, no role yet | Redeem an invite code and create the profile |
| `GET /bootstrap` | everyone | Everything that role may see, in one request (program, deliverables, resources, announcements, events, plus own / assigned / all submissions and users) |
| `POST /submit/:deliverableId` | pledge | Upload files, a link, or a note. Resubmitting replaces the previous files. |
| `POST /review/:submissionId` | educator (assigned) · VPM | `approve`, `revise`, or `comment`, with a comment |
| `GET /file?path=` | per permissions above | Open a submission or resource in the browser |
| `PUT /program` | VPM | Class name, start date, week titles |
| `POST/PUT/DELETE /items/:collection/:id?` | VPM | Deliverables, resources, announcements, events (multipart for resource files) |
| `PATCH /users/:uid` | VPM | Role, assigned educator, active |
| `POST /invites`, `DELETE /invites/:code` | VPM | Make and revoke invite codes |

## Screens

- **Pledge:** Home (this week, scorecard, next due, feedback, announcements) · Program (Weeks 1–8 → deliverables) · Calendar · Resources. A deliverable opens in a side panel: instructions → drop file → **Submit**.
- **Educator:** Dashboard (to review, missing, late, my pledges' progress) · Review Queue (split view: file on the left; comment, **Approve**, **Request revision** on the right; it moves to the next one automatically; shortcuts A / R / J / K) · My Pledges.
- **VPM:** Dashboard with the progress matrix (rows = pledges, columns = deliverables grouped by week; green / yellow / red) and completion by week · Review Queue (all) · People (roles, educator assignments, invite codes) · Program CMS (weeks, deliverables, resources, announcements, calendar).

## Design

- **Colors:** deep green `#0F3B2E`, cream `#F6F1E4`, muted gold `#B8975A`, navy `#13233F`.
- **Type:** Instrument Serif headings, Inter UI.
- **Photography:** real golf-course photos (Unsplash) on the sign-in screen and week headers.
- **Golf references stay quiet:** "Hole 3" under each **Week 3**, a scorecard row for weekly progress, and a small pennant on the current week. No golf icons.

## Later (not in this pass)

- Move the chapter CMS onto the same accounts (for example, a `site-admin` permission for VPMs) and retire its shared password.
- Email or push notifications when work is reviewed.
