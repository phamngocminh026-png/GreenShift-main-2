const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');

const rootDir = path.join(__dirname, '..');
const content = fs.readFileSync(path.join(rootDir, 'assets', 'js', 'word-export.js'), 'utf8');
const lines = content.split('\n');
const b64Line = lines.find(l => l.startsWith('const TEMPLATE_BASE64 = '));
const b64 = b64Line.slice(b64Line.indexOf('"') + 1, b64Line.lastIndexOf('"'));
const zip = new PizZip(Buffer.from(b64, 'base64'));
const xml = zip.file('word/document.xml').asText();

const idx317 = xml.lastIndexOf('Bảng 3.17');
const nextTbl317 = xml.indexOf('<w:tbl', idx317);
const endTbl317 = xml.indexOf('</w:tbl>', nextTbl317);
console.log('--- RAW XML BẢNG 3.17 ---');
console.log(xml.slice(nextTbl317, endTbl317 + 8));

const idx318 = xml.lastIndexOf('Bảng 3.18');
const nextTbl318 = xml.indexOf('<w:tbl', idx318);
const endTbl318 = xml.indexOf('</w:tbl>', nextTbl318);
console.log('--- RAW XML BẢNG 3.18 ---');
console.log(xml.slice(nextTbl318, endTbl318 + 8));
