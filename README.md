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

## tund23

```bash
# tab 1
cd backend && source venv/bin/activate && python app.py
# tab 2
cd backend && npm start
# tab 3
ganache --port 8545 --chain.networkId 5777
# tab 4
cd frontend && npm run start-generator
# tab 5 - build & deploy contract use truffle
rm -r build
truffle compile --all
truffle migrate --reset --network development
```

## 🎬 Kịch bản Demo: Hệ sinh thái Tín chỉ Carbon (End-to-End)
📌 Chuẩn bị trước khi Demo:
Mở sẵn 4 tab trình duyệt cho 4 portal: Generator, Validator 1, Validator 2, và Consumer. Đảm bảo Ganache đang chạy và MetaMask đã được import sẵn các tài khoản.

### Bước 1: Khởi tạo dự án và Yêu cầu cấp tín chỉ (Tại tab Generator)

Chọn đúng tài khoản Generator trên MetaMask.

Click "Connect Wallet" để liên kết ví.

Trên bản đồ Leaflet, click chọn một vùng rừng (hệ thống sẽ vẽ một khung chữ nhật bao quanh).

Click "Calculate NDVI" để gọi AI/Vệ tinh phân tích chỉ số mảng xanh.

Click "Send NDVI" để gửi dữ liệu này lên hệ thống (WebSocket sẽ lập tức báo tin cho các Validators).

### Bước 2: Kiểm định và Phê duyệt phát hành (Tại tab Validator 1 & Validator 2)

Chuyển sang tài khoản Validator 1 trên MetaMask và tab Validator 1. Click "Connect Wallet".

Click "Verify NDVI" để hệ thống tự tính toán lại nhằm đối chiếu, tránh việc Generator gian lận số liệu.

Click "Estimate CO2 Sequestration" để quy đổi chỉ số NDVI thành lượng CO2 hấp thụ và số Tín chỉ (CCT) tương ứng.

Click "Approve CCT" và ký giao dịch trên MetaMask để bỏ phiếu đồng thuận.

Lặp lại y hệt 4 thao tác trên tại tab Validator 2. (Vì Smart Contract yêu cầu đa chữ ký, khi đủ 2 phiếu, Token CCT sẽ tự động được đúc và gửi cho Generator).

### Bước 3: Nhận Token và Niêm yết lên sàn giao dịch (Tại tab Generator)

Quay lại tab Generator, click "View CCT" để kiểm tra số dư Token ERC-20 vừa được đúc.

Kéo xuống mục AMM, nhập số lượng CCT muốn bán và giá bán (ETH/CCT).

Click "List on AMM". (Hệ thống sẽ yêu cầu ký MetaMask 2 lần: Lần 1 để cấp quyền cho sàn AMM, Lần 2 để thực sự niêm yết lên sàn).

### Bước 4: Mua Tín chỉ Carbon (Tại tab Consumer)

Chuyển sang tài khoản Consumer trên MetaMask và tab Consumer. Click "Connect Wallet".

Click "Fetch from AMM" để tải danh sách các đơn hàng đang được bán trên sàn.

Chọn đơn hàng của Generator, nhập số lượng muốn mua và click "Buy CCT".

Ký giao dịch trên MetaMask để thanh toán bằng ETH và nhận CCT về ví.

Click "View CCT" (phía dưới) để xác nhận số dư tín chỉ vừa mua thành công.

### Bước 5: Bù đắp phát thải - Tiêu hủy tín chỉ (Tại tab Consumer)

Kéo xuống mục Retire, nhập số lượng CCT muốn tiêu hủy để bù đắp lượng Carbon xả thải của doanh nghiệp.

Click "Retire CCT".

Ký giao dịch trên MetaMask để cấp quyền cho Validator thu hồi số token này. (Lúc này WebSocket sẽ báo tin cho Validators).

### Bước 6: Xác nhận tiêu hủy và Cấp Chứng nhận (Tại tab Validator 1 & Validator 2)

Quay lại tab Validator 1, lúc này màn hình đã hiện yêu cầu tiêu hủy của Consumer.

Click "Approve CRC" và ký MetaMask để thực hiện đốt token (Burn).

Lặp lại thao tác "Approve CRC" tại tab Validator 2 để hoàn tất sự đồng thuận. Sau bước này, một NFT Chứng nhận (ERC-721) sẽ được đúc cho Consumer.

### Bước 7: Nhận NFT Chứng nhận Bù đắp Carbon (Tại tab Consumer)

Quay lại tab Consumer lần cuối.

Click nút "View CRC".

Thông tin chi tiết của Carbon Removal Certificate (NFT) sẽ hiện ra, chứng minh doanh nghiệp đã tiêu hủy thành công số lượng tín chỉ được ghi nhận vĩnh viễn trên Blockchain! 🎉

