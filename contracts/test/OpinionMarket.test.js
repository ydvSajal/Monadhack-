const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

const URI = "ipfs://meta";
const REWARD = ethers.parseEther("1");
const DURATION = 60n;

async function deploy() {
  const [employer, alice, bob, carol, arbiter] = await ethers.getSigners();
  const Market = await ethers.getContractFactory("OpinionMarket");
  const market = await Market.connect(employer).deploy(arbiter.address);
  await market.waitForDeployment();
  return { market, employer, alice, bob, carol, arbiter };
}

describe("OpinionMarket", () => {
  it("happy path: votes tally, labelers claim after deadline", async () => {
    const { market, alice, bob, carol } = await deploy();
    // budget for 3 votes
    await market.createTask(URI, 1, REWARD, DURATION, { value: REWARD * 3n });

    await market.connect(alice).vote(0, 0, 1);
    await market.connect(bob).vote(0, 0, 1);
    await market.connect(carol).vote(0, 0, 2);

    const tally = await market.getTally(0, 0);
    expect(tally[1]).to.equal(2);
    expect(tally[2]).to.equal(1);

    await expect(market.connect(alice).claim(0)).to.be.revertedWithCustomError(market, "VotingOpen");
    await time.increase(61);

    await expect(market.connect(alice).claim(0)).to.changeEtherBalance(alice, REWARD);
    await expect(market.connect(bob).claim(0)).to.changeEtherBalance(bob, REWARD);
    await expect(market.connect(alice).claim(0)).to.be.revertedWithCustomError(market, "NothingToClaim");
  });

  it("one vote per wallet per item; budget drain stops voting", async () => {
    const { market, alice, bob } = await deploy();
    await market.createTask(URI, 2, REWARD, DURATION, { value: REWARD }); // budget for 1 vote

    await market.connect(alice).vote(0, 0, 0);
    await expect(market.connect(alice).vote(0, 0, 1)).to.be.revertedWithCustomError(market, "AlreadyVoted");
    await expect(market.connect(bob).vote(0, 1, 0)).to.be.revertedWithCustomError(market, "VotingClosed"); // drained
  });

  it("dispute path: arbiter voids bad voter, employer reclaims, good voter still paid", async () => {
    const { market, employer, alice, bob, arbiter } = await deploy();
    await market.createTask(URI, 1, REWARD, DURATION, { value: REWARD * 2n });
    await market.connect(alice).vote(0, 0, 0);
    await market.connect(bob).vote(0, 0, 1);

    await market.connect(employer).freeze(0);
    await time.increase(61);
    await expect(market.connect(alice).claim(0)).to.be.revertedWithCustomError(market, "TaskFrozen");

    await market.connect(arbiter).resolve(0, [bob.address]);

    await expect(market.connect(bob).claim(0)).to.be.revertedWithCustomError(market, "NothingToClaim");
    await expect(market.connect(alice).claim(0)).to.changeEtherBalance(alice, REWARD);
    // budget was fully allocated (2 votes, 2 MON); employer reclaims only bob's voided share
    await expect(market.connect(employer).withdrawUnspent(0)).to.changeEtherBalance(employer, REWARD);
  });

  it("reclaim path: employer withdraws unspent after deadline, no double withdraw", async () => {
    const { market, employer, alice } = await deploy();
    await market.createTask(URI, 1, REWARD, DURATION, { value: REWARD * 5n });
    await market.connect(alice).vote(0, 0, 0);
    await time.increase(61);

    await expect(market.connect(employer).withdrawUnspent(0)).to.changeEtherBalance(employer, REWARD * 4n);
    await expect(market.connect(employer).withdrawUnspent(0)).to.be.revertedWithCustomError(market, "NothingToClaim");
    await expect(market.connect(alice).claim(0)).to.changeEtherBalance(alice, REWARD);
  });

  it("only arbiter resolves, only employer freezes", async () => {
    const { market, alice } = await deploy();
    await market.createTask(URI, 1, REWARD, DURATION, { value: REWARD });
    await expect(market.connect(alice).freeze(0)).to.be.revertedWithCustomError(market, "NotEmployer");
    await expect(market.connect(alice).resolve(0, [])).to.be.revertedWithCustomError(market, "NotArbiter");
  });
});
