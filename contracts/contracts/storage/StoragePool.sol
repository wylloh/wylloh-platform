// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "../token/WyllohToken.sol";

contract StoragePool is 
    Initializable, 
    AccessControlUpgradeable, 
    PausableUpgradeable, 
    UUPSUpgradeable 
{
    bytes32 public constant POOL_MANAGER_ROLE = keccak256("POOL_MANAGER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    WyllohToken public token;

    struct PoolMetrics {
        uint256 totalFunded;
        uint256 totalSpent;
        uint256 totalRecovered;
        uint256 activeContent;
        uint256 totalRewards;
    }

    struct ContentStorage {
        string ipfsHash;
        uint256 size;
        uint256 cost;
        uint256 startTime;
        uint256 recoveredAmount;
        bool isActive;
    }

    // Pool state
    PoolMetrics public metrics;
    mapping(string => ContentStorage) public contentStorage;
    mapping(address => uint256) public nodeRewards;
    
    // Configuration
    uint256 public constant INITIAL_POOL_SIZE = 100000 * 1e18; // 100,000 WYL
    uint256 public constant MIN_POOL_BALANCE = 10000 * 1e18;   // 10,000 WYL
    uint256 public constant MAX_CONTENT_SIZE = 100 * 1024 * 1024 * 1024; // 100 GB
    uint256 public constant DAILY_REWARD_RATE = 100 * 1e18;    // 100 WYL per day

    // Events
    event PoolFunded(address indexed funder, uint256 amount);
    event ContentFunded(string indexed ipfsHash, uint256 amount);
    event RewardDistributed(address indexed node, uint256 amount);
    event CostRecovered(string indexed ipfsHash, uint256 amount);
    event PoolMetricsUpdated(uint256 totalFunded, uint256 totalSpent, uint256 totalRecovered);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address _token) public initializer {
        __AccessControl_init();
        __Pausable_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(POOL_MANAGER_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);

        token = WyllohToken(_token);
    }

    function fundPool(uint256 amount) external whenNotPaused {
        require(amount > 0, "Amount must be greater than 0");
        require(
            token.transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );

        metrics.totalFunded += amount;
        emit PoolFunded(msg.sender, amount);
    }

    function fundContent(
        string calldata ipfsHash,
        uint256 size,
        uint256 cost
    ) external onlyRole(POOL_MANAGER_ROLE) whenNotPaused {
        require(bytes(ipfsHash).length > 0, "Invalid IPFS hash");
        require(size > 0 && size <= MAX_CONTENT_SIZE, "Invalid content size");
        require(cost > 0, "Invalid cost");
        require(contentStorage[ipfsHash].startTime == 0, "Content already funded");
        require(
            token.balanceOf(address(this)) >= cost,
            "Insufficient pool balance"
        );

        contentStorage[ipfsHash] = ContentStorage({
            ipfsHash: ipfsHash,
            size: size,
            cost: cost,
            startTime: block.timestamp,
            recoveredAmount: 0,
            isActive: true
        });

        metrics.totalSpent += cost;
        metrics.activeContent++;
        emit ContentFunded(ipfsHash, cost);
    }

    function distributeRewards(
        address[] calldata nodes,
        uint256[] calldata amounts
    ) external onlyRole(POOL_MANAGER_ROLE) whenNotPaused {
        require(nodes.length == amounts.length, "Array length mismatch");
        require(
            token.balanceOf(address(this)) >= getTotalRewards(amounts),
            "Insufficient pool balance"
        );

        for (uint256 i = 0; i < nodes.length; i++) {
            require(amounts[i] > 0, "Invalid reward amount");
            require(
                token.transfer(nodes[i], amounts[i]),
                "Reward transfer failed"
            );
            nodeRewards[nodes[i]] += amounts[i];
            metrics.totalRewards += amounts[i];
            emit RewardDistributed(nodes[i], amounts[i]);
        }
    }

    function recoverCost(
        string calldata ipfsHash,
        uint256 amount
    ) external onlyRole(POOL_MANAGER_ROLE) whenNotPaused {
        ContentStorage storage storage = contentStorage[ipfsHash];
        require(storage.isActive, "Content not active");
        require(
            amount <= storage.cost - storage.recoveredAmount,
            "Amount exceeds remaining cost"
        );

        storage.recoveredAmount += amount;
        metrics.totalRecovered += amount;
        emit CostRecovered(ipfsHash, amount);

        if (storage.recoveredAmount >= storage.cost) {
            storage.isActive = false;
            metrics.activeContent--;
        }
    }

    function updateMetrics() external onlyRole(POOL_MANAGER_ROLE) {
        emit PoolMetricsUpdated(
            metrics.totalFunded,
            metrics.totalSpent,
            metrics.totalRecovered
        );
    }

    // View functions
    function getContentStorage(string calldata ipfsHash) external view returns (
        uint256 size,
        uint256 cost,
        uint256 startTime,
        uint256 recoveredAmount,
        bool isActive
    ) {
        ContentStorage storage storage = contentStorage[ipfsHash];
        return (
            storage.size,
            storage.cost,
            storage.startTime,
            storage.recoveredAmount,
            storage.isActive
        );
    }

    function getPoolMetrics() external view returns (
        uint256 totalFunded,
        uint256 totalSpent,
        uint256 totalRecovered,
        uint256 activeContent,
        uint256 totalRewards
    ) {
        return (
            metrics.totalFunded,
            metrics.totalSpent,
            metrics.totalRecovered,
            metrics.activeContent,
            metrics.totalRewards
        );
    }

    function getNodeRewards(address node) external view returns (uint256) {
        return nodeRewards[node];
    }

    function getTotalRewards(uint256[] calldata amounts) public pure returns (uint256) {
        uint256 total = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            total += amounts[i];
        }
        return total;
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
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(AccessControlUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
} 