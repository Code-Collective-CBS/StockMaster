searchCurrencies: async (query) => {
    try {
        const pool = await poolPromise;
        const result = await pool
            .request()
            .input('query', sql.VarChar, `%${query}%`)
            .query(`
                SELECT TOP 10 *
                FROM Currency
                WHERE name LIKE @query
            `);
        return result.recordset;
    } catch (err) {
        console.error(`Error querying Currency table with query "${query}":`, err);
        throw err;
    }
},