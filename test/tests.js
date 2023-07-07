
const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("Unclaimed Registry Tests", function () {
    let contract;

    let owner;
    let addr1;
    let addr2;
    let receiver;
    let signer;
    let addrs;

    beforeEach(async function () {
        [owner, addr1, addr2, receiver, signer, rp, ...addrs] = await ethers.getSigners();

        let contractFactory = await ethers.getContractFactory("SelfkeyUnclaimedRegistry");
        contract = await upgrades.deployProxy(contractFactory, []);
        await contract.deployed();

        await expect(contract.connect(owner).changeAuthorizedSigner(signer.address, { from: owner.address }))
                .to.emit(contract, 'AuthorizedSignerChanged').withArgs(signer.address);
    });

    describe("Deployment", function() {
        it("Deployed correctly and authorized signer was assigned", async function() {
            expect(await contract.authorizedSigner()).to.equal(signer.address);
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
                .to.be.revertedWith('Not authorized to register');
        });
    });


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
                .to.be.revertedWith('Not authorized to register')


        });
    });

});

