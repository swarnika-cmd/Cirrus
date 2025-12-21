require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const cleanUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');

        const keepUsers = ['harsh', 'sarthakkk', 'john_doe'];

        // Delete users NOT in the keep list
        const result = await User.deleteMany({ username: { $nin: keepUsers } });
        console.log(`✅ successfully deleted ${result.deletedCount} users.`);
        console.log(`kept users: ${keepUsers.join(', ')}`);

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

cleanUsers();
