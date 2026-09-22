import React, { useState } from 'react';
import {
  Sparkles,
  Plus,
  Trash2,
  Copy,
  Check,
  Download,
  ShieldCheck,
  Code2,
  Diamond,
  Zap,
  Send,
  ExternalLink,
  Droplets,
  AlertCircle,
  Wallet,
  Fuel,
  FileCode,
  Terminal,
  Lock,
  Shield,
  ListPlus,
} from 'lucide-react';
import { BlockchainNetwork, NFTItem, NFTTrait, ConnectedWallet, GasFeeMode, MICRO_GAS_ETH, MICRO_GAS_SOL } from '../types';
import {
  DEFAULT_ETHEREUM_OWNER,
  DEFAULT_SOLANA_OWNER,
  generateMetadataJSON,
  CURRENT_ETH_PRICE_USD,
  CURRENT_SOL_PRICE_USD,
} from '../nftData';
import { sendNFTToWallet, getExplorerUrl } from '../walletService';
import {
  generateEthereumSolidityContract,
  generateSolanaAnchorProgram,
} from '../smartContractTemplates';
import NFTArtGenerator from './NFTArtGenerator';

interface NFTCreatorStudioProps {
  wallet: ConnectedWallet | null;
  onMintNFT: (nft: NFTItem) => void;
  onOpenBatchStudio?: () => void;
}

