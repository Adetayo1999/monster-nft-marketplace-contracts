import fs from "fs";
import path from "path";
import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { MonsterNFT, NftMarketPlace } from "../typechain-types";

const FRONTEND_PATH =
  "C:/Users/user/Desktop/stack/monster_nft_marketplace/client/my-new-dapp/constants/";

const deployFunction: DeployFunction = async ({
  network,
  ethers,
}: HardhatRuntimeEnvironment) => {
  try {
    const monsterNFTContract: NftMarketPlace = await ethers.getContract(
      "MonsterNFT"
    );
    const nftMarketPlace: MonsterNFT = await ethers.getContract(
      "NftMarketPlace"
    );

    fs.writeFileSync(
      FRONTEND_PATH + "market-place-abi.json",
      JSON.stringify(
        nftMarketPlace.interface.format(ethers.utils.FormatTypes.json)
      ),
      "utf-8"
    );
    fs.writeFileSync(
      path.join(FRONTEND_PATH, "monster-nft-abi.json"),
      JSON.stringify(
        nftMarketPlace.interface.format(ethers.utils.FormatTypes.json)
      ),
      "utf-8"
    );

    type ContentType = {
      [key: string]: {
        nftMarketPlaceAddress: string;
        monsterNFTAddress: string;
      };
    };

    let content: ContentType = {};

    if (fs.existsSync(path.join(FRONTEND_PATH, "mappings.json"))) {
      content =
        JSON.parse(
          fs.readFileSync(path.join(FRONTEND_PATH, "mappings.json"), "utf-8")
        ) || {};
    }

    content[network.config.chainId!] = {
      nftMarketPlaceAddress: nftMarketPlace.address,
      monsterNFTAddress: monsterNFTContract.address,
    };

    fs.writeFileSync(
      path.join(FRONTEND_PATH, "mappings.json"),
      JSON.stringify(content),
      "utf-8"
    );
  } catch (error) {
    console.log(error);
  }
};
export default deployFunction;
deployFunction.tags = ["all", "frontend"];
