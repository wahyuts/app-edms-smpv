const express = require('express');
const passwordController = require('../controllers/password.controller');

const router = express.Router();

router.post('/forgot', passwordController.forgotPassword);
router.post('/reset', passwordController.resetPassword);

module.exports = router;
