const fs = require('fs');

async function testWorkerLogic() {
  const env = {
    TURSO_DATABASE_URL: process.env.TURSO_DATABASE_URL,
    TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
  };

  const baseUrl = env.TURSO_DATABASE_URL.replace(/^libsql:\/\//, 'https://');
  const token = env.TURSO_AUTH_TOKEN;

  console.log("Testing Turso connection to:", baseUrl);

  const body = {
    requests: [
      {
        type: 'execute',
        stmt: {
          sql: 'SELECT 1 as test',
          args: [],
        },
      },
      { type: 'close' },
    ],
  };

  try {
    const res = await fetch(`${baseUrl}/v2/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      console.error("Turso failed:", res.status, await res.text());
    } else {
      console.log("Turso success:", JSON.stringify(await res.json(), null, 2));
    }

    // Check redis queue
    const redisRes = await fetch(`${env.UPSTASH_REDIS_REST_URL}/lrange/form_submissions_queue/0/10`, {
      headers: { Authorization: `Bearer ${env.UPSTASH_REDIS_REST_TOKEN}` }
    });
    console.log("Redis queue length:", (await redisRes.json()).result?.length || 0);

  } catch (err) {
    console.error("Error:", err);
  }
}

testWorkerLogic();
