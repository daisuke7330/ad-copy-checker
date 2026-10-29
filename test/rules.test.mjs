// 実行: npm test
import test from 'node:test';
import assert from 'node:assert/strict';
import { check, autofix, toZenkana, countChars } from '../rules.js';

const of = (t, kind, opts) => check(t, opts).filter(r => r.kind === kind).map(r => r.text);

test('機種依存文字を見つけて置き換え候補を出す（⑪以降・人名の異体字は直さず指摘だけ）', () => {
  assert.deepEqual(check('①お電話 ㈱サンプル 5㎏ ⑪').filter(x => x.kind === 'dep').map(x => [x.text, x.to]), [['①', '(1)'], ['㈱', '(株)'], ['㎏', 'kg'], ['⑪', '(11)']]);
  assert.deepEqual(check('髙橋').filter(x => x.kind === 'dep').map(x => x.to), [null]);
  assert.equal(autofix('髙橋'), '髙橋');
});

test('半角カナは濁点・半濁点ごと全角にする', () => {
  assert.equal(toZenkana('ｸﾞﾙｺｻﾐﾝ ﾊﾟﾜｰ｡'), 'グルコサミン パワー。');
});

test('英数字：混ざっている時だけ指摘し、横書きは半角・縦書きは全角にそろえる', () => {
  assert.deepEqual(of('１日２粒', 'alnum'), []);
  assert.deepEqual(check('業界Ｎｏ．１ 2粒 ３，０００').filter(r => r.kind === 'alnum').map(r => r.to), ['No.1', '3,000']);
  // 縦書き：全角が基準。電話番号の半角を全角に
  const v = '１５００㎎配合／１日６粒 0120-123-456';
  assert.equal(autofix(v, check(v, { alnum: 'zen' })), '１５００mg配合／１日６粒 ０１２０－１２３－４５６');
  // 横書き：電話番号の「－」も一緒に半角へ
  assert.equal(autofix('０１２０－１２３－４５６ 9時'), '0120-123-456 9時');
});

test('税込：価格ごとに近くの表記を見る（＋税・¥・同じ行の2つ目の価格・0円・改行）', () => {
  assert.deepEqual(of('初回980円（税込）、2回目以降 3,980円', 'tax'), ['3,980円']);
  assert.deepEqual(of('本体価格 3,000円＋税', 'tax'), []);
  assert.deepEqual(of('￥2,980', 'tax'), ['￥2,980']);
  assert.deepEqual(of('初回実質0円', 'tax'), []);
  assert.deepEqual(of('通常価格 5,000\n円のところ', 'tax'), ['5,000\n円']);
});

test('税込：原稿全体に「表示価格はすべて税込」の注記があれば価格ごとには出さない', () => {
  assert.deepEqual(of('1袋 2,980円\n3袋セット 8,000円\n※表示価格はすべて税込です。', 'tax'), []);
});

test('注意が要る表現：効能・限定・割引・順位を拾い、よくある言い回しは出さない', () => {
  assert.deepEqual(of('血圧が下がる、脂肪を燃焼、痛みが消える', 'caution'), ['血圧が下がる', '脂肪を燃焼', '痛みが消える']);
  assert.deepEqual(of('今なら先着100名様 期間限定 ５０％ＯＦＦ 売上第1位', 'caution'), ['今なら', '先着100名様', '期間限定', '５０％ＯＦＦ', '売上第1位']);
  assert.deepEqual(of('必ずお読みください。確実にお届けします。一番搾り。最高齢のお客様', 'caution'), []);
});

test('条件の確認：定期・送料・返品・解約・返金保証を拾う（顧客対応の視点）', () => {
  assert.deepEqual(of('定期初回500円、2回目以降は4回以上の継続', 'terms'), ['定期', '初回', '2回目以降', '4回以上', '継続']);
  assert.deepEqual(of('今なら送料無料！いつでも解約OK、全額返金保証', 'terms'), ['送料無料', 'いつでも解約', '全額返金保証']);
});

test('空白：行頭の字下げは出さず、文中の全角・半角混ざりの空白は出す', () => {
  assert.deepEqual(of('　　本文です', 'space'), []);
  assert.deepEqual(of('1袋　 3,240円', 'space'), ['　 ']);
});

test('自動修正は表記だけを直し、非表示にした種類は直さない', () => {
  assert.equal(autofix('①ｻﾌﾟﾘ １日2粒  治る \n送料 550円'), '(1)サプリ 1日2粒 治る\n送料 550円');
  assert.equal(autofix('1袋    2,980円', undefined, new Set(['space'])), '1袋    2,980円');
});

test('何も無い原稿は指摘なし、文字数を数える', () => {
  assert.deepEqual(check(''), []);
  assert.deepEqual(countChars('あい う\nえ'), { all: 6, body: 4, lines: 2 });
});
