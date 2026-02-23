// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract MintNFT {
    string public name = "Carbon Removal Certificate";
    string public symbol = "CRC";
    
    // Quản lý ID duy nhất cho từng NFT được phát hành
    uint256 public nextTokenId = 1; 

    // Các mapping theo chuẩn ERC-721
    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;
    mapping(uint256 => address) private _tokenApprovals;
    mapping(address => mapping(address => bool)) private _operatorApprovals;

    // Cấu trúc lưu thông tin lượng carbon đã bù đắp của mỗi NFT
    struct CRCInfo {
        uint256 burnAmount;
        uint256 timestamp;
    }
    mapping(uint256 => CRCInfo) public certificateDetails;

    // Sự kiện của ERC-721
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

    // --- CÁC HÀM CƠ BẢN CỦA DỰ ÁN ---

    // Phát hành NFT khi Consumer thực hiện Burn Token
    function mintCRC(address _consumer, uint256 _amount) external {
        require(_consumer != address(0), "Mint to zero address");
        
        uint256 tokenId = nextTokenId;
        nextTokenId += 1; // Tăng ID cho NFT tiếp theo

        _balances[_consumer] += 1;
        _owners[tokenId] = _consumer;

        // Lưu thông tin chứng nhận
        certificateDetails[tokenId] = CRCInfo({
            burnAmount: _amount,
            timestamp: block.timestamp
        });

        emit Transfer(address(0), _consumer, tokenId);
    }

    // Lấy thông tin chứng nhận bằng TokenID
    function getCRCDetails(uint256 _tokenId) external view returns (address owner, uint256 amount, uint256 timestamp) {
        owner = _owners[_tokenId];
        require(owner != address(0), "Invalid Token ID");
        CRCInfo memory info = certificateDetails[_tokenId];
        return (owner, info.burnAmount, info.timestamp);
    }

    // --- CÁC HÀM THEO CHUẨN ERC-721 ---

    function balanceOf(address owner) external view returns (uint256) {
        require(owner != address(0), "Query for zero address");
        return _balances[owner];
    }

    function ownerOf(uint256 tokenId) public view returns (address) {
        address owner = _owners[tokenId];
        require(owner != address(0), "Invalid Token ID");
        return owner;
    }

    function approve(address to, uint256 tokenId) external {
        address owner = ownerOf(tokenId);
        require(to != owner, "Approval to current owner");
        require(msg.sender == owner || _operatorApprovals[owner][msg.sender], "Not token owner or approved for all");

        _tokenApprovals[tokenId] = to;
        emit Approval(owner, to, tokenId);
    }

    function getApproved(uint256 tokenId) external view returns (address) {
        require(_owners[tokenId] != address(0), "Invalid Token ID");
        return _tokenApprovals[tokenId];
    }

    function setApprovalForAll(address operator, bool approved) external {
        require(msg.sender != operator, "Approve to caller");
        _operatorApprovals[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    function isApprovedForAll(address owner, address operator) external view returns (bool) {
        return _operatorApprovals[owner][operator];
    }

    function transferFrom(address from, address to, uint256 tokenId) external {
        require(to != address(0), "Transfer to zero address");
        address owner = ownerOf(tokenId);
        require(owner == from, "Transfer from incorrect owner");
        require(msg.sender == owner || _tokenApprovals[tokenId] == msg.sender || _operatorApprovals[owner][msg.sender], "Caller is not owner nor approved");

        delete _tokenApprovals[tokenId];
        _balances[from] -= 1;
        _balances[to] += 1;
        _owners[tokenId] = to;

        emit Transfer(from, to, tokenId);
    }
}
