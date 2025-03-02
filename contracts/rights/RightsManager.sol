// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title RightsManager
 * @dev Manages the rights associated with token ownership
 * Determines what rights are available based on quantity of tokens owned
 */
contract RightsManager is AccessControl {
    using Counters for Counters.Counter;

    // Roles
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant RIGHTS_MANAGER_ROLE = keccak256("RIGHTS_MANAGER_ROLE");

    // Rights types
    enum RightsType {
        PERSONAL_VIEWING,
        SMALL_VENUE,
        STREAMING_PLATFORM,
        THEATRICAL_EXHIBITION,
        NATIONAL_DISTRIBUTION,
        CUSTOM
    }

    // Rights threshold definition
    struct RightsThreshold {
        uint256 quantity;
        RightsType rightsType;
        bool enabled;
        string description;
        string additionalMetadata;
    }

    // Mapping from token ID to rights thresholds
    mapping(address => mapping(uint256 => RightsThreshold[])) private _rightsThresholds;

    // Custom rights definitions
    struct CustomRightsDefinition {
        uint256 id;
        string name;
        string description;
        string additionalMetadata;
    }

    // Custom rights definitions counter
    Counters.Counter private _customRightsCounter;
    
    // Mapping of custom rights definitions
    mapping(uint256 => CustomRightsDefinition) private _customRightsDefinitions;

    // Events
    event RightsThresholdAdded(address tokenContract, uint256 tokenId, uint256 quantity, RightsType rightsType);
    event RightsThresholdUpdated(address tokenContract, uint256 tokenId, uint256 index, uint256 quantity, RightsType rightsType);
    event RightsThresholdRemoved(address tokenContract, uint256 tokenId, uint256 index);
    event CustomRightsDefinitionCreated(uint256 id, string name, string description);

    /**
     * @dev Constructor
     */
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(RIGHTS_MANAGER_ROLE, msg.sender);
    }

    /**
     * @dev Add a rights threshold for a token
     * @param tokenContract Address of the token contract
     * @param tokenId Token ID
     * @param quantity Token quantity required for this rights type
     * @param rightsType Type of rights granted at this threshold
     * @param description Human-readable description of the rights
     * @param additionalMetadata Additional metadata for the rights (JSON string)
     */
    function addRightsThreshold(
        address tokenContract,
        uint256 tokenId,
        uint256 quantity,
        RightsType rightsType,
        string memory description,
        string memory additionalMetadata
    ) public onlyRole(RIGHTS_MANAGER_ROLE) {
        RightsThreshold memory newThreshold = RightsThreshold({
            quantity: quantity,
            rightsType: rightsType,
            enabled: true,
            description: description,
            additionalMetadata: additionalMetadata
        });

        _rightsThresholds[tokenContract][tokenId].push(newThreshold);

        emit RightsThresholdAdded(tokenContract, tokenId, quantity, rightsType);
    }

    /**
     * @dev Update a rights threshold for a token
     * @param tokenContract Address of the token contract
     * @param tokenId Token ID
     * @param index Index of the threshold to update
     * @param quantity New token quantity
     * @param rightsType New rights type
     * @param enabled Whether this threshold is enabled
     * @param description Updated description
     * @param additionalMetadata Updated additional metadata
     */
    function updateRightsThreshold(
        address tokenContract,
        uint256 tokenId,
        uint256 index,
        uint256 quantity,
        RightsType rightsType,
        bool enabled,
        string memory description,
        string memory additionalMetadata
    ) public onlyRole(RIGHTS_MANAGER_ROLE) {
        require(index < _rightsThresholds[tokenContract][tokenId].length, "RightsManager: Index out of bounds");

        RightsThreshold storage threshold = _rightsThresholds[tokenContract][tokenId][index];
        threshold.quantity = quantity;
        threshold.rightsType = rightsType;
        threshold.enabled = enabled;
        threshold.description = description;
        threshold.additionalMetadata = additionalMetadata;

        emit RightsThresholdUpdated(tokenContract, tokenId, index, quantity, rightsType);
    }

    /**
     * @dev Remove a rights threshold for a token
     * @param tokenContract Address of the token contract
     * @param tokenId Token ID
     * @param index Index of the threshold to remove
     */
    function removeRightsThreshold(
        address tokenContract,
        uint256 tokenId,
        uint256 index
    ) public onlyRole(RIGHTS_MANAGER_ROLE) {
        require(index < _rightsThresholds[tokenContract][tokenId].length, "RightsManager: Index out of bounds");

        // Move the last element to the deleted spot and pop the last element
        uint256 lastIndex = _rightsThresholds[tokenContract][tokenId].length - 1;
        
        if (index != lastIndex) {
            _rightsThresholds[tokenContract][tokenId][index] = _rightsThresholds[tokenContract][tokenId][lastIndex];
        }
        
        _rightsThresholds[tokenContract][tokenId].pop();

        emit RightsThresholdRemoved(tokenContract, tokenId, index);
    }

    /**
     * @dev Create a new custom rights definition
     * @param name Name of the custom rights
     * @param description Description of the custom rights
     * @param additionalMetadata Additional metadata (JSON string)
     * @return id The ID of the created custom rights definition
     */
    function createCustomRightsDefinition(
        string memory name,
        string memory description,
        string memory additionalMetadata
    ) public onlyRole(RIGHTS_MANAGER_ROLE) returns (uint256) {
        _customRightsCounter.increment();
        uint256 newId = _customRightsCounter.current();

        _customRightsDefinitions[newId] = CustomRightsDefinition({
            id: newId,
            name: name,
            description: description,
            additionalMetadata: additionalMetadata
        });

        emit CustomRightsDefinitionCreated(newId, name, description);

        return newId;
    }

    /**
     * @dev Check if a user has a specific rights type for a token
     * @param tokenContract Address of the token contract
     * @param tokenId Token ID
     * @param account User address to check
     * @param rightsType Rights type to check for
     * @return bool Whether the user has the specified rights
     */
    function hasRights(
        address tokenContract,
        uint256 tokenId,
        address account,
        RightsType rightsType
    ) public view returns (bool) {
        IERC1155 token = IERC1155(tokenContract);
        uint256 balance = token.balanceOf(account, tokenId);

        // Iterate through thresholds to find if user qualifies
        RightsThreshold[] memory thresholds = _rightsThresholds[tokenContract][tokenId];
        
        for (uint256 i = 0; i < thresholds.length; i++) {
            if (thresholds[i].enabled && 
                thresholds[i].rightsType == rightsType && 
                balance >= thresholds[i].quantity) {
                return true;
            }
        }

        return false;
    }

    /**
     * @dev Get all rights thresholds for a token
     * @param tokenContract Address of the token contract
     * @param tokenId Token ID
     * @return RightsThreshold[] Array of rights thresholds
     */
    function getRightsThresholds(
        address tokenContract,
        uint256 tokenId
    ) public view returns (RightsThreshold[] memory) {
        return _rightsThresholds[tokenContract][tokenId];
    }

    /**
     * @dev Get a custom rights definition
     * @param id ID of the custom rights definition
     * @return CustomRightsDefinition The custom rights definition
     */
    function getCustomRightsDefinition(
        uint256 id
    ) public view returns (CustomRightsDefinition memory) {
        require(id <= _customRightsCounter.current() && id > 0, "RightsManager: Invalid custom rights ID");
        return _customRightsDefinitions[id];
    }

    /**
     * @dev Get the highest rights type a user has for a token
     * @param tokenContract Address of the token contract
     * @param tokenId Token ID
     * @param account User address to check
     * @return highestRightsType The highest rights type the user has
     * @return description Description of the highest rights
     */
    function getHighestRights(
        address tokenContract,
        uint256 tokenId,
        address account
    ) public view returns (RightsType highestRightsType, string memory description) {
        IERC1155 token = IERC1155(tokenContract);
        uint256 balance = token.balanceOf(account, tokenId);
        
        highestRightsType = RightsType.PERSONAL_VIEWING; // Default to lowest rights
        string memory highestDescription = "";
        uint256 highestQuantity = 0;

        // Iterate through thresholds to find highest rights
        RightsThreshold[] memory thresholds = _rightsThresholds[tokenContract][tokenId];
        
        for (uint256 i = 0; i < thresholds.length; i++) {
            if (thresholds[i].enabled && 
                balance >= thresholds[i].quantity && 
                thresholds[i].quantity > highestQuantity) {
                highestRightsType = thresholds[i].rightsType;
                highestDescription = thresholds[i].description;
                highestQuantity = thresholds[i].quantity;
            }
        }

        return (highestRightsType, highestDescription);
    }

    /**
     * @dev Get the rights type name as a string
     * @param rightsType Rights type enum value
     * @return string The name of the rights type
     */
    function getRightsTypeName(RightsType rightsType) public pure returns (string memory) {
        if (rightsType == RightsType.PERSONAL_VIEWING) return "Personal Viewing";
        if (rightsType == RightsType.SMALL_VENUE) return "Small Venue";
        if (rightsType == RightsType.STREAMING_PLATFORM) return "Streaming Platform";
        if (rightsType == RightsType.THEATRICAL_EXHIBITION) return "Theatrical Exhibition";
        if (rightsType == RightsType.NATIONAL_DISTRIBUTION) return "National Distribution";
        if (rightsType == RightsType.CUSTOM) return "Custom Rights";
        
        return "Unknown";
    }
}