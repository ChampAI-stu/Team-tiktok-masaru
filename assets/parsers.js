/* MASARU TikTok Portal — parsers.js
   จับหัวคอลัมน์อัตโนมัติจากชื่อภาษาไทย/อังกฤษ (ALIAS)
   เมื่อได้ไฟล์จริงจากทีม ให้เพิ่มชื่อคอลัมน์ลงใน ALIAS ก็พอ ไม่ต้องแก้ตรรกะ */

const ALIAS = {
  sales: {
    order_date  : ['วันที่', 'วันที่สั่งซื้อ', 'วันที่ทำรายการ', 'order date', 'created time', 'วันที่ขาย', 'เวลาสั่งซื้อ'],
    order_no    : ['เลขที่ออเดอร์', 'order id', 'order no', 'หมายเลขคำสั่งซื้อ', 'เลขออเดอร์', 'หมายเลขออเดอร์ภายใน', 'เลขออเดอร์ออนไลน์'],
    shop        : ['ร้านค้า', 'ร้าน', 'shop', 'shop name', 'store', 'ชื่อร้าน'],
    sku         : ['sku', 'รหัสสินค้า', 'seller sku', 'รหัส'],
    product_name: ['ชื่อสินค้า', 'สินค้า', 'product name', 'product'],
    qty         : ['จำนวน', 'qty', 'quantity', 'จำนวนชิ้น'],
    amount      : ['ยอดขาย', 'ยอดเงิน', 'มูลค่า', 'total', 'amount', 'ยอดสุทธิ', 'ราคาขาย', 'gmv',
                   'ยอดเงินตัดส่วนลด', 'จำนวนเงินจำกัด (ตัดส่วนลด)', 'จำนวนเงินจำกัด'],
    staff       : ['ผู้รับผิดชอบ', 'ผู้ดูแล', 'พนักงาน', 'ทีม', 'staff', 'owner', 'ชื่อ', 'name']
  },
  expense: {
    exp_date    : ['วันที่', 'วันที่จ่าย', 'วันที่ใช้จ่าย', 'date'],
    category    : ['หมวด', 'หมวดหมู่', 'ประเภท', 'ประเภทค่าใช้จ่าย', 'category', 'รายการหลัก'],
    detail      : ['รายละเอียด', 'รายการ', 'detail', 'description', 'คำอธิบาย'],
    shop        : ['ร้านค้า', 'ร้าน', 'shop'],
    staff       : ['ผู้รับผิดชอบ', 'ผู้เบิก', 'พนักงาน', 'staff', 'ผู้ขอ'],
    amount      : ['จำนวนเงิน', 'ยอดเงิน', 'ค่าใช้จ่าย', 'amount', 'ยอด', 'total', 'บาท'],
    note        : ['หมายเหตุ', 'note', 'remark']
  },
  ads: {
    ad_date     : ['วันที่', 'date', 'วัน'],
    shop        : ['ร้านค้า', 'ร้าน', 'shop'],
    ad_type     : ['ประเภทแอด', 'ประเภท', 'รูปแบบแอด', 'ad type', 'campaign type'],
    campaign    : ['ชื่อแคมเปญ', 'แคมเปญ', 'campaign', 'campaign name'],
    sku         : ['sku', 'รหัสสินค้า'],
    product_name: ['ชื่อสินค้า', 'สินค้า', 'product name'],
    owner       : ['ผู้รับผิดชอบ', 'คนยิงแอด', 'ผู้ดูแล', 'owner', 'staff', 'ชื่อ'],
    spend       : ['ค่าแอด', 'ค่าโฆษณา', 'งบโฆษณา', 'spend', 'cost', 'ยอดค่าแอด', 'ค่าแอด (บาท)'],
    gmv         : ['ยอดขายจากแอด', 'ยอดขาย', 'gmv', 'revenue', 'ยอดขายจากแอด (บาท)'],
    orders      : ['จำนวนออเดอร์', 'ออเดอร์', 'orders', 'order'],
    impressions : ['การมองเห็น', 'impressions', 'impression', 'ยอดวิว', 'view'],
    clicks      : ['คลิก', 'clicks', 'click'],
    note        : ['หมายเหตุ', 'note', 'remark']
  }
};

