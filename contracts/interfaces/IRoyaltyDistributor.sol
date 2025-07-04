// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

/**
 * @title IRoyaltyDistributor
 * @dev Interface for the RoyaltyDistributor contract
 */
interface IRoyaltyDistributor {
    // Events
    event RoyaltyDistributed(address indexed tokenContract, uint256 indexed tokenId, uint256 amount);
    event RecipientAdded(address indexed tokenContract, uint256 indexed tokenId, address recipient, uint256 share);
    event RecipientRemoved(address indexed tokenContract, uint256 indexed tokenId, address recipient);
    event RecipientUpdated(address indexed tokenContract, uint256 indexed tokenId, address recipient, uint256 share);
    event FundsWithdrawn(address indexed recipient, uint256 amount);

    // Core functions
    function addRoyaltyRecipient(address tokenContract, uint256 tokenId, address recipient, uint256 sharePercentage) external;
    function updateRoyaltyRecipient(address tokenContract, uint256 tokenId, uint256 index, uint256 sharePercentage) external;
    function removeRoyaltyRecipient(address tokenContract, uint256 tokenId, uint256 index) external;
    function distributeRoyalties(address tokenContract, uint256 tokenId) external payable;
    function withdraw() external;
    function getBalance(address recipient) external view returns (uint256);
    function getRoyaltyRecipients(address tokenContract, uint256 tokenId) external view returns (address[] memory recipients, uint256[] memory shares);
} 