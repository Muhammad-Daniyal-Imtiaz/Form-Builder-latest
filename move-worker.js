const fs = require('fs')
const path = require('path')

const outputDir = path.join(__dirname, '.open-next')
const from = path.join(outputDir, 'worker.js')
const to = path.join(outputDir, '_worker.js')

if (!fs.existsSync(from)) {
  console.log('[DEPLOY] worker.js already moved or not generated')
  process.exit(0)
}

if (fs.existsSync(to)) {
  fs.rmSync(to, { force: true })
}

fs.renameSync(from, to)
console.log('[DEPLOY] Renamed worker.js to _worker.js')
