// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/utils/ERC1155HolderUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/IERC1155Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";

/**
 * @title ContentLending
 * @dev Contract for handling content lending with blockchain-based verification
 * This contract enables the lending of tokenized content for a specified duration
 * with automated royalty payments to content creators
 */
contract ContentLending is 
    Initializable, 
    AccessControlUpgradeable,
    ERC1155HolderUpgradeable,
    PausableUpgradeable,
    UUPSUpgradeable
{
    using CountersUpgradeable for CountersUpgradeable.Counter;

    // Roles
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    // Counters
    CountersUpgradeable.Counter private _lendingIdCounter;

    // Structures
    struct LendingAgreement {
        uint256 lendingId;
        uint256 tokenId;
        address tokenContract;
        address lender;
        address borrower;
        uint256 startTime;
        uint256 duration;
        uint256 price;
        bool active;
        bool completed;
        bool cancelled;
    }

    // State variables
    mapping(uint256 => LendingAgreement) public lendingAgreements;
    mapping(address => uint256[]) public userLendings;
    mapping(address => uint256[]) public userBorrowings;
    mapping(uint256 => uint256) public tokenToLendingId;
    mapping(address => mapping(uint256 => bool)) public tokenLendingStatus;
    uint256 public platformFeePercentage;
    address public feeRecipient;

    // Events
    event ContentLent(
        uint256 indexed lendingId,
        uint256 indexed tokenId,
        address tokenContract,
        address indexed lender,
        address borrower,
        uint256 duration,
        uint256 price
    );
    
    event ContentReturned(
        uint256 indexed lendingId,
        uint256 indexed tokenId,
        address lender,
        address indexed borrower
    );
    
    event LendingCancelled(
        uint256 indexed lendingId,
        uint256 indexed tokenId,
        address indexed lender
    );
    
    event PlatformFeeUpdated(
        uint256 oldFee,
        uint256 newFee
    );
    
    event FeeRecipientUpdated(
        address oldRecipient,
        address newRecipient
    );

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initialize the contract with default values
     * @param _feeRecipient Address to receive platform fees
     * @param _platformFeePercentage Platform fee percentage (e.g., 500 = 5%)
     */
    function initialize(
        address _feeRecipient,
        uint256 _platformFeePercentage
    ) public initializer {
        __AccessControl_init();
        __ERC1155Holder_init();
        __Pausable_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);

        platformFeePercentage = _platformFeePercentage;
        feeRecipient = _feeRecipient;
    }

    /**
     * @dev Lend content to a borrower
     * @param _tokenId Token ID of the content
     * @param _tokenContract Address of the token contract
     * @param _borrower Address of the borrower
     * @param _duration Duration of the lending in seconds
     * @param _price Price for lending in wei
     * @return lendingId ID of the lending agreement
     */
    function lendContent(
        uint256 _tokenId,
        address _tokenContract,
        address _borrower,
        uint256 _duration,
        uint256 _price
    ) external whenNotPaused returns (uint256) {
        require(_borrower != address(0), "Invalid borrower address");
        require(_borrower != msg.sender, "Cannot lend to yourself");
        require(_duration > 0, "Duration must be greater than 0");
        require(!tokenLendingStatus[_tokenContract][_tokenId], "Token already lent");
        
        // Check if the sender owns the token
        IERC1155Upgradeable tokenInterface = IERC1155Upgradeable(_tokenContract);
        require(tokenInterface.balanceOf(msg.sender, _tokenId) > 0, "Must own token to lend");
        
        // Transfer token to this contract for escrow
        tokenInterface.safeTransferFrom(msg.sender, address(this), _tokenId, 1, "");
        
        // Create lending agreement
        _lendingIdCounter.increment();
        uint256 newLendingId = _lendingIdCounter.current();
        
        LendingAgreement memory newAgreement = LendingAgreement({
            lendingId: newLendingId,
            tokenId: _tokenId,
            tokenContract: _tokenContract,
            lender: msg.sender,
            borrower: _borrower,
            startTime: block.timestamp,
            duration: _duration,
            price: _price,
            active: true,
            completed: false,
            cancelled: false
        });
        
        lendingAgreements[newLendingId] = newAgreement;
        userLendings[msg.sender].push(newLendingId);
        userBorrowings[_borrower].push(newLendingId);
        tokenToLendingId[_tokenId] = newLendingId;
        tokenLendingStatus[_tokenContract][_tokenId] = true;
        
        emit ContentLent(
            newLendingId,
            _tokenId,
            _tokenContract,
            msg.sender,
            _borrower,
            _duration,
            _price
        );
        
        return newLendingId;
    }
    
    /**
     * @dev Return borrowed content
     * @param _lendingId ID of the lending agreement
     */
    function returnContent(uint256 _lendingId) external whenNotPaused {
        LendingAgreement storage agreement = lendingAgreements[_lendingId];
        
        require(agreement.lendingId == _lendingId, "Lending does not exist");
        require(agreement.active, "Lending not active");
        require(!agreement.completed, "Lending already completed");
        require(!agreement.cancelled, "Lending was cancelled");
        require(
            msg.sender == agreement.borrower || msg.sender == agreement.lender,
            "Only borrower or lender can return"
        );
        
        // Transfer token back to the lender
        IERC1155Upgradeable tokenInterface = IERC1155Upgradeable(agreement.tokenContract);
        tokenInterface.safeTransferFrom(address(this), agreement.lender, agreement.tokenId, 1, "");
        
        // Update agreement status
        agreement.active = false;
        agreement.completed = true;
        tokenLendingStatus[agreement.tokenContract][agreement.tokenId] = false;
        
        emit ContentReturned(
            _lendingId,
            agreement.tokenId,
            agreement.lender,
            agreement.borrower
        );
    }
    
    /**
     * @dev Cancel a lending agreement (only lender can cancel before borrower accepts)
     * @param _lendingId ID of the lending agreement
     */
    function cancelLending(uint256 _lendingId) external whenNotPaused {
        LendingAgreement storage agreement = lendingAgreements[_lendingId];
        
        require(agreement.lendingId == _lendingId, "Lending does not exist");
        require(agreement.active, "Lending not active");
        require(!agreement.completed, "Lending already completed");
        require(!agreement.cancelled, "Lending already cancelled");
        require(msg.sender == agreement.lender, "Only lender can cancel");
        
        // Transfer token back to the lender
        IERC1155Upgradeable tokenInterface = IERC1155Upgradeable(agreement.tokenContract);
        tokenInterface.safeTransferFrom(address(this), agreement.lender, agreement.tokenId, 1, "");
        
        // Update agreement status
        agreement.active = false;
        agreement.cancelled = true;
        tokenLendingStatus[agreement.tokenContract][agreement.tokenId] = false;
        
        emit LendingCancelled(
            _lendingId,
            agreement.tokenId,
            agreement.lender
        );
    }
    
    /**
     * @dev Pay for borrowing content
     * @param _lendingId ID of the lending agreement
     */
    function payForLending(uint256 _lendingId) external payable whenNotPaused {
        LendingAgreement storage agreement = lendingAgreements[_lendingId];
        
        require(agreement.lendingId == _lendingId, "Lending does not exist");
        require(agreement.active, "Lending not active");
        require(!agreement.completed, "Lending already completed");
        require(!agreement.cancelled, "Lending was cancelled");
        require(msg.sender == agreement.borrower, "Only borrower can pay");
        require(msg.value >= agreement.price, "Insufficient payment");
        
        // Calculate platform fee
        uint256 platformFee = (agreement.price * platformFeePercentage) / 10000;
        uint256 lenderPayment = agreement.price - platformFee;
        
        // Transfer payments
        (bool successFee, ) = feeRecipient.call{value: platformFee}("");
        require(successFee, "Fee transfer failed");
        
        (bool successLender, ) = agreement.lender.call{value: lenderPayment}("");
        require(successLender, "Lender payment failed");
        
        // Return any excess payment
        uint256 excess = msg.value - agreement.price;
        if (excess > 0) {
            (bool successExcess, ) = msg.sender.call{value: excess}("");
            require(successExcess, "Excess payment return failed");
        }
    }
    
    /**
     * @dev Get all lending agreements for a user (as lender)
     * @param _user Address of the user
     * @return Array of lending IDs
     */
    function getLendingsByUser(address _user) external view returns (uint256[] memory) {
        return userLendings[_user];
    }
    
    /**
     * @dev Get all borrowing agreements for a user (as borrower)
     * @param _user Address of the user
     * @return Array of lending IDs
     */
    function getBorrowingsByUser(address _user) external view returns (uint256[] memory) {
        return userBorrowings[_user];
    }
    
    /**
     * @dev Get details of a lending agreement
     * @param _lendingId ID of the lending agreement
     * @return Agreement details
     */
    function getLendingDetails(uint256 _lendingId) external view returns (LendingAgreement memory) {
        return lendingAgreements[_lendingId];
    }
    
    /**
     * @dev Check if a token is currently being lent
     * @param _tokenContract Address of the token contract
     * @param _tokenId Token ID to check
     * @return Lending status (true if token is being lent)
     */
    function isTokenLent(address _tokenContract, uint256 _tokenId) external view returns (bool) {
        return tokenLendingStatus[_tokenContract][_tokenId];
    }
    
    /**
     * @dev Get the lending ID for a token
     * @param _tokenId Token ID to check
     * @return Lending ID (0 if not being lent)
     */
    function getLendingIdForToken(uint256 _tokenId) external view returns (uint256) {
        return tokenToLendingId[_tokenId];
    }
    
    /**
     * @dev Set the platform fee percentage
     * @param _platformFeePercentage New platform fee percentage (e.g., 500 = 5%)
     */
    function setPlatformFeePercentage(uint256 _platformFeePercentage) external onlyRole(ADMIN_ROLE) {
        require(_platformFeePercentage <= 3000, "Fee too high"); // Max 30%
        
        uint256 oldFee = platformFeePercentage;
        platformFeePercentage = _platformFeePercentage;
        
        emit PlatformFeeUpdated(oldFee, _platformFeePercentage);
    }
    
    /**
     * @dev Set the fee recipient address
     * @param _feeRecipient New fee recipient address
     */
    function setFeeRecipient(address _feeRecipient) external onlyRole(ADMIN_ROLE) {
        require(_feeRecipient != address(0), "Invalid fee recipient");
        
        address oldRecipient = feeRecipient;
        feeRecipient = _feeRecipient;
        
        emit FeeRecipientUpdated(oldRecipient, _feeRecipient);
    }
    
    /**
     * @dev Pause the contract
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }
    
    /**
     * @dev Unpause the contract
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }
    
    /**
     * @dev Function that should revert when `msg.sender` is not authorized to upgrade the contract.
     */
    function _authorizeUpgrade(address) internal override onlyRole(UPGRADER_ROLE) {}
    
    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(AccessControlUpgradeable, ERC1155ReceiverUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
} 