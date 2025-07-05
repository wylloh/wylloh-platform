// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "../../interfaces/IWyllohVerified.sol";
import "./WyllohFilmTokenSimple.sol";

/**
 * @title WyllohFilmFactory
 * @dev Factory contract for deploying film-specific token contracts
 * Each film gets its own contract with millions of identical tokens for stacking
 */
contract WyllohFilmFactory is AccessControl, ReentrancyGuard, IWyllohVerified {
    bytes32 public constant FILM_DEPLOYER_ROLE = keccak256("FILM_DEPLOYER_ROLE");
    
    // Registry of all deployed film contracts
    mapping(string => address) public filmContracts;
    address[] public allFilmContracts;
    mapping(address => string) public contractToFilmId;
    
    // Film metadata
    struct FilmInfo {
        string filmId;
        string title;
        address creator;
        address contractAddress;
        uint256 deployedAt;
        bool isActive;
    }
    
    mapping(string => FilmInfo) public filmInfo;
    
    // Events
    event FilmContractDeployed(
        string indexed filmId,
        string title,
        address indexed creator,
        address indexed contractAddress
    );
    
    event FilmContractDeactivated(string indexed filmId, address indexed contractAddress);
    
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(FILM_DEPLOYER_ROLE, msg.sender);
    }
    
    /**
     * @dev Deploy a new film-specific token contract
     * @param filmId Unique identifier for the film
     * @param title Film title
     * @param creator Address of the film creator
     * @param maxSupply Maximum number of tokens (millions for stacking)
     * @param rightsThresholds Array of token quantities that unlock different rights
     * @param baseURI Base URI for token metadata
     * @return filmContract Address of the deployed film contract
     */
    function deployFilmContract(
        string memory filmId,
        string memory title,
        address creator,
        uint256 maxSupply,
        uint256[] memory rightsThresholds,
        string memory baseURI
    ) external onlyRole(FILM_DEPLOYER_ROLE) nonReentrant returns (address filmContract) {
        require(bytes(filmId).length > 0, "Invalid film ID");
        require(bytes(title).length > 0, "Invalid title");
        require(creator != address(0), "Invalid creator");
        require(maxSupply > 0, "Invalid max supply");
        require(filmContracts[filmId] == address(0), "Film already exists");
        
        // Deploy new film token contract
        WyllohFilmTokenSimple newFilmContract = new WyllohFilmTokenSimple(
            filmId,
            title,
            creator,
            maxSupply,
            rightsThresholds,
            baseURI
        );
        
        filmContract = address(newFilmContract);
        
        // Register the film contract
        filmContracts[filmId] = filmContract;
        allFilmContracts.push(filmContract);
        contractToFilmId[filmContract] = filmId;
        
        filmInfo[filmId] = FilmInfo({
            filmId: filmId,
            title: title,
            creator: creator,
            contractAddress: filmContract,
            deployedAt: block.timestamp,
            isActive: true
        });
        
        emit FilmContractDeployed(filmId, title, creator, filmContract);
        
        return filmContract;
    }
    
    /**
     * @dev Get all deployed film contracts
     * @return Array of film contract addresses
     */
    function getAllFilmContracts() external view returns (address[] memory) {
        return allFilmContracts;
    }
    
    /**
     * @dev Get film contract address by film ID
     * @param filmId The film identifier
     * @return Contract address for the film
     */
    function getFilmContract(string memory filmId) external view returns (address) {
        return filmContracts[filmId];
    }
    
    /**
     * @dev Get film ID by contract address
     * @param contractAddress The contract address
     * @return Film identifier
     */
    function getFilmId(address contractAddress) external view returns (string memory) {
        return contractToFilmId[contractAddress];
    }
    
    /**
     * @dev Get total number of deployed films
     * @return Number of films
     */
    function getTotalFilms() external view returns (uint256) {
        return allFilmContracts.length;
    }
    
    /**
     * @dev Deactivate a film contract (admin only)
     * @param filmId The film to deactivate
     */
    function deactivateFilm(string memory filmId) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(filmContracts[filmId] != address(0), "Film does not exist");
        
        filmInfo[filmId].isActive = false;
        emit FilmContractDeactivated(filmId, filmContracts[filmId]);
    }
    
    // IWyllohVerified implementation
    function isWyllohVerified() external pure override returns (bool) {
        return true;
    }
    
    function contentType() external pure override returns (string memory) {
        return "film-factory";
    }
    
    function qualityLevel() external pure override returns (uint8) {
        return 100; // Factory itself is highest quality
    }
    
    function getWyllohVerificationSignature(uint256) external pure override returns (bytes memory) {
        return abi.encodePacked("wylloh:factory:verified");
    }
    
    function isTokenVerified(uint256) external pure override returns (bool) {
        return true; // All tokens from factory are verified
    }
    
    function tokenOrigin(uint256) external pure override returns (string memory) {
        return "wylloh-factory";
    }
} 