// Utility Function for caching in backend
const NodeCache = require("node-cache");
const cache = new NodeCache({ stdTTL: 3600 }); // 1 hour (60m*60m) ttl (standard time to live (stdTTL)) saved in RAM so fast but not persistant
module.exports = cache;

/*
- cache.get(key) — check if we already have it
- cache.set(key, data, ttl?) — store the new data (optional custom TTL)
- cache.del(key) — if you want to delete specific cache
- cache.flushAll() — if you want to clear everything manually (maybe in dev)
*/