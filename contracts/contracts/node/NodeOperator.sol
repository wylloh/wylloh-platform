// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "../token/WyllohToken.sol";

contract NodeOperator is 
    Initializable, 
    AccessControlUpgradeable, 
    PausableUpgradeable, 
    UUPSUpgradeable 
{
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    WyllohToken public token;

    struct Node {
        string ipfsPeerId;
        uint256 stake;
        uint256 startTime;
        uint256 lastRewardTime;
        uint256 totalRewards;
        uint256 performanceScore;
        uint256 uptime;
        bool isActive;
        NodeType nodeType;
    }

    enum NodeType { Basic, Premium, Enterprise }

    struct NodeTypeConfig {
        uint256 minStake;
        uint256 maxContent;
        uint256 rewardMultiplier;
        uint256 lockPeriod;
    }

    // Node state
    mapping(address => Node) public nodes;
    mapping(string => address) public peerIdToOperator;
    NodeTypeConfig[] public nodeTypeConfigs;

    // Reward state
    uint256 public constant DAILY_REWARD_POOL = 60000 * 1e18; // 60% of daily rewards
    uint256 public constant REWARD_PRECISION = 1e18;
    uint256 public lastRewardDistribution;

    // Performance thresholds
    uint256 public constant MIN_UPTIME = 95;
    uint256 public constant MIN_PERFORMANCE_SCORE = 80;
    uint256 public constant SLASH_PERCENTAGE = 5;

    // Events
    event NodeRegistered(address indexed operator, string ipfsPeerId, NodeType nodeType);
    event NodeDeregistered(address indexed operator);
    event RewardsDistributed(address indexed operator, uint256 amount);
    event NodeSlashed(address indexed operator, uint256 amount, string reason);
    event PerformanceUpdated(address indexed operator, uint256 performanceScore, uint256 uptime);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address _token) public initializer {
        __AccessControl_init();
        __Pausable_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ORACLE_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);

        token = WyllohToken(_token);

        // Initialize node type configurations
        nodeTypeConfigs.push(NodeTypeConfig({
            minStake: 50000 * 1e18,  // 50,000 WYL
            maxContent: 100,
            rewardMultiplier: 1e18,   // 1x
            lockPeriod: 30 days
        }));

        nodeTypeConfigs.push(NodeTypeConfig({
            minStake: 100000 * 1e18,  // 100,000 WYL
            maxContent: 500,
            rewardMultiplier: 15e17,  // 1.5x
            lockPeriod: 90 days
        }));

        nodeTypeConfigs.push(NodeTypeConfig({
            minStake: 500000 * 1e18,  // 500,000 WYL
            maxContent: type(uint256).max,
            rewardMultiplier: 2e18,   // 2x
            lockPeriod: 180 days
        }));
    }

    function registerNode(
        string calldata ipfsPeerId,
        NodeType nodeType
    ) external whenNotPaused {
        require(bytes(ipfsPeerId).length > 0, "Invalid peer ID");
        require(peerIdToOperator[ipfsPeerId] == address(0), "Peer ID already registered");
        require(nodes[msg.sender].ipfsPeerId.length == 0, "Operator already registered");

        NodeTypeConfig memory config = nodeTypeConfigs[uint256(nodeType)];
        require(token.balanceOf(msg.sender) >= config.minStake, "Insufficient stake");

        // Transfer stake to contract
        require(
            token.transferFrom(msg.sender, address(this), config.minStake),
            "Stake transfer failed"
        );

        nodes[msg.sender] = Node({
            ipfsPeerId: ipfsPeerId,
            stake: config.minStake,
            startTime: block.timestamp,
            lastRewardTime: block.timestamp,
            totalRewards: 0,
            performanceScore: 100,
            uptime: 100,
            isActive: true,
            nodeType: nodeType
        });

        peerIdToOperator[ipfsPeerId] = msg.sender;
        emit NodeRegistered(msg.sender, ipfsPeerId, nodeType);
    }

    function deregisterNode() external whenNotPaused {
        Node storage node = nodes[msg.sender];
        require(node.isActive, "Node not active");
        require(
            block.timestamp >= node.startTime + nodeTypeConfigs[uint256(node.nodeType)].lockPeriod,
            "Stake still locked"
        );

        // Return stake
        require(
            token.transfer(msg.sender, node.stake),
            "Stake return failed"
        );

        delete peerIdToOperator[node.ipfsPeerId];
        delete nodes[msg.sender];
        emit NodeDeregistered(msg.sender);
    }

    function updatePerformance(
        address operator,
        uint256 performanceScore,
        uint256 uptime
    ) external onlyRole(ORACLE_ROLE) {
        Node storage node = nodes[operator];
        require(node.isActive, "Node not active");

        node.performanceScore = performanceScore;
        node.uptime = uptime;

        // Check for slashing conditions
        if (uptime < MIN_UPTIME || performanceScore < MIN_PERFORMANCE_SCORE) {
            uint256 slashAmount = (node.stake * SLASH_PERCENTAGE) / 100;
            node.stake -= slashAmount;
            token.burn(slashAmount);
            emit NodeSlashed(operator, slashAmount, "Performance below threshold");
        }

        emit PerformanceUpdated(operator, performanceScore, uptime);
    }

    function distributeRewards() external onlyRole(ORACLE_ROLE) {
        require(
            block.timestamp >= lastRewardDistribution + 1 days,
            "Too early to distribute rewards"
        );

        uint256 totalActiveNodes = 0;
        uint256 totalWeightedStake = 0;

        // Calculate total weighted stake
        for (uint256 i = 0; i < nodeTypeConfigs.length; i++) {
            NodeType nodeType = NodeType(i);
            uint256 multiplier = nodeTypeConfigs[i].rewardMultiplier;
            
            // Count active nodes and their weighted stake
            for (uint256 j = 0; j < getActiveNodesByType(nodeType); j++) {
                totalActiveNodes++;
                totalWeightedStake += multiplier;
            }
        }

        require(totalActiveNodes > 0, "No active nodes");

        // Distribute rewards
        uint256 rewardPerWeight = DAILY_REWARD_POOL / totalWeightedStake;
        
        for (uint256 i = 0; i < nodeTypeConfigs.length; i++) {
            NodeType nodeType = NodeType(i);
            uint256 multiplier = nodeTypeConfigs[i].rewardMultiplier;
            
            // Distribute to each node of this type
            for (uint256 j = 0; j < getActiveNodesByType(nodeType); j++) {
                address operator = getActiveNodeByTypeAndIndex(nodeType, j);
                Node storage node = nodes[operator];
                
                uint256 reward = rewardPerWeight * multiplier;
                node.totalRewards += reward;
                node.lastRewardTime = block.timestamp;
                
                require(
                    token.transfer(operator, reward),
                    "Reward transfer failed"
                );
                
                emit RewardsDistributed(operator, reward);
            }
        }

        lastRewardDistribution = block.timestamp;
    }

    // View functions
    function getActiveNodesByType(NodeType nodeType) public view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < getTotalNodes(); i++) {
            address operator = getNodeByIndex(i);
            if (nodes[operator].isActive && nodes[operator].nodeType == nodeType) {
                count++;
            }
        }
        return count;
    }

    function getActiveNodeByTypeAndIndex(NodeType nodeType, uint256 index) public view returns (address) {
        uint256 count = 0;
        for (uint256 i = 0; i < getTotalNodes(); i++) {
            address operator = getNodeByIndex(i);
            if (nodes[operator].isActive && nodes[operator].nodeType == nodeType) {
                if (count == index) {
                    return operator;
                }
                count++;
            }
        }
        revert("Node not found");
    }

    function getTotalNodes() public view returns (uint256) {
        // This is a placeholder - in a real implementation, you'd need to maintain a list of nodes
        return 1000; // Example maximum
    }

    function getNodeByIndex(uint256 index) public view returns (address) {
        // This is a placeholder - in a real implementation, you'd need to maintain a list of nodes
        require(index < getTotalNodes(), "Index out of bounds");
        return address(uint160(index + 1)); // Example implementation
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