/*
Purpose: This file contains the business logic—the functions that handle the incoming requests, interact with the database (using the User model), and send back the response. It keeps the route files clean.
*/

//-----------------------------------------------------------------------------------------------------------------



const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
// ... imports ...
const User = require('../models/User');
const Message = require('../models/Message'); // 💡 Import Message Model
const jwt = require('jsonwebtoken');

// Adding a helper function to generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
}

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
    const { username, email, password, avatar, avatarType } = req.body;

    if (!username || !email || !password) {
        res.status(400);
        throw new Error('Please enter all required fields.');
    }

    const userExists = await User.findOne({ $or: [{ username }, { email }] });
    if (userExists) {
        res.status(400);
        throw new Error('User already exists.');
    }

    const user = await User.create({
        username,
        email,
        password,
        avatar: avatar || null,
        avatarType: avatarType || 'emoji',
    });

    if (user) {
        res.status(201).json({
            _id: user._id,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            avatarType: user.avatarType,
            token: generateToken(user._id),
            message: 'User registered successfully',
        });
    } else {
        res.status(500);
        throw new Error('Invalid user data received.');
    }
});

// @desc    Authenticate user & get token (Login)
// @route   POST /api/users/login
// @access  Public
const authUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
        res.json({
            _id: user._id,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            token: generateToken(user._id),
        });
    } else {
        res.status(401);
        throw new Error('Invalid email or password');
    }
});

// @desc    Get current user profile data
// @route   GET /api/users/profile
// @access  Private
const getMyProfile = asyncHandler(async (req, res) => {
    res.status(200).json({
        _id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        avatar: req.user.avatar,
    });
});

const getAllUsers = asyncHandler(async (req, res) => {
    const currentUserId = req.user._id;
    const users = await User.find({ _id: { $ne: currentUserId } })
        .select('-password -__v')
        .sort({ username: 1 });

    if (users) {
        res.status(200).json(users);
    } else {
        res.status(404);
        throw new Error('No other users found.');
    }
});

// @desc    Get 4 most recent chat contacts
// @route   GET /api/users/recent
// @access  Private
const getRecentContacts = asyncHandler(async (req, res) => {
    const currentUserId = req.user._id;

    const recentConversations = await Message.aggregate([
        {
            $match: {
                $or: [
                    { sender: currentUserId },
                    { receiver: currentUserId }
                ]
            }
        },
        { $sort: { createdAt: -1 } },
        {
            $group: {
                _id: {
                    $cond: [
                        { $eq: ["$sender", currentUserId] },
                        "$receiver",
                        "$sender"
                    ]
                },
                lastMessageTime: { $first: "$createdAt" },
                lastMessageContent: { $first: "$content" },
                messageType: { $first: "$messageType" }
            }
        },
        { $sort: { lastMessageTime: -1 } },
        { $limit: 4 },
        {
            $lookup: {
                from: "users",
                localField: "_id",
                foreignField: "_id",
                as: "userDetails"
            }
        },
        { $unwind: "$userDetails" },
        {
            $project: {
                _id: "$userDetails._id",
                username: "$userDetails.username",
                email: "$userDetails.email",
                avatar: "$userDetails.avatar",
                avatarType: "$userDetails.avatarType",
                lastMessage: "$lastMessageContent",
                lastMessageTime: "$lastMessageTime",
                messageType: "$messageType",
                isOnline: "$userDetails.isOnline"
            }
        }
    ]);

    res.json(recentConversations);
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateMyProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        user.username = req.body.username || user.username;
        user.email = req.body.email || user.email;
        user.avatar = req.body.avatar || user.avatar;
        user.avatarType = req.body.avatarType || user.avatarType;

        if (req.body.password) {
            user.password = req.body.password;
        }

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            username: updatedUser.username,
            email: updatedUser.email,
            avatar: updatedUser.avatar,
            avatarType: updatedUser.avatarType,
            token: generateToken(updatedUser._id),
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

module.exports = {
    registerUser,
    authUser,
    getMyProfile,
    getAllUsers,
    getRecentContacts,
    updateMyProfile
};