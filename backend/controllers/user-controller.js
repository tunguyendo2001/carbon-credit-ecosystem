const bcrypt = require("bcryptjs");
const Generator = require(`../models/generator.js`);
const Consumer = require(`../models/consumer.js`);
const Validator = require(`../models/validator.js`);
const { Web3 } = require('web3');
const MultiValidatorArtifact = require('../../frontend/src/abis/MultiValidator.json');


//LOGIN
const loginGenerator = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await Generator.findOne({ username });

    if (user) {
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return res.status(401).json({ error: "Invalid password." });
      }

      res.status(200).json({
        message: "User logged in successfully!",
      });
    } else {
      return res.status(404).json({ error: "Email is not registered." });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error." });
  }
};

const loginConsumer = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await Consumer.findOne({ username });

    if (user) {
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return res.status(401).json({ error: "Invalid password." });
      }

      res.status(200).json({
        message: "User logged in successfully!",
      });
    } else {
      return res.status(404).json({ error: "Email is not registered." });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error." });
  }
};

const loginValidator = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await Validator.findOne({ username });

    if (user) {
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return res.status(401).json({ error: "Invalid password." });
      }

      res.status(200).json({
        validatorRole: user.role,
        message: "User logged in successfully!",
      });
    } else {
      return res.status(404).json({ error: "Email is not registered." });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error." });
  }
};

//REGISTRATION
const registerGenerator = async (req, res) => {
  try {
    // Nhận thêm walletAddress
    const { firstName, lastName, email, username, password, walletAddress } = req.body;

    const existingUser = await Generator.findOne({ email });

    if (!existingUser) {
      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await Generator.create({
        firstName,
        lastName,
        email,
        username,
        password: hashedPassword,
        walletAddress, // Lưu vào DB
      });

      return res.status(201).json({
        message: "User registered successfully!",
      });
    } else {
      return res.status(400).json({ error: "Email is already registered." });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error." });
  }
};

const registerConsumer = async (req, res) => {
  try {
    // Nhận thêm walletAddress
    const { firstName, lastName, email, username, password, walletAddress } = req.body;

    const existingUser = await Consumer.findOne({ email });

    if (!existingUser) {
      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await Consumer.create({
        firstName,
        lastName,
        email,
        username,
        password: hashedPassword,
        walletAddress, // Lưu vào DB
      });

      return res.status(201).json({
        message: "User registered successfully!",
      });
    } else {
      return res.status(400).json({ error: "Email is already registered." });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error." });
  }
};

const registerValidator = async (req, res) => {
  try {
    // Lấy thêm walletAddress từ form gửi lên
    const { role, firstName, lastName, email, username, password, walletAddress } = req.body;

    const existingUser = await Validator.findOne({ email });

    if (!existingUser) {
      const hashedPassword = await bcrypt.hash(password, 10);

      // ==========================================
      // GỌI SMART CONTRACT ĐỂ ADD VALIDATOR VÀO WHITELIST
      // ==========================================
      try {
        // Kết nối Ganache (Đổi thành IP của Docker/Cloud nếu không chạy localhost)
        const web3 = new Web3("http://127.0.0.1:8545");

        // Lấy danh sách account Ganache, account[0] là Admin
        const accounts = await web3.eth.getAccounts();
        const admin = accounts[0];

        // Khởi tạo Smart Contract
        const networkId = (await web3.eth.net.getId()).toString(); // Chuyển BigInt sang String để lookup JSON
        const deployedNetwork = MultiValidatorArtifact.networks[networkId];

        if (!deployedNetwork || !deployedNetwork.address) {
          console.error(`❌ Contract MultiValidator not found on network ID: ${networkId}`);
          return res.status(500).json({ error: "Contract not deployed on this network." });
        }

        const contract = new web3.eth.Contract(
          MultiValidatorArtifact.abi,
          deployedNetwork.address
        );

        console.log(`📡 Connecting to contract at: ${deployedNetwork.address} on network ${networkId}`);

        // Kiểm tra xem ví đã có trong danh sách trắng chưa
        const isAlreadyWhitelisted = await contract.methods.isValidator(walletAddress).call();

        if (isAlreadyWhitelisted) {
          console.log(`✅ Validator ${walletAddress} is already in the whitelist.`);
        } else {
          // Nếu chưa có, gửi giao dịch thêm vào (Dùng ví Admin)
          console.log(`⏳ Adding new validator ${walletAddress} to Blockchain...`);
          await contract.methods.addValidator(walletAddress).send({
            from: admin,
            gas: 3000000
          });
          console.log("✅ Validator added to whitelist successfully!");
        }
      } catch (bcError) {
        console.error("Blockchain Error:", bcError);
        return res.status(500).json({ error: "Failed to add Validator to Blockchain. Check Ganache/Contract." });
      }

      // LƯU VÀO DATABASE MONGO
      const user = await Validator.create({
        role,
        firstName,
        lastName,
        email,
        username,
        password: hashedPassword,
        walletAddress, // Lưu thêm địa chỉ ví
      });

      return res.status(201).json({
        message: "User registered and whitelisted successfully!",
      });
    } else {
      return res.status(400).json({ error: "Email is already registered." });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error." });
  }
};

exports.loginGenerator = loginGenerator;
exports.loginConsumer = loginConsumer;
exports.loginValidator = loginValidator;

exports.registerGenerator = registerGenerator;
exports.registerConsumer = registerConsumer;
exports.registerValidator = registerValidator;