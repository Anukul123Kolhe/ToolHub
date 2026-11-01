const fs = require('fs');
const path = require('path');

const redirect404Html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>ToolHub — Redirecting...</title>
    <script>
      (function() {
        var path = window.location.pathname;
        var repo = '';
        if (window.location.hostname.endsWith('github.io')) {
          var segments = path.split('/').filter(Boolean);
          if (segments.length > 0) {
            repo = '/' + segments[0] + '/';
            path = segments.slice(1).join('/');
          } else {
            repo = '/';
          }
        } else {
          repo = '/';
          path = path.replace(/^\\//, '');
        }
        path = path.replace(/\\/+$/, '');
        var target = window.location.origin + repo + (path ? '#/' + path : '') + window.location.search + window.location.hash;
        window.location.replace(target);
      })();
    </script>
  </head>
  <body style="font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background-color: #0B0F17; color: #F8FAFC;">
    <div style="text-align: center; padding: 20px;">
      <h2 style="margin-bottom: 8px;">Loading ToolHub...</h2>
      <p style="color: #94A3B8; font-size: 14px;">Redirecting you to the application...</p>
    </div>
  </body>
</html>
`;

// 1. Root .nojekyll and 404.html
fs.writeFileSync('.nojekyll', '');
fs.writeFileSync('404.html', redirect404Html);

// 2. Ensure dist/404.html and dist/.nojekyll
fs.writeFileSync('dist/404.html', redirect404Html);
fs.writeFileSync('dist/.nojekyll', '');

// 3. Replicate inside dist/docs/ for gh-pages /docs deployment support
fs.mkdirSync('dist/docs', { recursive: true });
fs.copyFileSync('dist/index.html', 'dist/docs/index.html');
fs.writeFileSync('dist/docs/404.html', redirect404Html);
if (fs.existsSync('dist/favicon.svg')) {
  fs.copyFileSync('dist/favicon.svg', 'dist/docs/favicon.svg');
}
fs.writeFileSync('dist/docs/.nojekyll', '');
if (fs.existsSync('dist/docs/assets')) {
  fs.rmSync('dist/docs/assets', { recursive: true, force: true });
}
fs.cpSync('dist/assets', 'dist/docs/assets', { recursive: true });

// 4. Replicate to docs/ for main branch
fs.mkdirSync('docs', { recursive: true });
fs.copyFileSync('dist/index.html', 'docs/index.html');
fs.writeFileSync('docs/404.html', redirect404Html);
if (fs.existsSync('dist/favicon.svg')) {
  fs.copyFileSync('dist/favicon.svg', 'docs/favicon.svg');
}
fs.writeFileSync('docs/.nojekyll', '');
if (fs.existsSync('docs/assets')) {
  fs.rmSync('docs/assets', { recursive: true, force: true });
}
fs.cpSync('dist/assets', 'docs/assets', { recursive: true });

console.log('✓ Prepared GitHub Pages assets in root, /docs, and dist/docs');
