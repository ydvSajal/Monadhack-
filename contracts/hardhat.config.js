require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "";
const accounts = PRIVATE_KEY ? [PRIVATE_KEY] : [];

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 },
      // full metadata hash required for Sourcify match on Monad
      metadata: { bytecodeHash: "ipfs" },
    },
  },
  networks: {
    monadTestnet: { url: "https://testnet-rpc.monad.xyz/", chainId: 10143, accounts },
    monadMainnet: { url: "https://rpc.monad.xyz", chainId: 143, accounts },
  },
  sourcify: {
    enabled: true,
    apiUrl: "https://sourcify-api-monad.blockvision.org/",
    browserUrl: "https://testnet.monadexplorer.com",
  },
  etherscan: { enabled: false },
};
