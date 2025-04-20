export class CachingService {
    constructor() {
        this.cache = {}; // Object to store data
        this.defaultTTL = 24 * 60 * 60 * 1000
    }
}