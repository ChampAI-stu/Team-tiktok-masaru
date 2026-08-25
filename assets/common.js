/* MASARU TikTok Portal — common.js
   ★ ตั้งค่า Supabase ที่ CFG ด้านล่างก่อนใช้งาน */
const CFG = {
  url : 'https://gigrcfsidqhuiuqqtzcz.supabase.co',   // tiktokteam.masaru
  anon: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpZ3JjZnNpZHFodWl1cXF0emN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc2MzA5MTksImV4cCI6MjEwMzIwNjkxOX0.pS5eJRWUr3BYAZaoAZL85WPv0MU78M7bX3qz_6Hf59g',
  invite: { head: 'MSR-TTLEAD-7H3M2P', staff: 'MSR-TTCREW-4X9V6R' }
};

const sb = window.supabase.createClient(CFG.url, CFG.anon, {
  auth: { persistSession: true, autoRefreshToken: true }
});

/* ---------- format ---------- */
const fmtB  = n => (n === null || n === undefined || isNaN(n)) ? '-' :
  Number(n).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtB0 = n => (n === null || n === undefined || isNaN(n)) ? '-' :
  Number(n).toLocaleString('th-TH', { maximumFractionDigits: 0 });
const fmtN  = n => (n === null || n === undefined || isNaN(n)) ? '-' :
  Number(n).toLocaleString('th-TH');
const fmtPct = n => (n === null || n === undefined || isNaN(n)) ? '-' : (Number(n) * 100).toFixed(1) + '%';
const fmtX   = n => (n === null || n === undefined || isNaN(n) || Number(n) === 0) ? '-' : Number(n).toFixed(2) + 'x';
const esc = s => String(s ?? '').replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const thDate = d => { if (!d) return '-'; const x = new Date(d);
  return String(x.getDate()).padStart(2, '0') + '/' + String(x.getMonth() + 1).padStart(2, '0') + '/' + (x.getFullYear() + 543); };
const ymTh = ym => { if (!ym) return '-'; const [y, m] = ym.split('-');
  return ['','ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'][+m] + ' ' + (+y + 543); };
const todayISO = () => new Date().toISOString().slice(0, 10);
const monthStartISO = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10); };

/* ---------- toast ---------- */
function toast(msg, kind) {
  document.querySelectorAll('.toast').forEach(t => t.remove());
  const el = document.createElement('div');
  el.className = 'toast' + (kind ? ' ' + kind : '');
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3600);
}

/* ---------- cache 10 นาที ---------- */
const CK = 'mtt_';
function cacheGet(k) {
  try { const r = JSON.parse(sessionStorage.getItem(CK + k) || 'null');
    if (r && Date.now() - r.t < 600000) return r.v; } catch (e) {}
  return null;
}
function cacheSet(k, v) { try { sessionStorage.setItem(CK + k, JSON.stringify({ t: Date.now(), v })); } catch (e) {} }
function cacheClear() { Object.keys(sessionStorage).filter(k => k.startsWith(CK)).forEach(k => sessionStorage.removeItem(k)); }

/* ---------- rpc + cache ---------- */
async function rpc(fn, args, useCache = true) {
  const key = fn + ':' + JSON.stringify(args || {});
  if (useCache) { const c = cacheGet(key); if (c) return c; }
  const { data, error } = await sb.rpc(fn, args || {});
  if (error) { console.error(fn, error); toast('ดึงข้อมูลไม่สำเร็จ: ' + error.message, 'err'); return []; }
  cacheSet(key, data || []);
  return data || [];
}

/* ---------- auth ---------- */
let ME = null;
async function requireAuth() {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) { location.href = 'index.html'; return null; }
  const { data } = await sb.from('tt_profiles').select('*').eq('id', session.user.id).single();
  ME = { id: session.user.id, email: session.user.email,
         name: data?.full_name || session.user.email, role: data?.role || 'staff' };
  return ME;
}
const isHead = () => ME?.role === 'head';
async function logout() { await sb.auth.signOut(); cacheClear(); location.href = 'index.html'; }

/* ---------- nav ---------- */
const NAV = [
  ['index.html', 'หน้าหลัก'], ['sales.html', 'ยอดขาย'], ['expense.html', 'ค่าใช้จ่าย'],
  ['ads.html', 'ค่าแอด'], ['tutorial.html', 'Tutorial'], ['import.html', 'นำเข้าข้อมูล']
];
function renderTop(active) {
  const el = document.getElementById('top');
  if (!el) return;
  el.innerHTML = `<div class="top-in">
    <div class="brand"><span class="dot">🎵</span><span>MASARU TikTok<small>Team Portal</small></span></div>
    <nav class="nav">${NAV.map(([h, t]) =>
      `<a href="${h}" class="${h === active ? 'on' : ''}">${t}</a>`).join('')}</nav>
    <div class="who">
      <span>${esc(ME?.name || '')}</span>
      <span class="chip-role">${ME?.role === 'head' ? 'หัวหน้า' : 'ทีม'}</span>
      <button class="icon-btn" onclick="cacheClear();location.reload()" title="ล้างแคชแล้วโหลดใหม่">⟳</button>
      <button class="icon-btn" onclick="logout()">ออก</button>
    </div></div>`;
}

/* ---------- tabs ---------- */
function bindTabs(sel, onChange) {
  const box = document.querySelector(sel);
  if (!box) return;
  box.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    box.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
    document.querySelectorAll('[data-pane]').forEach(p => p.classList.toggle('hide', p.dataset.pane !== b.dataset.tab));
    if (onChange) onChange(b.dataset.tab);
  });
}

/* ---------- ตารางง่าย ๆ ---------- */
function tableHTML(cols, rows, footer) {
  if (!rows.length) return '<div class="empty">ยังไม่มีข้อมูล — อัปโหลดไฟล์ที่หน้า “นำเข้าข้อมูล”</div>';
  const th = cols.map(c => `<th class="${c.num ? 'num' : ''}">${c.t}</th>`).join('');
  const tb = rows.map(r => '<tr>' + cols.map(c =>
    `<td class="${c.num ? 'num' : ''}">${c.r ? c.r(r) : esc(r[c.k] ?? '-')}</td>`).join('') + '</tr>').join('');
  const tf = footer ? `<tfoot><tr>${cols.map(c =>
    `<td class="${c.num ? 'num' : ''}">${footer[c.k] ?? ''}</td>`).join('')}</tr></tfoot>` : '';
  return `<div class="tbl-wrap"><table><thead><tr>${th}</tr></thead><tbody>${tb}</tbody>${tf}</table></div>`;
}
const sum = (rows, k) => rows.reduce((a, r) => a + (Number(r[k]) || 0), 0);

/* ---------- export excel ---------- */
function exportXLSX(sheets, filename) {
  const wb = XLSX.utils.book_new();
  sheets.forEach(s => XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(s.aoa), s.name.slice(0, 31)));
  XLSX.writeFile(wb, filename);
}
