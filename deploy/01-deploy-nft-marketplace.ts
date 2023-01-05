import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DEV_CHAINS } from "../utils/dev-chains";
import { verify } from "../utils/verify-contract";

const deployFunction: DeployFunction = async ({
  deployments,
  ethers,
  network,
}: HardhatRuntimeEnvironment) => {
  try {
    const { deploy, log } = deployments;
    const accounts = await ethers.getSigners();

    const constructorArguments: any = [];
    log(
      "************************* Deploying NFT Market Place **************************"
    );
    const nftMarketPlace = await deploy("NftMarketPlace", {
      from: accounts[0].address,
      args: constructorArguments,
      log: true,
      waitConfirmations: DEV_CHAINS.includes(network.name) ? 1 : 3,
      autoMine: true,
    });
    log(
      `********************* Deployed at ${nftMarketPlace.address} *******************`
    );

    if (!DEV_CHAINS.includes(network.name)) {
      await verify(nftMarketPlace.address, constructorArguments);
      log("*************** Contract Verified ******************");
    }
  } catch (error) {
    console.log(error);
  }
};

export default deployFunction;

deployFunction.tags = ["all", "nft-market-place"];
