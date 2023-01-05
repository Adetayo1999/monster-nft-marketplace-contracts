import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DEV_CHAINS } from "../utils/dev-chains";
import { verify } from "../utils/verify-contract";
import { DeployFunction } from "hardhat-deploy/dist/types";

const deployMonsterNFT: DeployFunction = async ({
  deployments,
  network,
  ethers,
}: HardhatRuntimeEnvironment) => {
  try {
    const { log, deploy } = deployments;
    const [deployer] = await ethers.getSigners();
    log(
      `**************************** Deploying Monster NFT On ${network.name} *************************`
    );

    const constructorArguments = [
      "ipfs://QmXztwDKYaBkyAqZj8LYby6aUfyAzSR4UkSnxpU4aqHnUU/",
    ];

    const monsterNFT = await deploy("MonsterNFT", {
      from: deployer.address,
      args: constructorArguments,
      log: true,
      waitConfirmations: DEV_CHAINS.includes(network.name) ? 1 : 4,
    });

    if (!DEV_CHAINS.includes(network.name)) {
      log(
        `******************** Verifying MonsterNFT ${monsterNFT.address} ********************`
      );
      await verify(monsterNFT.address, constructorArguments);
      log(
        "*********************** Verification Success ************************"
      );
    }
  } catch (error) {
    console.log(error);
  }
};

export default deployMonsterNFT;
deployMonsterNFT.tags = ["all", "monsterNFT"];
