/* 
Purpose: This file defines the endpoints (the URLs) and maps them to the correct function in the controller.
*/

// ----------------------------------------------------------------------------------------------------------------------

// server/routes/userRoutes.js

const express = require('express');
const router = express.Router();
const {
    registerUser,
    authUser,
    getAllUsers,
    searchUsers,
    sendFriendRequest,
    acceptFriendRequest,
    getFriendRequests
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// Public Routes
router.post('/register', registerUser);
router.post('/login', authUser);

// Private Routes
router.get('/all', protect, getAllUsers); // Returns FRIENDS only now
router.get('/search', protect, searchUsers);
router.get('/requests', protect, getFriendRequests);
router.post('/request/:id', protect, sendFriendRequest);
router.post('/accept/:id', protect, acceptFriendRequest);

module.exports = router;