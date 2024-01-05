// SPDX-License-Identifier: proprietary
pragma solidity 0.8.19;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./ISelfkeyUnclaimedRegistryV1.sol";

contract SelfkeyUnclaimedRegistryV1 is Initializable, OwnableUpgradeable, ISelfkeyUnclaimedRegistryV1 {

    address public authorizedSigner;
    mapping(address => RewardEntry[]) private _rewardEntries;
    mapping(address => ClaimedEntry[]) private _claimedEntries;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() initializer {}

    function initialize() public initializer {
        __Ownable_init();
    }

    function changeAuthorizedSigner(address _signer) public onlyOwner {
        require(_signer != address(0), "Invalid authorized signer");
        authorizedSigner = _signer;
        emit AuthorizedSignerChanged(_signer);
    }

    function registerReward(address _account, uint256 _amount, string memory _scope, address _relying_party, address _signer) external {
        require(authorizedSigner == msg.sender, "Not authorized to register");
        _rewardEntries[_account].push(RewardEntry(block.timestamp, _amount, _scope, _relying_party, _signer));
        emit RewardRegistered(_account, _amount, _scope, _relying_party);
    }

    function registerClaim(address _account, uint256 _amount, string memory _scope, address _relying_party) external {
        require(authorizedSigner == msg.sender, "Not authorized to register");
        require(balanceOf(_account) >= _amount, "Not enough balance");
        _claimedEntries[_account].push(ClaimedEntry(block.timestamp, _amount, _scope, _relying_party));
        emit ClaimRegistered(_account, _amount, _scope, _relying_party);
    }

    function earned(address _account) public view returns(uint) {
        uint _balance = 0;
        RewardEntry[] memory _accountRecords = _rewardEntries[_account];
        for(uint i=0; i<_accountRecords.length; i++) {
            RewardEntry memory _record = _accountRecords[i];
            if (_record.timestamp <= block.timestamp) {
                _balance = _balance + _record.amount;
            }
        }
        return _balance;
    }

    function claimed(address _account) public view returns(uint) {
        uint _balance = 0;
        ClaimedEntry[] memory _accountRecords = _claimedEntries[_account];
        for(uint i=0; i<_accountRecords.length; i++) {
            ClaimedEntry memory _record = _accountRecords[i];
            if (_record.timestamp <= block.timestamp) {
                _balance = _balance + _record.amount;
            }
        }
        return _balance;
    }

    function balanceOf(address _account) public view returns(uint) {
        return earned(_account) - claimed(_account);
    }

    function earnedByScope(address _account, string memory _scope, address _relying_party) public view returns(uint) {
        uint _balance = 0;
        RewardEntry[] memory _accountRecords = _rewardEntries[_account];
        for(uint i=0; i<_accountRecords.length; i++) {
            RewardEntry memory _record = _accountRecords[i];
            if (_record.timestamp <= block.timestamp) {
                if (keccak256(abi.encodePacked(_scope)) == keccak256(abi.encodePacked(_record.scope)) && _relying_party == _record.relying_party) {
                    _balance = _balance + _record.amount;
                }
            }
        }
        return _balance;
    }

    function claimedByScope(address _account, string memory _scope, address _relying_party) public view returns(uint) {
        uint _balance = 0;
        ClaimedEntry[] memory _accountRecords = _claimedEntries[_account];
        for(uint i=0; i<_accountRecords.length; i++) {
            ClaimedEntry memory _record = _accountRecords[i];
            if (_record.timestamp <= block.timestamp) {
                if (keccak256(abi.encodePacked(_scope)) == keccak256(abi.encodePacked(_record.scope)) && _relying_party == _record.relying_party) {
                    _balance = _balance + _record.amount;
                }
            }
        }
        return _balance;
    }

    function balanceOfByScope(address _account, string memory _scope, address _relying_party) public view returns(uint) {
        return earnedByScope(_account, _scope, _relying_party) - claimedByScope(_account, _scope, _relying_party);
    }
}
