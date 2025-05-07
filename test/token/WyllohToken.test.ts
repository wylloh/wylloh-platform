import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ethers } from "hardhat";
import { Contract } from "ethers";

describe("WyllohToken", function () {
  let wyllohToken: Contract;
  let owner: any;
  let addr1: any;
  let addr2: any;

  const BASE_URI = "https://api.wylloh.com/tokens/";
  const TOKEN_ID = 1;
  const INITIAL_AMOUNT = 1000;
  const CONTENT_ID = "movie-123";
  const CONTENT_HASH = "0x1234567890abcdef";
  const CONTENT_TYPE = "movie";
  const TOKEN_URI = "https://api.wylloh.com/tokens/1";
  const ROYALTY_PERCENTAGE = 250; // 2.5%

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    const WyllohToken = await ethers.getContractFactory("WyllohToken");
    wyllohToken = await WyllohToken.deploy();
    await wyllohToken.waitForDeployment();
    await wyllohToken.initialize();

    // Grant minter role
    await wyllohToken.grantRole(await wyllohToken.MINTER_ROLE(), addr1.address);
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await wyllohToken.hasRole(await wyllohToken.DEFAULT_ADMIN_ROLE(), owner.address)).to.be.true;
    });

    it("Should set the correct base URI", async function () {
      expect(await wyllohToken.uri(TOKEN_ID)).to.equal(BASE_URI + TOKEN_ID);
    });
  });

  describe("Token Creation", function () {
    it("Should create a new token with correct metadata", async function () {
      await wyllohToken.connect(addr1).create(
        addr2.address,
        TOKEN_ID,
        INITIAL_AMOUNT,
        CONTENT_ID,
        CONTENT_HASH,
        CONTENT_TYPE,
        TOKEN_URI,
        addr2.address,
        ROYALTY_PERCENTAGE
      );

      const metadata = await wyllohToken.getContentMetadata(TOKEN_ID);
      expect(metadata.contentId).to.equal(CONTENT_ID);
      expect(metadata.contentHash).to.equal(CONTENT_HASH);
      expect(metadata.contentType).to.equal(CONTENT_TYPE);
      expect(metadata.creator).to.equal(addr1.address);
    });

    it("Should set the correct token URI", async function () {
      await wyllohToken.connect(addr1).create(
        addr2.address,
        TOKEN_ID,
        INITIAL_AMOUNT,
        CONTENT_ID,
        CONTENT_HASH,
        CONTENT_TYPE,
        TOKEN_URI,
        addr2.address,
        ROYALTY_PERCENTAGE
      );

      expect(await wyllohToken.uri(TOKEN_ID)).to.equal(TOKEN_URI);
    });

    it("Should set the correct royalty info", async function () {
      await wyllohToken.connect(addr1).create(
        addr2.address,
        TOKEN_ID,
        INITIAL_AMOUNT,
        CONTENT_ID,
        CONTENT_HASH,
        CONTENT_TYPE,
        TOKEN_URI,
        addr2.address,
        ROYALTY_PERCENTAGE
      );

      const [recipient, amount] = await wyllohToken.royaltyInfo(TOKEN_ID, 10000);
      expect(recipient).to.equal(addr2.address);
      expect(amount).to.equal(250); // 2.5% of 10000
    });
  });

  describe("Rights Thresholds", function () {
    it("should grant personal viewing rights with 1 token", async function () {
      await wyllohToken.mint(addr1.address, ethers.parseEther("1"));
      expect(await wyllohToken.hasPersonalViewingRights(addr1.address)).to.be.true;
    });

    it("should grant private screening rights with 30 tokens", async function () {
      await wyllohToken.mint(addr1.address, ethers.parseEther("30"));
      expect(await wyllohToken.hasPrivateScreeningRights(addr1.address)).to.be.true;
    });

    it("should grant small venue rights with 250 tokens", async function () {
      await wyllohToken.mint(addr1.address, ethers.parseEther("250"));
      expect(await wyllohToken.hasSmallVenueRights(addr1.address)).to.be.true;
    });

    it("should grant regional streaming rights with 1000 tokens", async function () {
      await wyllohToken.mint(addr1.address, ethers.parseEther("1000"));
      expect(await wyllohToken.hasRegionalStreamingRights(addr1.address)).to.be.true;
    });

    it("should grant theatrical rights with 5000 tokens", async function () {
      await wyllohToken.mint(addr1.address, ethers.parseEther("5000"));
      expect(await wyllohToken.hasTheatricalRights(addr1.address)).to.be.true;
    });

    it("should grant national distribution rights with 25000 tokens", async function () {
      await wyllohToken.mint(addr1.address, ethers.parseEther("25000"));
      expect(await wyllohToken.hasNationalDistributionRights(addr1.address)).to.be.true;
    });

    it("should not grant higher tier rights with insufficient tokens", async function () {
      await wyllohToken.mint(addr1.address, ethers.parseEther("29"));
      expect(await wyllohToken.hasPersonalViewingRights(addr1.address)).to.be.true;
      expect(await wyllohToken.hasPrivateScreeningRights(addr1.address)).to.be.false;
    });
  });

  describe("Token Transfers", function () {
    it("should maintain rights after token transfers", async function () {
      await wyllohToken.mint(addr1.address, ethers.parseEther("30"));
      expect(await wyllohToken.hasPrivateScreeningRights(addr1.address)).to.be.true;

      await wyllohToken.connect(addr1).transfer(addr2.address, ethers.parseEther("15"));
      expect(await wyllohToken.hasPrivateScreeningRights(addr1.address)).to.be.false;
      expect(await wyllohToken.hasPersonalViewingRights(addr1.address)).to.be.true;
      expect(await wyllohToken.hasPersonalViewingRights(addr2.address)).to.be.true;
    });
  });

  describe("Custom Rights Thresholds", function () {
    it("should allow setting custom rights thresholds", async function () {
      const newThresholds = [
        ethers.parseEther("2"),    // Personal viewing
        ethers.parseEther("50"),   // Private screening
        ethers.parseEther("500"),  // Small venue
        ethers.parseEther("2000"), // Regional streaming
        ethers.parseEther("10000"), // Theatrical
        ethers.parseEther("50000")  // National distribution
      ];

      await wyllohToken.setRightsThresholds(newThresholds);
      await wyllohToken.mint(addr1.address, ethers.parseEther("50"));

      expect(await wyllohToken.hasPersonalViewingRights(addr1.address)).to.be.true;
      expect(await wyllohToken.hasPrivateScreeningRights(addr1.address)).to.be.true;
      expect(await wyllohToken.hasSmallVenueRights(addr1.address)).to.be.false;
    });
  });

  describe("Token Stacking", function () {
    const STACK_AMOUNT = 100;
    const STACK_DURATION = 86400; // 1 day

    beforeEach(async function () {
      await wyllohToken.connect(addr1).create(
        addr2.address,
        TOKEN_ID,
        INITIAL_AMOUNT,
        CONTENT_ID,
        CONTENT_HASH,
        CONTENT_TYPE,
        TOKEN_URI,
        addr2.address,
        ROYALTY_PERCENTAGE
      );
    });

    it("Should stack tokens correctly", async function () {
      await wyllohToken.connect(addr2).stackTokens(TOKEN_ID, STACK_AMOUNT, STACK_DURATION);

      const stack = await wyllohToken.getStack(addr2.address, TOKEN_ID);
      expect(stack.amount).to.equal(STACK_AMOUNT);
      expect(stack.tokenId).to.equal(TOKEN_ID);
    });

    it("Should not allow unstaking before duration", async function () {
      await wyllohToken.connect(addr2).stackTokens(TOKEN_ID, STACK_AMOUNT, STACK_DURATION);

      await expect(
        wyllohToken.connect(addr2).unstackTokens(TOKEN_ID)
      ).to.be.revertedWith("Tokens still locked");
    });

    it("Should allow unstaking after duration", async function () {
      await wyllohToken.connect(addr2).stackTokens(TOKEN_ID, STACK_AMOUNT, STACK_DURATION);

      // Fast forward time
      await ethers.provider.send("evm_increaseTime", [STACK_DURATION + 1]);
      await ethers.provider.send("evm_mine");

      await wyllohToken.connect(addr2).unstackTokens(TOKEN_ID);
      const stack = await wyllohToken.getStack(addr2.address, TOKEN_ID);
      expect(stack.amount).to.equal(0);
    });
  });

  describe("Bundle Management", function () {
    const TOKEN_ID_2 = 2;
    const AMOUNT_1 = 100;
    const AMOUNT_2 = 200;

    beforeEach(async function () {
      // Create two tokens
      await wyllohToken.connect(addr1).create(
        addr2.address,
        TOKEN_ID,
        INITIAL_AMOUNT,
        CONTENT_ID,
        CONTENT_HASH,
        CONTENT_TYPE,
        TOKEN_URI,
        addr2.address,
        ROYALTY_PERCENTAGE
      );

      await wyllohToken.connect(addr1).create(
        addr2.address,
        TOKEN_ID_2,
        INITIAL_AMOUNT,
        "movie-456",
        "0xabcdef1234567890",
        CONTENT_TYPE,
        "https://api.wylloh.com/tokens/2",
        addr2.address,
        ROYALTY_PERCENTAGE
      );
    });

    it("Should create a bundle correctly", async function () {
      const tokenIds = [TOKEN_ID, TOKEN_ID_2];
      const amounts = [AMOUNT_1, AMOUNT_2];

      const bundleId = await wyllohToken.connect(addr2).createBundle(tokenIds, amounts);
      const bundle = await wyllohToken.getBundle(bundleId);

      expect(bundle.tokenIds.length).to.equal(2);
      expect(bundle.amounts[0]).to.equal(AMOUNT_1);
      expect(bundle.amounts[1]).to.equal(AMOUNT_2);
      expect(bundle.active).to.be.true;
    });

    it("Should unbundle correctly", async function () {
      const tokenIds = [TOKEN_ID, TOKEN_ID_2];
      const amounts = [AMOUNT_1, AMOUNT_2];

      const bundleId = await wyllohToken.connect(addr2).createBundle(tokenIds, amounts);
      await wyllohToken.connect(addr2).unbundle(bundleId);

      const bundle = await wyllohToken.getBundle(bundleId);
      expect(bundle.active).to.be.false;
    });
  });

  describe("Upgradeability", function () {
    it("Should be upgradeable", async function () {
      const WyllohTokenV2 = await ethers.getContractFactory("WyllohToken");
      await expect(
        upgrades.upgradeProxy(wyllohToken.address, WyllohTokenV2)
      ).to.not.be.reverted;
    });

    it("Should maintain state after upgrade", async function () {
      // Create a token
      await wyllohToken.connect(addr1).create(
        addr2.address,
        TOKEN_ID,
        INITIAL_AMOUNT,
        CONTENT_ID,
        CONTENT_HASH,
        CONTENT_TYPE,
        TOKEN_URI,
        addr2.address,
        ROYALTY_PERCENTAGE
      );

      // Upgrade the contract
      const WyllohTokenV2 = await ethers.getContractFactory("WyllohToken");
      const upgraded = await upgrades.upgradeProxy(wyllohToken.address, WyllohTokenV2);

      // Check that the token still exists
      const metadata = await upgraded.getContentMetadata(TOKEN_ID);
      expect(metadata.contentId).to.equal(CONTENT_ID);
    });
  });
}); 