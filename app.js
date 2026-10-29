import { check, autofix, countChars, KINDS } from './rules.js';

const $ = id => document.getElementById(id);
const SAMPLE = `【今だけ半額】話題のｸﾞﾙｺｻﾐﾝ配合サプリ
膝の悩みが治る！業界Ｎｏ．１の売れ筋です。
通常価格 6,480円 → 初回 3,240円（税込）
１日たった2粒、続けやすい  ㎎設計。
①お電話　②はがき　③インターネットでお申し込みください。
送料 550円`;
const KEY = 'ad-copy-checker:text';
let off = new Set();   // 表示しない種類

function esc(s) { return s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]); }

function render() {
  const text = $('src').value;
  try { localStorage.setItem(KEY, text); } catch {}
  const c = countChars(text);
  $('count').textContent = text ? `${c.all}文字（空白・改行を除く ${c.body}文字）／${c.lines}行` : '';
  const all = check(text), shown = all.filter(r => !off.has(r.kind));

  // 種類ごとの件数（押すと表示・非表示）
  $('filters').innerHTML = '';
  for (const [k, v] of Object.entries(KINDS)) {
    const n = all.filter(r => r.kind === k).length;
    const b = document.createElement('button');
    b.type = 'button'; b.className = `chip k-${k}${off.has(k) ? ' off' : ''}`; b.disabled = !n;
    b.textContent = `${v.label} ${n}`;
    b.onclick = () => { off.has(k) ? off.delete(k) : off.add(k); render(); };
    $('filters').append(b);
  }
  $('summary').textContent = !text ? '' : all.length ? `${all.length}件見つかりました` : '問題は見つかりませんでした';
  $('summary').className = 'summary ' + (text && !all.length ? 'ok' : '');

  // 原稿に色を付けて表示（重なりは先のものを優先）
  let html = '', at = 0, n = 0;
  for (const r of shown) {
    if (r.start < at) continue;
    html += esc(text.slice(at, r.start)) + `<mark class="k-${r.kind}" data-i="${n++}" title="${esc(r.why)}">${esc(r.text) || '␣'}</mark>`;
    at = r.end;
  }
  $('view').innerHTML = text ? html + esc(text.slice(at)) : '<p class="empty">左に原稿を貼ると、ここに直したい所が色付きで出ます。</p>';

  // 指摘の一覧（行番号つき）
  $('list').innerHTML = '';
  for (const r of shown) {
    const line = text.slice(0, r.start).split('\n').length;
    const li = document.createElement('li');
    li.innerHTML = `<span class="tag k-${r.kind}">${KINDS[r.kind].label}</span><span class="ln">${line}行目</span>`
      + `<b>${esc(r.text.replace(/ /g, '␣').replace(/　/g, '□'))}</b>${r.to != null && KINDS[r.kind].fix ? ` → <b>${esc(r.to) || '（削除）'}</b>` : ''}<div class="why">${esc(r.why)}</div>`;
    li.onclick = () => { $('src').focus(); $('src').setSelectionRange(r.start, r.end); };
    $('list').append(li);
  }
  $('btnFix').disabled = !all.some(r => KINDS[r.kind].fix);
}

$('src').addEventListener('input', render);
$('btnSample').onclick = () => { $('src').value = SAMPLE; render(); };
$('btnClear').onclick = () => { $('src').value = ''; render(); $('src').focus(); };
$('btnFix').onclick = async () => {
  const fixed = autofix($('src').value);
  try {
    // 許可待ちのまま止まることがあるので、2秒で諦めて下の方法に切り替える
    await Promise.race([navigator.clipboard.writeText(fixed), new Promise((_, ng) => setTimeout(ng, 2000))]);
    $('msg').textContent = 'コピーしました。税込表記・注意が要る表現は自動では直さないので、内容を見て直してください。';
  } catch {
    $('msg').textContent = 'コピーできませんでした。原稿の欄を直した内容に置き換えたので、そこからコピーしてください。';
    $('src').value = fixed; render();
  }
};
try { $('src').value = localStorage.getItem(KEY) || ''; } catch {}
render();
