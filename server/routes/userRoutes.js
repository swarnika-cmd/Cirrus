/* 
Purpose: This file defines the endpoints (the URLs) and maps them to the correct function in the controller.
*/

// ----------------------------------------------------------------------------------------------------------------------

// server/routes/userRoutes.js

const express = require('express');
const router = express.Router();
const { registerUser, authUser, getMyProfile, updateMyProfile, getAllUsers, getRecentContacts } = require('../controllers/userController'); // 👈 Add getMyProfile
const { protect } = require('../middleware/authMiddleware'); // 👈 Import middleware

// Public Routes (Registration and Login don't need a token)
router.post('/register', registerUser);
router.post('/login', authUser);

// Private Route (Requires a valid token)
// 💡 The 'protect' middleware runs before 'getMyProfile'
router.get('/profile', protect, getMyProfile);
router.put('/profile', protect, updateMyProfile); // 💡 New Route for updating profile
router.get('/all', protect, getAllUsers);
router.get('/recent', protect, getRecentContacts); // 💡 New Route

module.exports = router;