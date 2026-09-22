import { NFTItem, BlockchainNetwork, CreatorRevenueModel, RevenueCalculationResult } from './types';

export const CURRENT_ETH_PRICE_USD = 3420.0;
export const CURRENT_SOL_PRICE_USD = 152.5;

export const DEFAULT_ETHEREUM_OWNER = '0x94B7f1d2c18d45d3A4221768846Fe735F64AcDE0';
export const DEFAULT_SOLANA_OWNER = '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU';

export const PROCEDURAL_ART_TEMPLATES = [
  {
    id: 'cyber-genesis',
    name: 'Cybernetic Relic #01',
    category: 'Cyberpunk',
    gradient: 'from-fuchsia-600 via-purple-600 to-indigo-900',
    accentColor: '#ec4899',
    pattern: 'mesh',
    defaultTraits: [
      { id: '1', trait_type: 'Faction', value: 'Neon Syndicate' },
      { id: '2', trait_type: 'Core Affinity', value: 'Quantum Flux' },
      { id: '3', trait_type: 'Edition Tier', value: 'Mythic 1/1' },
      { id: '4', trait_type: 'Chain Layer', value: 'L1 Consensus' },
    ],
  },
  {
    id: 'solana-solstice',
    name: 'Solana Solar Beacon #88',
    category: 'Cosmic Solana',
    gradient: 'from-teal-400 via-emerald-500 to-indigo-950',
    accentColor: '#14f195',
    pattern: 'radial',
    defaultTraits: [
      { id: '1', trait_type: 'Cluster', value: 'Validator Prime' },
      { id: '2', trait_type: 'Speed Epoch', value: '400ms TPS' },
      { id: '3', trait_type: 'Program Derived', value: 'Anchor Certified' },
      { id: '4', trait_type: 'Rarity', value: 'Solstice Master' },
    ],
  },
  {
    id: 'eth-vitalik-prism',
    name: 'Ether Horizon Genesis #07',
    category: 'Minimalist Void',
    gradient: 'from-amber-400 via-rose-500 to-slate-900',
    accentColor: '#627eea',
    pattern: 'geometric',
    defaultTraits: [
      { id: '1', trait_type: 'Gas State', value: 'Zero Slipped' },
      { id: '2', trait_type: 'EVM Architecture', value: 'Verkle Proof' },
      { id: '3', trait_type: 'Harmonic', value: 'Golden Ratio' },
      { id: '4', trait_type: 'Signature', value: 'ECDSA Hardened' },
    ],
  },
  {
    id: 'hyper-sol-blade',
    name: 'Vortex Phantom #404',
    category: 'Dark Neon',
    gradient: 'from-violet-600 via-sky-600 to-black',
    accentColor: '#9945ff',
    pattern: 'grid',
    defaultTraits: [
      { id: '1', trait_type: 'Class', value: 'Vortex Infiltrator' },
      { id: '2', trait_type: 'Protocol', value: 'Metaplex Core' },
      { id: '3', trait_type: 'Aura', value: 'Electromagnetic' },
    ],
  },
];

export function generateMetadataJSON(
  item: Omit<NFTItem, 'metadataJson' | 'createdAt' | 'id'>
): string {
  if (item.network === 'ethereum') {
    const erc721Schema = {
      name: item.name,
      description: item.description,
      image: item.imageUrl,
      external_url: `https://aetheris-studio.web3/nft/${item.symbol.toLowerCase()}`,
      attributes: item.attributes.map((a) => ({
        trait_type: a.trait_type,
        value: a.value,
      })),
      properties: {
        token_standard: item.tokenStandard,
        creator_address: item.creatorAddress,
        owner_address: item.ownerAddress,
        royalty_fee_percent: item.royaltyFeePercent,
        total_supply: item.supply,
      },
      compiler: 'Aetheris Web3 NFT Studio v2.4 (Ethereum ERC-721 Standard)',
    };
    return JSON.stringify(erc721Schema, null, 2);
  } else {
    // Solana Metaplex Certified JSON schema
    const sellerFeeBasisPoints = Math.round(item.royaltyFeePercent * 100);
    const metaplexSchema = {
      name: item.name,
      symbol: item.symbol,
      description: item.description,
      seller_fee_basis_points: sellerFeeBasisPoints,
      image: item.imageUrl,
      animation_url: null,
      external_url: `https://aetheris-studio.web3/solana/${item.symbol.toLowerCase()}`,
      attributes: item.attributes.map((a) => ({
        trait_type: a.trait_type,
        value: a.value,
      })),
      collection: {
        name: `${item.symbol} Genesis Vault`,
        family: 'Aetheris Solana Creators',
      },
      properties: {
        files: [
          {
            uri: item.imageUrl,
            type: 'image/svg+xml',
          },
        ],
        category: 'image',
        creators: [
          {
            address: item.creatorAddress || DEFAULT_SOLANA_OWNER,
            share: 100,
          },
        ],
      },
    };
    return JSON.stringify(metaplexSchema, null, 2);
  }
}

export const INITIAL_SEED_NFTS: NFTItem[] = [];

export function calculateCreatorRevenue(model: CreatorRevenueModel): RevenueCalculationResult {
  const weeksPerMonth = 4.33;
  const monthlyHoursWorked = model.weeklyHoursWorked * weeksPerMonth;
  const monthlyTargetUSD = model.targetHourlyRateUSD * monthlyHoursWorked;
  const weeklyTargetUSD = model.targetHourlyRateUSD * model.weeklyHoursWorked;

  // 1. Primary Mints:
  const primaryGross = model.primaryMintCountMonth * model.primaryPriceUSD;
  const primaryPlatformFee = primaryGross * (model.marketplaceFeePercent / 100);
  const primaryGasCost = model.primaryMintCountMonth * model.gasPerTransactionUSD;
  const primaryNetUSD = Math.max(0, primaryGross - primaryPlatformFee - primaryGasCost);

  // 2. Secondary Market Royalties:
  const royaltiesGross = model.secondaryTradingVolumeUSD * (model.royaltyPercent / 100);
  // Marketplace usually deducts small distribution or smart contract protocol fee (approx 1%)
  const royaltiesNetUSD = royaltiesGross * 0.98;

  // 3. Web3 Commissions & Custom Contracts:
  const commissionsGross = model.commissionProjectsMonth * model.commissionPriceUSD;
  // Usually direct peer-to-peer or escrow with minor 1% fee
  const commissionsNetUSD = commissionsGross * 0.99;

  const totalGrossUSD = primaryGross + royaltiesGross + commissionsGross;
  const totalPlatformFeesUSD = (primaryGross - primaryNetUSD) + (royaltiesGross - royaltiesNetUSD) + (commissionsGross - commissionsNetUSD);
  const totalNetProfitUSD = primaryNetUSD + royaltiesNetUSD + commissionsNetUSD;

  const actualHourlyEarnedUSD = monthlyHoursWorked > 0 ? totalNetProfitUSD / monthlyHoursWorked : 0;
  const goalAchievementPercent = monthlyTargetUSD > 0 ? (totalNetProfitUSD / monthlyTargetUSD) * 100 : 0;
  const hoursNeededForTarget = model.targetHourlyRateUSD > 0 ? totalNetProfitUSD / model.targetHourlyRateUSD : 0;

  return {
    monthlyTargetUSD,
    weeklyTargetUSD,
    primaryNetUSD,
    royaltiesNetUSD,
    commissionsNetUSD,
    totalGrossUSD,
    totalPlatformFeesUSD,
    totalNetProfitUSD,
    actualHourlyEarnedUSD,
    goalAchievementPercent,
    hoursNeededForTarget,
  };
}
