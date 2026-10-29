// チェックのルール（画面に依存しない。node でテストできるように分けている）

// 機種依存文字 → 置き換え候補
const DEP = {
  '①': '(1)', '②': '(2)', '③': '(3)', '④': '(4)', '⑤': '(5)', '⑥': '(6)', '⑦': '(7)', '⑧': '(8)', '⑨': '(9)', '⑩': '(10)',
  'Ⅰ': 'I', 'Ⅱ': 'II', 'Ⅲ': 'III', 'Ⅳ': 'IV', 'Ⅴ': 'V', 'ⅰ': 'i', 'ⅱ': 'ii', 'ⅲ': 'iii',
  '㈱': '(株)', '㈲': '(有)', '㈹': '(代)', '㍿': '株式会社', '℡': 'TEL', '№': 'No.',
  '㎜': 'mm', '㎝': 'cm', '㎞': 'km', '㎎': 'mg', '㎏': 'kg', '㏄': 'cc', '㎡': 'm2', '㍉': 'ミリ', '㌔': 'キロ', '㌢': 'センチ', '㍍': 'メートル', '㌘': 'グラム', '㍑': 'リットル',
  '㍻': '平成', '㍼': '昭和', '㋿': '令和',
};

// 半角カナ → 全角（濁点・半濁点つきを先に）
const HK = 'ｦｧｨｩｪｫｬｭｮｯｰｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ｡｢｣､･';
const ZK = 'ヲァィゥェォャュョッーアイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワン。「」、・';
const DAKU = { ｶ: 'ガ', ｷ: 'ギ', ｸ: 'グ', ｹ: 'ゲ', ｺ: 'ゴ', ｻ: 'ザ', ｼ: 'ジ', ｽ: 'ズ', ｾ: 'ゼ', ｿ: 'ゾ', ﾀ: 'ダ', ﾁ: 'ヂ', ﾂ: 'ヅ', ﾃ: 'デ', ﾄ: 'ド', ﾊ: 'バ', ﾋ: 'ビ', ﾌ: 'ブ', ﾍ: 'ベ', ﾎ: 'ボ', ｳ: 'ヴ' };
const HANDAKU = { ﾊ: 'パ', ﾋ: 'ピ', ﾌ: 'プ', ﾍ: 'ペ', ﾎ: 'ポ' };
export function toZenkana(s) {
  return s.replace(/([ｦ-ﾝ])ﾞ/g, (m, c) => DAKU[c] || m).replace(/([ﾊ-ﾎ])ﾟ/g, (m, c) => HANDAKU[c] || m)
    .replace(/[ｦ-ﾝ｡-･]/g, c => ZK[HK.indexOf(c)] ?? c);
}

// 注意が要る表現（言い切り・効能・比較）。「要確認」として出すだけで、使えないとは決めつけない
const CAUTION = [
  { re: /(?:日本|業界|世界)?(?:No\.?\s?1|Ｎｏ．?１|ナンバーワン|一番)/g, why: 'No.1・一番などの比較表現は、調査の出典（調査機関・時期・対象）を添える必要があります' },
  { re: /最高|最強|最上級|究極|史上最|唯一|日本初|世界初/g, why: '最上級・唯一の表現は、裏付けとなる根拠がないと誇大表示とみなされるおそれがあります' },
  { re: /絶対|必ず|確実に|100%|１００％|完全に|永久/g, why: '効果を言い切る表現は、誤認を招くおそれがあるため言い換えを検討してください' },
  { re: /治る|治す|治療|改善する|効く|効果抜群|若返|アンチエイジング|痩せる|やせる|デトックス|免疫力/g, why: '健康食品・化粧品などで効能をうたう表現は、薬機法・景品表示法上の確認が必要です' },
  { re: /今だけ|限定\d*名|残りわずか|在庫限り|本日限り/g, why: '期間・数量の限定は、実際の条件と一致しているか確認してください（不当表示のおそれ）' },
  { re: /通常価格|定価|メーカー希望小売価格|\d+%\s?OFF|半額/gi, why: '比較価格（二重価格）は、その価格で販売した実績など根拠が必要です' },
];

