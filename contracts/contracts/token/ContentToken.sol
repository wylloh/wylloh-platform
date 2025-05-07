// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/extensions/ERC1155SupplyUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "../storage/StoragePool.sol";

contract ContentToken is 
    Initializable,
    ERC1155Upgradeable,
    ERC1155SupplyUpgradeable,
    PausableUpgradeable,
    AccessControlUpgradeable,
    UUPSUpgradeable
{
    using CountersUpgradeable for CountersUpgradeable.Counter;

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant DRM_MANAGER_ROLE = keccak256("DRM_MANAGER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    CountersUpgradeable.Counter private _contentIdCounter;
    StoragePool public storagePool;

    enum RightsTier {
        Basic,      // Streaming only, 720p
        Standard,   // Download + Streaming, 1080p
        Premium,    // Download + Streaming, 4K + Extras
        Exhibitor   // Public screening rights
    }

    struct Content {
        string ipfsHash;
        uint256 size;
        RightsTier tier;
        address creator;
        uint256 price;
        uint256 royaltyBps; // Basis points (e.g., 500 = 5%)
        bool isActive;
        uint256 totalSales;
        uint256 totalRevenue;
        uint256 maxSupply;
        uint256 currentSupply;
    }

    struct DRMKey {
        bytes32 keyHash;
        uint256 expiryTime;
        uint256 maxDevices;
        bool isRevoked;
    }

    // State variables
    mapping(uint256 => Content) public contents;
    mapping(uint256 => DRMKey) public drmKeys;
    mapping(uint256 => mapping(address => uint256)) public deviceCount;
    mapping(address => uint256[]) public creatorContents;
    mapping(uint256 => address[]) public contentOwners;

    // Events
    event ContentCreated(uint256 indexed contentId, address indexed creator, RightsTier tier, uint256 maxSupply);
    event RightsPurchased(uint256 indexed contentId, address indexed buyer, uint256 amount, RightsTier tier);
    event DRMKeyIssued(uint256 indexed contentId, address indexed owner);
    event DRMKeyRevoked(uint256 indexed contentId, address indexed owner);
    event DeviceBound(uint256 indexed contentId, address indexed owner, uint256 deviceCount);
    event RoyaltyPaid(uint256 indexed contentId, address indexed creator, uint256 amount);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address _storagePool) public initializer {
        __ERC1155_init("ipfs://");
        __ERC1155Supply_init();
        __Pausable_init();
        __AccessControl_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(DRM_MANAGER_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);

        storagePool = StoragePool(_storagePool);
    }

    function createContent(
        string calldata ipfsHash,
        uint256 size,
        RightsTier tier,
        uint256 price,
        uint256 royaltyBps,
        uint256 maxSupply,
        string calldata uri
    ) external whenNotPaused returns (uint256) {
        require(bytes(ipfsHash).length > 0, "Invalid IPFS hash");
        require(size > 0, "Invalid size");
        require(price > 0, "Invalid price");
        require(royaltyBps <= 10000, "Invalid royalty basis points");
        require(maxSupply > 0, "Invalid max supply");

        uint256 contentId = _contentIdCounter.current();
        _contentIdCounter.increment();

        contents[contentId] = Content({
            ipfsHash: ipfsHash,
            size: size,
            tier: tier,
            creator: msg.sender,
            price: price,
            royaltyBps: royaltyBps,
            isActive: true,
            totalSales: 0,
            totalRevenue: 0,
            maxSupply: maxSupply,
            currentSupply: 0
        });

        creatorContents[msg.sender].push(contentId);
        contentOwners[contentId].push(msg.sender);

        emit ContentCreated(contentId, msg.sender, tier, maxSupply);
        return contentId;
    }

    function purchaseRights(uint256 contentId, uint256 amount) external payable whenNotPaused {
        Content storage content = contents[contentId];
        require(content.isActive, "Content not active");
        require(content.currentSupply + amount <= content.maxSupply, "Exceeds max supply");
        require(msg.value >= content.price * amount, "Insufficient payment");

        // Transfer payment to creator with royalty
        uint256 royaltyAmount = (msg.value * content.royaltyBps) / 10000;
        uint256 creatorAmount = msg.value - royaltyAmount;

        (bool success, ) = content.creator.call{value: creatorAmount}("");
        require(success, "Transfer to creator failed");

        if (royaltyAmount > 0) {
            (success, ) = address(storagePool).call{value: royaltyAmount}("");
            require(success, "Transfer to storage pool failed");
        }

        _mint(msg.sender, contentId, amount, "");
        content.currentSupply += amount;
        content.totalSales += amount;
        content.totalRevenue += msg.value;
        contentOwners[contentId].push(msg.sender);

        emit RightsPurchased(contentId, msg.sender, amount, content.tier);
        emit RoyaltyPaid(contentId, content.creator, royaltyAmount);
    }

    function issueDRMKey(
        uint256 contentId,
        bytes32 keyHash,
        uint256 expiryTime,
        uint256 maxDevices
    ) external onlyRole(DRM_MANAGER_ROLE) whenNotPaused {
        require(contentId < _contentIdCounter.current(), "Content does not exist");
        require(expiryTime > block.timestamp, "Invalid expiry time");
        require(maxDevices > 0, "Invalid max devices");

        address owner = msg.sender;
        drmKeys[contentId] = DRMKey({
            keyHash: keyHash,
            expiryTime: expiryTime,
            maxDevices: maxDevices,
            isRevoked: false
        });

        emit DRMKeyIssued(contentId, owner);
    }

    function bindDevice(uint256 contentId) external whenNotPaused {
        require(balanceOf(msg.sender, contentId) > 0, "No rights owned");
        require(contentId < _contentIdCounter.current(), "Content does not exist");

        DRMKey storage key = drmKeys[contentId];
        require(!key.isRevoked, "DRM key revoked");
        require(block.timestamp <= key.expiryTime, "DRM key expired");
        require(deviceCount[contentId][msg.sender] < key.maxDevices, "Max devices reached");

        deviceCount[contentId][msg.sender]++;
        emit DeviceBound(contentId, msg.sender, deviceCount[contentId][msg.sender]);
    }

    function revokeDRMKey(uint256 contentId) external onlyRole(DRM_MANAGER_ROLE) whenNotPaused {
        require(contentId < _contentIdCounter.current(), "Content does not exist");
        drmKeys[contentId].isRevoked = true;
        emit DRMKeyRevoked(contentId, msg.sender);
    }

    // View functions
    function getContent(uint256 contentId) external view returns (
        string memory ipfsHash,
        uint256 size,
        RightsTier tier,
        address creator,
        uint256 price,
        uint256 royaltyBps,
        bool isActive,
        uint256 totalSales,
        uint256 totalRevenue,
        uint256 maxSupply,
        uint256 currentSupply
    ) {
        Content storage content = contents[contentId];
        return (
            content.ipfsHash,
            content.size,
            content.tier,
            content.creator,
            content.price,
            content.royaltyBps,
            content.isActive,
            content.totalSales,
            content.totalRevenue,
            content.maxSupply,
            content.currentSupply
        );
    }

    function getCreatorContents(address creator) external view returns (uint256[] memory) {
        return creatorContents[creator];
    }

    function getContentOwners(uint256 contentId) external view returns (address[] memory) {
        return contentOwners[contentId];
    }

    function getDeviceCount(uint256 contentId, address owner) external view returns (uint256) {
        return deviceCount[contentId][owner];
    }

    // Admin functions
    function pause() public onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        onlyRole(UPGRADER_ROLE)
        override
    {}

    // The following functions are overrides required by Solidity
    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal override(ERC1155Upgradeable, ERC1155SupplyUpgradeable) whenNotPaused {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155Upgradeable, AccessControlUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
} 