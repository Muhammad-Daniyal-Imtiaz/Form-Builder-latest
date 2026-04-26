const fs = require('fs');
const path = require('path');

const baseDir = path.join(process.cwd(), '.open-next');
const srcDir = path.join(baseDir, 'assets');

function moveFiles(currentSrc, currentDest) {
    if (!fs.existsSync(currentSrc)) return;
    
    if (!fs.existsSync(currentDest)) {
        fs.mkdirSync(currentDest, { recursive: true });
    }

    const items = fs.readdirSync(currentSrc);
    items.forEach(item => {
        const s = path.join(currentSrc, item);
        const d = path.join(currentDest, item);

        if (fs.statSync(s).isDirectory()) {
            moveFiles(s, d);
        } else {
            console.log(`[DEPLOY] Moving: ${item} to root`);
            fs.copyFileSync(s, d);
        }
    });
}

console.log('--- STARTING NUCLEAR ASSET MOVE ---');
moveFiles(srcDir, baseDir);
console.log('--- ASSET MOVE COMPLETE ---');
