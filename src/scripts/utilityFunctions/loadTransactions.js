const databaseUrl = 'http://localhost:3000/api/database';

const loadTransactions = async () => {
    try {
      const accountId = sessionStorage.getItem('selectedAccountId');
    
      if(!accountId) {
        throw new Error('Account id missing');
      }
    
      const response = await fetch(`${databaseUrl}//transactions/account/${accountId}`);
      if(!response.ok) {
        throw new Error('Error fetching transactions', error);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching transactions', error);
      throw error;
    }
}

export { loadTransactions };