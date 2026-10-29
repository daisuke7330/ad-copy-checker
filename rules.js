// チェックのルール（画面に依存しない。node でテストできるように分けている）

// 機種依存文字 → 置き換え候補（null は自動では直さない＝人名などで意図して使うことがある文字）
const DEP = {
  '①': '(1)', '②': '(2)', '③': '(3)', '④': '(4)', '⑤': '(5)', '⑥': '(6)', '⑦': '(7)', '⑧': '(8)', '⑨': '(9)', '⑩': '(10)',
  '⑪': '(11)', '⑫': '(12)', '⑬': '(13)', '⑭': '(14)', '⑮': '(15)', '⑯': '(16)', '⑰': '(17)', '⑱': '(18)', '⑲': '(19)', '⑳': '(20)',
  'Ⅰ': 'I', 'Ⅱ': 'II', 'Ⅲ': 'III', 'Ⅳ': 'IV', 'Ⅴ': 'V', 'Ⅵ': 'VI', 'Ⅶ': 'VII', 'Ⅷ': 'VIII', 'Ⅸ': 'IX', 'Ⅹ': 'X',
  'ⅰ': 'i', 'ⅱ': 'ii', 'ⅲ': 'iii', 'ⅳ': 'iv', 'ⅴ': 'v',
  '㈱': '(株)', '㈲': '(有)', '㈹': '(代)', '㍿': '株式会社', '℡': 'TEL', '№': 'No.',
  '㎜': 'mm', '㎝': 'cm', '㎞': 'km', '㎎': 'mg', '㎏': 'kg', '㏄': 'cc', '㎡': 'm2', '㍉': 'ミリ', '㌔': 'キロ', '㌢': 'センチ', '㍍': 'メートル', '㌘': 'グラム', '㍑': 'リットル',
  '㍻': '平成', '㍼': '昭和', '㋿': '令和',
  '髙': null, '﨑': null, '德': null, '瀨': null,
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

// 注意が要る表現。「要確認」として出すだけで、使えないとは決めつけない
// why = なぜ確認が要るか、todo = 回覧で見る人が担当者に聞くこと
const CAUTION = [
  { re: /(?:日本|業界|世界|売上|販売数)?(?:No\.?\s?1|Ｎｏ．?１|ナンバー(?:ワン|1|１)|第[1１一]位)|(?<!番)一番(?!搾り)/g,
    why: 'No.1・第1位などの比較表現は、調査の出典（調査機関・時期・対象）を添える必要があります', todo: '担当者に「調査の出典が原稿に入っているか」を聞く' },
  { re: /最高(?!齢)|最強|最上級|究極|史上最|唯一|日本初|世界初/g,
    why: '最上級・唯一の表現は、裏付けとなる根拠がないと誇大表示とみなされるおそれがあります', todo: '担当者に根拠の資料があるかを聞く' },
  { re: /絶対|必ず(?!お(?:読み|守り|確かめ))|確実に(?!お届け)|100%|１００％|完全に|永久/g,
    why: '効果を言い切る表現は、誤認を招くおそれがあるため言い換えを検討してください', todo: '効果について言い切っていないかを確かめる' },
  { re: /治る|治す|治療|改善する|効く|効果抜群|若返|アンチエイジング|痩せる|やせる|デトックス|免疫力|(?:血圧|血糖値?|コレステロール|尿酸値)が?下がる|脂肪を?燃焼|痛みが?(?:消える|なくなる|和らぐ)|予防|防止|解消|回復/g,
    why: '健康食品・化粧品などで効能をうたう表現は、薬機法・景品表示法上の確認が必要です', todo: '担当者に「薬機法のチェックを通したか」を聞く' },
  { re: /今だけ|今なら|期間限定|数量限定|限定[\d０-９]*名|先着[\d０-９]*名?様?|全員|もれなく|残りわずか|在庫限り|本日限り/g,
    why: '期間・数量の限定は、実際の条件と一致しているか確認してください（不当表示のおそれ）', todo: '期間・人数などの条件が原稿に書いてあるかを確かめる' },
  { re: /通常価格|定価|メーカー希望小売価格|[\d０-９]+\s?[%％]\s?(?:OFF|ＯＦＦ|オフ|引き|割引)|[\d０-９]+割引き?|半額/gi,
    why: '比較価格（二重価格）や割引は、元の価格で販売した実績など根拠が必要です', todo: '担当者に「元の価格で売った実績があるか」を聞く' },
];

// 条件の確認：お客様からの問い合わせ・苦情につながりやすい言葉（顧客対応の視点）
const TERMS = [
  { re: /定期(?:購入|便|コース)?|初回|[2２二]回目以降|継続|[\d０-９]+回以上|縛りなし|いつでも(?:解約|休止|停止)/g,
    why: '定期購入は、回数の条件と2回目以降の価格が、初回価格と同じくらい目立つ形で書かれているか確認してください', todo: '「2回目の値段を知らなかった」という問い合わせにならないか確かめる' },
  { re: /送料無料|送料/g,
    why: '送料は、条件や例外（地域・金額・回数）が書かれているか確認してください', todo: '「送料がかかった」という問い合わせにならないか確かめる' },
  { re: /全額返金保証|返金保証|全額返金|返品|返金|解約|キャンセル/g,
    why: '返品・返金・解約は、条件と受付方法（期限・連絡先・開封の扱い）が書かれているか確認してください', todo: '「返品できると思った」という問い合わせにならないか確かめる' },
];

// 価格（「1,980円」「￥1,980」。数字と「円」の間の改行も許す＝PDFから写した原稿の対策）
const PRICE = /[¥￥]\s?([\d０-９][\d０-９,，]*)|([\d０-９][\d０-９,，]*)\s*円/g;
const TAX_NEAR = /税込|税抜|税別|内税|外税|税[\d０-９]|消費税|[+＋]\s?税/;
// 原稿全体に「表示価格はすべて税込」のような注記があれば、価格ごとの指摘はしない
const TAX_NOTE = /(?:表示|記載|掲載)?価格は(?:すべて|全て)?(?:税込|税抜|税別)|(?:すべて|全て)(?:税込|税抜|税別)|価格[^\n。]{0,10}(?:税込|税抜|税別)(?:表示|です|価格)/;

const ZEN_RUN = /[０-９Ａ-Ｚａ-ｚ](?:[０-９Ａ-Ｚａ-ｚ．，－：]*[０-９Ａ-Ｚａ-ｚ])?/g;
const HAN_RUN = /[0-9A-Za-z](?:[0-9A-Za-z.,\-:]*[0-9A-Za-z])?/g;
export const toHanAlnum = s => s.replace(/[０-９Ａ-Ｚａ-ｚ．，－：]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0));
export const toZenAlnum = s => s.replace(/[0-9A-Za-z.,\-:]/g, c => String.fromCharCode(c.charCodeAt(0) + 0xFEE0));

