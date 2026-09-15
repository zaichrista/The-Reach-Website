import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const staticAssets = ['Reach trial 1 transparent.png', 'The Reach Promo live.mp4'];
const documents = [
  'index.html', 'about.html', 'menu.html', 'legal/privacy.html', 'legal/cookies.html',
  'styles.css', 'site.js', 'public/cookie-consent.js', 'public/cookie-consent.css',
];

rmSync('dist', { recursive: true, force: true });
mkdirSync('dist/client', { recursive: true });
mkdirSync('dist/server', { recursive: true });
for (const asset of staticAssets) {
  const target = join('dist/client', asset);
  mkdirSync(dirname(target), { recursive: true });
  copyFileSync(asset, target);
}
copyFileSync('deployment-headers.txt', 'dist/client/_headers');
const files = Object.fromEntries(documents.map(file => [
  `/${file}`,
  {
    body: readFileSync(file, 'utf8'),
    contentType: file.endsWith('.html') ? 'text/html; charset=utf-8'
      : file.endsWith('.css') ? 'text/css; charset=utf-8'
      : 'text/javascript; charset=utf-8',
  },
]));
writeFileSync('dist/server/index.js', `const files = ${JSON.stringify(files)};
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname === '/' ? '/index.html'
      : url.pathname === '/about' ? '/about.html'
      : url.pathname === '/menu' ? '/menu.html'
      : url.pathname === '/legal/privacy' ? '/legal/privacy.html'
      : url.pathname === '/legal/cookies' ? '/legal/cookies.html'
      : url.pathname;
    const file = files[path];
    const response = file
      ? new Response(request.method === 'HEAD' ? null : file.body, { headers: { 'Content-Type': file.contentType, 'Cache-Control': 'public, max-age=0, must-revalidate' } })
      : env.ASSETS ? await env.ASSETS.fetch(request) : new Response('Not found', { status: 404 });
    const headers = new Headers(response.headers);
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    headers.set('X-Frame-Options', 'DENY');
    headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    headers.set('Content-Security-Policy', "default-src 'self'; img-src 'self'; media-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'");
    if (new URL(request.url).protocol === 'https:') headers.set('Strict-Transport-Security', 'max-age=31536000');
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  }
};\n`);
writeFileSync('dist/server/wrangler.json', JSON.stringify({
  name: 'the-reach-website',
  main: 'index.js',
  compatibility_date: '2026-05-15',
  no_bundle: true,
  assets: { directory: '../client', binding: 'ASSETS', run_worker_first: true },
}, null, 2) + '\n');
console.log(`Built ${documents.length} pages and styles plus ${staticAssets.length} media assets for hosting.`);
