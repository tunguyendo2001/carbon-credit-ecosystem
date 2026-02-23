// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract MintTokens {
    string public name = "Carbon Credit Token";
    string public symbol = "CCT";
    uint8 public decimals = 18;

    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    
    // Thêm mapping quản lý quyền chi tiêu (Bắt buộc của ERC-20)
    mapping(address => mapping(address => uint256)) public allowance;

    // Các sự kiện bắt buộc của ERC-20 để Frontend (MetaMask) theo dõi được
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    // Phát hành tín chỉ cho Generator
    function mintTokens(address _generator, uint256 _amount) external {
        balanceOf[_generator] += _amount;
        totalSupply += _amount;
        emit Transfer(address(0), _generator, _amount);
    }

    // Chuyển token trực tiếp
    function transfer(address _to, uint256 _amount) external returns (bool) {
        require(balanceOf[msg.sender] >= _amount, "Not enough CCT tokens");
        balanceOf[msg.sender] -= _amount;
        balanceOf[_to] += _amount;
        emit Transfer(msg.sender, _to, _amount);
        return true;
    }

    // Cấp quyền cho người khác (hoặc AMM Contract) tiêu tiền của mình
    function approve(address _spender, uint256 _amount) external returns (bool) {
        allowance[msg.sender][_spender] = _amount;
        emit Approval(msg.sender, _spender, _amount);
        return true;
    }

    // Hợp đồng khác chuyển token (Ví dụ: AMM thực hiện lệnh Swap)
    function transferFrom(address _sender, address _receiver, uint256 _amount) external returns (bool) {
        require(balanceOf[_sender] >= _amount, "Not enough CCT tokens");
        require(allowance[_sender][msg.sender] >= _amount, "Allowance exceeded"); // Bảo mật: Phải được cho phép

        allowance[_sender][msg.sender] -= _amount;
        balanceOf[_sender] -= _amount;
        balanceOf[_receiver] += _amount;
        
        emit Transfer(_sender, _receiver, _amount);
        return true;
    }

    // Consumer tự tiêu hủy token để bù đắp
    function burn(uint256 _amount) external returns (bool) {
        require(balanceOf[msg.sender] >= _amount, "Insufficient CCT in wallet");
        balanceOf[msg.sender] -= _amount;
        totalSupply -= _amount;
        emit Transfer(msg.sender, address(0), _amount);
        return true;
    }
}
