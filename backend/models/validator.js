const mongoose = require("mongoose");

const ValidatorSchema = new mongoose.Schema(
  {
    role: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    walletAddress: { type: String, required: true } // <-- THÊM DÒNG NÀY
  }
);

const Validator = mongoose.model("Validator", ValidatorSchema, 'validators');
module.exports = Validator;
