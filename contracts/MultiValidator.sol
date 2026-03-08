// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IMintContract {
    function mintTokens(address _receiver, uint256 _amount) external;
    function burnFrom(address account, uint256 amount) external;
}

interface IMintNFT {
    function mintCRC(address recipient, uint256 amount) external;
}

contract MultiValidator {
    address public mint;
    address public nftContract;
    address public admin; // Người quản trị mạng lưới
    
    uint256 public constant CCT_DECIMALS = 10**18;

    // ==========================================
    // 1 & 2. CẤU TRÚC LƯU TRỮ (Giữ nguyên như cũ)
    // ==========================================
    struct MintRequest {
        uint256 creditAmount;
        uint256 approvalCount;
        bool isCompleted;
    }
    // Mapping: Generator => RequestID => MintRequest
    mapping(address => mapping(bytes32 => MintRequest)) public mintRequests;
    // Mapping: RequestID => Validator => hasVoted
    mapping(bytes32 => mapping(address => bool)) public hasVotedMint;

    struct BurnRequest {
        uint256 retireAmount;
        uint256 approvalCount;
        bool isCompleted;
    }
    // Mapping: Consumer => RequestID => BurnRequest
    mapping(address => mapping(bytes32 => BurnRequest)) public burnRequests;
    // Mapping: RequestID => Validator => hasVoted
    mapping(bytes32 => mapping(address => bool)) public hasVotedBurn;


    // ==========================================
    // 3. QUẢN LÝ DANH SÁCH VALIDATOR TỰ ĐỘO
    // ==========================================
    uint256 public totalValidators = 0; // Biến lưu tổng số Validator
    mapping(address => bool) public isValidator; // Danh sách trắng (Whitelist)

    constructor() {
        admin = msg.sender; // Người deploy contract sẽ là Admin
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    // Hàm thêm Validator mới (Tăng mẫu số)
    function addValidator(address _validator) public onlyAdmin {
        require(!isValidator[_validator], "Already a validator");
        isValidator[_validator] = true;
        totalValidators++;
    }

    // Hàm xóa Validator (Giảm mẫu số)
    function removeValidator(address _validator) public onlyAdmin {
        require(isValidator[_validator], "Not a validator");
        isValidator[_validator] = false;
        totalValidators--;
    }

    function setMintContract(address _mint) public onlyAdmin { mint = _mint; }
    function setNftContract(address _nftContract) public onlyAdmin { nftContract = _nftContract; }


    // ==========================================
    // 4. HÀM THỰC THI (Đã tích hợp Logic > 25%)
    // ==========================================
    
    function voteToApprove(address payable _generator, uint256 _sequestrationTons, bytes32 _requestId) public {
        require(isValidator[msg.sender], "You are not an authorized validator");
        require(totalValidators > 0, "No validators in system");

        MintRequest storage req = mintRequests[_generator][_requestId];
        require(!req.isCompleted, "Request already completed");
        require(!hasVotedMint[_requestId][msg.sender], "Validator has already voted for this request");

        uint256 creditAmount = _sequestrationTons * 1 ether;
        
        if (req.approvalCount == 0) {
            req.creditAmount = creditAmount;
        } else {
            require(req.creditAmount == creditAmount, "Mismatched credit amount");
        }
        
        hasVotedMint[_requestId][msg.sender] = true;
        req.approvalCount++;
        
        uint256 currentPercentage = (req.approvalCount * 100) / totalValidators;
        if (currentPercentage >= 25) {
            req.isCompleted = true;
            IMintContract(mint).mintTokens(_generator, req.creditAmount);
        }
    }

    function burnTokens(address payable _consumer, uint256 _amount, bytes32 _requestId) public {
        require(isValidator[msg.sender], "You are not an authorized validator");
        require(totalValidators > 0, "No validators in system");

        BurnRequest storage req = burnRequests[_consumer][_requestId];
        require(!req.isCompleted, "Request already completed");
        require(!hasVotedBurn[_requestId][msg.sender], "Validator has already voted");

        if (req.approvalCount == 0) {
            req.retireAmount = _amount;
        } else {
            require(req.retireAmount == _amount, "Mismatched burn amount");
        }

        hasVotedBurn[_requestId][msg.sender] = true;
        req.approvalCount++;

        uint256 currentPercentage = (req.approvalCount * 100) / totalValidators;
        if (currentPercentage >= 25) {
            req.isCompleted = true;
            uint256 scaledAmount = req.retireAmount * CCT_DECIMALS;
            
            IMintContract(mint).burnFrom(_consumer, scaledAmount);
            IMintNFT(nftContract).mintCRC(_consumer, scaledAmount);
        }
    }
}
