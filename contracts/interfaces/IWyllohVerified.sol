// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.9;

/**
 * @title IWyllohVerified
 * @dev Interface for contracts that contain Wylloh-verified content
 * This interface allows for verification of content origin and quality
 */
interface IWyllohVerified {
    /**
     * @dev Returns whether this contract is verified by Wylloh
     * @return True if the contract is verified by Wylloh
     */
    function isWyllohVerified() external view returns (bool);
    
    /**
     * @dev Returns the content type of tokens in this contract
     * @return String representing the content type (e.g., "movie", "film", "video")
     */
    function contentType() external view returns (string memory);
    
    /**
     * @dev Returns the Wylloh content quality level
     * @return Quality level (0-100, where 100 is highest quality)
     */
    function qualityLevel() external view returns (uint8);
    
    /**
     * @dev Returns the Wylloh verification signature for a specific token
     * @param tokenId The ID of the token to get verification for
     * @return Verification signature for the token
     */
    function getWyllohVerificationSignature(uint256 tokenId) external view returns (bytes memory);
    
    /**
     * @dev Verifies if a token has valid Wylloh verification
     * @param tokenId The ID of the token to verify
     * @return True if the token has valid Wylloh verification
     */
    function isTokenVerified(uint256 tokenId) external view returns (bool);
    
    /**
     * @dev Returns the origin platform of a token
     * @param tokenId The ID of the token to check
     * @return String representing the origin platform (e.g., "wylloh", "otherprovider")
     */
    function tokenOrigin(uint256 tokenId) external view returns (string memory);
    
    /**
     * @dev Event emitted when a token is verified by Wylloh
     * @param tokenId The ID of the verified token
     * @param verifier Address of the verifier
     * @param timestamp When verification occurred
     */
    event TokenVerified(uint256 indexed tokenId, address indexed verifier, uint256 timestamp);
    
    /**
     * @dev Event emitted when a token's verification is revoked
     * @param tokenId The ID of the token
     * @param revoker Address that revoked verification
     * @param reason Reason for revocation
     * @param timestamp When revocation occurred
     */
    event VerificationRevoked(uint256 indexed tokenId, address indexed revoker, string reason, uint256 timestamp);
} 