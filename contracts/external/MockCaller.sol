// SPDX-License-Identifier: proprietary
pragma solidity 0.8.19;

import "../ISelfkeyUnclaimedRegistry.sol";

contract MockCaller {

    constructor() { }

    function mockRegisterReward(address _contract, address _account, uint256 _amount, string memory _scope, address _relying_party, address _signer) external {
        ISelfkeyUnclaimedRegistry(_contract).registerReward(_account, _amount, _scope, _relying_party, _signer);
    }
}
