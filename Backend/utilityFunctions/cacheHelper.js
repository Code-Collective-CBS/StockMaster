const cache = require("./cache");

// Helper function to get or set new cache
// Source is label for identifying the date come from

async function getOrSetCache(key, fetchFunction, ttl = 600) {
    const cached = cache.get(key);
    if (cached) return { data: cached, source: "cache" };

    const freshData = await fetchFunction();
    cache.set(key, freshData, ttl);
    return { data: freshData, source: "fresh" };
}

/*
- key: what are we looking for in the cache  
- fetchFunction: wrap a function to pass the function as a parameter 
- ttl: Time To Live which is set to 10 minuts for default
- data: cache: a label for the raw cached data in the return
- data: freshData: a label for the newly raw fetched data
*/

module.exports = { getOrSetCache };