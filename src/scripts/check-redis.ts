const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

async function checkQueue() {
    if (!redisUrl || !redisToken) {
        console.error("Missing Redis credentials");
        return;
    }
    
    const res = await fetch(`${redisUrl}/llen/form_submissions_queue`, {
        headers: { Authorization: `Bearer ${redisToken}` }
    });
    const data = await res.json();
    console.log("Queue length:", data.result);
    
    const proc = await fetch(`${redisUrl}/keys/processing:*`, {
        headers: { Authorization: `Bearer ${redisToken}` }
    });
    const procData = await proc.json();
    console.log("Processing lists:", procData.result);
}

checkQueue();
