export type BlockchainNetwork = 'ethereum' | 'solana';

export type WalletProviderType = 'metamask' | 'phantom';

export type GasFeeMode = 'zero-gas' | 'micro-gas';

export const MICRO_GAS_ETH = 0.000001; // Exact 0.000001 Ether gas fee
export const MICRO_GAS_SOL = 0.000001; // Exact 0.000001 Solana gas fee

export interface ConnectedWallet {
  type: WalletProviderType;
  address: string;
  network: BlockchainNetwork;
  networkName: string;
  chainId?: string | number;
  balance: number; // in ETH or SOL
  isConnected: boolean;
}

export interface NFTTrait {
  id: string;
  trait_type: string;
  value: string;
}

export interface NFTItem {
  id: string;
  name: string;
  symbol: string;
  description: string;
  network: BlockchainNetwork;
  ownerAddress: string;
  creatorAddress: string;
  imageUrl: string;
  royaltyFeePercent: number; // e.g. 5%
  supply: number; // 1 for 1/1, or multiple for editions
  tokenStandard: 'ERC-721' | 'ERC-1155' | 'Metaplex Master Edition' | 'Metaplex Core';
  attributes: NFTTrait[];
  createdAt: number;
  estimatedPriceUSD: number;
  metadataJson: string;
  // On-chain status
  isSentToWallet?: boolean;
  mintTxHash?: string;
  isGaslessLazyMint?: boolean;
  gasFeeMode?: GasFeeMode;
  gasFeePaid?: number; // 0 or 0.000001
  gasFeeCurrency?: 'ETH' | 'SOL';
  recipientWallet?: string;
}

export type BatchQueueItemStatus = 'pending' | 'deploying' | 'minted' | 'failed';

export interface BatchNFTEntry {
  id: string;
  name: string;
  symbol: string;
  description: string;
  network: BlockchainNetwork;
  ownerAddress: string;
  creatorAddress: string;
  imageUrl: string;
  royaltyFeePercent: number;
  supply: number;
  tokenStandard: 'ERC-721' | 'ERC-1155' | 'Metaplex Master Edition' | 'Metaplex Core';
  attributes: NFTTrait[];
  estimatedPriceUSD: number;
  gasFeeMode?: GasFeeMode;
  status: BatchQueueItemStatus;
  errorMessage?: string;
  mintTxHash?: string;
  explorerUrl?: string;
}

export interface BatchDeploymentLog {
  id: string;
  timestamp: number;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  txHash?: string;
  explorerUrl?: string;
}

export interface CreatorRevenueModel {
  targetHourlyRateUSD: number; // e.g. $200 / hour
  weeklyHoursWorked: number; // e.g. 20 hours / week
  network: BlockchainNetwork;
  // Income Channel 1: Primary Mint Sales
  primaryMintCountMonth: number;
  primaryPriceUSD: number;
  // Income Channel 2: Secondary Market Royalties
  secondaryTradingVolumeUSD: number;
  royaltyPercent: number; // e.g. 5%
  // Income Channel 3: Direct Web3 Commissions & Art Contracts
  commissionProjectsMonth: number;
  commissionPriceUSD: number;
  // Expense & Fee modeling
  marketplaceFeePercent: number; // e.g. 2.5%
  gasPerTransactionUSD: number; // e.g. $8 on ETH or $0.002 on Solana
}

export interface RevenueCalculationResult {
  monthlyTargetUSD: number;
  weeklyTargetUSD: number;
  primaryNetUSD: number;
  royaltiesNetUSD: number;
  commissionsNetUSD: number;
  totalGrossUSD: number;
  totalPlatformFeesUSD: number;
  totalNetProfitUSD: number;
  actualHourlyEarnedUSD: number;
  goalAchievementPercent: number;
  hoursNeededForTarget: number;
}

export interface CreatorVaultBalance {
  pendingEth: number;
  pendingSol: number;
  withdrawnEth: number;
  withdrawnSol: number;
  withdrawalHistory: {
    id: string;
    amount: number;
    currency: 'ETH' | 'SOL';
    recipientAddress: string;
    txHash: string;
    timestamp: number;
    status: 'completed' | 'processing';
    gasFeeMode?: GasFeeMode;
    gasFeePaid?: number; // 0 or 0.000001
    netReceived?: number;
  }[];
}
