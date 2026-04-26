const fs = require('fs');
const path = require('path');

const baseDir = path.join(process.cwd(), '.open-next');
const srcDir = path.join(baseDir, 'assets');

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

console.log('--- STARTING ASSET MOVE (PRESERVE STRUCTURE) ---');
copyRecursive(srcDir, baseDir);
console.log('--- ASSET MOVE COMPLETE ---');
