import { ethers, network } from "hardhat";
import { MonsterNFT, NftMarketPlace } from "../typechain-types";
import { DEV_CHAINS } from "../utils/dev-chains";

(async () => {
  try {
    const monsterNFTContract: MonsterNFT = await ethers.getContract(
      "MonsterNFT"
    );
    const nftMarketPlace: NftMarketPlace = await ethers.getContract(
      "NftMarketPlace"
    );
    const nftPrice = await monsterNFTContract.getNFTPrice();
    console.log("Minting...");
    const txResponse = await monsterNFTContract.mint({ value: nftPrice });
    const txReceipt = await txResponse.wait(
      !DEV_CHAINS.includes(network.name) ? 3 : undefined
    );
    const tokenId = txReceipt.events?.[1]?.args?.[1];
    console.log("Mint Success...");

    console.log("Approving For Sale...");
    await (
      await monsterNFTContract.approve(nftMarketPlace.address, tokenId)
    ).wait(!DEV_CHAINS.includes(network.name) ? 3 : undefined);

    console.log("approved...");
    console.log("Listing NFT...");
    await (
      await nftMarketPlace.listItem(
        tokenId,
        monsterNFTContract.address,
        ethers.utils.parseEther("2")
      )
    ).wait(!DEV_CHAINS.includes(network.name) ? 3 : undefined);
    console.log("Listing Success");
  } catch (error) {
    console.log(error);
  }
})();
