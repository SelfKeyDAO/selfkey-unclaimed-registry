# Selfkey Unclaimed Registry Contract

## Overview

## Development

All smart contracts are implemented in Solidity `^0.8.0`, using [Hardhat](https://hardhat.org/) as the Solidity development framework.

### Prerequisites

* [NodeJS](htps://nodejs.org), v16.1.0+
* [Hardhat](https://hardhat.org/), which is a comprehensive framework for Ethereum development.

### Initialization

    npm install

### Testing

    npx hardhat test

or with code coverage

    npx hardhat coverage


### Contract method interface

The following public functions are provided:

* `setSignerAddress(address _signer)` : set authorized signer
* `registerReward(address _account, uint256 _amount, string memory _scope, address _relying_party, address _signer)` : register unclaimed reward;
* `registerClaim(address _account, uint256 _amount, string memory _scope, address _relying_party)` : register a claim

* `earned(address _account) external view returns(uint)` : total amount of unclaimed rewards;
* `claimed(address _account) external view returns(uint)` : total amount of claimed rewards;
* `balanceOf(address _account) external view returns(uint)` :

* `earnedByScope(address _account, string memory _scope, address _relying_party) external view returns(uint)` :
* `claimedByScope(address _account, string memory _scope, address _relying_party) external view returns(uint)` :
* `balanceOfByScope(address _account, string memory _scope, address _relying_party) external view returns(uint)` :


### Contract addresses

```
Polygon Mumbai: 0xb270C5aE4c55Ee3EEC2607ee09570b67150EC59E
Polygon Mainnet:
Signer: 0x89145000ADBeCe9D1FFB26F645dcb0883bc5c3d9
```

### Deploying and upgrading contract

Deploy proxy and initial version of the contract
```
npx hardhat run scripts/deploy.js --network mumbai
```

### Verifying contract

```
npx hardhat verify --network mumbai <contract_address>
```

## Contributing

Please see the [contributing notes](CONTRIBUTING.md).


## Team
