const { ethers, network } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  const arbiter = process.env.ARBITER || deployer.address;

  console.log(`Network: ${network.name}`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Arbiter:  ${arbiter}`);

  const Market = await ethers.getContractFactory("OpinionMarket");
  const market = await Market.deploy(arbiter);
  await market.waitForDeployment();

  const addr = await market.getAddress();
  console.log(`\nOpinionMarket deployed: ${addr}`);
  console.log(`\nVerify:\n  npx hardhat verify --network ${network.name} ${addr} ${arbiter}`);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
