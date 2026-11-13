'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const dest = path.join(root, 'dist');
fs.rmSync(dest, { recursive: true, force: true });
fs.mkdirSync(dest, { recursive: true });
for (const file of ['index.html', 'style.css', 'base.css', 'tokens.css', 'script.js', 'validation.js', 'vendor/qrcode.js', 'vendor/LICENSE', 'vendor/README.md']) {
  const target = path.join(dest, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(path.join(root, file), target);
}
console.log('Статическое приложение подготовлено в dist/');
