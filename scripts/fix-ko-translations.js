/**
 * Docusaurus 한국어 번역 버그 수정
 * theme.blog.tagTitle에서 {nPosts}에 이미 plurals 결과가 들어가서 중복되는 문제
 */
const fs = require('fs');
const path = require('path');

const filePath = path.join(
  __dirname,
  '../node_modules/@docusaurus/theme-translations/locales/ko/theme-common.json'
);

if (fs.existsSync(filePath)) {
  const json = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  json['theme.blog.tagTitle'] = '"{tagName}" 태그 — {nPosts}';
  fs.writeFileSync(filePath, JSON.stringify(json, null, 2) + '\n', 'utf-8');
  console.log('Fixed ko translation: theme.blog.tagTitle');
}
