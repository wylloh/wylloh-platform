// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract WyllohToken is 
    Initializable, 
    ERC20Upgradeable, 
    PausableUpgradeable, 
    AccessControlUpgradeable, 
    UUPSUpgradeable 
{
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    // Staking structures
    struct Stake {
        uint256 amount;
        uint256 startTime;
        uint256 lockPeriod;
        uint256 lastRewardTime;
    }

    struct StakingTier {
        uint256 minAmount;
        uint256 apy;
        uint256 lockPeriod;
    }

    // Staking state
    mapping(address => Stake) public stakes;
    StakingTier[] public stakingTiers;
    uint256 public totalStaked;
    uint256 public constant REWARD_PRECISION = 1e18;

    // Burning state
    uint256 public totalBurned;
    uint256 public constant BURN_RATE = 50; // 50% of fees burned
    uint256 public constant BURN_PRECISION = 100;

    // Events
    event Staked(address indexed user, uint256 amount, uint256 lockPeriod);
    event Unstaked(address indexed user, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 amount);
    event TokensBurned(uint256 amount);
    event StakingTierAdded(uint256 minAmount, uint256 apy, uint256 lockPeriod);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize() public initializer {
        __ERC20_init("Wylloh Token", "WYL");
        __Pausable_init();
        __AccessControl_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);

        // Initialize staking tiers
        stakingTiers.push(StakingTier(10000 * 1e18, 5, 90 days));  // 5% APY, 3 months
        stakingTiers.push(StakingTier(50000 * 1e18, 10, 180 days)); // 10% APY, 6 months
        stakingTiers.push(StakingTier(100000 * 1e18, 15, 365 days)); // 15% APY, 12 months
    }

    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }

    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        onlyRole(UPGRADER_ROLE)
        override
    {}

    // Staking functions
    function stake(uint256 amount, uint256 tierIndex) external whenNotPaused {
        require(amount > 0, "Amount must be greater than 0");
        require(tierIndex < stakingTiers.length, "Invalid tier");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        
        StakingTier memory tier = stakingTiers[tierIndex];
        require(amount >= tier.minAmount, "Amount below tier minimum");
        
        // Transfer tokens to contract
        _transfer(msg.sender, address(this), amount);
        
        // Update stake
        stakes[msg.sender] = Stake({
            amount: amount,
            startTime: block.timestamp,
            lockPeriod: tier.lockPeriod,
            lastRewardTime: block.timestamp
        });
        
        totalStaked += amount;
        emit Staked(msg.sender, amount, tier.lockPeriod);
    }

    function unstake() external whenNotPaused {
        Stake storage userStake = stakes[msg.sender];
        require(userStake.amount > 0, "No stake found");
        require(
            block.timestamp >= userStake.startTime + userStake.lockPeriod,
            "Stake is locked"
        );

        uint256 amount = userStake.amount;
        uint256 rewards = calculateRewards(msg.sender);
        
        // Reset stake
        delete stakes[msg.sender];
        totalStaked -= amount;
        
        // Transfer stake and rewards
        _transfer(address(this), msg.sender, amount);
        if (rewards > 0) {
            mint(msg.sender, rewards);
        }
        
        emit Unstaked(msg.sender, amount);
        if (rewards > 0) {
            emit RewardsClaimed(msg.sender, rewards);
        }
    }

    function calculateRewards(address user) public view returns (uint256) {
        Stake memory userStake = stakes[user];
        if (userStake.amount == 0) return 0;

        uint256 stakingDuration = block.timestamp - userStake.lastRewardTime;
        uint256 tierIndex = getStakingTier(userStake.amount);
        uint256 apy = stakingTiers[tierIndex].apy;
        
        return (userStake.amount * apy * stakingDuration) / (365 days * 100);
    }

    function getStakingTier(uint256 amount) public view returns (uint256) {
        for (uint256 i = stakingTiers.length; i > 0; i--) {
            if (amount >= stakingTiers[i - 1].minAmount) {
                return i - 1;
            }
        }
        revert("No eligible tier found");
    }

    // Burning functions
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
        totalBurned += amount;
        emit TokensBurned(amount);
    }

    function burnFromFee(uint256 amount) external onlyRole(DEFAULT_ADMIN_ROLE) {
        uint256 burnAmount = (amount * BURN_RATE) / BURN_PRECISION;
        _burn(address(this), burnAmount);
        totalBurned += burnAmount;
        emit TokensBurned(burnAmount);
    }

    // The following functions are overrides required by Solidity
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override whenNotPaused {
        super._beforeTokenTransfer(from, to, amount);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(AccessControlUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
} 