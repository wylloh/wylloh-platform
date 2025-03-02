// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

/**
 * @title RoyaltyDistributor
 * @dev Manages the collection and distribution of royalties for token sales
 */
contract RoyaltyDistributor is AccessControl {
    using SafeMath for uint256;

    // Roles
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant ROYALTY_MANAGER_ROLE = keccak256("ROYALTY_MANAGER_ROLE");

    // Events
    event RoyaltyDistributed(address indexed tokenContract, uint256 indexed tokenId, uint256 amount);
    event RecipientAdded(address indexed tokenContract, uint256 indexed tokenId, address recipient, uint256 share);
    event RecipientRemoved(address indexed tokenContract, uint256 indexed tokenId, address recipient);
    event RecipientUpdated(address indexed tokenContract, uint256 indexed tokenId, address recipient, uint256 share);
    event FundsWithdrawn(address indexed recipient, uint256 amount);

    // Royalty recipient structure
    struct RoyaltyRecipient {
        address recipientAddress;
        uint256 sharePercentage; // Basis points (1/100 of a percent, so 10000 = 100%)
    }

    // Mapping from token contract and ID to recipients
    mapping(address => mapping(uint256 => RoyaltyRecipient[])) private _royaltyRecipients;
    
    // Mapping of accumulated balances for each recipient
    mapping(address => uint256) private _balances;

    /**
     * @dev Constructor
     */
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(ROYALTY_MANAGER_ROLE, msg.sender);
    }

    /**
     * @dev Add a royalty recipient for a token
     * @param tokenContract Address of the token contract
     * @param tokenId Token ID
     * @param recipient Address of the royalty recipient
     * @param sharePercentage Percentage share in basis points (10000 = 100%)
     */
    function addRoyaltyRecipient(
        address tokenContract,
        uint256 tokenId,
        address recipient,
        uint256 sharePercentage
    ) public onlyRole(ROYALTY_MANAGER_ROLE) {
        require(recipient != address(0), "RoyaltyDistributor: Invalid recipient address");
        require(sharePercentage > 0 && sharePercentage <= 10000, "RoyaltyDistributor: Invalid share percentage");

        // Check that adding this recipient won't exceed 100%
        uint256 totalShares = getTotalRoyaltyShares(tokenContract, tokenId);
        require(totalShares.add(sharePercentage) <= 10000, "RoyaltyDistributor: Total shares exceed 100%");

        _royaltyRecipients[tokenContract][tokenId].push(RoyaltyRecipient({
            recipientAddress: recipient,
            sharePercentage: sharePercentage
        }));

        emit RecipientAdded(tokenContract, tokenId, recipient, sharePercentage);
    }

    /**
     * @dev Update a royalty recipient's share
     * @param tokenContract Address of the token contract
     * @param tokenId Token ID
     * @param index Index of the recipient to update
     * @param sharePercentage New percentage share in basis points (10000 = 100%)
     */
    function updateRoyaltyRecipient(
        address tokenContract,
        uint256 tokenId,
        uint256 index,
        uint256 sharePercentage
    ) public onlyRole(ROYALTY_MANAGER_ROLE) {
        require(index < _royaltyRecipients[tokenContract][tokenId].length, "RoyaltyDistributor: Index out of bounds");
        require(sharePercentage > 0 && sharePercentage <= 10000, "RoyaltyDistributor: Invalid share percentage");

        // Calculate total shares minus the one being updated
        uint256 totalShares = getTotalRoyaltyShares(tokenContract, tokenId);
        uint256 currentShare = _royaltyRecipients[tokenContract][tokenId][index].sharePercentage;
        uint256 otherShares = totalShares.sub(currentShare);

        require(otherShares.add(sharePercentage) <= 10000, "RoyaltyDistributor: Total shares exceed 100%");

        address recipient = _royaltyRecipients[tokenContract][tokenId][index].recipientAddress;
        _royaltyRecipients[tokenContract][tokenId][index].sharePercentage = sharePercentage;

        emit RecipientUpdated(tokenContract, tokenId, recipient, sharePercentage);
    }

    /**
     * @dev Remove a royalty recipient
     * @param tokenContract Address of the token contract
     * @param tokenId Token ID
     * @param index Index of the recipient to remove
     */
    function removeRoyaltyRecipient(
        address tokenContract,
        uint256 tokenId,
        uint256 index
    ) public onlyRole(ROYALTY_MANAGER_ROLE) {
        require(index < _royaltyRecipients[tokenContract][tokenId].length, "RoyaltyDistributor: Index out of bounds");

        address recipient = _royaltyRecipients[tokenContract][tokenId][index].recipientAddress;

        // Move the last element to the deleted spot and pop the last element
        uint256 lastIndex = _royaltyRecipients[tokenContract][tokenId].length - 1;
        
        if (index != lastIndex) {
            _royaltyRecipients[tokenContract][tokenId][index] = _royaltyRecipients[tokenContract][tokenId][lastIndex];
        }
        
        _royaltyRecipients[tokenContract][tokenId].pop();

        emit RecipientRemoved(tokenContract, tokenId, recipient);
    }

    /**
     * @dev Distribute royalties for a token sale
     * @param tokenContract Address of the token contract
     * @param tokenId Token ID
     */
    function distributeRoyalties(
        address tokenContract,
        uint256 tokenId
    ) public payable {
        require(msg.value > 0, "RoyaltyDistributor: No royalties to distribute");
        require(_royaltyRecipients[tokenContract][tokenId].length > 0, "RoyaltyDistributor: No recipients configured");

        uint256 totalDistributed = 0;

        // Distribute to each recipient according to their share
        for (uint256 i = 0; i < _royaltyRecipients[tokenContract][tokenId].length; i++) {
            RoyaltyRecipient memory recipient = _royaltyRecipients[tokenContract][tokenId][i];
            
            uint256 amount = msg.value.mul(recipient.sharePercentage).div(10000);
            _balances[recipient.recipientAddress] = _balances[recipient.recipientAddress].add(amount);
            
            totalDistributed = totalDistributed.add(amount);
        }

        // If there's any remainder due to rounding, send it to the first recipient
        if (totalDistributed < msg.value && _royaltyRecipients[tokenContract][tokenId].length > 0) {
            uint256 remainder = msg.value.sub(totalDistributed);
            address firstRecipient = _royaltyRecipients[tokenContract][tokenId][0].recipientAddress;
            _balances[firstRecipient] = _balances[firstRecipient].add(remainder);
        }

        emit RoyaltyDistributed(tokenContract, tokenId, msg.value);
    }

    /**
     * @dev Withdraw accumulated royalties
     */
    function withdraw() public {
        uint256 amount = _balances[msg.sender];
        require(amount > 0, "RoyaltyDistributor: No funds to withdraw");

        // Reset balance before transfer to prevent reentrancy
        _balances[msg.sender] = 0;

        // Transfer funds
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "RoyaltyDistributor: Transfer failed");

        emit FundsWithdrawn(msg.sender, amount);
    }

    /**
     * @dev Get the balance of a recipient
     * @param recipient Address of the recipient
     * @return uint256 Available balance to withdraw
     */
    function getBalance(address recipient) public view returns (uint256) {
        return _balances[recipient];
    }

    /**
     * @dev Get all royalty recipients for a token
     * @param tokenContract Address of the token contract
     * @param tokenId Token ID
     * @return recipients Array of royalty recipients
     * @return shares Array of share percentages (basis points)
     */
    function getRoyaltyRecipients(
        address tokenContract,
        uint256 tokenId
    ) public view returns (address[] memory recipients, uint256[] memory shares) {
        uint256 count = _royaltyRecipients[tokenContract][tokenId].length;
        
        recipients = new address[](count);
        shares = new uint256[](count);
        
        for (uint256 i = 0; i < count; i++) {
            recipients[i] = _royaltyRecipients[tokenContract][tokenId][i].recipientAddress;
            shares[i] = _royaltyRecipients[tokenContract][tokenId][i].sharePercentage;
        }
        
        return (recipients, shares);
    }

    /**
     * @dev Get total royalty shares for a token
     * @param tokenContract Address of the token contract
     * @param tokenId Token ID
     * @return uint256 Total shares (in basis points)
     */
    function getTotalRoyaltyShares(
        address tokenContract,
        uint256 tokenId
    ) public view returns (uint256) {
        uint256 totalShares = 0;
        
        for (uint256 i = 0; i < _royaltyRecipients[tokenContract][tokenId].length; i++) {
            totalShares = totalShares.add(_royaltyRecipients[tokenContract][tokenId][i].sharePercentage);
        }
        
        return totalShares;
    }

    /**
     * @dev Batch update multiple recipients at once
     * @param tokenContract Address of the token contract
     * @param tokenId Token ID
     * @param recipients Array of recipient addresses
     * @param shares Array of share percentages (basis points)
     */
    function batchUpdateRecipients(
        address tokenContract,
        uint256 tokenId,
        address[] calldata recipients,
        uint256[] calldata shares
    ) public onlyRole(ROYALTY_MANAGER_ROLE) {
        require(recipients.length == shares.length, "RoyaltyDistributor: Arrays length mismatch");
        
        // Clear existing recipients
        delete _royaltyRecipients[tokenContract][tokenId];
        
        // Add new recipients
        uint256 totalShares = 0;
        
        for (uint256 i = 0; i < recipients.length; i++) {
            require(recipients[i] != address(0), "RoyaltyDistributor: Invalid recipient address");
            require(shares[i] > 0 && shares[i] <= 10000, "RoyaltyDistributor: Invalid share percentage");
            
            totalShares = totalShares.add(shares[i]);
            require(totalShares <= 10000, "RoyaltyDistributor: Total shares exceed 100%");
            
            _royaltyRecipients[tokenContract][tokenId].push(RoyaltyRecipient({
                recipientAddress: recipients[i],
                sharePercentage: shares[i]
            }));
            
            emit RecipientAdded(tokenContract, tokenId, recipients[i], shares[i]);
        }
    }
}