const norm = s => String(s ?? '').toLowerCase()
  .replace(/[\u200b\u200c\ufeff]/g, '')            // zero-width space ที่ติดมากับ export
  .replace(/\u0e4d\u0e32/g, '\u0e33')               // "จํานวน" -> "จำนวน"
  .replace(/\s*\([a-z]{1,3}\)\s*$/i, '')           // ตัด (A) (BM) ท้ายหัวคอลัมน์
  .replace(/[\s\u00a0]+/g, '').replace(/[()฿,.\-_/:]/g, '');

/* หาแถวหัวตาราง: แถวที่ match alias ได้มากที่สุดใน 15 แถวแรก */
function findHeader(aoa, alias) {
  const keys = Object.values(alias).flat().map(norm);
  let best = { row: -1, hit: 0 };
  for (let r = 0; r < Math.min(15, aoa.length); r++) {
    const hit = (aoa[r] || []).filter(c => c && keys.includes(norm(c))).length;
    if (hit > best.hit) best = { row: r, hit };
  }
  return best.hit >= 2 ? best.row : -1;
}

function mapColumns(headerRow, alias) {
  const map = {};
  headerRow.forEach((cell, i) => {
    const n = norm(cell);
    if (!n) return;
    for (const [field, names] of Object.entries(alias)) {
      if (map[field] !== undefined) continue;
      if (names.map(norm).includes(n)) { map[field] = i; break; }
    }
  });
  return map;
}

