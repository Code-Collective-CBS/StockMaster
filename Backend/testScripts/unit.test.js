require('dotenv').config();
const databaseServices = require('../services/databaseServices');
const databaseController = require('../controllers/databaseController');


const uniqueEmail = `unit${Date.now()}@gmail.com`; // Avoid duplicate error
let testUserId;
let testAccountId;

// 1. Create user
test('1.1 Unit test: Create user', async () => {
    
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

    testUserId = result.user_id; // Save it for later tests
});

// 1.2 Prevent creating user with duplicate email
test('1.2 Prevent creating user with duplicate email', async () => {    
    const testBody = {
        firstname: 'Jesper2',
        lastname: 'Tester1',
        email: uniqueEmail, // Same email as test 1.
        password: '1',
        phone_number: '11111111',
        avatar: 'Fin'
    };
    
    const result = await databaseServices.createUser(testBody);
    
    expect(result.status).toBe(400);
    expect(result.message).toBe("E-mail already exists");
});

// 2.1 Test succesfull login for user created in 1.1
test('2.1 Successful login', async() => {
    const request = {
        body: {
            email: uniqueEmail, // Credentials from test 1.1
            password: '1'
        },
        session: {}
    };

    const response = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
    };

    await databaseController.login(request, response);

    expect(response.status(201))
    expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({
        message: "Login succesful",
        id: expect.any(Number),
        firstname: 'Jesper',
        lastname: 'Tester',
        })
    );

    expect(request.session.user_id).toBeDefined();
});

// 2.2 Test inputting wrong password for an user
test('2.2 unsuccessful login with wrong password', async() => {
    const request = {
        body: {
            email: uniqueEmail, // Credentials from test 1.1
            password: 'wrong'
        },
        session: {}
    };

    const response = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
    };

    await databaseController.login(request, response);

    expect(response.status(500))
    expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Wrong username or password' })
    );
});

// Test the creation of an account with deposit and withdraw
test('3.1 Create an account and deposit', async() => {
    const result = await databaseServices.createAccount(testUserId, 'Unit Account', 'DKK', 'Unit Bank');

    expect(result).toHaveProperty('account_id');
    expect(result.account_name).toBe('Unit Account');
    expect(result.account_currency).toBe('DKK');
    expect(result.account_bank).toBe('Unit Bank');

    testAccountId = result.account_id; // Save for deposit/withdraw test
});

test('3.2 Deposit to created account in 3.1', async () => {
    const depositAmount = 1200;
    const result = await databaseServices.depositToAccount(testUserId, testAccountId, depositAmount);

    expect(result).toHaveProperty('total_balance');
    expect(Number(result.total_balance)).toEqual(depositAmount);
});

test('3.3 Withdraw deposit amount from 3.2', async () => {
    const withdrawAmount = 1200;
    const result = await databaseServices.withdrawFromAccount(testUserId, testAccountId, withdrawAmount);
    
    expect(result).toHaveProperty('total_balance');
    expect(Number(result.total_balance)).toEqual(0);
});

test('3.4 Withdraw more than account balance', async () => {
    const withdrawAmount = 1200;

    await expect(
        databaseServices.withdrawFromAccount(testUserId, testAccountId, withdrawAmount)
      ).rejects.toThrow('Insufficient funds');
});