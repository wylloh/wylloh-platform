// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "../token/NodeOperator.sol";

contract ContentStorage is 
    Initializable, 
    AccessControlUpgradeable, 
    PausableUpgradeable, 
    UUPSUpgradeable 
{
    bytes32 public constant CONTENT_MANAGER_ROLE = keccak256("CONTENT_MANAGER_ROLE");
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    NodeOperator public nodeOperator;

    struct Content {
        string ipfsHash;
        uint256 size;
        uint256 uploadTime;
        address uploader;
        bool isVerified;
        uint256 replicationCount;
        uint256[] nodeIndices;
        ContentType contentType;
        ContentStatus status;
    }

    enum ContentType { Movie, Series, Documentary, Short }
    enum ContentStatus { Pending, Active, Archived, Removed }

    struct ContentMetrics {
        uint256 viewCount;
        uint256 popularity;
        uint256 lastAccessTime;
        uint256[] nodePerformance;
    }

    // Content state
    mapping(string => Content) public contents;
    mapping(string => ContentMetrics) public contentMetrics;
    mapping(address => string[]) public uploaderContents;
    mapping(string => address[]) public contentNodes;

    // Replication requirements
    uint256 public constant MIN_REPLICATION = 3;
    uint256 public constant TARGET_REPLICATION = 5;
    uint256 public constant MAX_REPLICATION = 10;

    // Events
    event ContentRegistered(string indexed ipfsHash, address indexed uploader, ContentType contentType);
    event ContentVerified(string indexed ipfsHash);
    event ContentArchived(string indexed ipfsHash);
    event ContentRemoved(string indexed ipfsHash);
    event NodeAssigned(string indexed ipfsHash, address indexed node);
    event NodeRemoved(string indexed ipfsHash, address indexed node);
    event ReplicationUpdated(string indexed ipfsHash, uint256 replicationCount);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address _nodeOperator) public initializer {
        __AccessControl_init();
        __Pausable_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(CONTENT_MANAGER_ROLE, msg.sender);
        _grantRole(ORACLE_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);

        nodeOperator = NodeOperator(_nodeOperator);
    }

    function registerContent(
        string calldata ipfsHash,
        uint256 size,
        ContentType contentType
    ) external whenNotPaused {
        require(bytes(ipfsHash).length > 0, "Invalid IPFS hash");
        require(size > 0, "Invalid content size");
        require(contents[ipfsHash].uploadTime == 0, "Content already registered");

        contents[ipfsHash] = Content({
            ipfsHash: ipfsHash,
            size: size,
            uploadTime: block.timestamp,
            uploader: msg.sender,
            isVerified: false,
            replicationCount: 0,
            nodeIndices: new uint256[](0),
            contentType: contentType,
            status: ContentStatus.Pending
        });

        contentMetrics[ipfsHash] = ContentMetrics({
            viewCount: 0,
            popularity: 0,
            lastAccessTime: block.timestamp,
            nodePerformance: new uint256[](0)
        });

        uploaderContents[msg.sender].push(ipfsHash);
        emit ContentRegistered(ipfsHash, msg.sender, contentType);
    }

    function verifyContent(string calldata ipfsHash) external onlyRole(CONTENT_MANAGER_ROLE) {
        Content storage content = contents[ipfsHash];
        require(content.uploadTime > 0, "Content not found");
        require(!content.isVerified, "Content already verified");
        require(content.replicationCount >= MIN_REPLICATION, "Insufficient replication");

        content.isVerified = true;
        content.status = ContentStatus.Active;
        emit ContentVerified(ipfsHash);
    }

    function assignNode(
        string calldata ipfsHash,
        address node
    ) external onlyRole(CONTENT_MANAGER_ROLE) {
        Content storage content = contents[ipfsHash];
        require(content.uploadTime > 0, "Content not found");
        require(content.status == ContentStatus.Active, "Content not active");
        require(content.replicationCount < MAX_REPLICATION, "Max replication reached");

        // Verify node is active and has capacity
        (bool isActive, ) = nodeOperator.getNodeStatus(node);
        require(isActive, "Node not active");

        // Add node to content's node list
        contentNodes[ipfsHash].push(node);
        content.replicationCount++;
        content.nodeIndices.push(uint256(uint160(node)));

        emit NodeAssigned(ipfsHash, node);
        emit ReplicationUpdated(ipfsHash, content.replicationCount);
    }

    function removeNode(
        string calldata ipfsHash,
        address node
    ) external onlyRole(CONTENT_MANAGER_ROLE) {
        Content storage content = contents[ipfsHash];
        require(content.uploadTime > 0, "Content not found");
        require(content.status == ContentStatus.Active, "Content not active");

        // Find and remove node from content's node list
        address[] storage nodes = contentNodes[ipfsHash];
        for (uint256 i = 0; i < nodes.length; i++) {
            if (nodes[i] == node) {
                nodes[i] = nodes[nodes.length - 1];
                nodes.pop();
                content.replicationCount--;
                break;
            }
        }

        emit NodeRemoved(ipfsHash, node);
        emit ReplicationUpdated(ipfsHash, content.replicationCount);
    }

    function updateContentMetrics(
        string calldata ipfsHash,
        uint256 viewCount,
        uint256 popularity
    ) external onlyRole(ORACLE_ROLE) {
        Content storage content = contents[ipfsHash];
        require(content.uploadTime > 0, "Content not found");
        require(content.status == ContentStatus.Active, "Content not active");

        ContentMetrics storage metrics = contentMetrics[ipfsHash];
        metrics.viewCount = viewCount;
        metrics.popularity = popularity;
        metrics.lastAccessTime = block.timestamp;

        // Update node performance metrics
        metrics.nodePerformance = new uint256[](content.replicationCount);
        for (uint256 i = 0; i < content.replicationCount; i++) {
            address node = contentNodes[ipfsHash][i];
            (bool isActive, uint256 performance) = nodeOperator.getNodePerformance(node);
            metrics.nodePerformance[i] = isActive ? performance : 0;
        }
    }

    function archiveContent(string calldata ipfsHash) external onlyRole(CONTENT_MANAGER_ROLE) {
        Content storage content = contents[ipfsHash];
        require(content.uploadTime > 0, "Content not found");
        require(content.status == ContentStatus.Active, "Content not active");

        content.status = ContentStatus.Archived;
        emit ContentArchived(ipfsHash);
    }

    function removeContent(string calldata ipfsHash) external onlyRole(CONTENT_MANAGER_ROLE) {
        Content storage content = contents[ipfsHash];
        require(content.uploadTime > 0, "Content not found");
        require(content.status != ContentStatus.Removed, "Content already removed");

        content.status = ContentStatus.Removed;
        delete contentNodes[ipfsHash];
        emit ContentRemoved(ipfsHash);
    }

    // View functions
    function getContentNodes(string calldata ipfsHash) external view returns (address[] memory) {
        return contentNodes[ipfsHash];
    }

    function getUploaderContents(address uploader) external view returns (string[] memory) {
        return uploaderContents[uploader];
    }

    function getContentMetrics(string calldata ipfsHash) external view returns (
        uint256 viewCount,
        uint256 popularity,
        uint256 lastAccessTime,
        uint256[] memory nodePerformance
    ) {
        ContentMetrics storage metrics = contentMetrics[ipfsHash];
        return (
            metrics.viewCount,
            metrics.popularity,
            metrics.lastAccessTime,
            metrics.nodePerformance
        );
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