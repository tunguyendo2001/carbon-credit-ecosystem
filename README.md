# 🌿 Carbon Credit Ecosystem (CCE) — Blockchain Based

Hệ sinh thái tín chỉ Carbon phi tập trung sử dụng công nghệ **Blockchain (Ethereum/Polygon)**, **dữ liệu vệ tinh Sentinel-2** và mô hình **DeFi (AMM)** để minh bạch hóa thị trường tín chỉ carbon toàn cầu.

> Dự án được phát triển dựa trên nghiên cứu *"A Blockchain-based Carbon Credit Ecosystem"* — Dr. Soheil Saraji & Dr. Mike Borowczak.

---

## 📋 Mục lục

- [Tổng quan hệ thống](#-tổng-quan-hệ-thống)
- [Thành phần hệ thống](#-thành-phần-hệ-thống)
- [Luồng thực thi](#-luồng-thực-thi)
- [Cấu trúc thư mục](#-cấu-trúc-thư-mục)
- [Yêu cầu hệ thống](#-yêu-cầu-hệ-thống)
- [Hướng dẫn cài đặt & cấu hình](#-hướng-dẫn-cài-đặt--cấu-hình)
- [Triển khai Smart Contracts](#-triển-khai-smart-contracts)
- [Kịch bản Demo End-to-End](#-kịch-bản-demo-end-to-end)

---

## 🌐 Tổng quan hệ thống

Hệ thống giải quyết các vấn đề cốt lõi của thị trường carbon truyền thống:

| Vấn đề | Giải pháp |
|--------|-----------|
| **Double-spending** | Token ERC-20 on-chain — mỗi tín chỉ chỉ tồn tại duy nhất |
| **Thiếu minh bạch** | Toàn bộ quy trình từ thẩm định → phát hành → tiêu hủy được ghi trên blockchain |
| **Thanh khoản kém** | AMM (Automated Market Maker) cho phép mua/bán tức thì không qua trung gian |
| **Gian lận dữ liệu** | Validator độc lập tái tính NDVI từ vệ tinh Sentinel-2 để đối chiếu |

### Kiến trúc 3 lớp

```
┌────────────────────────────────────────────────────┐
│              Application Layer                     │
│   React.js Dashboard  ×  MetaMask  ×  WebSocket    │
├────────────────────────────────────────────────────┤
│             Smart Contract Layer (EVM)             │
│  MultiValidator  ·  MintTokens  ·  MintNFT  ·  AMM │
├────────────────────────────────────────────────────┤
│              Infrastructure Layer                  │
│   Ganache/Ethereum  ·  IPFS  ·  MongoDB            │
└────────────────────────────────────────────────────┘
```

---

## 🧩 Thành phần hệ thống

### Smart Contracts (`/contracts`)

| Contract | Chuẩn | Mô tả |
|----------|-------|-------|
| `MultiValidator.sol` | — | Cơ chế đồng thuận đa bên; yêu cầu ≥ 2 Validator ký để mint/burn |
| `MintTokens.sol` | ERC-20 | Phát hành và quản lý Carbon Credit Token (CCT) |
| `MintNFT.sol` | ERC-721 | Cấp chứng nhận Carbon Removal Certificate (CRC) sau khi tiêu hủy tín chỉ |
| `AMM.sol` | — | Sàn giao dịch tự động; cho phép niêm yết và mua CCT bằng ETH |

### Backend

| Thành phần | Công nghệ | Cổng | Chức năng |
|------------|-----------|------|-----------|
| **Flask API** | Python 3 | `5000` | Tính NDVI qua Sentinel Hub API; ước tính CO₂ hấp thụ |
| **Express API** | Node.js | `8000` | Auth (đăng ký/đăng nhập); relay thông báo WebSocket |
| **WebSocket Server** | ws | `8080` | Thông báo real-time từ Generator → Validators và Consumer → Validators |
| **MongoDB** | MongoDB | `27017` | Lưu tài khoản off-chain (Generator, Consumer, Validator) |

### Frontend (`/frontend`)

Ứng dụng React có thể chạy ở **4 chế độ portal** (mỗi vai trò một cổng riêng):

| Portal | Cổng | Vai trò | Chức năng chính |
|--------|------|---------|-----------------|
| Generator | `3000` | Chủ dự án rừng | Chọn vùng bản đồ, tính NDVI, gửi cho Validator, niêm yết CCT lên AMM |
| Consumer | `3001` | Doanh nghiệp mua tín chỉ | Mua CCT từ AMM, retire (tiêu hủy) để nhận CRC NFT |
| Validator 1 | `3002` | Kiểm định viên | Xác minh NDVI, ước tính CO₂, approve mint CCT và approve CRC |
| Validator 2 | `3003` | Kiểm định viên | Tương tự Validator 1 (cần đủ 2 chữ ký) |

---

## 🔄 Luồng thực thi

```
Generator                  Validator 1 & 2                Consumer
    │                            │                           │
    ├─ Chọn vùng rừng            │                           │
    ├─ Tính NDVI (Sentinel-2)    │                           │
    ├─ Gửi NDVI ──────────────►  │                           │
    │                            ├─ Xác minh NDVI            │
    │                            ├─ Ước tính CO₂             │
    │                            ├─ Approve CCT (×2) ──────► │ [on-chain: mintTokens]
    │◄─────────────── CCT Token ──┘                          │
    │                                                        │
    ├─ Niêm yết CCT lên AMM                                  │
    │                                                        │
    │                                               ├─ Fetch AMM listings
    │                                               ├─ Mua CCT (ETH → CCT)
    │                                               ├─ Retire CCT ──────────►│
    │                                                        │◄──────────────┤
    │                                                        ├─ Approve CRC (×2)
    │                                                        │  [on-chain: burnFrom + mintCRC]
    │                                                        │
    │                                               ◄─── CRC NFT (ERC-721) ──┘
```

**Chi tiết từng bước:**

1. **Thẩm định NDVI** — Generator chọn vùng đất trên bản đồ Leaflet → gọi Sentinel Hub API để lấy ảnh vệ tinh → tính chỉ số NDVI → gửi qua WebSocket cho Validators.
2. **Kiểm định độc lập** — Mỗi Validator tự gọi lại Sentinel Hub để tính NDVI từ cùng tọa độ, đối chiếu với dữ liệu Generator, rồi ước tính lượng CO₂ hấp thụ.
3. **Phát hành CCT** — Sau khi 2 Validator `voteToApprove()` on-chain, `MultiValidator` tự động gọi `mintTokens()` để phát hành CCT (ERC-20) cho Generator.
4. **Giao dịch AMM** — Generator `approve()` cho contract AMM rồi `listTokens()`. Consumer `fetchListings()` → `buyTokens()` bằng ETH.
5. **Retire & Cấp CRC** — Consumer `approve()` cho `MultiValidator` rồi gửi yêu cầu retire. Sau khi 2 Validator `burnTokens()` on-chain: CCT bị đốt, CRC NFT (ERC-721) được mint cho Consumer.

---

## 📂 Cấu trúc thư mục

```
carbon-credit-ecosystem/
├── contracts/
│   ├── AMM.sol
│   ├── MintNFT.sol
│   ├── MintTokens.sol
│   └── MultiValidator.sol
├── migrations/
│   └── 2_deploy_contracts.js
├── backend/
│   ├── app.py                  # Flask: NDVI & CO₂ API
│   ├── server.js               # Express: Auth & WebSocket relay
│   ├── websocket.js            # WebSocket server
│   ├── controllers/
│   │   └── user-controller.js
│   ├── models/
│   │   ├── generator.js
│   │   ├── consumer.js
│   │   └── validator.js
│   ├── handlers/
│   │   └── IPFSHandler.js
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── abis/               # ABI JSON sau khi compile (tự động sinh)
│   │   ├── pages/
│   │   │   ├── UserDashboard/  # Dashboard Generator / Consumer / Validator
│   │   │   ├── UserLogin/
│   │   │   ├── UserRegistration/
│   │   │   └── UserSelection/
│   │   └── handlers/
│   │       └── Web3Handler.js
│   ├── package.json
│   └── Dockerfile.nginx
├── docker-compose.yml
├── truffle-config.js
└── README.md
```

---

## ⚙️ Yêu cầu hệ thống

| Công cụ | Phiên bản tối thiểu |
|---------|---------------------|
| Node.js | 16+ |
| Python | 3.8+ |
| Truffle Suite | Mới nhất |
| Ganache | Mới nhất (`npm install -g ganache`) |
| MongoDB | 6+ |
| MetaMask | Extension trên trình duyệt |

---

## 🛠 Hướng dẫn cài đặt & cấu hình

### 1. Clone repo

```bash
git clone <repo-url>
cd carbon-credit-ecosystem
```

### 2. Cấu hình biến môi trường

**Backend Python** — tạo file `backend/.env` từ mẫu:

```bash
cp backend/.env.example backend/.env
```

Điền các giá trị vào `backend/.env`:

```env
FLASK_APP=app.py
SECRET_KEY=your_secret_key_here

# Lấy từ https://apps.sentinel-hub.com/dashboard/
SENTINAL_HUB_CLIENT_ID=your_sentinel_client_id
SENTINAL_HUB_CLIENT_SECRET=your_sentinel_client_secret
SENTINAL_HUB_INSTANCE_ID=your_sentinel_instance_id
```

**Backend Node.js** — các biến DB được đọc từ `backend/nodemon.json` (đã có sẵn cho dev):

```json
{
  "env": {
    "DB_USER": "admin",
    "DB_PASSWORD": "admin",
    "DB_NAME": "off-chain-db",
    "DB_URL": "localhost:27017"
  }
}
```

Hoặc đặt biến `MONGO_URI` trực tiếp:

```bash
export MONGO_URI=mongodb://admin:admin@localhost:27017/off-chain-db?authSource=admin
```

**Frontend** — nếu backend chạy trên host khác, tạo `frontend/.env`:

```env
REACT_APP_API_URL=http://localhost:8000
```

> Mặc định frontend gọi API tại `http://localhost:8000` (hardcode trong code); chỉ cần đặt biến này nếu muốn override.

### 3. Cài đặt dependencies

**Backend Node.js:**
```bash
cd backend
npm install
```

**Backend Python (khuyên dùng virtualenv):**
```bash
cd backend
python -m venv venv
source venv/bin/activate          # Linux/macOS
# venv\Scripts\activate           # Windows
pip install flask sentinelhub numpy flask_cors python-dotenv pillow
```

**Frontend:**
```bash
cd frontend
npm install
```

**Smart Contracts:**
```bash
npm install -g truffle
```

---

## 🚀 Triển khai Smart Contracts

### Bước 1 — Khởi động Ganache (local blockchain)

```bash
ganache --port 8545 --chain.networkId 5777
```

> Ganache sẽ in ra danh sách 10 tài khoản với private key. Ghi lại các địa chỉ để import vào MetaMask.

### Bước 2 — Compile & Deploy contracts

```bash
# Xóa build cũ (nếu có)
rm -rf build/

# Compile tất cả contracts
truffle compile --all

# Deploy lên mạng development
truffle migrate --reset --network development
```

> ABI JSON sẽ được tự động sinh ra tại `frontend/src/abis/` (được cấu hình trong `truffle-config.js`).

### Bước 3 — Import tài khoản vào MetaMask

1. Mở MetaMask → **Add Network** với thông số:
   - Network Name: `Ganache Local`
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `5777`
   - Currency Symbol: `ETH`

2. Import private key từ Ganache output:
   - `accounts[0]` → dùng cho **Validator** (deploy MultiValidator)
   - `accounts[1]` → dùng cho **Generator**
   - `accounts[2]` → dùng cho **Consumer** (deploy AMM)
   - `accounts[3]` → dùng cho **Validator 2** (tài khoản bổ sung)

---

## ▶️ Chạy các dịch vụ

Mở **5 terminal** riêng biệt và chạy lần lượt:

```bash
# Terminal 1 — Flask API (NDVI & CO₂)
cd backend
source venv/bin/activate
python app.py
# Chạy tại http://localhost:5000

# Terminal 2 — Express API + WebSocket relay
cd backend
npm start
# Chạy tại http://localhost:8000 và ws://localhost:8080

# Terminal 3 — Ganache (nếu chưa chạy)
ganache --port 8545 --chain.networkId 5777

# Terminal 4 — Frontend Generator portal
cd frontend
npm run start-generator
# Chạy tại http://localhost:3000

# Terminal 5 — Frontend Consumer portal (tuỳ chọn)
cd frontend
npm run start-consumer
# Chạy tại http://localhost:3001
```

**Các lệnh script frontend đầy đủ:**

| Lệnh | Cổng | Portal |
|------|------|--------|
| `npm run start-generator` | 3000 | Generator |
| `npm run start-consumer` | 3001 | Consumer |
| `npm run start-validator` | 3002 | Validator 1 |
| `npm run start-validator-2` | 3003 | Validator 2 |

> **Lưu ý:** Cần đảm bảo MongoDB đang chạy trước khi khởi động Express server. Nếu dùng Docker: `docker run -d -p 27017:27017 -e MONGO_INITDB_ROOT_USERNAME=admin -e MONGO_INITDB_ROOT_PASSWORD=admin mongo`

---

## 🎬 Kịch bản Demo End-to-End

### Chuẩn bị

- Mở **4 tab trình duyệt** cho 4 portal: Generator (`3000`), Validator 1 (`3002`), Validator 2 (`3003`), Consumer (`3001`).
- Đảm bảo Ganache đang chạy và MetaMask đã import đủ tài khoản.
- Mỗi tab chọn đúng tài khoản MetaMask tương ứng.

---

### Bước 1 — Đăng ký & Đăng nhập

Tại mỗi portal, truy cập trang **User Selection** → chọn đúng vai trò → **Đăng ký** tài khoản (lần đầu) hoặc **Đăng nhập** (đã có tài khoản).

---

### Bước 2 — Generator: Đo NDVI & Gửi dữ liệu

> **Tab Generator** | MetaMask: `accounts[1]`

1. Click **"Connect Wallet"** → ký xác nhận trong MetaMask.
2. Trên bản đồ Leaflet, click vào một **vùng rừng** — hệ thống sẽ vẽ khung chữ nhật bao quanh.
3. Click **"Calculate NDVI"** → Flask API gọi Sentinel Hub, tính chỉ số NDVI từ ảnh vệ tinh.
4. Click **"Send NDVI"** → dữ liệu được gửi qua WebSocket tới tất cả Validators đang online.

---

### Bước 3 — Validator 1 & 2: Kiểm định & Approve CCT

> **Tab Validator 1** | MetaMask: `accounts[0]`  
> **Tab Validator 2** | MetaMask: `accounts[3]`

Thực hiện **lần lượt tại cả 2 tab Validator**:

1. Click **"Connect Wallet"**.
2. Click **"Verify NDVI"** → Flask API tự tính lại NDVI từ cùng tọa độ để đối chiếu.
3. Click **"Estimate CO₂ Sequestration"** → quy đổi NDVI thành lượng CO₂ và số CCT tương ứng.
4. Click **"Approve CCT"** → ký giao dịch `voteToApprove()` trên MetaMask.

> ✅ Sau khi **Validator thứ 2** approve, Smart Contract tự động `mintTokens()` — CCT (ERC-20) được phát hành vào ví Generator.

---

### Bước 4 — Generator: Kiểm tra số dư & Niêm yết lên AMM

> **Tab Generator**

1. Click **"View CCT"** → kiểm tra số dư CCT vừa nhận.
2. Nhập số lượng CCT muốn bán và giá ETH/CCT.
3. Click **"List on AMM"**:
   - MetaMask ký lần 1: `approve()` — cấp quyền cho AMM contract.
   - MetaMask ký lần 2: `listTokens()` — niêm yết lên sàn.

---

### Bước 5 — Consumer: Mua CCT từ AMM

> **Tab Consumer** | MetaMask: `accounts[2]`

1. Click **"Connect Wallet"**.
2. Click **"Fetch from AMM"** → tải danh sách đang bán.
3. Click vào listing của Generator để chọn.
4. Nhập số lượng CCT muốn mua → click **"Buy CCT"** → ký MetaMask (thanh toán ETH).
5. Click **"View CCT"** → xác nhận số dư CCT trong ví.

---

### Bước 6 — Consumer: Retire CCT (Bù đắp phát thải)

> **Tab Consumer**

1. Nhập số lượng CCT muốn tiêu hủy vào ô **Retire**.
2. Click **"Retire CCT"** → MetaMask ký `approve()` cho MultiValidator.
3. Hệ thống gửi yêu cầu retire qua WebSocket tới Validators.

---

### Bước 7 — Validator 1 & 2: Approve CRC

> **Tab Validator 1** và **Tab Validator 2**

Màn hình Validator hiển thị yêu cầu retire mới từ Consumer.

1. Click **"Approve CRC"** → ký MetaMask để gọi `burnTokens()`.
2. Lặp lại tại **Validator 2**.

> ✅ Sau khi cả 2 Validator approve:  
> - CCT của Consumer bị đốt (`burnFrom`).  
> - NFT chứng nhận CRC (ERC-721) được mint vào ví Consumer.

---

### Bước 8 — Consumer: Xem CRC NFT

> **Tab Consumer**

1. Click **"View CRC"** → Smart Contract trả về thông tin chứng nhận:
   - Địa chỉ ví chủ sở hữu
   - Số lượng CCT đã retire
   - Timestamp ghi nhận on-chain

🎉 **Hoàn tất luồng demo!** Doanh nghiệp đã có bằng chứng bù đắp carbon được ghi vĩnh viễn trên blockchain.

---

## 🐳 Chạy bằng Docker Compose (Tuỳ chọn)

```bash
docker-compose up --build
```

Sau khi các container khởi động, vẫn cần chạy thủ công bước deploy contracts:

```bash
truffle migrate --reset --network development
```

Truy cập frontend tại `http://localhost`, mở 4 tab mà đăng nhập với từng role user.

---
