Dưới đây là nội dung tệp `README.md` hoàn chỉnh, chuyên nghiệp được biên soạn dựa trên cấu trúc mã nguồn và các tài liệu nghiệp vụ của dự án **Carbon Credit Ecosystem (CCE)**.

---

# Carbon Credit Ecosystem (CCE) - Blockchain Based

Hệ sinh thái tín chỉ Carbon phi tập trung sử dụng công nghệ Blockchain, dữ liệu vệ tinh (Sentinel-2) và mô hình tài chính phi tập trung (DeFi) để minh bạch hóa thị trường tín chỉ carbon toàn cầu.

## 🌟 Giới thiệu tổng quan

Dự án giải quyết các vấn đề chí mạng của thị trường carbon truyền thống như:

* **Double-spending:** Ngăn chặn việc một tín chỉ bị bán nhiều lần.
* **Lack of Transparency:** Minh bạch hóa toàn bộ quy trình từ thẩm định đến tiêu hủy.
* **Liquidity Issues:** Tạo thanh khoản tức thì thông qua mô hình AMM (Automated Market Maker).

## 🏗 Kiến trúc hệ thống

Hệ thống được thiết kế theo mô hình 3 lớp:

1. **Application Layer:** Giao diện React.js Dashboard tích hợp ví MetaMask.
2. **Smart Contract Layer:** Logic nghiệp vụ chạy trên EVM (Solidity) gồm:
* `MultiValidator.sol`: Cơ chế đồng thuận xác thực đa bên.
* `MintTokens.sol`: Quản lý tài sản ERC-20 (Carbon Credits).
* `MintNFT.sol`: Cấp chứng nhận ERC-721 sau khi tiêu hủy tín chỉ.
* `AMM.sol`: Giao dịch tự động không qua trung gian.


3. **Infrastructure Layer:** Blockchain (Ethereum/Polygon) và lưu trữ phi tập trung (IPFS).

## 🚀 Công nghệ sử dụng

* **Blockchain:** Solidity, Truffle, Web3.js.
* **Backend:** Node.js (Express), Python (Flask - Xử lý dữ liệu vệ tinh Sentinel Hub).
* **Frontend:** React.js, MetaMask API.
* **Storage:** IPFS (Lưu trữ báo cáo & Metadata).

## 🛠 Hướng dẫn cài đặt

### 1. Yêu cầu hệ thống

* Node.js (v16+)
* Python 3.8+
* Truffle Suite
* MetaMask Extension trên trình duyệt.

### 2. Triển khai Smart Contracts

```bash
# Cài đặt Truffle toàn cục
npm install -g truffle

# Biên dịch và triển khai lên mạng thử nghiệm
truffle compile
truffle migrate --network development

```

### 3. Cài đặt Backend

```bash
cd backend
npm install

# Cài đặt dependencies cho Python
pip install flask sentinelhub numpy

# Khởi chạy server
npm start
# Trong một terminal khác, chạy Flask app
python app.py

```

### 4. Cài đặt Frontend

```bash
cd frontend
npm install
npm start

```

## 🔄 Luồng dữ liệu chính (Data Flow)

1. **Thẩm định:** Validator kiểm tra báo cáo dự án trên IPFS và ký phê duyệt on-chain.
2. **Phát hành:** Khi đạt >70% đồng thuận, Smart Contract tự động Mint Carbon Token (ERC-20).
3. **Giao dịch:** Token được đưa vào AMM Pool để người dùng mua bằng Stablecoin.
4. **Bù đắp:** Consumer thực hiện lệnh `Burn` token để nhận NFT chứng nhận quyền sở hữu vĩnh viễn và ghi nhận giảm phát thải.

## 📂 Cấu trúc thư mục

* `/contracts`: Mã nguồn Smart Contracts (Solidity).
* `/migrations`: Script triển khai hợp đồng.
* `/backend`: API server, xử lý IPFS và logic Oracle vệ tinh (Python).
* `/frontend`: Giao diện Dashboard cho người dùng (React).
* `/abis`: File định nghĩa giao diện hợp đồng thông minh cho Web3.

## 📄 Giấy phép

Dự án được phát hành dưới giấy phép MIT.

---

*Dự án được phát triển dựa trên nghiên cứu "A Blockchain-based Carbon Credit Ecosystem" của Dr. Soheil Saraji & Dr. Mike Borowczak.*
