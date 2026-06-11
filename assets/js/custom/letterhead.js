// Letterhead maker — branded header/footer with optional body text, in three
// header styles. Produces a single-page letterhead (or a typed letter).

import { Sheet, COLORS, initCustomDoc } from './kit.js';

const $ = (s) => document.querySelector(s);

const state = {
  name: '', tagline: '', address: '', email: '', phone: '', website: '',
  logo: '', style: 'rule', accent: '#11233f', font: 'serif',
  body: '', pageSize: 'a4',
};

function layout(measure) {
  const s = new Sheet(state.pageSize, measure);
  const head = state.font === 'serif' ? 'timesB' : 'helvB';
  const accent = state.accent || COLORS.ink;

  // ---------- header ----------
  if (state.style === 'band') {
    s.rect(0, 0, s.W, 92, { fill: accent });
    if (state.logo) s.image(state.logo, s.left, 22, 48, 48);
    const hx = state.logo ? s.left + 60 : s.left;
    s.text(state.name || 'Your business', hx, 32, 19, head, COLORS.white);
    if (state.tagline) s.text(state.tagline, hx, 58, 9, 'helv', '#ffffffcc');
    const contact = [state.email, state.phone, state.website].filter(Boolean).join('   ·   ');
    if (contact) s.text(contact, s.right, 38, 8.5, 'helv', '#ffffffcc', 'right');
    if (state.address) s.text(state.address.replace(/\n/g, ', '), s.right, 52, 8.5, 'helv', '#ffffffcc', 'right');
    s.y = 130;
  } else if (state.style === 'centered') {
    s.y = 54;
    if (state.logo) { s.image(state.logo, s.W / 2 - 26, s.y, 52, 52); s.y += 60; }
    s.text(state.name || 'Your business', s.W / 2, s.y, 21, head, COLORS.ink, 'center');
    s.y += 26;
    if (state.tagline) { s.text(state.tagline, s.W / 2, s.y, 9.5, 'helvO', COLORS.muted, 'center'); s.y += 16; }
    const contact = [state.address.replace(/\n/g, ', '), [state.email, state.phone, state.website].filter(Boolean).join('   ·   ')].filter(Boolean);
    for (const lineStr of contact) {
      s.text(lineStr, s.W / 2, s.y, 8.5, 'helv', COLORS.muted, 'center');
      s.y += 13;
    }
    s.y += 10;
    s.line(s.left + 40, s.y, s.right - 40, s.y, COLORS.gold, 0.8);
    s.y += 30;
  } else { // rule
    if (state.logo) s.image(state.logo, s.left, s.y, 52, 52);
    const hx = state.logo ? s.left + 64 : s.left;
    s.text(state.name || 'Your business', hx, s.y + 6, 19, head, COLORS.ink);
    if (state.tagline) s.text(state.tagline, hx, s.y + 32, 9.5, 'helvO', COLORS.muted);
    const contact = [state.email, state.phone, state.website].filter(Boolean);
    contact.forEach((c, i) => s.text(c, s.right, s.y + 4 + i * 13, 8.5, 'helv', COLORS.muted, 'right'));
    s.y += 64;
    s.line(s.left, s.y, s.right, s.y, accent, 1.6);
    s.line(s.left, s.y + 3, s.right, s.y + 3, COLORS.gold, 0.6);
    s.y += 34;
  }

  // ---------- body ----------
  if (state.body) {
    s.para(state.body, s.left, 10.5, state.font === 'serif' ? 'times' : 'helv', COLORS.ink, s.contentW, 17);
  }

  // ---------- footer ----------
  const fy = s.H - 44;
  s.line(s.left, fy - 12, s.right, fy - 12, COLORS.hairline, 0.6);
  const footBits = [state.address.replace(/\n/g, ', '), state.email, state.phone, state.website].filter(Boolean).join('   ·   ');
  if (footBits) s.text(footBits, s.W / 2, fy, 7.5, 'helv', COLORS.faint, 'center');

  return s.pages;
}

const app = initCustomDoc({
  layout,
  filename: () => `Letterhead-${(state.name || 'business').replace(/\s+/g, '-')}.pdf`,
});

for (const key of ['name', 'tagline', 'address', 'email', 'phone', 'website', 'style', 'accent', 'font', 'body', 'pageSize']) {
  const el = $(`#f-${key}`);
  if (!el) continue;
  el.value = state[key];
  el.addEventListener('input', () => { state[key] = el.value; app.refresh(); });
}

$('#logo-input').addEventListener('change', () => {
  const f = $('#logo-input').files[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = () => { state.logo = r.result; app.refresh(); };
  r.readAsDataURL(f);
});
$('#logo-clear').addEventListener('click', () => { state.logo = ''; $('#logo-input').value = ''; app.refresh(); });
