const { ethers, upgrades } = require('hardhat');

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    // Mumbai address
    const proxyAddress = "0xb270C5aE4c55Ee3EEC2607ee09570b67150EC59E";

    const contractFactory = await hre.ethers.getContractFactory("SelfkeyUnclaimedRegistry");
    const contract = await upgrades.upgradeProxy(proxyAddress, contractFactory, { timeout: 500000 });
    await contract.deployed();

    console.log("Deployed contract address:", contract.address);

    // INFO: verify contract after deployment
    // npx hardhat verify --network mumbai 0xb270C5aE4c55Ee3EEC2607ee09570b67150EC59E
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
