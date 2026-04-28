/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

const baseDir = path.join(process.cwd(), '.open-next');
const srcDir = path.join(baseDir, 'assets');

// Step 1: Recursively copy assets preserving structure
function copyRecursive(src, dest) {
    if (!fs.existsSync(src)) return;
    const stats = fs.statSync(src);
    if (stats.isDirectory()) {
        if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
        fs.readdirSync(src).forEach(child => {
            copyRecursive(path.join(src, child), path.join(dest, child));
        });
    } else {
        console.log(`[DEPLOY] Copying: ${path.relative(srcDir, src)}`);
        fs.copyFileSync(src, dest);
    }
}

console.log('--- STARTING ASSET MOVE ---');
copyRecursive(srcDir, baseDir);
console.log('Cleaning up assets folder...');
fs.rmSync(srcDir, { recursive: true, force: true });
console.log('--- ASSET MOVE COMPLETE ---');

// Step 2: Generate _routes.json so Cloudflare Pages serves static files
// directly WITHOUT going through _worker.js
const routes = {
    version: 1,
    include: ['/*'],
    exclude: [
        '/_next/static/*',
        '/_next/image*',
        '/favicon.ico',
        '/*.svg',
        '/*.png',
        '/*.jpg',
        '/*.jpeg',
        '/*.gif',
        '/*.webp',
        '/*.woff2',
        '/*.woff',
        '/*.ttf',
    ],
};

const routesPath = path.join(baseDir, '_routes.json');
fs.writeFileSync(routesPath, JSON.stringify(routes, null, 2));
console.log('--- _routes.json WRITTEN ---');
console.log(JSON.stringify(routes, null, 2));