export default function NFTCreatorStudio({ wallet, onMintNFT, onOpenBatchStudio }: NFTCreatorStudioProps) {
  const [network, setNetwork] = useState<BlockchainNetwork>(
    wallet?.network || 'ethereum'
  );
  const [name, setName] = useState('Ether Relic #001');
  const [symbol, setSymbol] = useState('ERELIC');
  const [description, setDescription] = useState(
    'A rare cryptographic artifact minted on the decentralized network with perpetual creator royalties and certified ownership rights.'
  );
  const [ownerAddress, setOwnerAddress] = useState(
    wallet?.address || DEFAULT_ETHEREUM_OWNER
  );
  const [creatorAddress, setCreatorAddress] = useState(
    wallet?.address || DEFAULT_ETHEREUM_OWNER
  );
  const [royaltyFeePercent, setRoyaltyFeePercent] = useState<number>(7.5);
  const [supply, setSupply] = useState<number>(1);
  const [targetPriceUSD, setTargetPriceUSD] = useState<number>(350);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [copiedJSON, setCopiedJSON] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'metadata' | 'contracts' | 'deployment'>('editor');
  const [contractChain, setContractChain] = useState<BlockchainNetwork>('ethereum');
  const [copiedContract, setCopiedContract] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployedContractAddress, setDeployedContractAddress] = useState<string | null>(null);
  const [deploymentTxHash, setDeploymentTxHash] = useState<string | null>(null);
  const [gasFeeMode, setGasFeeMode] = useState<GasFeeMode>('micro-gas'); // Default to real on-chain transactions
  const [isSendingToWallet, setIsSendingToWallet] = useState(false);
  const [mintStatus, setMintStatus] = useState<{
    success: boolean;
    message: string;
    txHash?: string;
    explorerUrl?: string;
    gasFeePaid?: number;
    gasFeeMode?: GasFeeMode;
  } | null>(null);

  const [attributes, setAttributes] = useState<NFTTrait[]>([
    { id: '1', trait_type: 'Rarity Tier', value: 'Mythic 1/1' },
    { id: '2', trait_type: 'Network Consensus', value: 'Proof-of-Stake' },
    { id: '3', trait_type: 'Commercial Rights', value: 'CC0 Unrestricted' },
    { id: '4', trait_type: 'Web3 Gas Policy', value: 'Zero Gas Fee (0.000000 ETH/SOL Sponsored)' },
  ]);

  // When network changes, adjust default address and symbol
  const handleNetworkSwitch = (newNet: BlockchainNetwork) => {
    setNetwork(newNet);
    if (newNet === 'ethereum') {
      const addr = wallet?.type === 'metamask' ? wallet.address : DEFAULT_ETHEREUM_OWNER;
      setOwnerAddress(addr);
      setCreatorAddress(addr);
      setName('Ether Relic #001');
      setSymbol('ERELIC');
    } else {
      const addr = wallet?.type === 'phantom' ? wallet.address : DEFAULT_SOLANA_OWNER;
      setOwnerAddress(addr);
      setCreatorAddress(addr);
      setName('Solana Genesis Apex #42');
      setSymbol('SOLAPEX');
    }
  };

  const handleApplyWalletAddress = () => {
    if (wallet && wallet.address) {
      setOwnerAddress(wallet.address);
      setCreatorAddress(wallet.address);
      if (wallet.network !== network) {
        setNetwork(wallet.network);
      }
    }
  };

  const handleAddTrait = () => {
    const newTrait: NFTTrait = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      trait_type: 'Trait Type',
      value: 'Custom Value',
    };
    setAttributes([...attributes, newTrait]);
  };

  const handleUpdateTrait = (id: string, field: 'trait_type' | 'value', val: string) => {
    setAttributes(
      attributes.map((attr) => (attr.id === id ? { ...attr, [field]: val } : attr))
    );
  };

  const handleRemoveTrait = (id: string) => {
    setAttributes(attributes.filter((attr) => attr.id !== id));
  };

  const tokenStandard =
    network === 'ethereum'
      ? supply === 1
        ? 'ERC-721'
        : 'ERC-1155'
      : 'Metaplex Master Edition';

  // Current real-time generated metadata JSON string
  const currentMetadata = generateMetadataJSON({
    name,
    symbol,
    description,
    network,
    ownerAddress,
    creatorAddress,
    imageUrl: imageUrl || 'ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi',
    royaltyFeePercent,
    supply,
    tokenStandard,
    attributes,
    estimatedPriceUSD: targetPriceUSD,
  });

  const handleCopyJSON = () => {
    navigator.clipboard.writeText(currentMetadata);
    setCopiedJSON(true);
    setTimeout(() => setCopiedJSON(false), 2000);
  };

  const handleDownloadJSON = () => {
    const blob = new Blob([currentMetadata], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${symbol.toLowerCase() || 'nft'}-metadata.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const currentSolidityCode = generateEthereumSolidityContract({
    name,
    symbol,
    royaltyFeePercent,
    creatorAddress: wallet?.address || creatorAddress,
    minGasFeeEth: MICRO_GAS_ETH,
  });

  const currentSolanaCode = generateSolanaAnchorProgram({
    name,
    symbol,
    royaltyFeePercent,
    creatorAddress: wallet?.address || creatorAddress,
    minGasFeeSolLamports: 1000,
  });

  const handleCopyContract = () => {
    const code = contractChain === 'ethereum' ? currentSolidityCode : currentSolanaCode;
    navigator.clipboard.writeText(code);
    setCopiedContract(true);
    setTimeout(() => setCopiedContract(false), 2000);
  };

  const handleDownloadContract = () => {
    const isEth = contractChain === 'ethereum';
    const code = isEth ? currentSolidityCode : currentSolanaCode;
    const filename = isEth
      ? `${(name || 'NFT').replace(/[^a-zA-Z0-9]/g, '')}.sol`
      : 'lib.rs';
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleRealDeploy = async () => {
    if (!wallet || !wallet.isConnected) {
      alert('Please connect your MetaMask or Phantom wallet first to deploy a real contract on the blockchain.');
      return;
    }

    setIsDeploying(true);
    setMintStatus(null);

    try {
      const result = await import('../walletService').then(m => m.deployNFTContract(wallet, { name, symbol }));
      setDeployedContractAddress(result.contractAddress);
      setDeploymentTxHash(result.txHash);
      setActiveTab('deployment');
      setMintStatus({
        success: true,
        message: `Smart Contract Deployed Successfully! Address: ${result.contractAddress}`,
        txHash: result.txHash,
        explorerUrl: result.explorerUrl
      });
    } catch (err: any) {
      setMintStatus({
        success: false,
        message: err.message || 'Deployment failed. Ensure you have enough gas.'
      });
    } finally {
      setIsDeploying(false);
    }
  };

  const handleMintAndSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setMintStatus(null);
    setIsSendingToWallet(true);

    const gasFeePaid = gasFeeMode === 'zero-gas' ? 0.000000 : (network === 'ethereum' ? MICRO_GAS_ETH : MICRO_GAS_SOL);
    const gasFeeCurrency: 'ETH' | 'SOL' = network === 'ethereum' ? 'ETH' : 'SOL';

    try {
      let txHash = '';
      let explorerUrl = '';

      if (!wallet || !wallet.isConnected) {
        alert('A real wallet connection is required to create an NFT.');
        setIsSendingToWallet(false);
        return;
      }

      // Broadcast / sign directly with MetaMask or Phantom
      const sendResult = await sendNFTToWallet(wallet, {
        name,
        symbol,
        metadataJson: currentMetadata,
        isGasless: gasFeeMode === 'zero-gas',
        gasFeeMode,
        gasFeeAmount: gasFeePaid,
      });
      txHash = sendResult.txHash;
      explorerUrl = sendResult.explorerUrl;

      // Ensure gas attribute reflects current choice
      const dynamicAttributes = attributes.map((a) =>
        a.id === '4' || a.trait_type === 'Web3 Gas Policy' || a.trait_type === 'Mint Capital'
          ? {
              ...a,
              trait_type: 'Web3 Gas Policy',
              value:
                gasFeeMode === 'zero-gas'
                  ? 'Zero Gas Fee (0.000000 ETH/SOL Sponsored)'
                  : `${gasFeePaid.toFixed(6)} ${gasFeeCurrency} Real Micro-Gas`,
            }
          : a
      );

      const newNFT: NFTItem = {
        id: `nft-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name,
        symbol,
        description,
        network,
        ownerAddress: wallet?.address || ownerAddress,
        creatorAddress: wallet?.address || creatorAddress,
        imageUrl: imageUrl || '',
        royaltyFeePercent,
        supply,
        tokenStandard,
        attributes: dynamicAttributes,
        createdAt: Date.now(),
        estimatedPriceUSD: targetPriceUSD,
        metadataJson: currentMetadata,
        isSentToWallet: true,
        mintTxHash: txHash,
        isGaslessLazyMint: gasFeeMode === 'zero-gas',
        gasFeeMode,
        gasFeePaid,
        gasFeeCurrency,
        recipientWallet: wallet?.address || ownerAddress,
      };

      onMintNFT(newNFT);
      setMintStatus({
        success: true,
        message: `NFT successfully created! Gas: ${
          gasFeeMode === 'zero-gas'
            ? '0.000000 (Zero Gas Fee)'
            : `${gasFeePaid.toFixed(6)} ${gasFeeCurrency} (Real Micro-Gas)`
        } anchored to ${wallet?.type ? wallet.type : 'Web3'} wallet!`,
        txHash,
        explorerUrl,
        gasFeePaid,
        gasFeeMode,
      });
    } catch (err: any) {
      setMintStatus({
        success: false,
        message: err.message || 'Minting transaction was rejected or failed.',
      });
    } finally {
      setIsSendingToWallet(false);
    }
  };

  const priceInCrypto =
    network === 'ethereum'
      ? (targetPriceUSD / CURRENT_ETH_PRICE_USD).toFixed(4)
      : (targetPriceUSD / CURRENT_SOL_PRICE_USD).toFixed(3);

  return (
    <div id="nft-creator-studio-container" className="space-y-6">
      {/* Network Selector Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-panel p-5 rounded-2xl border border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-display flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" /> Web3 NFT Creator Studio
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Build and send 100% creator-owned NFTs directly to MetaMask or Phantom with zero upfront fees
          </p>
        </div>

        {/* Network Toggle Buttons & Batch Studio Launch */}
        <div className="flex flex-wrap items-center gap-2">
          {onOpenBatchStudio && (
            <button
              type="button"
              id="btn-launch-batch-studio"
              onClick={onOpenBatchStudio}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-all border border-indigo-200 shadow-2xs"
            >
              <ListPlus className="w-4 h-4 text-indigo-600" />
              <span>Batch Collection Queue</span>
            </button>
          )}

          <div className="flex items-center p-1 bg-slate-100/80 rounded-xl border border-slate-200">
            <button
              type="button"
              id="btn-select-network-ethereum"
              onClick={() => handleNetworkSwitch('ethereum')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                network === 'ethereum'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Diamond className="w-4 h-4 text-indigo-600" />
              <span>Ethereum (MetaMask)</span>
            </button>

            <button
              type="button"
              id="btn-select-network-solana"
              onClick={() => handleNetworkSwitch('solana')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                network === 'solana'
                  ? 'bg-white text-teal-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Zap className="w-4 h-4 text-teal-600" />
              <span>Solana (Phantom)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Artwork generator & Quick Metadata Inspector */}
        <div className="lg:col-span-5 space-y-6">
          <NFTArtGenerator
            network={network}
            onImageChange={(img) => setImageUrl(img)}
            currentImage={imageUrl}
          />

          {/* Standards & Ownership summary card */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>On-Chain Parameters</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                {gasFeeMode === 'zero-gas' ? '0.000000 Free Deposit' : '0.000001 Micro-Gas'}
              </span>
            </div>

            <div className="space-y-2 text-xs text-slate-600 font-mono">
              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span className="text-slate-400">Target Standard:</span>
                <span className="font-semibold text-slate-800">{tokenStandard}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span className="text-slate-400">Target Marketplace:</span>
                <span className="font-semibold text-slate-800">
                  {network === 'ethereum' ? 'OpenSea / LooksRare' : 'Magic Eden / Tensor'}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span className="text-slate-400">Creator Royalties:</span>
                <span className="font-bold text-emerald-600">
                  {royaltyFeePercent}% ({royaltyFeePercent * 100} BPS)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Valuation:</span>
                <span className="font-bold text-indigo-600">
                  ${targetPriceUSD.toFixed(2)} ({priceInCrypto} {network === 'ethereum' ? 'ETH' : 'SOL'})
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: NFT Details Form & Dynamic Attributes */}
        <div className="lg:col-span-7 glass-panel p-6 rounded-2xl border border-slate-200/80">
          {/* Tab Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 mb-5 gap-3">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                id="btn-tab-editor"
                onClick={() => setActiveTab('editor')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'editor'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                NFT Parameters
              </button>
              <button
                type="button"
                id="btn-tab-metadata"
                onClick={() => setActiveTab('metadata')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all ${
                  activeTab === 'metadata'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>JSON Metadata View</span>
              </button>
              <button
                type="button"
                id="btn-tab-contracts"
                onClick={() => setActiveTab('contracts')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all ${
                  activeTab === 'contracts'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>Smart Contracts (.sol & Rust)</span>
              </button>
              <button
                type="button"
                id="btn-tab-deployment"
                onClick={() => setActiveTab('deployment')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all ${
                  activeTab === 'deployment'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Real Deployment</span>
              </button>
            </div>

            {activeTab === 'metadata' && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="btn-copy-metadata-json"
                  onClick={handleCopyJSON}
                  className="flex items-center gap-1 text-xs text-slate-600 hover:text-indigo-600 bg-slate-100 px-2.5 py-1 rounded-lg font-semibold"
                >
                  {copiedJSON ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedJSON ? 'Copied' : 'Copy JSON'}</span>
                </button>
                <button
                  type="button"
                  id="btn-download-metadata-json"
                  onClick={handleDownloadJSON}
                  className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2.5 py-1 rounded-lg font-semibold"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .json</span>
                </button>
              </div>
            )}

            {activeTab === 'contracts' && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="btn-copy-contract-code"
                  onClick={handleCopyContract}
                  className="flex items-center gap-1 text-xs text-slate-600 hover:text-indigo-600 bg-slate-100 px-2.5 py-1 rounded-lg font-semibold"
                >
                  {copiedContract ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedContract ? 'Copied Code' : 'Copy Code'}</span>
                </button>
                <button
                  type="button"
                  id="btn-download-contract-code"
                  onClick={handleDownloadContract}
                  className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2.5 py-1 rounded-lg font-semibold"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{contractChain === 'ethereum' ? 'Download .sol' : 'Download .rs'}</span>
                </button>
              </div>
            )}
          </div>

          {activeTab === 'editor' ? (
            <form onSubmit={handleMintAndSend} className="space-y-4">
              {/* Web3 Gas Fee Policy Selector: Zero Gas vs Real 0.000001 ETH/SOL Micro-Gas */}
              <div className="space-y-2 p-3.5 bg-slate-50 border border-slate-200/90 rounded-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Fuel className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-bold text-slate-800">
                      Web3 Gas Fee Policy
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {gasFeeMode === 'zero-gas' ? '0.000000 FEE' : '0.000001 MICRO-GAS'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Option 1: Zero Gas Fee */}
                  <button
                    type="button"
                    id="btn-gas-mode-zero"
                    onClick={() => setGasFeeMode('zero-gas')}
                    className={`p-3 rounded-xl border text-left transition-all relative ${
                      gasFeeMode === 'zero-gas'
                        ? 'border-emerald-500 bg-emerald-50/90 text-emerald-950 shadow-xs ring-1 ring-emerald-400'
                        : 'border-slate-200 bg-white hover:bg-slate-100/60 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        <Droplets className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Off-Chain Signature (Gasless)</span>
                      </div>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-100/80 text-emerald-800">
                        OFF-CHAIN PROOF
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-700 leading-tight">
                      Sign a cryptographic proof with $0.00 gas. No Etherscan link is generated until a collector mints.
                    </p>
                  </button>

                  {/* Option 2: Real Micro-Gas Fee (0.000001 ETH / SOL) */}
                  <button
                    type="button"
                    id="btn-gas-mode-micro"
                    onClick={() => setGasFeeMode('micro-gas')}
                    className={`p-3 rounded-xl border text-left transition-all relative ${
                      gasFeeMode === 'micro-gas'
                        ? 'border-indigo-500 bg-indigo-50/90 text-indigo-950 shadow-xs ring-1 ring-indigo-400'
                        : 'border-slate-200 bg-white hover:bg-slate-100/60 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        <Fuel className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span>Real On-Chain Transaction</span>
                      </div>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-indigo-100/80 text-indigo-800">
                        VERIFIED ON SCANNER
                      </span>
                    </div>
                    <p className="text-[11px] text-indigo-700 leading-tight">
                      Broadcast real transaction to {network === 'ethereum' ? 'Ethereum' : 'Solana'} with signed receipt. 100% verifiable on-chain.
                    </p>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    NFT Title / Item Name
                  </label>
                  <input
                    id="input-nft-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
                    placeholder="e.g. Ether Relic #001"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Symbol / Ticker
                  </label>
                  <input
                    id="input-nft-symbol"
                    type="text"
                    required
                    maxLength={10}
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono font-bold text-slate-800 focus:outline-none focus:border-indigo-500 uppercase"
                    placeholder="e.g. AETH"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Description & Creator Narrative
                </label>
                <textarea
                  id="input-nft-description"
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-indigo-500"
                  placeholder="Describe your digital art, utility, or collection backstory..."
                />
              </div>

              {/* Owner and Creator Addresses with Quick Wallet Hook */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-600">
                    Recipient & Creator Wallet Address
                  </label>
                  {wallet && wallet.isConnected && (
                    <button
                      type="button"
                      onClick={handleApplyWalletAddress}
                      className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1"
                    >
                      <Wallet className="w-3 h-3" />
                      <span>Use Connected {wallet.type === 'metamask' ? 'MetaMask' : 'Phantom'}</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <input
                      id="input-nft-creator"
                      type="text"
                      value={creatorAddress}
                      onChange={(e) => setCreatorAddress(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-indigo-500"
                      placeholder="Creator Address (0x... or Base58)"
                    />
                  </div>

                  <div>
                    <input
                      id="input-nft-owner"
                      type="text"
                      value={ownerAddress}
                      onChange={(e) => setOwnerAddress(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-indigo-500"
                      placeholder="Recipient Wallet Address"
                    />
                  </div>
                </div>
              </div>

              {/* Royalties, Supply, and Initial Pricing */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Creator Royalty (%)
                  </label>
                  <div className="relative">
                    <input
                      id="input-nft-royalty"
                      type="number"
                      step="0.5"
                      min="0"
                      max="20"
                      value={royaltyFeePercent}
                      onChange={(e) => setRoyaltyFeePercent(parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      %
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Perpetual secondary cut</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Total Edition Supply
                  </label>
                  <input
                    id="input-nft-supply"
                    type="number"
                    min="1"
                    max="10000"
                    value={supply}
                    onChange={(e) => setSupply(parseInt(e.target.value) || 1)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">1 = 1/1 Unique Masterpiece</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Primary Valuation (USD)
                  </label>
                  <div className="relative">
                    <input
                      id="input-nft-price"
                      type="number"
                      min="1"
                      step="10"
                      value={targetPriceUSD}
                      onChange={(e) => setTargetPriceUSD(parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      $
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    ≈ {priceInCrypto} {network === 'ethereum' ? 'ETH' : 'SOL'}
                  </p>
                </div>
              </div>

              {/* Attributes / Traits Editor */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700">
                    NFT Traits & Attributes ({attributes.length})
                  </label>
                  <button
                    type="button"
                    id="btn-add-trait"
                    onClick={handleAddTrait}
                    className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Attribute
                  </button>
                </div>

                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {attributes.map((attr) => (
                    <div key={attr.id} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={attr.trait_type}
                        onChange={(e) =>
                          handleUpdateTrait(attr.id, 'trait_type', e.target.value)
                        }
                        placeholder="Trait Type (e.g. Faction)"
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:border-indigo-500"
                      />
                      <input
                        type="text"
                        value={attr.value}
                        onChange={(e) => handleUpdateTrait(attr.id, 'value', e.target.value)}
                        placeholder="Value (e.g. Cyber Void)"
                        className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:border-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveTrait(attr.id)}
                        className="text-slate-400 hover:text-rose-500 p-1"
                        title="Remove Attribute"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {mintStatus && (
                <div
                  id="mint-status-banner"
                  className={`p-3 rounded-xl border text-xs font-mono ${
                    mintStatus.success
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {mintStatus.success ? (
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span>{mintStatus.message}</span>
                  </div>
                  {mintStatus.explorerUrl && (
                    <div className="mt-2 pt-2 border-t border-emerald-200 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500">Explorer Confirmation:</span>
                      <a
                        href={mintStatus.explorerUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-indigo-700 underline font-bold flex items-center gap-1"
                      >
                        <span>View on {network === 'ethereum' ? 'Etherscan' : 'Solscan'}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              )}

              <button
                type="submit"
                id="btn-create-nft-submit"
                disabled={isSendingToWallet}
                className="w-full py-3.5 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>
                  {isSendingToWallet
                    ? 'Broadcasting to Wallet...'
                    : wallet && wallet.isConnected
                    ? `Mint & Send NFT to Connected ${wallet.type === 'metamask' ? 'MetaMask' : 'Phantom'}`
                    : `Mint & Send ${network === 'ethereum' ? 'Ethereum' : 'Solana'} NFT`}
                </span>
              </button>
            </form>
          ) : activeTab === 'metadata' ? (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">
                This JSON payload adheres strictly to {network === 'ethereum' ? 'OpenSea / EIP-721' : 'Solana Metaplex Token Metadata'} standards. It can be uploaded directly to IPFS, Arweave, or decentralized storage gateways.
              </p>
              <pre className="p-4 bg-slate-900 text-emerald-400 rounded-xl text-[11px] font-mono overflow-x-auto max-h-[380px] border border-slate-800 leading-relaxed">
                {currentMetadata}
              </pre>
            </div>
          ) : activeTab === 'contracts' ? (
            /* Smart Contracts Tab (.sol & Rust) */
            <div className="space-y-4">
              {/* Chain Architecture Selector */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl gap-2">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-bold text-slate-800">Target Smart Contract Architecture:</span>
                </div>
                <div className="flex items-center gap-1.5 p-1 bg-white rounded-lg border border-slate-200">
                  <button
                    type="button"
                    id="btn-contract-chain-eth"
                    onClick={() => setContractChain('ethereum')}
                    className={`px-2.5 py-1 text-xs font-mono font-bold rounded-md flex items-center gap-1 transition-all ${
                      contractChain === 'ethereum'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Diamond className="w-3 h-3 text-indigo-300" />
                    <span>Ethereum .sol</span>
                  </button>
                  <button
                    type="button"
                    id="btn-contract-chain-sol"
                    onClick={() => setContractChain('solana')}
                    className={`px-2.5 py-1 text-xs font-mono font-bold rounded-md flex items-center gap-1 transition-all ${
                      contractChain === 'solana'
                        ? 'bg-teal-600 text-white'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Zap className="w-3 h-3 text-teal-300" />
                    <span>Solana Rust (lib.rs)</span>
                  </button>
                </div>
              </div>

              {/* Source Code Box */}
              <div className="relative">
                <div className="flex items-center justify-between px-3 py-1.5 bg-slate-800 text-slate-300 text-[11px] font-mono rounded-t-xl border-t border-x border-slate-700">
                  <span className="flex items-center gap-1.5">
                    <FileCode className="w-3.5 h-3.5 text-indigo-400" />
                    {contractChain === 'ethereum'
                      ? `${(name || 'NFT').replace(/[^a-zA-Z0-9]/g, '')}.sol (OpenZeppelin v5 ERC721 + EIP-2981)`
                      : 'lib.rs (Solana Metaplex Token Metadata / Anchor 0.30)'}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-bold">
                    {contractChain === 'ethereum' ? 'Solidity ^0.8.20' : 'Rust 1.75+ / Anchor'}
                  </span>
                </div>
                <pre className="p-4 bg-slate-950 text-indigo-200 rounded-b-xl text-[11px] font-mono overflow-x-auto max-h-[360px] border border-slate-800 leading-relaxed selection:bg-indigo-700">
                  {contractChain === 'ethereum' ? currentSolidityCode : currentSolanaCode}
                </pre>
              </div>

              {/* Deployment Guide */}
                <div className="p-3 bg-indigo-50/70 border border-indigo-200/80 rounded-xl space-y-1.5 text-xs text-indigo-950">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>
                    How to Deploy {contractChain === 'ethereum' ? 'to Ethereum Sepolia / Mainnet' : 'to Solana Devnet / Mainnet'}
                  </span>
                </div>
                <div className="bg-amber-50 border border-amber-200 p-2 rounded-lg mb-2">
                  <p className="text-[10px] text-amber-800 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Need Testnet Funds? Use a faucet: </span>
                    <a href="https://sepoliafaucet.com/" target="_blank" rel="noreferrer" className="underline font-bold">Sepolia</a>
                    <span> or </span>
                    <a href="https://faucet.solana.com/" target="_blank" rel="noreferrer" className="underline font-bold">Solana Devnet</a>
                  </p>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-indigo-900/90 pl-1 font-mono">
                  {contractChain === 'ethereum' ? (
                    <>
                      <li>Open the browser IDE at <strong>remix.ethereum.org</strong></li>
                      <li>Create a new file named <code>{(name || 'NFT').replace(/[^a-zA-Z0-9]/g, '')}.sol</code> and paste this code</li>
                      <li>In the Compiler tab, select compiler version <code>0.8.20</code> or higher and click Compile</li>
                      <li>In the Deploy tab, choose Environment: <strong>Injected Provider - MetaMask</strong></li>
                      <li>Pass your wallet address into constructor and click <strong>Deploy</strong></li>
                    </>
                  ) : (
                    <>
                      <li>Install Solana CLI and Anchor framework: <code>cargo install --git https://github.com/coral-xyz/anchor anchor-cli</code></li>
                      <li>Initialize a new project: <code>anchor init {symbol.toLowerCase() || 'nft'}_anchor</code></li>
                      <li>Replace <code>programs/{symbol.toLowerCase() || 'nft'}_anchor/src/lib.rs</code> with this code</li>
                      <li>Run <code>anchor build</code> and deploy to devnet: <code>anchor deploy --provider.cluster devnet</code></li>
                      <li>Mint using Phantom wallet or your TypeScript client test script</li>
                    </>
                  )}
                </ol>
              </div>

              {/* Cryptographic Truth & Ledger Immutability Panel */}
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2 text-slate-300">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs font-mono">
                  <Lock className="w-4 h-4" />
                  <span>Cryptographic Truth: Why Blockchain Ledger Data Cannot Be Faked Over 1–4 Years</span>
                </div>
                <div className="space-y-1.5 text-[11px] leading-relaxed text-slate-400">
                  <p>
                    <strong className="text-slate-200">1. Decentralized Public Consensus:</strong> Blockchains like Ethereum and Solana do not store data locally on individual devices. State transitions (account balances, token ownership, transfers) are validated by thousands of independent consensus nodes across the globe.
                  </p>
                  <p>
                    <strong className="text-slate-200">2. Tamper-Proof Cryptographic Nonces:</strong> Every transaction carries an incremental sequence nonce, gas receipt, and ECDSA/Ed25519 cryptographic signature. Blocks are linked sequentially in Merkle Patricia Tries. A 1-to-4 year transaction history cannot be retroactively inserted or faked on real block explorers (Etherscan, Solscan).
                  </p>
                  <p>
                    <strong className="text-slate-200">3. Real Wallets Query Live RPC Nodes:</strong> MetaMask and Phantom do not allow users or apps to covertly spoof real token balances or past profit histories. Wallets query trusted JSON-RPC node providers (Infura, Alchemy, QuickNode) and only display verifiable balances confirmed on-chain.
                  </p>
                  <p>
                    <strong className="text-slate-200">4. Genuine Creator Revenue:</strong> Legitimate long-term profits (over 1 to 4 years) are achieved through genuine digital asset sales, secondary on-chain creator royalties (via the EIP-2981 royalty standard implemented in the contract above), and direct collector auctions.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Real Deployment Tab */
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="p-5 bg-indigo-50 border border-indigo-100 rounded-2xl space-y-4">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-indigo-600 rounded-xl">
                    <ShieldCheck className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Direct On-Chain Deployment</h3>
                    <p className="text-sm text-slate-600 mt-1">
                      Deploy your 100% real NFT collection contract directly to the blockchain from this studio. No third-party tools required.
                    </p>
                  </div>
                </div>

                {!deployedContractAddress ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-white border border-slate-200 rounded-xl">
                      <h4 className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                        <Terminal className="w-4 h-4 text-indigo-600" />
                        Deployment Configuration
                      </h4>
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div className="space-y-1">
                          <span className="text-slate-500">Collection Name:</span>
                          <p className="font-mono font-bold text-slate-800">{name}</p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-slate-500">Ticker Symbol:</span>
                          <p className="font-mono font-bold text-slate-800">{symbol}</p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-slate-500">Network:</span>
                          <p className="font-bold text-indigo-700 capitalize">{network}</p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-slate-500">Royalty Standard:</span>
                          <p className="font-bold text-emerald-600">EIP-2981 / Metaplex</p>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      id="btn-trigger-real-deployment"
                      disabled={isDeploying || !wallet?.isConnected}
                      onClick={handleRealDeploy}
                      className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                      {isDeploying ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Broadcasting Deployment...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 fill-white" />
                          <span>Deploy Real Contract Now</span>
                        </>
                      )}
                    </button>
                    {!wallet?.isConnected && (
                      <p className="text-[10px] text-center text-rose-500 font-bold">
                        Please connect your wallet to enable real on-chain deployment.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl animate-in zoom-in-95 duration-500">
                      <div className="flex items-center gap-2 text-emerald-800 font-bold mb-3">
                        <Check className="w-5 h-5" />
                        <span>Contract Deployed Successfully!</span>
                      </div>
                      <div className="space-y-3 font-mono text-[11px]">
                        <div className="flex flex-col gap-1">
                          <span className="text-emerald-600">Contract Address:</span>
                          <div className="flex items-center gap-2">
                            <code className="bg-white px-2 py-1 rounded border border-emerald-100 flex-1 truncate">
                              {deployedContractAddress}
                            </code>
                            <button
                              onClick={() => navigator.clipboard.writeText(deployedContractAddress)}
                              className="p-1 hover:bg-emerald-100 rounded text-emerald-600"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-emerald-600 font-bold">Verifiable Transaction Hash:</span>
                          <div className="flex items-center gap-2">
                            <code className="bg-white px-2 py-1 rounded border border-emerald-100 flex-1 truncate font-bold">
                              {deploymentTxHash}
                            </code>
                            <a
                              href={getExplorerUrl(wallet, deploymentTxHash || '')}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 hover:bg-emerald-100 rounded text-indigo-600"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('editor')}
                      className="w-full py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all"
                    >
                      Return to Minting Studio
                    </button>
                  </div>
                )}
              </div>

              <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs mb-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>On-Chain Persistence & Profitability</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  By deploying a real contract, you establish an immutable 100% creator-owned identity on the ledger. 
                  Any revenue generated from primary mints or secondary sales will be visible as <strong className="text-slate-200">real coin balance</strong> in your wallet. 
                  This is not a simulation; real gas fees apply to ensure decentralization.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
