# Makefile cho Carbon Credit Ecosystem

# Định nghĩa các biến
TRUFFLE = npx truffle
GANACHE_PORT = 8545

.PHONY: all help install start-chain deploy demo clean

# Target mặc định
all: help

# Hiển thị hướng dẫn
help:
	@echo "----------------------------------------------------------------------"
	@echo "AVAILABLE COMMANDS:"
	@echo "  make install      : Cài đặt các dependencies (npm install)"
	@echo "  make deploy       : Compile và Deploy Smart Contracts lên mạng local"
	@echo "  make demo         : Chạy kịch bản Demo Luồng dữ liệu chính"
	@echo "  make full-demo    : Chạy toàn bộ (Install -> Deploy -> Demo)"
	@echo "----------------------------------------------------------------------"

# Cài đặt thư viện
install:
	@echo "📦 Đang cài đặt thư viện..."
	npm install

# Deploy Smart Contracts
deploy:
	@echo "🚀 Đang deploy Smart Contracts..."
	$(TRUFFLE) migrate --reset --network development

# Chạy Demo Script
demo:
	@echo "🎬 Đang chạy kịch bản Demo..."
	$(TRUFFLE) exec scripts/demo_data_flow.js --network development

# Chạy toàn bộ luồng từ đầu (Dùng cho lần đầu tiên)
full-demo: deploy demo

# Dọn dẹp build artifacts
clean:
	@echo "🧹 Đang dọn dẹp thư mục build..."
	rm -rf build/
	@echo "✅ Đã dọn dẹp xong."
