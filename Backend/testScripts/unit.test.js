require('dotenv').config();
const databaseServices = require('../services/databaseServices');


test('1. Unit test: Create user', async () => {
    const uniqueEmail = `unit${Date.now()}@gmail.com`; // Avoid duplicate error

    const testBody = {
        firstname: 'Jesper',
        lastname: 'Tester',
        email: uniqueEmail,
        password: '1',
        phone_number: '11111111',
        avatar: 'Fin'
    };

    const result = await databaseServices.createUser(testBody);

    expect(result.status).toBe(201);
    expect(result).toHaveProperty('user_id');
});