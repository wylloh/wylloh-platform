import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("ContentToken", function () {
    let contentToken: Contract;
    let storagePool: Contract;
    let owner: HardhatEthersSigner;
    let filmmaker: HardhatEthersSigner;
    let buyer: HardhatEthersSigner;
    let drmManager: HardhatEthersSigner;

    const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
    const DRM_MANAGER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("DRM_MANAGER_ROLE"));

    const testContent = {
        ipfsHash: "QmTest123",
        size: ethers.parseUnits("1", 30), // 1 GB
        tier: 1, // Standard tier
        price: ethers.parseEther("1"),
        royaltyBps: 500, // 5%
        uri: "ipfs://test-metadata"
    };

    beforeEach(async function () {
        [owner, filmmaker, buyer, drmManager] = await ethers.getSigners();

        // Deploy StoragePool
        const StoragePool = await ethers.getContractFactory("StoragePool");
        storagePool = await StoragePool.deploy();
        await storagePool.waitForDeployment();

        // Deploy ContentToken
        const ContentToken = await ethers.getContractFactory("ContentToken");
        contentToken = await ContentToken.deploy();
        await contentToken.waitForDeployment();

        // Initialize ContentToken
        await contentToken.initialize(await storagePool.getAddress());

        // Grant roles
        await contentToken.grantRole(DRM_MANAGER_ROLE, drmManager.address);
    });

    describe("Initialization", function () {
        it("Should set the correct name and symbol", async function () {
            expect(await contentToken.name()).to.equal("Wylloh Content");
            expect(await contentToken.symbol()).to.equal("WYLF");
        });

        it("Should set the correct storage pool address", async function () {
            expect(await contentToken.storagePool()).to.equal(await storagePool.getAddress());
        });

        it("Should grant roles correctly", async function () {
            expect(await contentToken.hasRole(DRM_MANAGER_ROLE, drmManager.address)).to.be.true;
        });
    });

    describe("Content Creation", function () {
        it("Should allow creating content", async function () {
            const tx = await contentToken.connect(filmmaker).createContent(
                testContent.ipfsHash,
                testContent.size,
                testContent.tier,
                testContent.price,
                testContent.royaltyBps,
                testContent.uri
            );

            const receipt = await tx.wait();
            const event = receipt?.logs[0];
            const tokenId = event?.args[0];

            const content = await contentToken.getContent(tokenId);
            expect(content.ipfsHash).to.equal(testContent.ipfsHash);
            expect(content.creator).to.equal(filmmaker.address);
            expect(content.price).to.equal(testContent.price);
        });

        it("Should fail with invalid parameters", async function () {
            await expect(
                contentToken.connect(filmmaker).createContent(
                    "",
                    testContent.size,
                    testContent.tier,
                    testContent.price,
                    testContent.royaltyBps,
                    testContent.uri
                )
            ).to.be.revertedWith("Invalid IPFS hash");

            await expect(
                contentToken.connect(filmmaker).createContent(
                    testContent.ipfsHash,
                    0,
                    testContent.tier,
                    testContent.price,
                    testContent.royaltyBps,
                    testContent.uri
                )
            ).to.be.revertedWith("Invalid size");
        });
    });

    describe("Rights Purchase", function () {
        let tokenId: number;

        beforeEach(async function () {
            const tx = await contentToken.connect(filmmaker).createContent(
                testContent.ipfsHash,
                testContent.size,
                testContent.tier,
                testContent.price,
                testContent.royaltyBps,
                testContent.uri
            );

            const receipt = await tx.wait();
            const event = receipt?.logs[0];
            tokenId = event?.args[0];
        });

        it("Should allow purchasing rights", async function () {
            const initialBalance = await ethers.provider.getBalance(filmmaker.address);
            
            await contentToken.connect(buyer).purchaseRights(tokenId, {
                value: testContent.price
            });

            const content = await contentToken.getContent(tokenId);
            expect(content.totalSales).to.equal(1);
            expect(content.totalRevenue).to.equal(testContent.price);

            const finalBalance = await ethers.provider.getBalance(filmmaker.address);
            expect(finalBalance).to.be.gt(initialBalance);
        });

        it("Should fail with insufficient payment", async function () {
            await expect(
                contentToken.connect(buyer).purchaseRights(tokenId, {
                    value: ethers.parseEther("0.5")
                })
            ).to.be.revertedWith("Insufficient payment");
        });
    });

    describe("DRM Management", function () {
        let tokenId: number;
        const keyHash = ethers.keccak256(ethers.toUtf8Bytes("test-key"));
        const expiryTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
        const maxDevices = 3;

        beforeEach(async function () {
            const tx = await contentToken.connect(filmmaker).createContent(
                testContent.ipfsHash,
                testContent.size,
                testContent.tier,
                testContent.price,
                testContent.royaltyBps,
                testContent.uri
            );

            const receipt = await tx.wait();
            const event = receipt?.logs[0];
            tokenId = event?.args[0];

            await contentToken.connect(drmManager).issueDRMKey(
                tokenId,
                keyHash,
                expiryTime,
                maxDevices
            );
        });

        it("Should allow binding devices", async function () {
            await contentToken.connect(filmmaker).bindDevice(tokenId);
            const deviceCount = await contentToken.getDeviceCount(tokenId, filmmaker.address);
            expect(deviceCount).to.equal(1);
        });

        it("Should fail when max devices reached", async function () {
            for (let i = 0; i < maxDevices; i++) {
                await contentToken.connect(filmmaker).bindDevice(tokenId);
            }

            await expect(
                contentToken.connect(filmmaker).bindDevice(tokenId)
            ).to.be.revertedWith("Max devices reached");
        });

        it("Should allow revoking DRM key", async function () {
            await contentToken.connect(drmManager).revokeDRMKey(tokenId);
            await expect(
                contentToken.connect(filmmaker).bindDevice(tokenId)
            ).to.be.revertedWith("DRM key revoked");
        });
    });

    describe("Access Control", function () {
        it("Should only allow DRM manager to issue keys", async function () {
            const tx = await contentToken.connect(filmmaker).createContent(
                testContent.ipfsHash,
                testContent.size,
                testContent.tier,
                testContent.price,
                testContent.royaltyBps,
                testContent.uri
            );

            const receipt = await tx.wait();
            const event = receipt?.logs[0];
            const tokenId = event?.args[0];

            await expect(
                contentToken.connect(filmmaker).issueDRMKey(
                    tokenId,
                    ethers.keccak256(ethers.toUtf8Bytes("test-key")),
                    Math.floor(Date.now() / 1000) + 3600,
                    3
                )
            ).to.be.revertedWith("AccessControl: account");
        });
    });
}); 