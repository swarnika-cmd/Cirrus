/*
Purpose: This file contains the business logic—the functions that handle the incoming requests, interact with the database (using the User model), and send back the response. It keeps the route files clean.
*/

//-----------------------------------------------------------------------------------------------------------------



const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const jwt = require('jsonwebtoken'); // 4. to generate the tokens after successful login

// Adding a helper function to generate JWT
const generateToken = (id) => {
    // 🐛 FIX 1: Change 'JsonWebTokenError.sign' to 'jwt.sign'
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d', //Token expires in 30 days
    });
}

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
    // Extract data from the request body
    const { username, email, password
        , avatar, avatarType
    } = req.body;

    // --- Basic Validation ---
    if (!username || !email || !password) {
        res.status(400); // Bad Request
        throw new Error('Please enter all required fields: username, email, and password.');
    }

    // --- Check if user exists (Username/Email must be unique) ---
    const userExists = await User.findOne({ $or: [{ username }, { email }] });
    if (userExists) {
        res.status(400); // Bad Request
        throw new Error('User with this email or username already exists.');
    }

    // // --- Hash Password ---
    // const salt = await bcrypt.genSalt(10); // Generate salt (random data for hashing)
    // const hashedPassword = await bcrypt.hash(password, salt);

    // --- Create User in Database ---
    const user = await User.create({
        username,
        email,
        password, // our  model will itself hash the password 
        avatar: avatar || null,
        avatarType: avatarType || 'emoji',
        // avatar will use the default value defined in the User model
    });

    // --- Send Response ---
    if (user) {
        // Send back user data (excluding the password hash)
        res.status(201).json({ // 201 Created
            _id: user._id,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            avatarType: user.avatarType,
            token: generateToken(user._id),
            // 💡 Optional: Generate a token on registration for immediate login
            // token: generateToken(user._id),
            message: 'User registered successfully',
        });
    } else {
        res.status(500); // Server Error
        throw new Error('Invalid user data received.');
    }
});

// @desc    Authenticate user & get token (Login)
// @route   POST /api/users/login
// @access  Public
const authUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // 1. Check for user email
    const user = await User.findOne({ email });

    // 2. Check if user exists AND if password matches
    if (user && (await bcrypt.compare(password, user.password))) {

        // 3. SUCCESS: Send token and user data
        res.json({
            _id: user._id,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            token: generateToken(user._id), // 👈 This generates the token
        });
    } else {
        // 4. FAILURE
        res.status(401);
        throw new Error('Invalid email or password');
    }
});


// @desc    Get current user profile data
// @route   GET /api/users/profile
// @access  Private (Requires token)
const getMyProfile = asyncHandler(async (req, res) => {
    // req.user is set by the protect middleware. 
    // req.user has the Mongoose object. We use ._id, not .id (though Express often converts it)
    res.status(200).json({
        _id: req.user._id, // 💡 Correction: Use ._id for consistency with Mongoose
        username: req.user.username,
        email: req.user.email,
        avatar: req.user.avatar,
    });
});

// @desc    Get my friends (Connected Users)
// @route   GET /api/users/friends (Replaces logic of getAllUsers for chat list)
// @access  Private
const getFriends = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).populate('friends', '-password');
    res.status(200).json(user.friends);
});

// @desc    Search for users (Global search) -> Returns users NOT already friends/pending
// @route   GET /api/users/search?query=abc
// @access  Private
const searchUsers = asyncHandler(async (req, res) => {
    const keyword = req.query.query ? {
        $or: [
            { username: { $regex: req.query.query, $options: 'i' } },
            { email: { $regex: req.query.query, $options: 'i' } },
        ],
    } : {};

    // Exclude current user
    let users = await User.find(keyword).find({ _id: { $ne: req.user._id } }).select('-password');

    // EXCLUDE users who are already friends or have pending requests
    const currentUser = await User.findById(req.user._id);
    users = users.filter(u =>
        !currentUser.friends.includes(u._id) &&
        !currentUser.sentRequests.includes(u._id) &&
        !currentUser.incomingRequests.includes(u._id)
    );

    res.json(users);
});

// @desc    Send Friend Request
// @route   POST /api/users/request/:id
// @access  Private
const sendFriendRequest = asyncHandler(async (req, res) => {
    const targetUserId = req.params.id;
    const currentUserId = req.user._id;

    if (targetUserId === currentUserId.toString()) {
        res.status(400); throw new Error("Cannot add yourself");
    }

    const targetUser = await User.findById(targetUserId);
    const currentUser = await User.findById(currentUserId);

    if (!targetUser) { res.status(404); throw new Error("User not found"); }

    // Check if already friends or requested
    if (currentUser.friends.includes(targetUserId)) { res.status(400); throw new Error("Already friends"); }
    if (currentUser.sentRequests.includes(targetUserId)) { res.status(400); throw new Error("Request already sent"); }
    if (currentUser.incomingRequests.includes(targetUserId)) { res.status(400); throw new Error("User has already sent you a request"); }

    // Update Arrays
    await User.findByIdAndUpdate(currentUserId, { $push: { sentRequests: targetUserId } });
    await User.findByIdAndUpdate(targetUserId, { $push: { incomingRequests: currentUserId } });

    res.status(200).json({ message: "Request Sent" });
});

// @desc    Accept Friend Request
// @route   POST /api/users/accept/:id
// @access  Private
const acceptFriendRequest = asyncHandler(async (req, res) => {
    const requesterId = req.params.id;
    const currentUserId = req.user._id;

    const currentUser = await User.findById(currentUserId);

    if (!currentUser.incomingRequests.includes(requesterId)) {
        res.status(400); throw new Error("No request from this user");
    }

    // Add to friends, remove from requests
    await User.findByIdAndUpdate(currentUserId, {
        $push: { friends: requesterId },
        $pull: { incomingRequests: requesterId }
    });

    await User.findByIdAndUpdate(requesterId, {
        $push: { friends: currentUserId },
        $pull: { sentRequests: currentUserId }
    });

    res.status(200).json({ message: "Request Accepted" });
});

// @desc    Get Incoming Requests
// @route   GET /api/users/requests
// @access  Private
const getFriendRequests = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).populate('incomingRequests', '-password');
    res.status(200).json(user.incomingRequests);
});


// KEEPING OLD getAllUsers for backward compatibility if needed, but updated to "getFriends" logic usually
const getAllUsers = getFriends;

module.exports = {
    registerUser,
    authUser,
    getMyProfile,
    getAllUsers, // Now maps to getFriends (Connected users only)
    searchUsers,
    sendFriendRequest,
    acceptFriendRequest,
    getFriendRequests
};