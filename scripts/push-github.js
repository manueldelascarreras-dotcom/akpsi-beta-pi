/*
 * Commit the project to GitHub through the REST API, for machines where local
 * git isn't available (on this Mac, git needs the Xcode license accepted first).
 *
 *   GH_TOKEN=$(gh auth token) node scripts/push-github.js <owner/repo> "<commit message>"
 *
 * Uploads every project file except private data, dependencies, logs, and CSVs,
 * and makes one commit on main with exactly that tree.
 */
const fs = require('fs'), path = require('path');
const [, , repo, message] = process.argv;
const T = process.env.GH_TOKEN;
if (!repo || !message || !T) { console.error('Usage: GH_TOKEN=... node scripts/push-github.js <owner/repo> "<message>"'); process.exit(1); }
const SKIP = /^(private|node_modules|functions\/node_modules|\.git|\.claude|\.gstack|\.firebase)(\/|$)|(^|\/)\.DS_Store$|\.log$|\.csv$/;
const files = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const rel = path.relative('.', path.join(d, e.name));
    if (SKIP.test(rel)) continue;
    e.isDirectory() ? walk(path.join(d, e.name)) : files.push(rel);
  }
})('.');
const gh = async (method, url, body) => {
  const r = await fetch(`https://api.github.com/repos/${repo}${url}`, { method, headers: { Authorization: `Bearer ${T}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' }, body: body && JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok && r.status !== 404 && r.status !== 409) throw new Error(`${method} ${url} ${r.status} ${JSON.stringify(j).slice(0, 200)}`);
  return { status: r.status, j };
};
(async () => {
  const ref = await gh('GET', '/git/ref/heads/main');
  let parent = ref.status === 200 ? ref.j.object.sha : null;
  if (!parent) {   // empty repo: the git data API needs one commit first
    await gh('PUT', '/contents/.gitkeep', { message: 'Initialize', content: '' });
    parent = (await gh('GET', '/git/ref/heads/main')).j.object.sha;
  }
  const tree = [];
  for (const f of files) {
    const blob = await gh('POST', '/git/blobs', { content: fs.readFileSync(f).toString('base64'), encoding: 'base64' });
    tree.push({ path: f, mode: '100644', type: 'blob', sha: blob.j.sha });
  }
  const t = await gh('POST', '/git/trees', { tree });
  const c = await gh('POST', '/git/commits', { message, tree: t.j.sha, parents: [parent] });
  await gh('PATCH', '/git/refs/heads/main', { sha: c.j.sha, force: true });
  console.log(`pushed ${files.length} files, commit ${c.j.sha.slice(0, 7)}`);
})().catch(e => { console.error(e.message); process.exit(1); });
