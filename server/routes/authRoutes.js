const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const {
    verifyAccessToken,
    verifyRefreshToken,
} = require('../middleware/authMiddleware');
const {
    validateRegisterInput,
    validateLoginInput,
} = require('../utils/validation');

// Register route
router.post('/register', validateRegisterInput, authController.register);

// Login route
router.post('/login', validateLoginInput, authController.loginUser);

// Refresh token route
router.get('/refresh', verifyRefreshToken, authController.refreshToken);

// Logout route
router.post('/logout', verifyAccessToken, authController.logout);

// Protected route example
router.get('/protected', verifyAccessToken, authController.protectedRoute);

// Google OAuth Routes
router.get('/google', authController.googleAuth);
router.get('/google/callback', authController.googleAuthCallback);
router.get('/failure', authController.authFailure);

module.exports = router;