// group: 'look' = 人が見て判断する所、'auto' = 自動で直る表記
export const KINDS = {
  caution: { label: '注意が要る表現', fix: false, group: 'look' },
  terms: { label: '条件の確認', fix: false, group: 'look' },
  tax: { label: '税込・税抜の表記なし', fix: false, group: 'look' },
  dep: { label: '機種依存文字', fix: true, group: 'auto' },
  hkana: { label: '半角カナ', fix: true, group: 'auto' },
  alnum: { label: '英数字の全角・半角の混在', fix: true, group: 'auto' },
  space: { label: '余分な空白', fix: true, group: 'auto' },
};

// opts.alnum: 'han'（横書き：半角にそろえる・既定）／'zen'（縦書き：全角にそろえる）
// 結果：{ kind, start, end, text, why, todo, to } の配列（start/end は全文での位置）
export function check(text, opts = {}) {
  const out = [];
  const add = (kind, start, end, why, to, todo) => out.push({ kind, start, end, text: text.slice(start, end), why, to, todo });
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c in DEP) add('dep', i, i + 1, DEP[c] ? '環境によって文字化けします' : '環境によって文字化けします（人名などで使う場合は入稿先に確認）', DEP[c]);
  }
  for (const m of text.matchAll(/[ｦ-ﾟ｡-･]+/g)) add('hkana', m.index, m.index + m[0].length, '半角カナは媒体によって使えません', toZenkana(m[0]));

  // 英数字：全角と半角が両方ある時だけ「混在」として出し、選んだ向きにそろえる（電話番号の「－」「：」も一緒に）
  if (/[0-9A-Za-z]/.test(text) && /[０-９Ａ-Ｚａ-ｚ]/.test(text)) {
    if (opts.alnum === 'zen') for (const m of text.matchAll(HAN_RUN)) add('alnum', m.index, m.index + m[0].length, '全角の英数字と混ざっています（縦書き向けに全角にそろえます）', toZenAlnum(m[0]));
    else for (const m of text.matchAll(ZEN_RUN)) add('alnum', m.index, m.index + m[0].length, '半角の英数字と混ざっています（横書き向けに半角にそろえます）', toHanAlnum(m[0]));
  }

  // 空白：行頭の字下げは対象外。行末の空白と、文中で続く空白（全角・半角の混ざりも）を出す
  for (const m of text.matchAll(/(?<=\S)[ 　]+$/gm)) add('space', m.index, m.index + m[0].length, '行末に空白があります', '');
  for (const m of text.matchAll(/(?<=\S)[ 　]{2,}(?=\S)/g)) add('space', m.index, m.index + m[0].length, '空白が続いています（表の位置合わせなら「余分な空白」を非表示にすると直しません）', m[0][0]);

  // 税込：原稿全体に注記がなければ、価格ごとに前後の近くを見る（1行に価格が2つあっても別々に判定）
  if (!TAX_NOTE.test(text)) {
    for (const m of text.matchAll(PRICE)) {
      const num = (m[1] || m[2]).replace(/[,，]/g, '');
      if (/^[0０]+$/.test(num)) continue;   // 「実質0円」などは価格ではない
      const near = text.slice(Math.max(0, m.index - 6), m.index + m[0].length + 8);
      if (!TAX_NEAR.test(near)) add('tax', m.index, m.index + m[0].length, '消費者向けの価格は税込の総額表示が必要です。税込か税抜かを書いてください（原稿全体の注記「表示価格はすべて税込」でも可）', undefined, '価格のすぐ近くか、原稿の注記に「税込」があるかを確かめる');
    }
  }
  for (const { re, why, todo } of CAUTION) for (const m of text.matchAll(re)) add('caution', m.index, m.index + m[0].length, why, undefined, todo);
  for (const { re, why, todo } of TERMS) for (const m of text.matchAll(re)) add('terms', m.index, m.index + m[0].length, why, undefined, todo);

  // 同じ種類で重なったら長い方を残す
  out.sort((a, b) => a.start - b.start || b.end - a.end);
  return out.filter((r, i) => !out.slice(0, i).some(o => o.kind === r.kind && o.start <= r.start && r.end <= o.end));
}

export const hasTaxNote = text => TAX_NOTE.test(text);

// 自動で直せるもの（機種依存・半角カナ・英数字・空白）を直した原稿。skip に入れた種類・指摘は直さない
export function autofix(text, results = check(text), skip = new Set()) {
  let s = '', at = 0;
  for (const r of results.filter(r => KINDS[r.kind].fix && r.to != null && !skip.has(r.kind) && !skip.has(r)).sort((a, b) => a.start - b.start)) {
    if (r.start < at) continue;
    s += text.slice(at, r.start) + r.to; at = r.end;
  }
  return s + text.slice(at);
}

export function countChars(text) {
  return { all: [...text].length, body: [...text.replace(/\s/g, '')].length, lines: text ? text.split('\n').length : 0 };
}
