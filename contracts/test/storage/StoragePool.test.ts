import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("StoragePool", function () {
    let storagePool: Contract;
    let wyllohToken: Contract;
    let owner: HardhatEthersSigner;
    let poolManager: HardhatEthersSigner;
    let nodeOperator: HardhatEthersSigner;
    let filmmaker: HardhatEthersSigner;

    const POOL_MANAGER_ROLE = ethers.keccak256(
        ethers.toUtf8Bytes("POOL_MANAGER_ROLE")
    );

    beforeEach(async function () {
        [owner, poolManager, nodeOperator, filmmaker] = await ethers.getSigners();

        // Deploy WyllohToken
        const WyllohToken = await ethers.getContractFactory("WyllohToken");
        wyllohToken = await WyllohToken.deploy();
        await wyllohToken.waitForDeployment();

        // Deploy StoragePool
        const StoragePool = await ethers.getContractFactory("StoragePool");
        storagePool = await StoragePool.deploy();
        await storagePool.waitForDeployment();

        // Initialize StoragePool
        await storagePool.initialize(await wyllohToken.getAddress());

        // Grant roles
        await storagePool.grantRole(POOL_MANAGER_ROLE, poolManager.address);

        // Mint tokens to filmmaker
        await wyllohToken.mint(filmmaker.address, ethers.parseEther("1000000"));
    });

    describe("Initialization", function () {
        it("Should set the correct token address", async function () {
            expect(await storagePool.token()).to.equal(await wyllohToken.getAddress());
        });

        it("Should grant roles correctly", async function () {
            expect(await storagePool.hasRole(POOL_MANAGER_ROLE, poolManager.address)).to.be.true;
        });
    });

    describe("Pool Funding", function () {
        it("Should allow funding the pool", async function () {
            const amount = ethers.parseEther("1000");
            await wyllohToken.connect(filmmaker).approve(await storagePool.getAddress(), amount);
            await storagePool.connect(filmmaker).fundPool(amount);

            const metrics = await storagePool.getPoolMetrics();
            expect(metrics.totalFunded).to.equal(amount);
        });

        it("Should fail if amount is zero", async function () {
            await expect(
                storagePool.connect(filmmaker).fundPool(0)
            ).to.be.revertedWith("Amount must be greater than 0");
        });
    });

    describe("Content Funding", function () {
        const ipfsHash = "QmTest123";
        const size = ethers.parseUnits("1", 30); // 1 GB
        const cost = ethers.parseEther("100");

        beforeEach(async function () {
            // Fund the pool first
            await wyllohToken.connect(filmmaker).approve(await storagePool.getAddress(), cost);
            await storagePool.connect(filmmaker).fundPool(cost);
        });

        it("Should allow funding content", async function () {
            await storagePool.connect(poolManager).fundContent(ipfsHash, size, cost);

            const storage = await storagePool.getContentStorage(ipfsHash);
            expect(storage.size).to.equal(size);
            expect(storage.cost).to.equal(cost);
            expect(storage.isActive).to.be.true;
        });

        it("Should fail if content is already funded", async function () {
            await storagePool.connect(poolManager).fundContent(ipfsHash, size, cost);
            await expect(
                storagePool.connect(poolManager).fundContent(ipfsHash, size, cost)
            ).to.be.revertedWith("Content already funded");
        });

        it("Should fail if pool has insufficient balance", async function () {
            const largeCost = ethers.parseEther("1000000");
            await expect(
                storagePool.connect(poolManager).fundContent(ipfsHash, size, largeCost)
            ).to.be.revertedWith("Insufficient pool balance");
        });
    });

    describe("Reward Distribution", function () {
        const rewardAmount = ethers.parseEther("100");

        beforeEach(async function () {
            // Fund the pool first
            await wyllohToken.connect(filmmaker).approve(await storagePool.getAddress(), rewardAmount);
            await storagePool.connect(filmmaker).fundPool(rewardAmount);
        });

        it("Should distribute rewards to nodes", async function () {
            const nodes = [nodeOperator.address];
            const amounts = [rewardAmount];

            await storagePool.connect(poolManager).distributeRewards(nodes, amounts);

            const nodeReward = await storagePool.getNodeRewards(nodeOperator.address);
            expect(nodeReward).to.equal(rewardAmount);
        });

        it("Should fail if arrays length mismatch", async function () {
            const nodes = [nodeOperator.address];
            const amounts = [rewardAmount, rewardAmount];

            await expect(
                storagePool.connect(poolManager).distributeRewards(nodes, amounts)
            ).to.be.revertedWith("Array length mismatch");
        });
    });

    describe("Cost Recovery", function () {
        const ipfsHash = "QmTest123";
        const size = ethers.parseUnits("1", 30); // 1 GB
        const cost = ethers.parseEther("100");
        const recoveryAmount = ethers.parseEther("50");

        beforeEach(async function () {
            // Fund the pool and content
            await wyllohToken.connect(filmmaker).approve(await storagePool.getAddress(), cost);
            await storagePool.connect(filmmaker).fundPool(cost);
            await storagePool.connect(poolManager).fundContent(ipfsHash, size, cost);
        });

        it("Should recover costs partially", async function () {
            await storagePool.connect(poolManager).recoverCost(ipfsHash, recoveryAmount);

            const storage = await storagePool.getContentStorage(ipfsHash);
            expect(storage.recoveredAmount).to.equal(recoveryAmount);
            expect(storage.isActive).to.be.true;
        });

        it("Should mark content as inactive when fully recovered", async function () {
            await storagePool.connect(poolManager).recoverCost(ipfsHash, cost);

            const storage = await storagePool.getContentStorage(ipfsHash);
            expect(storage.recoveredAmount).to.equal(cost);
            expect(storage.isActive).to.be.false;
        });

        it("Should fail if recovery amount exceeds remaining cost", async function () {
            await expect(
                storagePool.connect(poolManager).recoverCost(ipfsHash, cost + 1n)
            ).to.be.revertedWith("Amount exceeds remaining cost");
        });
    });

    describe("Access Control", function () {
        it("Should only allow pool manager to fund content", async function () {
            const ipfsHash = "QmTest123";
            const size = ethers.parseUnits("1", 30);
            const cost = ethers.parseEther("100");

            await expect(
                storagePool.connect(filmmaker).fundContent(ipfsHash, size, cost)
            ).to.be.revertedWith("AccessControl: account");
        });

        it("Should only allow pool manager to distribute rewards", async function () {
            const nodes = [nodeOperator.address];
            const amounts = [ethers.parseEther("100")];

            await expect(
                storagePool.connect(filmmaker).distributeRewards(nodes, amounts)
            ).to.be.revertedWith("AccessControl: account");
        });
    });
}); 