const fs = require('fs');
const path = require('path');

// 1. Ensure dist/404.html and dist/.nojekyll
fs.copyFileSync('dist/index.html', 'dist/404.html');
fs.writeFileSync('dist/.nojekyll', '');

// 2. Replicate inside dist/docs/ for gh-pages /docs deployment support
fs.mkdirSync('dist/docs', { recursive: true });
fs.copyFileSync('dist/index.html', 'dist/docs/index.html');
fs.copyFileSync('dist/404.html', 'dist/docs/404.html');
if (fs.existsSync('dist/favicon.svg')) {
  fs.copyFileSync('dist/favicon.svg', 'dist/docs/favicon.svg');
}
fs.writeFileSync('dist/docs/.nojekyll', '');
fs.cpSync('dist/assets', 'dist/docs/assets', { recursive: true });

// 3. Replicate to docs/ for main branch
fs.mkdirSync('docs', { recursive: true });
fs.copyFileSync('dist/index.html', 'docs/index.html');
fs.copyFileSync('dist/404.html', 'docs/404.html');
if (fs.existsSync('dist/favicon.svg')) {
  fs.copyFileSync('dist/favicon.svg', 'docs/favicon.svg');
}
fs.writeFileSync('docs/.nojekyll', '');
fs.cpSync('dist/assets', 'docs/assets', { recursive: true });

console.log('✓ Prepared GitHub Pages assets in root, /docs, and dist/docs');
