const mongoose = require('mongoose');

const generatorSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    walletAddress: { type: String, required: true } // <-- Thêm trường này
});
const Generator = mongoose.model('User', generatorSchema, 'generators');

module.exports = Generator;
