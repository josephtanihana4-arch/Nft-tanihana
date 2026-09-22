import React, { useState } from 'react';
import {
  Diamond,
  Zap,
  Code2,
  Copy,
  Check,
  Download,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Layers,
  Sparkles,
  Send,
  Droplets,
  CheckCircle2,
  Fuel,
} from 'lucide-react';
import { NFTItem, BlockchainNetwork, ConnectedWallet, MICRO_GAS_ETH, MICRO_GAS_SOL } from '../types';
import { CURRENT_ETH_PRICE_USD, CURRENT_SOL_PRICE_USD } from '../nftData';
import { sendNFTToWallet } from '../walletService';

interface NFTGalleryProps {
  nfts: NFTItem[];
  wallet: ConnectedWallet | null;
  onDeleteNFT: (id: string) => void;
  onUpdateNFT: (nft: NFTItem) => void;
}

export default function NFTGallery({
  nfts,
  wallet,
  onDeleteNFT,
  onUpdateNFT,
}: NFTGalleryProps) {
  const [selectedChainFilter, setSelectedChainFilter] = useState<'all' | BlockchainNetwork>('all');
  const [inspectingNFT, setInspectingNFT] = useState<NFTItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [upgradingId, setUpgradingId] = useState<string | null>(null);

  const filteredNFTs = nfts.filter((item) => {
    if (selectedChainFilter === 'all') return true;
    return item.network === selectedChainFilter;
  });

  const handleCopyJSON = (json: string, id: string) => {
    navigator.clipboard.writeText(json);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadJSON = (nft: NFTItem) => {
    const blob = new Blob([nft.metadataJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${nft.symbol.toLowerCase()}-${nft.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleUpgradeToOnChain = async (nft: NFTItem) => {
    if (!wallet || !wallet.isConnected) {
      alert('Please connect your personal wallet (MetaMask or Phantom) first to upgrade this NFT to the blockchain.');
      return;
    }

    setUpgradingId(nft.id);
    try {
      const mode = 'micro-gas';
      const gasFeeAmount = nft.network === 'ethereum' ? MICRO_GAS_ETH : MICRO_GAS_SOL;

      const res = await sendNFTToWallet(wallet, {
        name: nft.name,
        symbol: nft.symbol,
        metadataJson: nft.metadataJson,
        isGasless: false,
        gasFeeMode: mode,
        gasFeeAmount,
      });

      const updated: NFTItem = {
        ...nft,
        isSentToWallet: true,
        mintTxHash: res.txHash,
        recipientWallet: wallet.address,
        ownerAddress: wallet.address,
        gasFeeMode: mode,
        gasFeePaid: gasFeeAmount,
        isGaslessLazyMint: false,
      };

      onUpdateNFT(updated);
      alert(`Success! Your NFT is now 100% real and verifiable on the ${nft.network === 'ethereum' ? 'Ethereum' : 'Solana'} blockchain.`);
    } catch (err: any) {
      alert(err.message || 'On-chain upgrade failed.');
    } finally {
      setUpgradingId(null);
    }
  };

  const handleSendToConnectedWallet = async (nft: NFTItem) => {
    if (!wallet || !wallet.isConnected) {
      alert('Please connect your MetaMask or Phantom wallet first.');
      return;
    }

    setSendingId(nft.id);
    try {
      const mode = nft.gasFeeMode || (nft.isGaslessLazyMint ? 'zero-gas' : 'micro-gas');
      const gasFeeAmount =
        nft.gasFeePaid ??
        (mode === 'micro-gas' ? (nft.network === 'ethereum' ? MICRO_GAS_ETH : MICRO_GAS_SOL) : 0);

      const res = await sendNFTToWallet(wallet, {
        name: nft.name,
        symbol: nft.symbol,
        metadataJson: nft.metadataJson,
        isGasless: mode === 'zero-gas',
        gasFeeMode: mode,
        gasFeeAmount,
      });

      const updated: NFTItem = {
        ...nft,
        isSentToWallet: true,
        mintTxHash: res.txHash,
        recipientWallet: wallet.address,
        ownerAddress: wallet.address,
        gasFeeMode: mode,
        gasFeePaid: gasFeeAmount,
      };

      onUpdateNFT(updated);
    } catch (err: any) {
      alert(err.message || 'Transfer failed.');
    } finally {
      setSendingId(null);
    }
  };

  return (
    <div id="nft-gallery-container" className="space-y-6">
      {/* Header and Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-panel p-5 rounded-2xl border border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-display flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" /> Owned & Created Web3 NFTs
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Displaying {filteredNFTs.length} verified digital assets minted in your studio workspace
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => setSelectedChainFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              selectedChainFilter === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            All Chains ({nfts.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedChainFilter('ethereum')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              selectedChainFilter === 'ethereum'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Diamond className="w-3.5 h-3.5 text-indigo-600" />
            <span>Ethereum</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedChainFilter('solana')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              selectedChainFilter === 'solana'
                ? 'bg-white text-teal-700 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-teal-600" />
            <span>Solana</span>
          </button>
        </div>
      </div>

      {/* NFT Cards Grid */}
      {filteredNFTs.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-2xl border border-slate-200 space-y-3">
          <Sparkles className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-700">No NFTs Created in this Category</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Switch to the Creator Studio tab above to design and mint your first Ethereum or Solana NFT!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNFTs.map((nft) => {
            const isEth = nft.network === 'ethereum';
            const priceCrypto = isEth
              ? (nft.estimatedPriceUSD / CURRENT_ETH_PRICE_USD).toFixed(3) + ' ETH'
              : (nft.estimatedPriceUSD / CURRENT_SOL_PRICE_USD).toFixed(2) + ' SOL';

            return (
              <div
                key={nft.id}
                id={`nft-card-${nft.id}`}
                className="glass-panel rounded-2xl border border-slate-200/90 overflow-hidden flex flex-col hover:shadow-lg transition-all"
              >
                {/* Visual Artwork Box */}
                <div className="relative aspect-square w-full bg-slate-950 flex items-center justify-center overflow-hidden">
                  {nft.imageUrl ? (
                    <img
                      src={nft.imageUrl}
                      alt={nft.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
                      {isEth ? (
                        <Diamond className="w-16 h-16 text-indigo-400 animate-pulse" />
                      ) : (
                        <Zap className="w-16 h-16 text-teal-400 animate-pulse" />
                      )}
                      <span className="text-xs font-mono font-bold text-white/80 mt-3 tracking-widest">
                        {nft.symbol}
                      </span>
                    </div>
                  )}

                  {/* Chain badge */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full backdrop-blur-md bg-black/60 text-white text-[10px] font-mono font-bold border border-white/10">
                    {isEth ? (
                      <>
                        <Diamond className="w-3 h-3 text-indigo-400" />
                        <span>Ethereum</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-3 h-3 text-teal-400" />
                        <span>Solana</span>
                      </>
                    )}
                  </div>

                  {/* Web3 Gas Policy Badge (Zero Gas or Real 0.000001 Gas) */}
                  {nft.gasFeeMode === 'micro-gas' && !nft.isGaslessLazyMint ? (
                    <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full backdrop-blur-md bg-indigo-950/85 text-indigo-300 text-[10px] font-mono border border-indigo-500/40 flex items-center gap-1 shadow-xs">
                      <CheckCircle2 className="w-2.5 h-2.5 text-indigo-400" />
                      <span>Verified On-Chain</span>
                    </div>
                  ) : (
                    <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full backdrop-blur-md bg-amber-950/85 text-amber-400 text-[10px] font-mono border border-amber-500/30 flex items-center gap-1 shadow-xs">
                      <ShieldCheck className="w-2.5 h-2.5" />
                      <span>Off-Chain Signature</span>
                    </div>
                  )}
                </div>

                {/* NFT Details */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-indigo-600 uppercase">
                          {nft.symbol}
                        </span>
                        <h3 className="text-base font-bold text-slate-900 font-display">
                          {nft.name}
                        </h3>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">Valuation</span>
                        <span className="text-xs font-mono font-bold text-slate-900">
                          ${nft.estimatedPriceUSD}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500 block">
                          {priceCrypto}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 line-clamp-2">
                      {nft.description}
                    </p>

                    {/* Owner & Wallet confirmation */}
                    <div className="p-2.5 bg-slate-50 rounded-xl space-y-1.5 text-[11px] font-mono text-slate-600 border border-slate-100">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Owner:</span>
                        <span className="font-semibold truncate max-w-[170px]" title={nft.ownerAddress}>
                          {nft.ownerAddress}
                        </span>
                      </div>

                     {/* Gas Fee Paid Line */}
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-400">Mint Status:</span>
                      <span className="font-bold flex items-center gap-1">
                        {nft.gasFeeMode === 'micro-gas' && !nft.isGaslessLazyMint ? (
                          <span className="text-indigo-700 flex items-center gap-1">
                            <ShieldCheck className="w-2.5 h-2.5" /> 100% Real On-Chain
                          </span>
                        ) : (
                          <span className="text-amber-700 flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5" /> Signed Voucher (Off-Chain)
                          </span>
                        )}
                      </span>
                    </div>

                      {nft.isSentToWallet && nft.mintTxHash && (
                        <div className="flex justify-between items-center pt-1 border-t border-slate-200/60">
                          <span className="text-emerald-700 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Sent to Wallet</span>
                          </span>
                          <a
                            href={
                              isEth
                                ? `https://etherscan.io/tx/${nft.mintTxHash}`
                                : `https://solscan.io/tx/${nft.mintTxHash}`
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="text-indigo-600 hover:underline flex items-center gap-1 font-bold text-[10px]"
                          >
                            <span>Tx Record</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Traits chips */}
                    {nft.attributes.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {nft.attributes.slice(0, 3).map((attr) => (
                          <span
                            key={attr.id}
                            className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-mono text-slate-700 border border-slate-200/60"
                          >
                            <span className="text-slate-400">{attr.trait_type}: </span>
                            <span className="font-bold">{attr.value}</span>
                          </span>
                        ))}
                        {nft.attributes.length > 3 && (
                          <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-[10px] font-mono text-slate-500">
                            +{nft.attributes.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions footer */}
                  <div className="space-y-2 pt-3 border-t border-slate-100">
                    {(nft.isGaslessLazyMint || nft.gasFeeMode === 'zero-gas') && (
                      <button
                        type="button"
                        onClick={() => handleUpgradeToOnChain(nft)}
                        disabled={upgradingId === nft.id}
                        className="w-full py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-xs font-bold font-mono transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                      >
                        <Zap className="w-3.5 h-3.5 fill-white" />
                        <span>
                          {upgradingId === nft.id
                            ? 'Deploying to Chain...'
                            : 'Upgrade to 100% Real On-Chain'}
                        </span>
                      </button>
                    )}

                    {!nft.isSentToWallet && !nft.isGaslessLazyMint && (
                      <button
                        type="button"
                        onClick={() => handleSendToConnectedWallet(nft)}
                        disabled={sendingId === nft.id}
                        className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold font-mono transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>
                          {sendingId === nft.id
                            ? 'Broadcasting...'
                            : `Send NFT to ${wallet?.type ? wallet.type : 'Connected Wallet'}`}
                        </span>
                      </button>
                    )}

                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setInspectingNFT(nft)}
                        className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-bold"
                      >
                        <Code2 className="w-3.5 h-3.5" />
                        <span>Inspect Metadata</span>
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleDownloadJSON(nft)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100"
                          title="Download JSON metadata"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteNFT(nft.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                          title="Delete from studio"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Metadata Inspector Modal */}
      {inspectingNFT && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Code2 className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900 font-display">
                  {inspectingNFT.name} Standards Metadata
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectingNFT(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
              <span>Standard: {inspectingNFT.tokenStandard}</span>
              <span>Network: {inspectingNFT.network.toUpperCase()}</span>
            </div>

            <pre className="p-4 bg-slate-900 text-emerald-400 rounded-xl text-xs font-mono overflow-x-auto max-h-[360px] border border-slate-800 leading-relaxed">
              {inspectingNFT.metadataJson}
            </pre>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleCopyJSON(inspectingNFT.metadataJson, inspectingNFT.id)}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold font-mono transition-colors"
              >
                {copiedId === inspectingNFT.id ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copiedId === inspectingNFT.id ? 'Copied!' : 'Copy Metadata'}</span>
              </button>
              <button
                type="button"
                onClick={() => handleDownloadJSON(inspectingNFT)}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold font-mono transition-colors shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .json file</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
