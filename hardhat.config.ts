import "dotenv/config";
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-etherscan";
import "hardhat-deploy";
import "hardhat-gas-reporter";

const GOERLI_RPC_URL = process.env.GOERLI_RPC_URL;
const GOERLI_PRIVATE_KEY = process.env.GOERLI_PRIVATE_KEY;
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;

const config: HardhatUserConfig = {
  solidity: "0.8.17",
  networks: {
    goerli: {
      url: GOERLI_RPC_URL,
      accounts: [GOERLI_PRIVATE_KEY!],
    },
  },
  etherscan: {
    apiKey: {
      goerli: ETHERSCAN_API_KEY!,
    },
  },
  gasReporter: {
    noColors: true,
    enabled: true,
    outputFile: "gas-reporter.txt",
  },
};

export default config;
