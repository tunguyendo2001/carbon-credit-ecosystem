/* scripts/demo_data_flow.js */
const MultiValidator = artifacts.require("MultiValidator");
const MintTokens = artifacts.require("MintTokens");
const AMM = artifacts.require("AMM");
const MintNFT = artifacts.require("MintNFT");

module.exports = async function(callback) {
  try {
    const accounts = await web3.eth.getAccounts();
    const [deployer, generator, validator1, validator2, validator3, consumer] = accounts;

    // Load Contracts
    const multiValidator = await MultiValidator.deployed();
    const mintTokens = await MintTokens.deployed();
    const amm = await AMM.deployed();
    const mintNFT = await MintNFT.deployed();

    console.log("\n==================================================");
    console.log("🚀 BẮT ĐẦU DEMO LUỒNG DỮ LIỆU TÍN CHỈ CARBON");
    console.log("==================================================\n");

    // --- BƯỚC 1: THẨM ĐỊNH (VERIFICATION) ---
    console.log("1️⃣  BƯỚC 1: THẨM ĐỊNH (VERIFICATION)");
    const ipfsHash = "QmTestHash123456789"; // Giả lập hash từ IPFS
    const amountToMint = web3.utils.toWei("1000", "ether"); // 1000 Credits

    // Giả lập Generator gửi yêu cầu (Trong thực tế backend gọi, ở đây ta giả lập Validator vote luôn)
    console.log(`   - Generator yêu cầu phát hành: 1000 Tín chỉ`);
    
    // Các Validator bỏ phiếu (Cần >70% đồng thuận)
    // Giả sử cần 2/3 phiếu (Logic trong Smart Contract của bạn)
    console.log("   - Validator 1 đang xác thực báo cáo trên IPFS...");
    await multiValidator.voteToApprove(generator, amountToMint, { from: validator1 });
    console.log("   ✅ Validator 1 đã ký duyệt.");

    console.log("   - Validator 2 đang xác thực báo cáo trên IPFS...");
    await multiValidator.voteToApprove(generator, amountToMint, { from: validator2 });
    console.log("   ✅ Validator 2 đã ký duyệt.");
    
    // --- BƯỚC 2: PHÁT HÀNH (ISSUANCE) ---
    console.log("\n2️⃣  BƯỚC 2: PHÁT HÀNH (ISSUANCE)");
    // Kiểm tra số dư của Generator
    let balance = await mintTokens.balanceOf(generator);
    console.log(`   - Số dư Generator hiện tại: ${web3.utils.fromWei(balance)} CCE`);
    
    if (balance.toString() === amountToMint.toString() || balance > 0) {
         console.log("   🎉 Smart Contract đã tự động Mint Token thành công!");
    } else {
         console.log("   ⚠️ Chưa Mint được token (Cần kiểm tra lại logic MultiValidator)");
    }

// --- BƯỚC 3: GIAO DỊCH (TRADING / MARKETPLACE) ---
    console.log("\n3️⃣  BƯỚC 3: GIAO DỊCH (TRADING)");
    
    // Cấp quyền cho AMM Contract (Thực chất là Marketplace) tiêu tiền hộ
    await mintTokens.approve(amm.address, amountToMint, { from: generator });
    
    // Generator niêm yết bán (List Tokens)
    // Lưu ý: Hợp đồng của bạn nhân giá trực tiếp với 1 Ether (scaledPrice = _price * 1 ether).
    // Nên _price = 1 nghĩa là 1 ETH cho 1 Token. 
    // Mạng Ganache ảo cho mỗi ví 100 ETH, nên chúng ta sẽ test bán 10 Token giá 1 ETH/Token.
    const sellAmount = 10;
    const sellPrice = 1; 
    console.log(`   - Generator niêm yết bán ${sellAmount} CCE với giá ${sellPrice} ETH/CCE...`);
    await amm.listTokens(sellAmount, sellPrice, { from: generator });
    console.log("   ✅ Đã niêm yết lên sàn thành công.");

    // Consumer mua token từ đơn hàng đầu tiên (index = 0)
    // Consumer phải trả 10 Token * 1 ETH = 10 ETH
    const ethToPay = web3.utils.toWei("10", "ether");
    console.log(`   - Consumer mua ${sellAmount} tín chỉ và thanh toán 10 ETH...`);
    await amm.buyTokens(0, sellAmount, { from: consumer, value: ethToPay });
    
    const consumerBalance = await mintTokens.balanceOf(consumer);
    console.log(`   💰 Số dư Consumer sau khi mua: ${web3.utils.fromWei(consumerBalance)} CCE`);

    // --- BƯỚC 4: BÙ ĐẮP (OFFSETTING / BURNING) ---
    console.log("\n4️⃣  BƯỚC 4: BÙ ĐẮP & NHẬN NFT (OFFSETTING)");
    
    const burnAmount = consumerBalance; // Burn hết số vừa mua
    console.log(`   - Consumer thực hiện lệnh Burn ${web3.utils.fromWei(burnAmount)} CCE để bù đắp phát thải...`);
    
    // Consumer cần approve cho contract MintTokens được quyền burn (nếu logic yêu cầu) hoặc gọi hàm burn trực tiếp
    // Giả sử hàm burn trong MintTokens.sol tự xử lý
    await mintTokens.burn(burnAmount, { from: consumer });
    console.log("   🔥 Token đã bị tiêu hủy khỏi lưu thông.");

    // Kiểm tra NFT
    const nftBalance = await mintNFT.balanceOf(consumer);
    console.log(`   🏆 Consumer đã nhận được: ${nftBalance} NFT Chứng nhận Xanh (ERC-721).`);

    console.log("\n==================================================");
    console.log("✅ DEMO HOÀN TẤT THÀNH CÔNG");
    console.log("==================================================\n");

    callback();
  } catch (error) {
    console.error(error);
    callback(error);
  }
};
