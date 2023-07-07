// SPDX-License-Identifier: proprietary
pragma solidity 0.8.19;

struct RewardEntry {
    uint256 timestamp;
    uint amount;
    string scope;
    address relying_party;
    address signer;
}

struct ClaimedEntry {
    uint256 timestamp;
    uint amount;
    string scope;
    address relying_party;
}

interface ISelfkeyUnclaimedRegistry {
    event AuthorizedSignerChanged(address indexed _address);
    event RewardRegistered(address indexed _account, uint _amount, string _scope, address _relying_party);
    event ClaimRegistered(address indexed _account, uint _amount, string _scope, address _relying_party);

    function changeAuthorizedSigner(address _signer) external;
    function registerReward(address _account, uint256 _amount, string memory _scope, address _relying_party, address _signer) external;
    function registerClaim(address _account, uint256 _amount, string memory _scope, address _relying_party) external;

    function earned(address _account) external view returns(uint);
    function claimed(address _account) external view returns(uint);
    function balanceOf(address _account) external view returns(uint);

    function earnedByScope(address _account, string memory _scope, address _relying_party) external view returns(uint);
    function claimedByScope(address _account, string memory _scope, address _relying_party) external view returns(uint);
    function balanceOfByScope(address _account, string memory _scope, address _relying_party) external view returns(uint);
}