// 1行の中で、価格に「税込」「税抜」「(税…)」のどれもなければ指摘（総額表示の確認）
const PRICE = /(?:[\d０-９][\d０-９,，]*)\s?円/g;
const TAX = /税込|税抜|税別|内税|外税|（税|\(税|税\d|消費税/;

const isZenAlnum = c => /[０-９Ａ-Ｚａ-ｚ]/.test(c);
export const toHanAlnum = s => s.replace(/[０-９Ａ-Ｚａ-ｚ．，]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0));

export const KINDS = {
  dep: { label: '機種依存文字', fix: true },
  hkana: { label: '半角カナ', fix: true },
  alnum: { label: '全角英数字', fix: true },
  space: { label: '余分な空白', fix: true },
  tax: { label: '税込・税抜の表記なし', fix: false },
  caution: { label: '注意が要る表現', fix: false },
};

// 結果：{ kind, start, end, text, why, to } の配列（start/end は全文での位置）
export function check(text) {
  const out = [];
  const add = (kind, start, end, why, to) => out.push({ kind, start, end, text: text.slice(start, end), why, to });
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (DEP[c]) add('dep', i, i + 1, '環境によって文字化けします', DEP[c]);
  }
  for (const m of text.matchAll(/[ｦ-ﾟ｡-･]+/g)) add('hkana', m.index, m.index + m[0].length, '半角カナは媒体によって使えません', toZenkana(m[0]));
  // 全角英数字：本文に半角英数字もある時だけ「混在」として出す（全部全角でそろえている原稿は対象外）
  const hasHan = /[0-9A-Za-z]/.test(text);
  if (hasHan) for (const m of text.matchAll(/[０-９Ａ-Ｚａ-ｚ](?:[０-９Ａ-Ｚａ-ｚ．，]*[０-９Ａ-Ｚａ-ｚ])?/g)) add('alnum', m.index, m.index + m[0].length, '半角の英数字と混ざっています。どちらかにそろえてください', toHanAlnum(m[0]));
  for (const m of text.matchAll(/[ 　]+$/gm)) add('space', m.index, m.index + m[0].length, '行末に空白があります', '');
  for (const m of text.matchAll(/ {2,}|　{2,}/g)) add('space', m.index, m.index + m[0].length, '空白が続いています', m[0][0]);
  let pos = 0;
  for (const line of text.split('\n')) {
    if (!TAX.test(line)) for (const m of line.matchAll(PRICE)) add('tax', pos + m.index, pos + m.index + m[0].length, '消費者向けの価格は税込の総額表示が必要です。税込か税抜かを書いてください');
    pos += line.length + 1;
  }
  for (const { re, why } of CAUTION) for (const m of text.matchAll(re)) add('caution', m.index, m.index + m[0].length, why);
  // 同じ位置で重なったら先に見つけたものを残す
  out.sort((a, b) => a.start - b.start || b.end - a.end);
  return out.filter((r, i) => !out.slice(0, i).some(o => o.kind === r.kind && o.start <= r.start && r.end <= o.end));
}

// 自動で直せるもの（機種依存・半角カナ・全角英数・空白）を直した原稿
export function autofix(text, results = check(text)) {
  let s = '', at = 0;
  for (const r of results.filter(r => KINDS[r.kind].fix && r.to != null).sort((a, b) => a.start - b.start)) {
    if (r.start < at) continue;
    s += text.slice(at, r.start) + r.to; at = r.end;
  }
  return s + text.slice(at);
}

export function countChars(text) {
  return { all: [...text].length, body: [...text.replace(/\s/g, '')].length, lines: text ? text.split('\n').length : 0 };
}
