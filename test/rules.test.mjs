// 実行: node --test test/
import test from 'node:test';
import assert from 'node:assert/strict';
import { check, autofix, toZenkana, countChars } from '../rules.js';

const kinds = t => check(t).map(r => r.kind);

test('機種依存文字を見つけて置き換え候補を出す', () => {
  const r = check('①お電話 ㈱サンプル 5㎏');
  assert.deepEqual(r.filter(x => x.kind === 'dep').map(x => [x.text, x.to]), [['①', '(1)'], ['㈱', '(株)'], ['㎏', 'kg']]);
});

test('半角カナは濁点・半濁点ごと全角にする', () => {
  assert.equal(toZenkana('ｸﾞﾙｺｻﾐﾝ ﾊﾟﾜｰ｡'), 'グルコサミン パワー。');
});

test('全角英数字は半角と混ざっている時だけ指摘する', () => {
  assert.ok(kinds('１日2粒').includes('alnum'));
  assert.ok(!kinds('１日２粒').includes('alnum'));
});

test('税込・税抜のない価格を行ごとに指摘する', () => {
  assert.deepEqual(check('送料 550円\n初回 3,240円（税込）').filter(r => r.kind === 'tax').map(r => r.text), ['550円']);
});

test('注意が要る表現を見つける', () => {
  const t = check('膝の悩みが治る！業界Ｎｏ．１').filter(r => r.kind === 'caution').map(r => r.text);
  assert.deepEqual(t, ['治る', '業界Ｎｏ．１']);
});

test('自動修正は機種依存・半角カナ・全角英数・空白だけを直し、表現は残す', () => {
  assert.equal(autofix('①ｻﾌﾟﾘ １日2粒  治る \n送料 550円'), '(1)サプリ 1日2粒 治る\n送料 550円');
});

test('何も無い原稿は指摘なし、文字数を数える', () => {
  assert.deepEqual(check(''), []);
  assert.deepEqual(countChars('あい う\nえ'), { all: 6, body: 4, lines: 2 });
});
