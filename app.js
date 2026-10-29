import { check, autofix, countChars, hasTaxNote, KINDS } from './rules.js';

const $ = id => document.getElementById(id);
const SAMPLE = `【今だけ半額】話題のｸﾞﾙｺｻﾐﾝ配合サプリ
膝の痛みが消える！業界Ｎｏ．１の売れ筋です。
定期初回 980円（税込）、2回目以降 3,980円 ※4回以上の継続が条件
１日たった2粒、続けやすい  ㎎設計。
①お電話　②はがき　③インターネットでお申し込みください。
送料 550円／効果がなければ全額返金保証`;
const KEY = 'ad-copy-checker:text', KEY_MODE = 'ad-copy-checker:alnum';
const off = new Set();       // 表示しない種類（非表示の種類は自動修正もしない）
const ignored = new Set();   // 「無視」した指摘（種類＋文字で覚える）
const ikey = r => `${r.kind}|${r.text}`;
const store = (k, v) => { try { localStorage.setItem(k, v); } catch {} };

function esc(s) { return s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]); }
const mode = () => document.querySelector('input[name=alnum]:checked').value;

function render() {
  const text = $('src').value;
  store(KEY, text);
  const c = countChars(text);
  $('count').textContent = text ? `${c.all}文字（空白・改行を除く ${c.body}文字）／${c.lines}行` : '';
  const all = check(text, { alnum: mode() }).filter(r => !ignored.has(ikey(r)));
  const shown = all.filter(r => !off.has(r.kind));

  // 種類ごとの件数（押すと表示・非表示）
  $('filters').innerHTML = '';
  for (const [k, v] of Object.entries(KINDS)) {
    const n = all.filter(r => r.kind === k).length;
    const b = document.createElement('button');
    b.type = 'button'; b.className = `chip k-${k}${off.has(k) ? ' off' : ''}`; b.disabled = !n;
    b.textContent = `${v.label} ${n}`; b.title = off.has(k) ? '押すと表示します' : '押すと非表示にします（非表示の種類は自動修正もしません）';
    b.onclick = () => { off.has(k) ? off.delete(k) : off.add(k); render(); };
    $('filters').append(b);
  }
  const look = all.filter(r => KINDS[r.kind].group === 'look').length, auto = all.length - look;
  $('summary').innerHTML = !text ? '' : all.length
    ? `<b>人が見る所 ${look}件</b>／自動で直る表記 ${auto}件${hasTaxNote(text) ? '<span class="note">（税込の注記あり：価格ごとの税込チェックは省略）</span>' : ''}`
    : '問題は見つかりませんでした';
  $('summary').className = 'summary ' + (text && !all.length ? 'ok' : '');

  // 原稿に色を付けて表示（重なりは先のものを優先）
  let html = '', at = 0;
  for (const r of shown) {
    if (r.start < at) continue;
    html += esc(text.slice(at, r.start)) + `<mark class="k-${r.kind}" title="${esc(KINDS[r.kind].label + '：' + r.why)}">${esc(r.text) || '␣'}</mark>`;
    at = r.end;
  }
  $('view').innerHTML = text ? html + esc(text.slice(at)) : '<p class="empty">左に原稿を貼ると、ここに直したい所が色付きで出ます。</p>';

  // 指摘の一覧：「人が見る所」を先に、「自動で直る表記」を後に
  $('list').innerHTML = '';
  for (const [g, title] of [['look', '人が見る所（回覧で担当者に確認）'], ['auto', '自動で直る表記（下のボタンでまとめて直せます）']]) {
    const items = shown.filter(r => KINDS[r.kind].group === g);
    if (!items.length) continue;
    const h = document.createElement('li'); h.className = 'group'; h.textContent = `${title}　${items.length}件`; $('list').append(h);
    for (const r of items) {
      const line = text.slice(0, r.start).split('\n').length;
      const li = document.createElement('li');
      li.innerHTML = `<span class="tag k-${r.kind}">${KINDS[r.kind].label}</span><span class="ln">${line}行目</span>`
        + `<b>${esc(r.text.replace(/\n/g, '↵').replace(/ /g, '␣').replace(/　/g, '□'))}</b>${r.to != null && KINDS[r.kind].fix ? ` → <b>${esc(r.to) || '（削除）'}</b>` : ''}`
        + `<button type="button" class="ign" title="この指摘を今後出さない（このページを開いている間）">無視</button>`
        + `<div class="why">${esc(r.why)}</div>${r.todo ? `<div class="todo">回覧でのひと言：${esc(r.todo)}</div>` : ''}`;
      li.onclick = () => { $('src').focus(); $('src').setSelectionRange(r.start, r.end); };
      li.querySelector('.ign').onclick = e => { e.stopPropagation(); ignored.add(ikey(r)); render(); };
      $('list').append(li);
    }
  }
  $('ignored').hidden = !ignored.size;
  $('ignored').textContent = `無視した指摘 ${ignored.size}件を元に戻す`;
  $('btnFix').disabled = !shown.some(r => KINDS[r.kind].fix && r.to != null);
}

$('src').addEventListener('input', render);
document.querySelectorAll('input[name=alnum]').forEach(el => el.onchange = () => { store(KEY_MODE, mode()); render(); });
$('btnSample').onclick = () => { $('src').value = SAMPLE; render(); };
$('btnClear').onclick = () => { $('src').value = ''; render(); $('src').focus(); };
$('ignored').onclick = () => { ignored.clear(); render(); };
$('btnFix').onclick = async () => {
  const text = $('src').value;
  const results = check(text, { alnum: mode() }).filter(r => !ignored.has(ikey(r)));
  const fixed = autofix(text, results, off);
  try {
    // 許可待ちのまま止まることがあるので、2秒で諦めて下の方法に切り替える
    await Promise.race([navigator.clipboard.writeText(fixed), new Promise((_, ng) => setTimeout(ng, 2000))]);
    $('msg').textContent = 'コピーしました。「人が見る所」は自動では直さないので、担当者に確認してください。';
  } catch {
    $('msg').textContent = 'コピーできませんでした。原稿の欄を直した内容に置き換えたので、そこからコピーしてください。';
    $('src').value = fixed; render();
  }
};
try {
  $('src').value = localStorage.getItem(KEY) || '';
  const m = localStorage.getItem(KEY_MODE); if (m === 'han' || m === 'zen') document.querySelector(`input[name=alnum][value=${m}]`).checked = true;
} catch {}
render();
