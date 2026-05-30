const fs = require('fs');

async function testWorkerLogic() {
  const env = {
    TURSO_DATABASE_URL: process.env.TURSO_DATABASE_URL,
    TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    ENCRYPTION_SECRET: process.env.ENCRYPTION_SECRET,
  };

  // Quick port of worker logic to test it locally
  const workerSrc = fs.readFileSync('./worker.js', 'utf8');
  // strip `export default { ... }` so we can run it
  const cleanSrc = workerSrc.replace(/export default {[\s\S]*?};/, '');
  
  eval(cleanSrc);
  
  console.log("Running processQueue...");
  try {
    const res = await processQueue(env);
    console.log("processQueue result:", res);
  } catch (err) {
    console.error("processQueue FATAL ERROR:", err);
  }
}

testWorkerLogic();
