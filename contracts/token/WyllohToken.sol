// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title WyllohToken
 * @dev Implementation of the Wylloh media license token using ERC1155
 * Supports royalties (ERC2981) and tracks token supply
 */
contract WyllohToken is ERC1155, ERC1155Burnable, ERC1155Supply, ERC2981, AccessControl {
    using Strings for uint256;

    // Role definitions
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
    // Token metadata URI storage
    mapping(uint256 => string) private _tokenURIs;
    
    // Token content metadata
    struct ContentMetadata {
        string contentId;     // Unique identifier for the content
        string contentHash;   // Hash of the content for verification
        string contentType;   // Type of content (movie, series, etc.)
        address creator;      // Address of the content creator
    }
    
    mapping(uint256 => ContentMetadata) private _contentMetadata;
    
    // Rights configuration by token quantity
    struct RightsThreshold {
        uint256 quantity;     // Token quantity needed
        uint8 rightsType;     // Type of rights (personal, commercial, etc.)
        bool enabled;         // Whether this threshold is active
    }
    
    // Mapping from token ID to array of rights thresholds
    mapping(uint256 => RightsThreshold[]) private _rightsThresholds;
    
    // Events
    event TokenCreated(uint256 indexed tokenId, address indexed creator, string contentId);
    event RightsThresholdSet(uint256 indexed tokenId, uint256 quantity, uint8 rightsType);
    
    /**
     * @dev Constructor
     * @param uri_ Base URI for token metadata
     */
    constructor(string memory uri_) ERC1155(uri_) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
    }
    
    /**
     * @dev Creates a new token
     * @param to Recipient of the initial token batch
     * @param id Token ID to create
     * @param amount Initial amount to mint
     * @param contentId Unique identifier for the content
     * @param contentHash Hash of the content for verification
     * @param contentType Type of content (movie, series, etc.)
     * @param tokenURI URI for token metadata
     * @param royaltyRecipient Address to receive royalties
     * @param royaltyPercentage Royalty percentage (in basis points, e.g. 250 = 2.5%)
     */
    function create(
        address to,
        uint256 id,
        uint256 amount,
        string memory contentId,
        string memory contentHash,
        string memory contentType,
        string memory tokenURI,
        address royaltyRecipient,
        uint96 royaltyPercentage
    ) public onlyRole(MINTER_ROLE) {
        _mint(to, id, amount, "");
        
        _contentMetadata[id] = ContentMetadata({
            contentId: contentId,
            contentHash: contentHash,
            contentType: contentType,
            creator: msg.sender
        });
        
        _setTokenURI(id, tokenURI);
        _setTokenRoyalty(id, royaltyRecipient, royaltyPercentage);
        
        emit TokenCreated(id, msg.sender, contentId);
    }
    
    /**
     * @dev Sets rights thresholds for a token
     * @param tokenId Token ID to set rights for
     * @param quantities Array of token quantities for each rights threshold
     * @param rightsTypes Array of rights types corresponding to each quantity
     */
    function setRightsThresholds(
        uint256 tokenId,
        uint256[] memory quantities,
        uint8[] memory rightsTypes
    ) public onlyRole(ADMIN_ROLE) {
        require(quantities.length == rightsTypes.length, "Arrays must be same length");
        delete _rightsThresholds[tokenId];
        
        for (uint256 i = 0; i < quantities.length; i++) {
            _rightsThresholds[tokenId].push(RightsThreshold({
                quantity: quantities[i],
                rightsType: rightsTypes[i],
                enabled: true
            }));
            
            emit RightsThresholdSet(tokenId, quantities[i], rightsTypes[i]);
        }
    }
    
    /**
     * @dev Checks if an address has rights of a specific type for a token
     * @param account Address to check
     * @param tokenId Token ID to check
     * @param rightsType Rights type to check for
     * @return bool Whether the account has the specified rights
     */
    function hasRights(address account, uint256 tokenId, uint8 rightsType) public view returns (bool) {
        uint256 balance = balanceOf(account, tokenId);
        
        for (uint256 i = 0; i < _rightsThresholds[tokenId].length; i++) {
            RightsThreshold memory threshold = _rightsThresholds[tokenId][i];
            if (threshold.enabled && 
                threshold.rightsType == rightsType && 
                balance >= threshold.quantity) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * @dev Gets the content metadata for a token
     * @param tokenId Token ID to get metadata for
     * @return ContentMetadata struct with content information
     */
    function getContentMetadata(uint256 tokenId) public view returns (ContentMetadata memory) {
        return _contentMetadata[tokenId];
    }
    
    /**
     * @dev Gets the URI for a token
     * @param tokenId Token ID to get URI for
     * @return string URI for token metadata
     */
    function uri(uint256 tokenId) public view virtual override returns (string memory) {
        string memory tokenURI = _tokenURIs[tokenId];
        
        // If there is no token-specific URI, return the base URI
        string memory base = super.uri(tokenId);
        if (bytes(tokenURI).length == 0) {
            return string(abi.encodePacked(base, tokenId.toString()));
        }
        
        return tokenURI;
    }
    
    /**
     * @dev Sets the URI for a token
     * @param tokenId Token ID to set URI for
     * @param tokenURI New URI for the token
     */
    function _setTokenURI(uint256 tokenId, string memory tokenURI) internal {
        _tokenURIs[tokenId] = tokenURI;
    }
    
    /**
     * @dev Updates the URI for a token (admin only)
     * @param tokenId Token ID to update URI for
     * @param newUri New URI for the token
     */
    function setTokenURI(uint256 tokenId, string memory newUri) public onlyRole(ADMIN_ROLE) {
        _setTokenURI(tokenId, newUri);
    }
    
    /**
     * @dev Returns the rights thresholds for a token
     * @param tokenId Token ID to check
     * @return Array of RightsThreshold structs
     */
    function getRightsThresholds(uint256 tokenId) public view returns (RightsThreshold[] memory) {
        return _rightsThresholds[tokenId];
    }
    
    /**
     * @dev Hook that is called before any token transfer
     */
    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal override(ERC1155, ERC1155Supply) {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
    }
    
    /**
     * @dev See {IERC165-supportsInterface}
     */
    function supportsInterface(bytes4 interfaceId) public view override(ERC1155, ERC2981, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}