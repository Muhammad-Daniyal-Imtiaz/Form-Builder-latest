const fs = require('fs');
const path = require('path');

const src = path.join(process.cwd(), '.open-next', 'assets');
const dest = path.join(process.cwd(), '.open-next');

function copyRecursive(src, dest) {
    if (!fs.existsSync(src)) return;
    const stats = fs.statSync(src);
    if (stats.isDirectory()) {
        if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
        fs.readdirSync(src).forEach(child => {
            copyRecursive(path.join(src, child), path.join(dest, child));
        });
    } else {
        fs.copyFileSync(src, dest);
    }
}

console.log('Moving assets from', src, 'to', dest);
copyRecursive(src, dest);
console.log('Assets moved successfully!');
