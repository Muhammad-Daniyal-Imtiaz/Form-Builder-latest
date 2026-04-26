const fs = require('fs');
const path = require('path');

const srcDir = path.join(process.cwd(), '.open-next', 'assets');
const destDir = path.join(process.cwd(), '.open-next');

if (fs.existsSync(srcDir)) {
    console.log('Moving files from .open-next/assets to .open-next...');
    const files = fs.readdirSync(srcDir);
    files.forEach(file => {
        const srcPath = path.join(srcDir, file);
        const destPath = path.join(destDir, file);
        
        if (fs.existsSync(destPath) && fs.statSync(destPath).isDirectory()) {
            console.log(`Merging directory: ${file}`);
            // Simple recursive merge for directories like _next
            const subFiles = fs.readdirSync(srcPath);
            subFiles.forEach(subFile => {
                const subSrc = path.join(srcPath, subFile);
                const subDest = path.join(destPath, subFile);
                if (!fs.existsSync(destPath)) fs.mkdirSync(destPath, { recursive: true });
                fs.renameSync(subSrc, subDest);
            });
        } else {
            console.log(`Moving file/folder: ${file}`);
            fs.renameSync(srcPath, destPath);
        }
    });
    console.log('Done!');
} else {
    console.log('Source directory not found, skipping move.');
}
