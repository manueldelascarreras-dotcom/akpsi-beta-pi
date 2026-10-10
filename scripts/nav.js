// Rewrites the nav, mobile menu, and footer links on a page to the standard set.
// Usage: node nav.js <file> <current: home|about|philanthropy|members>
const fs = require('fs');
const [, , file, current] = process.argv;
let s = fs.readFileSync(file, 'utf8');
const onHome = current === 'home';
const home = onHome ? '' : 'chapter.html';
const items = [
  ['home', 'Home', 'chapter.html'],
  ['about', 'About', 'about.html'],
  ['philanthropy', 'Philanthropy', 'philanthropy.html'],
  ['members', 'Members', 'members.html'],
  ['events', 'Events', 'events.html'],
];
const cur = k => k === current ? ' aria-current="page"' : '';

const navUl = `<ul class="nav-links">
${items.map(([k, label, href]) => `      <li><a href="${href}"${cur(k)}>${label}</a></li>`).join('\n')}
      <li><a href="apply.html" class="nav-cta"${current === "apply" ? " aria-current=\"page\"" : ""}>Apply</a></li>
    </ul>`;
const mobile = `<div id="mobile-menu" aria-label="Site navigation">
${items.map(([, label, href]) => `    <a href="${href}">${label}</a>`).join('\n')}
    <a href="apply.html">Apply</a>
  </div>`;
const footer = `<nav class="footer-links" aria-label="Footer navigation">
${items.filter(([k]) => k !== current).map(([, label, href]) => `        <a href="${href}">${label}</a>`).join('\n')}
        <a href="apply.html">Apply</a>
        <a href="./">Pledge Portal</a>
        <a data-link="instagram" href="#" target="_blank" rel="noopener noreferrer">Instagram</a>
        <a data-link="tiktok" href="#" target="_blank" rel="noopener noreferrer">TikTok</a>
      </nav>`;

const swap = (re, rep, name) => { if (!re.test(s)) throw new Error('missing ' + name + ' in ' + file); s = s.replace(re, rep); };
swap(/<ul class="nav-links">[\s\S]*?<\/ul>/, navUl, 'nav');
swap(/<div id="mobile-menu"[^>]*>[\s\S]*?<\/div>/, mobile, 'mobile menu');
swap(/<nav class="footer-links"[^>]*>[\s\S]*?<\/nav>/, footer, 'footer links');
fs.writeFileSync(file, s);
console.log('ok', file);
