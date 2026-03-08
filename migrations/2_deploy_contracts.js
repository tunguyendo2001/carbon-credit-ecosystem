const MultiValidator = artifacts.require("MultiValidator");
const MintTokens = artifacts.require("MintTokens");
const AMM = artifacts.require("AMM");
const MintNFT = artifacts.require("MintNFT");

module.exports = async function (deployer, network, accounts) {
    if (!accounts[0]) {
        throw new Error("accounts[0] is undefined. Check your Truffle network configuration.");
    }

    const validatorAddress = accounts[0]; // Admin và cũng là Validator 1
    const validator2Address = accounts[1]; // Validator thứ 2 dùng để test
    const consumerAddress = accounts[2]; // Consumer address for AMM contract
    const initialFunding = web3.utils.toWei("50", "ether"); // Funding

    console.log("Deploying Contracts...");
    console.log(`Admin/Validator 1: ${validatorAddress}`);
    console.log(`Validator 2: ${validator2Address}`);

    // 1. Deploy Mint Tokens
    await deployer.deploy(MintTokens);
    const mintTokensInstance = await MintTokens.deployed();
    const mintTokensAddress = mintTokensInstance.address;

    // 2. Deploy Mint NFT
    await deployer.deploy(MintNFT);
    const mintNFTInstance = await MintNFT.deployed();
    const mintNFTAddress = mintNFTInstance.address;

    // 3. Deploy MultiValidator
    await deployer.deploy(MultiValidator, { from: validatorAddress });
    const multiValidatorInstance = await MultiValidator.deployed();

    console.log("Setting up MultiValidator logic...");

    // Gọi các hàm Setter để cấu hình địa chỉ contract
    await multiValidatorInstance.setMintContract(mintTokensAddress, { from: validatorAddress });
    await multiValidatorInstance.setNftContract(mintNFTAddress, { from: validatorAddress });

    // Tự động Add sẵn 4 tài khoản đầu tiên làm Validator (Whitelist)
    console.log("Adding validators to Whitelist...");
    for (let i = 0; i < 4; i++) {
        if (accounts[i]) {
            console.log(`Adding Account ${i}: ${accounts[i]} to Whitelist...`);
            await multiValidatorInstance.addValidator(accounts[i], { from: validatorAddress });
        }
    }

    // 4. Deploy AMM
    await deployer.deploy(AMM, consumerAddress, mintTokensAddress, { from: consumerAddress, value: initialFunding });

    console.log("✅ Deployment and Setup successful!");
};
