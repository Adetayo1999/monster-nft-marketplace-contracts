import { network, deployments, ethers } from "hardhat";
import { DEV_CHAINS } from "../utils/dev-chains";
import { MonsterNFT, NftMarketPlace } from "../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";

!DEV_CHAINS.includes(network.name)
  ? describe.skip
  : describe("Tests On The NFT Market Place", () => {
      let nftMarketPlace: NftMarketPlace,
        accounts: SignerWithAddress[],
        monsterNFT: MonsterNFT;

      beforeEach(async () => {
        await deployments.fixture(["all"]);
        nftMarketPlace = await ethers.getContract("NftMarketPlace");
        monsterNFT = await ethers.getContract("MonsterNFT");
        accounts = await ethers.getSigners();
        const nftPrice = await monsterNFT.getNFTPrice();
        await monsterNFT.mint({ value: nftPrice });
        await monsterNFT.approve(nftMarketPlace.address, 1);
      });

      describe("listItem function", () => {
        it("revert with custom error if user is not token owner", async () => {
          const newNftMarketPlace = nftMarketPlace.connect(accounts[1]);
          await expect(
            newNftMarketPlace.listItem(
              1,
              monsterNFT.address,
              ethers.utils.parseEther("2")
            )
          ).to.be.revertedWithCustomError(
            newNftMarketPlace,
            "NftMarketPlace__NotNftOwner"
          );
        });
        it("revers with custom error if user tries to re-list an NFT", async () => {
          await nftMarketPlace.listItem(
            1,
            monsterNFT.address,
            ethers.utils.parseEther("2")
          );
          await expect(
            nftMarketPlace.listItem(
              1,
              monsterNFT.address,
              ethers.utils.parseEther("2")
            )
          ).to.be.revertedWithCustomError(
            nftMarketPlace,
            "NftMarketPlace__NftListed"
          );
        });
        it("reverts with custom error when an invalid price is sent", async () => {
          await expect(
            nftMarketPlace.listItem(
              1,
              monsterNFT.address,
              ethers.utils.parseEther("0")
            )
          ).to.be.revertedWithCustomError(
            nftMarketPlace,
            "NftMarketPlace__InvalidPriceSent"
          );
        });
        it("stores the listing in a data structure", async () => {
          const txResponse = await nftMarketPlace.listItem(
            1,
            monsterNFT.address,
            ethers.utils.parseEther("2")
          );
          const txReceipt = await txResponse.wait();
          const data = txReceipt.events?.[0]?.args;
          const listing = await nftMarketPlace.getListing(
            monsterNFT.address,
            data?.[1]
          );
          expect(listing?.[0]?.toString()).to.equal("1");
          expect(listing?.[1]?.toString()).to.equal(
            ethers.utils.parseEther("2").toString()
          );
          expect(listing?.[3]).to.equal(accounts[0].address);
        });
        it("reverts with custom error if nft approval is not given to market place contract", async () => {
          const nftPrice = await monsterNFT.getNFTPrice();
          await monsterNFT.mint({ value: nftPrice });
          await expect(
            nftMarketPlace.listItem(
              "2",
              monsterNFT.address,
              ethers.utils.parseEther("40")
            )
          ).to.be.revertedWithCustomError(
            nftMarketPlace,
            "NftMarketPlace__NFTNotApprovedForSale"
          );
        });
      });

      describe("cancelListing function", () => {
        it("reverts if user is not token owner", async () => {
          const newNftMarketPlace = nftMarketPlace.connect(accounts[1]);
          await expect(
            newNftMarketPlace.cancelListing(1, monsterNFT.address)
          ).to.be.revertedWithCustomError(
            newNftMarketPlace,
            "NftMarketPlace__NotNftOwner"
          );
        });
        it("reverts if the NFT is not listed", async () => {
          await expect(
            nftMarketPlace.cancelListing(1, monsterNFT.address)
          ).to.be.revertedWithCustomError(
            nftMarketPlace,
            "NftMarketPlace__NftNotListed"
          );
        });

        it("deletes the listing from the data structure", async () => {
          await nftMarketPlace.listItem(
            "1",
            monsterNFT.address,
            ethers.utils.parseEther("2")
          );
          const txResponse = await nftMarketPlace.cancelListing(
            1,
            monsterNFT.address
          );
          const txReceipt = await txResponse.wait();
          const data = txReceipt.events?.[0]?.args;
          const listing = await nftMarketPlace.getListing(
            monsterNFT.address,
            data?.[1]
          );
          expect(listing[0]).to.equal("0");
          expect(listing[1]).to.equal("0");
          expect(listing[2]).to.equal(
            "0x0000000000000000000000000000000000000000"
          );
          expect(listing[3]).to.equal(
            "0x0000000000000000000000000000000000000000"
          );
        });
      });

      describe("updateListing function", () => {
        it("revert with custom error if user is not token owner", async () => {
          const newNftMarketPlace = nftMarketPlace.connect(accounts[1]);
          await expect(
            newNftMarketPlace.updateListing(
              ethers.utils.parseEther("2"),
              1,
              monsterNFT.address
            )
          ).to.be.revertedWithCustomError(
            newNftMarketPlace,
            "NftMarketPlace__NotNftOwner"
          );
        });
        it("reverts with custom error when an nft is not listed", async () => {
          await expect(
            nftMarketPlace.updateListing(
              ethers.utils.parseEther("2"),
              1,
              monsterNFT.address
            )
          ).to.be.revertedWithCustomError(
            nftMarketPlace,
            "NftMarketPlace__NftNotListed"
          );
        });
        it("reverts with custom error when an invalid price is sent", async () => {
          await nftMarketPlace.listItem(
            1,
            monsterNFT.address,
            ethers.utils.parseEther("3")
          );
          await expect(
            nftMarketPlace.updateListing(
              ethers.utils.parseEther("0"),
              1,
              monsterNFT.address
            )
          ).to.be.revertedWithCustomError(
            nftMarketPlace,
            "NftMarketPlace__InvalidPriceSent"
          );
        });
        it("stores the listing in a data structure", async () => {
          await nftMarketPlace.listItem(
            1,
            monsterNFT.address,
            ethers.utils.parseEther("2")
          );

          const txResponse = await nftMarketPlace.updateListing(
            ethers.utils.parseEther("10"),
            1,
            monsterNFT.address
          );

          const txReceipt = await txResponse.wait();
          const data = txReceipt.events?.[0]?.args;
          const listing = await nftMarketPlace.getListing(
            monsterNFT.address,
            data?.[1]
          );
          expect(listing?.[0]?.toString()).to.equal("1");
          expect(listing?.[1]?.toString()).to.equal(
            ethers.utils.parseEther("10").toString()
          );
          expect(listing?.[3]).to.equal(accounts[0].address);
        });
      });

      describe("buyItem function", async () => {
        it("reverts if the NFT is not listed", async () => {
          await expect(
            nftMarketPlace.buyItem("1", monsterNFT.address)
          ).to.be.revertedWithCustomError(
            nftMarketPlace,
            "NftMarketPlace__NftNotListed"
          );
        });

        it("reverts if an invalid price is sent", async () => {
          await nftMarketPlace.listItem(
            1,
            monsterNFT.address,
            ethers.utils.parseEther("2")
          );

          await expect(
            nftMarketPlace.buyItem("1", monsterNFT.address, {
              value: ethers.utils.parseEther("1"),
            })
          ).to.be.revertedWithCustomError(
            nftMarketPlace,
            "NftMarketPlace__NotEnoughETH"
          );
        });

        it("adds to the lister's proceeds on success", async () => {
          const listingPrice = ethers.utils.parseEther("2");

          await nftMarketPlace.listItem(1, monsterNFT.address, listingPrice);

          const listerStartingBalance = await nftMarketPlace.getProceed();

          await nftMarketPlace
            .connect(accounts[1])
            .buyItem("1", monsterNFT.address, {
              value: listingPrice,
            });
          const listerEndingBalance = await nftMarketPlace.getProceed();
          expect(listerEndingBalance.toString()).to.equal(
            listerStartingBalance.add(listingPrice).toString()
          );
        });

        it("removes the listing from listings data structure on success", async () => {
          const listingPrice = ethers.utils.parseEther("2");

          await nftMarketPlace.listItem(1, monsterNFT.address, listingPrice);

          const txResponse = await nftMarketPlace
            .connect(accounts[1])
            .buyItem("1", monsterNFT.address, {
              value: listingPrice,
            });
          const txReceipt = await txResponse.wait();
          const tokenId = txReceipt.events?.[1]?.args?.[2];
          const listing = await nftMarketPlace.getListing(
            monsterNFT.address,
            tokenId
          );
          expect(listing[0]).to.equal("0");
          expect(listing[1]).to.equal("0");
          expect(listing[2]).to.equal(
            "0x0000000000000000000000000000000000000000"
          );
          expect(listing[3]).to.equal(
            "0x0000000000000000000000000000000000000000"
          );
        });

        it("transfers ownership of NFT from lister to buyer", async () => {
          const initialOwner = await monsterNFT.ownerOf("1");
          expect(initialOwner).to.equal(accounts[0].address);
          const listingPrice = ethers.utils.parseEther("2");
          await nftMarketPlace.listItem(1, monsterNFT.address, listingPrice);
          await (
            await nftMarketPlace
              .connect(accounts[1])
              .buyItem("1", monsterNFT.address, {
                value: listingPrice,
              })
          ).wait();
          const finalOwner = await monsterNFT.ownerOf("1");
          expect(finalOwner).to.equal(accounts[1].address);
        });
      });

      describe("withdrawProceeds", () => {
        it("reverts when the proceeds is insufficient", async () => {
          await expect(
            nftMarketPlace.withdrawProceeds()
          ).to.be.revertedWithCustomError(
            nftMarketPlace,
            "NftMarketPlace__NotEnoughProceeds"
          );
        });

        it("transfers the proceed to the owner on success", async () => {
          const listingPrice = ethers.utils.parseEther("2");
          await nftMarketPlace.listItem(1, monsterNFT.address, listingPrice);
          const initialProceed = await nftMarketPlace.getProceed();
          await (
            await nftMarketPlace
              .connect(accounts[1])
              .buyItem("1", monsterNFT.address, {
                value: listingPrice,
              })
          ).wait();
          const finalProceed = await nftMarketPlace.getProceed();

          expect(initialProceed.toString()).to.equal("0");
          expect(finalProceed.toString()).to.equal(listingPrice.toString());

          const initialBalance = await ethers.provider.getBalance(
            accounts[0].address
          );
          const txReceipt = await (
            await nftMarketPlace.withdrawProceeds()
          ).wait();
          const finalBalance = await ethers.provider.getBalance(
            accounts[0].address
          );
          const gasFee = txReceipt.gasUsed.mul(txReceipt.effectiveGasPrice);
          expect(finalBalance.toString()).to.equal(
            initialBalance.add(listingPrice).sub(gasFee)
          );
        });
      });
    });
