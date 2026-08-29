// Address is filled in after deploy (see contracts/scripts/deploy.js output).
// Kept in an env var so preview/prod can point at different deployments.
export const MARKET_ADDRESS = (process.env.NEXT_PUBLIC_MARKET_ADDRESS ??
  "0x0000000000000000000000000000000000000000") as `0x${string}`;

export const MAX_CHOICES = 4;

// Minimal ABI — must match contracts/contracts/OpinionMarket.sol.
export const marketAbi = [
  {
    type: "function",
    name: "createTask",
    stateMutability: "payable",
    inputs: [
      { name: "metadataURI", type: "string" },
      { name: "itemCount", type: "uint64" },
      { name: "rewardPerVote", type: "uint128" },
      { name: "duration", type: "uint64" },
    ],
    outputs: [{ name: "taskId", type: "uint256" }],
  },
  {
    type: "function",
    name: "vote",
    stateMutability: "nonpayable",
    inputs: [
      { name: "taskId", type: "uint256" },
      { name: "itemId", type: "uint256" },
      { name: "choice", type: "uint8" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "freeze",
    stateMutability: "nonpayable",
    inputs: [{ name: "taskId", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "resolve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "taskId", type: "uint256" },
      { name: "badVoters", type: "address[]" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "claim",
    stateMutability: "nonpayable",
    inputs: [{ name: "taskId", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "withdrawUnspent",
    stateMutability: "nonpayable",
    inputs: [{ name: "taskId", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "taskCount",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "tasks",
    stateMutability: "view",
    inputs: [{ name: "", type: "uint256" }],
    outputs: [
      { name: "employer", type: "address" },
      { name: "metadataURI", type: "string" },
      { name: "itemCount", type: "uint64" },
      { name: "rewardPerVote", type: "uint128" },
      { name: "escrow", type: "uint128" },
      { name: "deadline", type: "uint64" },
      { name: "frozen", type: "bool" },
      { name: "resolved", type: "bool" },
    ],
  },
  {
    type: "function",
    name: "getTally",
    stateMutability: "view",
    inputs: [
      { name: "taskId", type: "uint256" },
      { name: "itemId", type: "uint256" },
    ],
    outputs: [{ name: "out", type: "uint32[4]" }],
  },
  {
    type: "function",
    name: "earnings",
    stateMutability: "view",
    inputs: [
      { name: "", type: "uint256" },
      { name: "", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "voted",
    stateMutability: "view",
    inputs: [
      { name: "", type: "uint256" },
      { name: "", type: "uint256" },
      { name: "", type: "address" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "claimed",
    stateMutability: "view",
    inputs: [
      { name: "", type: "uint256" },
      { name: "", type: "address" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "event",
    name: "TaskCreated",
    inputs: [
      { name: "taskId", type: "uint256", indexed: true },
      { name: "employer", type: "address", indexed: true },
      { name: "itemCount", type: "uint256", indexed: false },
      { name: "rewardPerVote", type: "uint256", indexed: false },
      { name: "deadline", type: "uint64", indexed: false },
      { name: "metadataURI", type: "string", indexed: false },
    ],
  },
] as const;

export type TaskMeta = {
  title: string;
  kind: "thumbnail" | "label";
  description?: string;
  items: { prompt?: string; imageUrls?: string[]; choices: string[] }[];
};
