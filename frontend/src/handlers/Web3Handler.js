import Web3 from "web3";

const getWeb3 = async () => {
    if (window.ethereum) {
        try {
            // BƯỚC 1: Ép MetaMask hiện bảng chọn ví (thu hồi quyền cũ tạm thời)
            await window.ethereum.request({
                method: "wallet_requestPermissions",
                params: [{ eth_accounts: {} }],
            });

            // BƯỚC 2: Sau khi người dùng chọn xong, yêu cầu truy cập tài khoản
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });

            if (accounts.length > 0) {
                // Khởi tạo và trả về instance Web3 mới
                return new Web3(window.ethereum);
            }
        } catch (error) {
            console.error('Người dùng từ chối kết nối ví hoặc có lỗi:', error);
        }
    } else {
        alert('Vui lòng cài đặt MetaMask!');
    }
    return null;
}

export default getWeb3;
