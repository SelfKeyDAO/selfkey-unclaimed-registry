const { ethers, upgrades } = require('hardhat');

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    // Polygon address
    const proxyAddress = "0x976913906CAC2F3b0B784E811f87F64528C56B90";

    const contractFactory = await hre.ethers.getContractFactory("SelfkeyUnclaimedRegistryV1");
    console.log('Implementation address: ' + await upgrades.erc1967.getImplementationAddress(proxyAddress));
    console.log('Admin address: ' + await upgrades.erc1967.getAdminAddress(proxyAddress));

    const contract = await upgrades.forceImport(proxyAddress, contractFactory, { kind: 'transparent' });

    console.log("Done", contract);

    // INFO: verify contract after deployment
    // npx hardhat verify --network polygon 0x976913906CAC2F3b0B784E811f87F64528C56B90
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
