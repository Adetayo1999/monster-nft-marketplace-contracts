import { network, ethers, deployments } from "hardhat";
import { DEV_CHAINS } from "../utils/dev-chains";
import { MonsterNFT } from "../typechain-types";
import { expect } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber } from "ethers";

!DEV_CHAINS.includes(network.name)
  ? describe.skip
  : describe("Tests On Monster NFT", () => {
      let monsterNFT: MonsterNFT,
        accounts: SignerWithAddress[],
        nftPrice: BigNumber;
      beforeEach(async () => {
        await deployments.fixture(["monsterNFT"]);
        monsterNFT = await ethers.getContract("MonsterNFT");
        accounts = await ethers.getSigners();
        nftPrice = await monsterNFT.getNFTPrice();
      });

      describe("constructor Function", () => {
        it("expects Monster NFT name and symbol be stored corretly", async () => {
          const [monsterNFTName, monsterNFTSymbol] = await Promise.all([
            monsterNFT.name(),
            monsterNFT.symbol(),
          ]);
          expect(monsterNFTName).to.equal("Monster NFT");
          expect(monsterNFTSymbol).to.equal("MNFT");
        });
      });

      describe("mint Function", () => {
        it("reverts with custom error if invalid ether amount is passed", async () => {
          const invalidNftPrice = nftPrice.sub(nftPrice.div(BigNumber.from(2)));
          await expect(
            monsterNFT.mint({ value: invalidNftPrice })
          ).to.be.revertedWithCustomError(
            monsterNFT,
            "MonsterNFT__NotEnoughETH"
          );
        });

        it("emits an event on successful mint", async () => {
          const tx = await monsterNFT.mint({ value: nftPrice });
          const txReceipt = await tx.wait();
          expect(txReceipt.events?.[1]?.args?.[0]).to.equal(
            accounts[0].address
          );
        });
      });

      describe("changeNFTPrice function", () => {
        it("reverts when a user asides the contract owner tries to change the nft price", async () => {
          const newMonsterNFTContractConnection = monsterNFT.connect(
            accounts[1]
          );
          await expect(
            newMonsterNFTContractConnection.changeNFTPrice(
              ethers.utils.parseEther("1")
            )
          ).to.be.revertedWith("Ownable: caller is not the owner");
        });
        it("updates the global nft price on successful update", async () => {
          const newNFTPrice = ethers.utils.parseEther("2");
          await monsterNFT.changeNFTPrice(newNFTPrice);
          const nftPrice = await monsterNFT.getNFTPrice();
          expect(nftPrice.toString()).to.be.equal(newNFTPrice.toString());
        });
      });

      describe("withdraw function", () => {
        it("reverts when a user asides the contract owner tries to withdraw", async () => {
          const newMonsterNFTContractConnection = monsterNFT.connect(
            accounts[1]
          );
          await expect(
            newMonsterNFTContractConnection.withdraw()
          ).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("withdraws the contract balance to the user's account", async () => {
          const nftPrice = ethers.utils.parseEther("20");
          await (await monsterNFT.changeNFTPrice(nftPrice)).wait(1);
          const contractOwnerIntialBalance = await ethers.provider.getBalance(
            accounts[0].address
          );

          for (let i = 1; i < accounts.length; i++) {
            const newMonsterNFTContractConnection = monsterNFT.connect(
              accounts[i]
            );
            await newMonsterNFTContractConnection.mint({ value: nftPrice });
          }
          const txResponse = await monsterNFT.withdraw();
          const txReceipt = await txResponse.wait(1);
          const contractOwnerFinalBalance = await ethers.provider.getBalance(
            accounts[0].address
          );
          const totalAmountExpectedInContract = nftPrice.mul(
            BigNumber.from(accounts.length - 1)
          );
          const totalGasFee = txReceipt.gasUsed.mul(
            txReceipt.effectiveGasPrice
          );

          expect(contractOwnerFinalBalance).to.equal(
            contractOwnerIntialBalance
              .add(totalAmountExpectedInContract)
              .sub(totalGasFee)
          );
        });
      });

      describe("tokenURI function", () => {
        it("throws an error when trying to access uri of an unminted token", async () => {
          await expect(monsterNFT.tokenURI("30")).to.revertedWith(
            "ERC721: invalid token ID"
          );
        });

        it("returns a token uri when a token is successfully minted", async () => {
          const txResponse = await monsterNFT.mint({ value: nftPrice });
          const txReceipt = await txResponse.wait();
          const tokenURI = await monsterNFT.tokenURI(
            txReceipt.events?.[1]?.args?.[1]
          );
          expect(tokenURI).to.equal(
            `ipfs://QmXztwDKYaBkyAqZj8LYby6aUfyAzSR4UkSnxpU4aqHnUU/1.json`
          );
        });
      });

      describe("getBaseURI and setBaseURI funtions", () => {
        it("checks the baseUri is set correctly", async () => {
          const FAKE_BASE_URL = "ipfs://some-fake-uri/";
          await monsterNFT.setBaseURI(FAKE_BASE_URL);
          const baseUri = await monsterNFT.getBaseURI();
          expect(baseUri).to.equal(FAKE_BASE_URL);
        });
      });
    });
