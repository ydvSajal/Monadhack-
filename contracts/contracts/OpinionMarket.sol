// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title OpinionMarket - on-chain escrow marketplace for crowd opinions / data labeling.
/// Employers escrow native MON and post items to judge (thumbnail A/B/C, data labels).
/// Labelers vote per item, earn a fixed reward per vote, and claim after the deadline.
/// Optimistic payout: silence after the deadline means labelers get paid. Employer disputes
/// fraud by freezing the task; a fixed arbiter voids bad voters and returns their share.
contract OpinionMarket {
    uint8 public constant MAX_CHOICES = 4;

    struct Task {
        address employer;
        string metadataURI; // JSON: { title, kind, items: [{ prompt|imageUrls, choices: [labels] }] }
        uint64 itemCount;
        uint128 rewardPerVote;
        uint128 escrow; // unallocated funds still held for this task
        uint64 deadline; // voting closes and claiming opens at this timestamp
        bool frozen;
        bool resolved;
    }

    address public immutable arbiter;
    Task[] public tasks;

    // taskId => itemId => choice => vote count
    mapping(uint256 => mapping(uint256 => mapping(uint8 => uint32))) public tally;
    // taskId => itemId => voter => voted?
    mapping(uint256 => mapping(uint256 => mapping(address => bool))) public voted;
    // taskId => voter => claimable amount
    mapping(uint256 => mapping(address => uint256)) public earnings;
    // taskId => voter => voided by arbiter?
    mapping(uint256 => mapping(address => bool)) public voided;
    // taskId => voter => claimed?
    mapping(uint256 => mapping(address => bool)) public claimed;

    uint256 private _lock = 1;

    event TaskCreated(
        uint256 indexed taskId,
        address indexed employer,
        uint256 itemCount,
        uint256 rewardPerVote,
        uint64 deadline,
        string metadataURI
    );
    event Voted(uint256 indexed taskId, uint256 indexed itemId, address indexed voter, uint8 choice);
    event Frozen(uint256 indexed taskId);
    event Resolved(uint256 indexed taskId, address[] voidedVoters);
    event Claimed(uint256 indexed taskId, address indexed voter, uint256 amount);
    event Withdrawn(uint256 indexed taskId, address indexed employer, uint256 amount);

    error NotEmployer();
    error NotArbiter();
    error BadParams();
    error VotingClosed();
    error VotingOpen();
    error AlreadyVoted();
    error TaskFrozen();
    error TaskResolved();
    error NothingToClaim();
    error TransferFailed();
    error Reentrancy();

    modifier nonReentrant() {
        if (_lock == 2) revert Reentrancy();
        _lock = 2;
        _;
        _lock = 1;
    }

    constructor(address _arbiter) {
        arbiter = _arbiter == address(0) ? msg.sender : _arbiter;
    }

    /// @notice Create a task and escrow the full budget as msg.value.
    /// @param duration seconds until voting closes. Demo tasks use ~60.
    function createTask(string calldata metadataURI, uint64 itemCount, uint128 rewardPerVote, uint64 duration)
        external
        payable
        returns (uint256 taskId)
    {
        if (itemCount == 0 || rewardPerVote == 0 || duration == 0 || msg.value == 0) revert BadParams();
        if (msg.value < rewardPerVote) revert BadParams();
        uint64 deadline = uint64(block.timestamp) + duration;
        taskId = tasks.length;
        tasks.push(
            Task({
                employer: msg.sender,
                metadataURI: metadataURI,
                itemCount: itemCount,
                rewardPerVote: rewardPerVote,
                escrow: uint128(msg.value),
                deadline: deadline,
                frozen: false,
                resolved: false
            })
        );
        emit TaskCreated(taskId, msg.sender, itemCount, rewardPerVote, deadline, metadataURI);
    }

    /// @notice Vote on one item. One vote per wallet per item. Pays rewardPerVote into claimable earnings.
    function vote(uint256 taskId, uint256 itemId, uint8 choice) external {
        Task storage t = tasks[taskId];
        if (t.frozen) revert TaskFrozen();
        if (t.resolved) revert TaskResolved();
        if (block.timestamp >= t.deadline) revert VotingClosed();
        if (itemId >= t.itemCount || choice >= MAX_CHOICES) revert BadParams();
        if (voted[taskId][itemId][msg.sender]) revert AlreadyVoted();
        if (t.escrow < t.rewardPerVote) revert VotingClosed(); // budget drained

        voted[taskId][itemId][msg.sender] = true;
        unchecked {
            tally[taskId][itemId][choice] += 1;
        }
        t.escrow -= t.rewardPerVote;
        earnings[taskId][msg.sender] += t.rewardPerVote;
        emit Voted(taskId, itemId, msg.sender, choice);
    }

    /// @notice Employer freezes a task they believe contains fraudulent votes. Blocks claims until resolved.
    function freeze(uint256 taskId) external {
        Task storage t = tasks[taskId];
        if (msg.sender != t.employer) revert NotEmployer();
        if (t.resolved) revert TaskResolved();
        t.frozen = true;
        emit Frozen(taskId);
    }

    /// @notice Arbiter voids fraudulent voters, returning their allocated reward to the employer's escrow.
    function resolve(uint256 taskId, address[] calldata badVoters) external {
        if (msg.sender != arbiter) revert NotArbiter();
        Task storage t = tasks[taskId];
        t.resolved = true;
        t.frozen = false;
        uint256 refund;
        for (uint256 i; i < badVoters.length; ++i) {
            address bad = badVoters[i];
            if (voided[taskId][bad] || claimed[taskId][bad]) continue;
            voided[taskId][bad] = true;
            refund += earnings[taskId][bad];
            earnings[taskId][bad] = 0;
        }
        if (refund > 0) t.escrow += uint128(refund);
        emit Resolved(taskId, badVoters);
    }

    /// @notice Labeler claims earnings after the deadline (and after resolution if the task was frozen).
    function claim(uint256 taskId) external nonReentrant {
        Task storage t = tasks[taskId];
        if (block.timestamp < t.deadline) revert VotingOpen();
        if (t.frozen && !t.resolved) revert TaskFrozen();
        if (voided[taskId][msg.sender] || claimed[taskId][msg.sender]) revert NothingToClaim();
        uint256 amt = earnings[taskId][msg.sender];
        if (amt == 0) revert NothingToClaim();

        claimed[taskId][msg.sender] = true;
        earnings[taskId][msg.sender] = 0;
        (bool ok,) = msg.sender.call{value: amt}("");
        if (!ok) revert TransferFailed();
        emit Claimed(taskId, msg.sender, amt);
    }

    /// @notice Employer reclaims unallocated budget after the deadline or after resolution.
    function withdrawUnspent(uint256 taskId) external nonReentrant {
        Task storage t = tasks[taskId];
        if (msg.sender != t.employer) revert NotEmployer();
        if (block.timestamp < t.deadline && !t.resolved) revert VotingOpen();
        uint256 amt = t.escrow;
        if (amt == 0) revert NothingToClaim();

        t.escrow = 0;
        (bool ok,) = msg.sender.call{value: amt}("");
        if (!ok) revert TransferFailed();
        emit Withdrawn(taskId, msg.sender, amt);
    }

    // --- views ---

    function taskCount() external view returns (uint256) {
        return tasks.length;
    }

    function getTally(uint256 taskId, uint256 itemId) external view returns (uint32[4] memory out) {
        for (uint8 c; c < MAX_CHOICES; ++c) {
            out[c] = tally[taskId][itemId][c];
        }
    }
}
