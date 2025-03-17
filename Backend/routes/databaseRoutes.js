const express = require('express');
const router = express.Router();
const userController = require('../controllers/databaseController');
const database = require('../config/config');

router.post('/users', userController.createUser);

module.exports = router;