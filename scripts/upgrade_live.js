const { ethers, upgrades } = require('hardhat');

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    // Polygon address
    const proxyAddress = "0x976913906CAC2F3b0B784E811f87F64528C56B90";

    const contractFactory = await hre.ethers.getContractFactory("SelfkeyUnclaimedRegistry");
    const contract = await upgrades.upgradeProxy(proxyAddress, contractFactory, { timeout: 500000 });
    await contract.deployed();

    console.log("Deployed contract address:", contract.address);

    // INFO: verify contract after deployment
    // npx hardhat verify --network polygon 0x976913906CAC2F3b0B784E811f87F64528C56B90
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