/* ---------- ตัวแปลงค่า ---------- */
function toNum(v) {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'number') return v;
  const s = String(v).replace(/[,\s฿]/g, '').replace(/บาท/g, '').replace(/\((.+)\)/, '-$1');
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}
function toDate(v) {
  if (v === null || v === undefined || v === '') return null;
  if (v instanceof Date && !isNaN(v)) return iso(v);
  if (typeof v === 'number') {                      // Excel serial
    const d = XLSX.SSF.parse_date_code(v);
    if (!d) return null;
    return `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
  }
  const s = String(v).trim();
  let m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);   // DD/MM/YYYY
  if (m) { let y = +m[3]; if (y < 100) y += 2500; if (y > 2400) y -= 543; return `${y}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`; }
  m = s.match(/^(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})/);          // YYYY-MM-DD
  if (m) { let y = +m[1]; if (y > 2400) y -= 543; return `${y}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`; }
  const d = new Date(s);
  return isNaN(d) ? null : iso(d);
}
const iso = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

/* เดือนจากชื่อชีท เช่น "ค่าแอดเดือน 7" / "เดือน 7" / "ก.ค." */
function monthFromSheetName(name) {
  let m = String(name).match(/เดือน\s*(\d{1,2})/);
  if (m) return +m[1];
  const th = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
  const i = th.findIndex(t => String(name).includes(t.replace(/\./g, '')) || String(name).includes(t));
  return i >= 0 ? i + 1 : null;
}

/* เดาชนิดข้อมูลจากชื่อชีท */
function guessKind(sheetName) {
  const n = String(sheetName);
  if (/ค่าแอด|โฆษณา|ads?/i.test(n)) return 'ads';
  if (/ค่าใช้จ่าย|รายจ่าย|expense|cost/i.test(n)) return 'expense';
  if (/ยอดขาย|รายได้|sales?|order/i.test(n)) return 'sales';
  return null;
}

/* ---------- fallback: ชีทค่าแอดที่ไม่มีหัวตาราง ----------
   รองรับรูปแบบที่ทีมส่งมา เช่น:  [เดือน 7 | ค่า Ads | เพลง | Ministores30 | 662064.39]
   อ่านแบบอิงตำแหน่ง: ข้อความ 2 ตัวท้ายก่อนตัวเลข = ผู้รับผิดชอบ, ร้านค้า */
function parseAdsFlat(aoa, sheetName, opt = {}) {
  const rows = [], skipped = [];
  const year = opt.year || new Date().getFullYear();
  let sheetMonth = monthFromSheetName(sheetName);

  aoa.forEach((raw, i) => {
    if (!raw || raw.every(c => c === null || c === '')) return;
    const cells = raw.filter(c => c !== null && c !== '');
    const line = cells.map(c => String(c)).join(' ');
    if (/รวมทั้งสิ้น|รวมทั้งหมด|^รวม|total/i.test(line.trim())) { skipped.push({ row: i + 1, reason: 'แถวสรุปยอด' }); return; }

    const nums = cells.map(toNum).filter(n => n !== null && n !== 0);
    const spend = nums.length ? nums[nums.length - 1] : null;
    if (spend === null) { skipped.push({ row: i + 1, reason: 'ไม่มีตัวเลขค่าแอด' }); return; }

    let month = sheetMonth;
    const texts = [];
    cells.forEach(c => {
      const t = String(c).trim();
      if (toNum(c) !== null && !isNaN(Number(String(c).replace(/,/g, '')))) return;
      const m = t.match(/เดือน\s*(\d{1,2})/);
      if (m) { month = +m[1]; return; }
      texts.push(t);
    });

    const shop  = texts.length >= 2 ? texts[texts.length - 1] : '';
    const owner = texts.length >= 2 ? texts[texts.length - 2] : (texts[0] || '');
    const adType = texts.length >= 3 ? texts[texts.length - 3] : 'ค่า Ads';

    rows.push({
      ad_date: `${year}-${String(month || new Date().getMonth() + 1).padStart(2, '0')}-01`,
      shop, ad_type: adType, campaign: null, sku: null, product_name: null,
      owner, spend, gmv: null, orders: null, impressions: null, clicks: null,
      note: 'ยอดรวมทั้งเดือน (ไฟล์ไม่มีรายวัน)'
    });
  });
  return { ok: rows.length > 0, kind: 'ads', sheet: sheetName, rows, skipped,
           headerRow: 0, missing: [], flat: true,
           error: rows.length ? null : 'อ่านชีทค่าแอดไม่ได้ — ไม่พบทั้งหัวตารางและตัวเลขค่าแอด' };
}

/* ---------- parser หลัก ---------- */
/* คืน { ok, kind, sheet, rows:[obj], skipped:[{row,reason}], map, headerRow } */
function parseSheet(wb, sheetName, kind, opt = {}) {
  const ws = wb.Sheets[sheetName];
  const aoa = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: null, blankrows: false });
  const alias = ALIAS[kind];
  const hr = findHeader(aoa, alias);
  if (hr < 0) {
    if (kind === 'ads') return parseAdsFlat(aoa, sheetName, opt);
    return { ok: false, kind, sheet: sheetName, error: 'หาหัวตารางไม่เจอ — ตรวจชื่อคอลัมน์ให้ตรงกับที่ระบบรู้จัก', rows: [], skipped: [] };
  }

  const map = mapColumns(aoa[hr], alias);
  const dateField = kind === 'sales' ? 'order_date' : kind === 'expense' ? 'exp_date' : 'ad_date';
  const amtField  = kind === 'ads' ? 'spend' : 'amount';
  const missing = [dateField, amtField].filter(f => map[f] === undefined);

  const numFields = ['qty','amount','spend','gmv','orders','impressions','clicks'];
  const rows = [], skipped = [];
  const fallbackMonth = opt.month || monthFromSheetName(sheetName);
  const year = opt.year || new Date().getFullYear();

  const kindNumFields = numFields.filter(f => alias[f] !== undefined);

  for (let r = hr + 1; r < aoa.length; r++) {
    const raw = aoa[r] || [];
    if (raw.every(c => c === null || c === '')) continue;
    // ข้ามแถวสรุปยอด (เช็กจากเซลล์ดิบ ก่อนแปลงค่า)
    const firstCell = String(raw.find(c => c !== null && c !== '') ?? '').trim();
    if (/^(รวม|รวมทั้งหมด|ผลรวม|total|sum|grand)/i.test(firstCell)) { skipped.push({ row: r + 1, reason: 'แถวสรุปยอด' }); continue; }
    const o = {};
    for (const [f, i] of Object.entries(map)) {
      const v = raw[i];
      o[f] = numFields.includes(f) ? toNum(v) : (v === null ? null : String(v).trim());
    }
    // วันที่
    let d = map[dateField] !== undefined ? toDate(raw[map[dateField]]) : null;
    if (!d && fallbackMonth) d = `${year}-${String(fallbackMonth).padStart(2,'0')}-01`;
    if (!d) { skipped.push({ row: r + 1, reason: 'วันที่ไม่ถูกต้อง' }); continue; }
    o[dateField] = d;
    // ยอดเงิน
    const amt = o[amtField];
    if (amt === null || amt === undefined) { skipped.push({ row: r + 1, reason: 'ไม่มีตัวเลข' + (kind === 'ads' ? 'ค่าแอด' : 'ยอดเงิน') }); continue; }
    kindNumFields.forEach(f => { if (o[f] === undefined) o[f] = null; });
    rows.push(o);
  }
  return { ok: true, kind, sheet: sheetName, rows, skipped, map, headerRow: hr + 1, missing };
}

/* อ่านรายชื่อชีททั้งหมด + เดาชนิด */
function scanWorkbook(wb) {
  return wb.SheetNames.map(n => ({
    name: n,
    kind: guessKind(n),
    month: monthFromSheetName(n),
    rows: (XLSX.utils.sheet_to_json(wb.Sheets[n], { header: 1, blankrows: false }) || []).length
  }));
}

/* ---------- ลายนิ้วมือแถว (กันข้อมูลซ้ำ) ----------
   คิดจากค่าทุกช่องที่อ่านได้ + ชนิดข้อมูล
   ไม่รวมชื่อไฟล์/ชีท → อัปไฟล์เดิมซ้ำ หรืออัปไฟล์ใหม่ที่มีแถวเดิมปนมา ก็จับได้ */
function rowHash(kind, o) {
  const s = kind + '|' + Object.keys(o).sort()
    .map(k => k + '=' + String(o[k] ?? '').trim()).join('|');
  let h1 = 0x811c9dc5, h2 = 0x01000193;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 0x01000193) >>> 0;
    h2 = Math.imul(h2 + c, 0x85ebca6b) >>> 0;
  }
  return h1.toString(16).padStart(8, '0') + h2.toString(16).padStart(8, '0') + '-' + s.length.toString(36);
}

/* ตัดแถวซ้ำภายในไฟล์เดียวกัน คืน { rows, dupInFile } */
function dedupeRows(kind, rows) {
  // แถวที่ค่าเหมือนกันเป๊ะอาจเป็นของจริง (ออเดอร์เดียวมี 2 บรรทัดสินค้าเดิม)
  // จึงไม่ตัดทิ้ง แต่ต่อลำดับการเกิดซ้ำเข้าไปใน hash → อัปไฟล์เดิมซ้ำยังจับได้ ยอดจริงไม่หาย
  const count = new Map(), out = [];
  let repeated = 0;
  for (const r of rows) {
    const base = rowHash(kind, r);
    const n = (count.get(base) || 0) + 1;
    count.set(base, n);
    if (n > 1) repeated++;
    out.push({ ...r, row_hash: base + '#' + n });
  }
  return { rows: out, dupInFile: 0, repeated };
}
