
const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Unclaimed Registry Tests", function () {
    let contract;
    let authContract;
    let mintableContract;

    let owner;
    let addr1;
    let addr2;
    let receiver;
    let signer;
    let addrs;

    beforeEach(async function () {
        [owner, addr1, addr2, receiver, signer, rp, ...addrs] = await ethers.getSigners();

        let authorizationContractFactory = await ethers.getContractFactory("SelfkeyIdAuthorization");
        authContract = await authorizationContractFactory.deploy(signer.address);

        let mintableContractFactory = await ethers.getContractFactory("SelfkeyMintableRegistry");
        mintableContract = await upgrades.deployProxy(mintableContractFactory, []);
        await mintableContract.deployed();

        let contractFactory = await ethers.getContractFactory("SelfkeyUnclaimedRegistry");
        contract = await upgrades.deployProxy(contractFactory, []);
        await contract.deployed();

        await contract.connect(owner).setAuthorizationContractAddress(authContract.address, { from: owner.address });

        await contract.connect(owner).setMintableRegistryContractAddress(mintableContract.address, { from: owner.address });

        await mintableContract.connect(owner).addAuthorizedCaller(contract.address, { from: owner.address });

        await expect(contract.connect(owner).changeAuthorizedSigner(signer.address, { from: owner.address }))
                .to.emit(contract, 'AuthorizedSignerChanged').withArgs(signer.address);
    });

    describe("Deployment", function() {
        it("Deployed correctly and authorized signer was assigned", async function() {
            expect(await contract.authorizedSigner()).to.equal(signer.address);
        });
    });

    describe("Upgradeability", function() {
        it("Should upgrade correctly", async function() {
            [owner, addr1, addr2, receiver, signer, ...addrs] = await ethers.getSigners();

            let factory = await ethers.getContractFactory("SelfkeyUnclaimedRegistryV1");
            contract = await upgrades.deployProxy(factory, []);
            await contract.deployed();

            let factory2 = await ethers.getContractFactory("SelfkeyUnclaimedRegistry");
            const upgradedContract = await upgrades.upgradeProxy(contract.address, factory2);

            await expect(upgradedContract.connect(owner).addAuthorizedCaller(signer.address, { from: owner.address }))
                .to.emit(upgradedContract, 'AuthorizedCallerAdded').withArgs(signer.address);
        });
    });

    describe("Governance", function() {
        it("Owner can change signer", async function() {
            await contract.changeAuthorizedSigner(addr1.address);
            expect(await contract.authorizedSigner()).to.equal(addr1.address);
        });

        it("Random wallet cannot change signer", async function() {
            await expect(contract.connect(addr2).changeAuthorizedSigner(addr1.address, { from: addr2.address }))
                .to.be.revertedWith('Ownable: caller is not the owner');
        });
    });

    describe("Register a reward", function() {
        it("Authorized signer can register a reward", async function() {
            const _account = addr2.address;
            const _amount = 100;
            const _scope = 'invite';
            const _relying_party = rp.address;
            const _signer = addr1.address;

            expect(await contract.connect(signer).registerReward(_account, _amount, _scope, _relying_party, _signer))
                .to.emit('RewardRegistered').withArgs(_account, _amount, _scope, _relying_party);
        });

        it("Balance is updated after registration", async function() {
            const _account = addr2.address;
            const _amount = 100;
            const _scope = 'invite';
            const _relying_party = rp.address;
            const _signer = addr1.address;

            expect(await contract.connect(signer).registerReward(_account, _amount, _scope, _relying_party, _signer))
                .to.emit('RewardRegistered').withArgs(_account, _amount, _scope, _relying_party);

            expect(await contract.balanceOf(_account)).to.equal(_amount);
        });

        it("Scoped balance is updated after registration", async function() {
            const _account = addr2.address;
            const _amount = 100;
            const _scope = 'invite';
            const _relying_party = rp.address;
            const _signer = addr1.address;

            expect(await contract.connect(signer).registerReward(_account, _amount, _scope, _relying_party, _signer))
                .to.emit('RewardRegistered').withArgs(_account, _amount, _scope, _relying_party);

            expect(await contract.balanceOf(_account)).to.equal(_amount);

            expect (await contract.balanceOfByScope(_account, _scope, _relying_party)).to.equal(_amount);
        });

        it("Earned is updated after registration", async function() {
            const _account = addr2.address;
            const _amount = 200;
            const _scope = 'invite';
            const _relying_party = rp.address;
            const _signer = addr1.address;

            expect(await contract.connect(signer).registerReward(_account, _amount, _scope, _relying_party, _signer))
                .to.emit('RewardRegistered').withArgs(_account, _amount, _scope, _relying_party);

            expect(await contract.earned(_account)).to.equal(_amount);
        });

        it("Earned by scope is updated after registration", async function() {
            const _account = addr2.address;
            const _amount = 200;
            const _scope = 'invite';
            const _relying_party = rp.address;
            const _signer = addr1.address;

            expect(await contract.connect(signer).registerReward(_account, _amount, _scope, _relying_party, _signer))
                .to.emit('RewardRegistered').withArgs(_account, _amount, _scope, _relying_party);

            expect(await contract.earnedByScope(_account, _scope, _relying_party)).to.equal(_amount);
        });

        it("Non-authorized signer cannot register a reward", async function() {
            const _account = addr2.address;
            const _amount = 100;
            const _scope = 'invite';
            const _relying_party = rp.address;
            const _signer = addr1.address;

            await expect(contract.connect(addr1).registerReward(_account, _amount, _scope, _relying_party, _signer))
                .to.be.revertedWith('Not an authorized caller or signer');
        });
    });


    describe("Register Reward via authorized Contract", function() {
        it("Authorized caller contract can register a reward", async function() {
            const _account = addr2.address;
            const _amount = 100;
            const _scope = 'invite';
            const _relying_party = rp.address;
            const _signer = addr1.address;

            const mockFactory = await ethers.getContractFactory("MockCaller");
            const mockContract = await mockFactory.deploy();

            expect(await contract.connect(owner).addAuthorizedCaller(mockContract.address, { from: owner.address }))
                .to.emit(contract, 'AuthorizedCallerAdded').withArgs(mockContract.address);

            await mockContract.connect(owner).mockRegisterReward(contract.address, _account, _amount, _scope, _relying_party, _signer);

            expect(await contract.balanceOf(_account)).to.equal(_amount);
        });

        it("Non-Authorized caller contract cannot register a reward", async function() {
            const _account = addr2.address;
            const _amount = 100;
            const _scope = 'invite';
            const _relying_party = rp.address;
            const _signer = addr1.address;

            const mockFactory = await ethers.getContractFactory("MockCaller");
            const mockContract = await mockFactory.deploy();

            await expect(mockContract.connect(owner).mockRegisterReward(contract.address, _account, _amount, _scope, _relying_party, _signer))
                .to.be.revertedWith('Not an authorized caller or signer');

            expect(await contract.balanceOf(_account)).to.equal(0);
        });
    })


    describe("Register claim", function() {
        it("Authorized signer can register a claim", async function() {
            const _account = addr2.address;
            const _amount = 100;
            const _scope = 'invite';
            const _relying_party = rp.address;
            const _signer = addr1.address;

            expect(await contract.connect(signer).registerReward(_account, _amount, _scope, _relying_party, _signer))
                .to.emit('RewardRegistered').withArgs(_account, _amount, _scope, _relying_party);

            expect(await contract.connect(signer).registerClaim(_account, _amount, _scope, _relying_party))
                .to.emit('ClaimRegistered').withArgs(_account, _amount, _scope, _relying_party);
        });

        it("Cannot claim more than earned", async function() {
            const _account = addr2.address;
            const _amount = 100;
            const _scope = 'invite';
            const _relying_party = rp.address;
            const _signer = addr1.address;

            expect(await contract.connect(signer).registerReward(_account, _amount, _scope, _relying_party, _signer))
                .to.emit('RewardRegistered').withArgs(_account, _amount, _scope, _relying_party);

            const _claim_amount = 120;
            await expect(contract.connect(signer).registerClaim(_account, _claim_amount, _scope, _relying_party))
                .to.be.revertedWith('Not enough balance');
        });

        it("Balance is updated after claiming", async function() {
            const _account = addr2.address;
            const _amount = 100;
            const _scope = 'invite';
            const _relying_party = rp.address;
            const _signer = addr1.address;

            expect(await contract.connect(signer).registerReward(_account, _amount, _scope, _relying_party, _signer))
                .to.emit('RewardRegistered').withArgs(_account, _amount, _scope, _relying_party);

            const _claim_amount = 50;
            expect(await contract.connect(signer).registerClaim(_account, _claim_amount, _scope, _relying_party))
                .to.emit('ClaimRegistered').withArgs(_account, _claim_amount, _scope, _relying_party);

            expect(await contract.balanceOf(_account)).to.equal(_amount - _claim_amount);
        });

        it("Scoped Balance is updated after claiming", async function() {
            const _account = addr2.address;
            const _amount = 100;
            const _scope = 'invite';
            const _relying_party = rp.address;
            const _signer = addr1.address;

            expect(await contract.connect(signer).registerReward(_account, _amount, _scope, _relying_party, _signer))
                .to.emit('RewardRegistered').withArgs(_account, _amount, _scope, _relying_party);

            const _claim_amount = 50;
            expect(await contract.connect(signer).registerClaim(_account, _claim_amount, _scope, _relying_party))
                .to.emit('ClaimRegistered').withArgs(_account, _claim_amount, _scope, _relying_party);

            expect(await contract.balanceOf(_account)).to.equal(_amount - _claim_amount);
            expect(await contract.balanceOfByScope(_account, _scope, _relying_party)).to.equal(_amount - _claim_amount);
        });

        it("Claim balance is updated after claiming", async function() {
            const _account = addr2.address;
            const _amount = 100;
            const _scope = 'invite';
            const _relying_party = rp.address;
            const _signer = addr1.address;

            expect(await contract.connect(signer).registerReward(_account, _amount, _scope, _relying_party, _signer))
                .to.emit('RewardRegistered').withArgs(_account, _amount, _scope, _relying_party);

            const _claim_amount = 50;
            expect(await contract.connect(signer).registerClaim(_account, _claim_amount, _scope, _relying_party))
                .to.emit('ClaimRegistered').withArgs(_account, _claim_amount, _scope, _relying_party);

            expect(await contract.claimed(_account)).to.equal(_claim_amount);
        });

        it("Scoped claim balance is updated after claiming", async function() {
            const _account = addr2.address;
            const _amount = 100;
            const _scope = 'invite';
            const _relying_party = rp.address;
            const _signer = addr1.address;

            expect(await contract.connect(signer).registerReward(_account, _amount, _scope, _relying_party, _signer))
                .to.emit('RewardRegistered').withArgs(_account, _amount, _scope, _relying_party);

            const _claim_amount = 50;
            expect(await contract.connect(signer).registerClaim(_account, _claim_amount, _scope, _relying_party))
                .to.emit('ClaimRegistered').withArgs(_account, _claim_amount, _scope, _relying_party);

            expect(await contract.claimed(_account)).to.equal(_claim_amount);
            expect(await contract.claimedByScope(_account, _scope, _relying_party)).to.equal(_claim_amount);
        });



        it("Non-authorized signer cannot register a mint", async function() {
            const _account = addr2.address;
            const _amount = 100;
            const _scope = 'invite';
            const _relying_party = rp.address;
            const _signer = addr1.address;

            expect(await contract.connect(signer).registerReward(_account, _amount, _scope, _relying_party, _signer))
                .to.emit('RewardRegistered').withArgs(_account, _amount, _scope, _relying_party);

            const _claim_amount = 50;
            await expect(contract.connect(addr1).registerClaim(_account, _claim_amount, _scope, _relying_party))
                .to.be.revertedWith('Not an authorized caller or signer')


        });
    });

    describe("Self Register claim", function() {
        it("Authorized user can register a claim", async function() {

            const _from = contract.address;
            const _to = addr2.address;
            const _amount = 100;
            const _scope = 'selfkey.self.claim';
            const _relying_party = rp.address;
            const _signer = addr1.address;
            const _timestamp = await time.latest();
            const _param = ethers.utils.hexZeroPad(_relying_party, 32);

            expect(await contract.connect(signer).registerReward(_to, _amount, _scope, _relying_party, _signer))
                .to.emit('RewardRegistered').withArgs(_to, _amount, _scope, _relying_party);

            let hash = await authContract.getMessageHash(_from, _to, _amount, _scope, _param, _timestamp);
            let signature = await signer.signMessage(ethers.utils.arrayify(hash));
            expect(await authContract.verify(_from, _to, _amount, _scope, _param, _timestamp, signer.address, signature)).to.equal(true);

            await expect(contract.connect(addr2).selfClaim(_to, _amount, _param, _timestamp, signer.address, signature, { from: addr2.address }))
                .to.emit(contract, 'ClaimRegistered')
                .withArgs(addr2.address, 100, 'selfkey.self.claim', rp.address);

            // Check if amount is in mintable registry
            expect(await mintableContract.balanceOf(_to)).to.equal(_amount);

            // Check if amount is deducted from unclaimed registry
            expect(await contract.balanceOf(_to)).to.equal(0);
        });

        it("Non-authorized user can not register a claim", async function() {

            const _from = contract.address;
            const _to = addr2.address;
            const _amount = 100;
            const _scope = 'selfkey.self.claim';
            const _relying_party = rp.address;
            const _signer = addr1.address;
            const _timestamp = await time.latest();
            const _param = ethers.utils.hexZeroPad(_relying_party, 32);

            expect(await contract.connect(signer).registerReward(_to, _amount, _scope, _relying_party, _signer))
                .to.emit('RewardRegistered').withArgs(_to, _amount, _scope, _relying_party);

            let hash = await authContract.getMessageHash(_from, _to, _amount, _scope, _param, _timestamp);
            let signature = await addr1.signMessage(ethers.utils.arrayify(hash));
            expect(await authContract.verify(_from, _to, _amount, _scope, _param, _timestamp, addr1.address, signature)).to.equal(true);

            await expect(contract.connect(addr2).selfClaim(_to, _amount, _param, _timestamp, addr1.address, signature, { from: addr2.address }))
                .to.be.revertedWith('Invalid signer');
        });

    });
});

