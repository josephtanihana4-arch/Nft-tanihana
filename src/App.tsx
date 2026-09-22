import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Layers,
  TrendingUp,
  HelpCircle,
  Diamond,
  Zap,
  ShieldCheck,
  PlusCircle,
  ArrowDownCircle,
  Wallet,
  ListPlus,
} from 'lucide-react';
import { NFTItem, ConnectedWallet, CreatorVaultBalance, GasFeeMode } from './types';
import { INITIAL_SEED_NFTS, CURRENT_ETH_PRICE_USD, CURRENT_SOL_PRICE_USD } from './nftData';
import WalletBar from './components/WalletBar';
import NFTCreatorStudio from './components/NFTCreatorStudio';
import BatchNFTStudio from './components/BatchNFTStudio';
import CreatorRevenuePlanner from './components/CreatorRevenuePlanner';
import NFTGallery from './components/NFTGallery';
import CreatorVaultWithdrawal from './components/CreatorVaultWithdrawal';
import Web3CreatorEducation from './components/Web3CreatorEducation';

export default function App() {
  const [activeTab, setActiveTab] = useState<'studio' | 'batch' | 'withdrawal' | 'planner' | 'gallery' | 'handbook'>('studio');
  const [wallet, setWallet] = useState<ConnectedWallet | null>(null);

  // Load created NFTs from localStorage if available
  const [nfts, setNfts] = useState<NFTItem[]>(() => {
    try {
      const saved = localStorage.getItem('aetheris_nfts_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load stored NFTs', e);
    }
    return INITIAL_SEED_NFTS;
  });

  // Creator vault earnings and withdrawal history
  const [vault, setVault] = useState<CreatorVaultBalance>(() => {
    try {
      const saved = localStorage.getItem('aetheris_vault_v1');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load stored vault', e);
    }
    return {
      pendingEth: 0,
      pendingSol: 0,
      withdrawnEth: 0,
      withdrawnSol: 0,
      withdrawalHistory: [],
    };
  });

  // Persist NFTs to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('aetheris_nfts_v2', JSON.stringify(nfts));
    } catch (e) {
      console.error('Failed to save NFTs to localStorage', e);
    }
  }, [nfts]);

  // Persist Vault to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('aetheris_vault_v1', JSON.stringify(vault));
    } catch (e) {
      console.error('Failed to save vault to localStorage', e);
    }
  }, [vault]);

  const handleMintNFT = (newNFT: NFTItem) => {
    setNfts((prev) => [newNFT, ...prev]);
  };

  const handleUpdateNFT = (updated: NFTItem) => {
    setNfts((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
  };

  const handleDeleteNFT = (id: string) => {
    setNfts((prev) => prev.filter((item) => item.id !== id));
  };

  const handleWithdrawComplete = (
    amount: number,
    currency: 'ETH' | 'SOL',
    txHash: string,
    gasFeePaid: number = 0,
    netReceived: number = amount,
    gasFeeMode: GasFeeMode = 'zero-gas'
  ) => {
    setVault((prev) => {
      const isEth = currency === 'ETH';
      return {
        ...prev,
        pendingEth: isEth ? Math.max(0, prev.pendingEth - amount) : prev.pendingEth,
        pendingSol: !isEth ? Math.max(0, prev.pendingSol - amount) : prev.pendingSol,
        withdrawnEth: isEth ? prev.withdrawnEth + amount : prev.withdrawnEth,
        withdrawnSol: !isEth ? prev.withdrawnSol + amount : prev.withdrawnSol,
        withdrawalHistory: [
          {
            id: `w-${Date.now()}`,
            amount,
            currency,
            recipientAddress: wallet?.address || '0x...',
            txHash,
            timestamp: Date.now(),
            status: 'completed',
            gasFeeMode,
            gasFeePaid,
            netReceived,
          },
          ...prev.withdrawalHistory,
        ],
      };
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Universal Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-purple-600 flex items-center justify-center text-white shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-slate-900 text-lg tracking-tight">
                  Aetheris
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Web3 NFT Studio
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                MetaMask & Phantom Suite • $0 Free Deposit • Real Crypto Settlement
              </p>
            </div>
          </div>

          {/* Live Web3 Market Tickers */}
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono">
              <Diamond className="w-3.5 h-3.5 text-indigo-600" />
              <span className="text-slate-500">ETH:</span>
              <span className="font-bold text-slate-900">
                ${CURRENT_ETH_PRICE_USD.toLocaleString('en-US', { minimumFractionDigits: 1 })}
              </span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono">
              <Zap className="w-3.5 h-3.5 text-teal-600" />
              <span className="text-slate-500">SOL:</span>
              <span className="font-bold text-slate-900">
                ${CURRENT_SOL_PRICE_USD.toLocaleString('en-US', { minimumFractionDigits: 1 })}
              </span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Free Deposit Lazy-Mint</span>
            </div>
          </div>

          {/* Quick Action Button */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="header-btn-quick-create"
              onClick={() => setActiveTab('studio')}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold font-mono transition-all shadow-xs"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Create NFT</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1 overflow-x-auto border-t border-slate-100 py-1.5">
          <button
            type="button"
            id="nav-tab-studio"
            onClick={() => setActiveTab('studio')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold font-display transition-all whitespace-nowrap ${
              activeTab === 'studio'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>NFT Creator Studio</span>
          </button>

          <button
            type="button"
            id="nav-tab-batch"
            onClick={() => setActiveTab('batch')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold font-display transition-all whitespace-nowrap ${
              activeTab === 'batch'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ListPlus className="w-4 h-4" />
            <span>Batch Collection Queue</span>
          </button>

          <button
            type="button"
            id="nav-tab-withdrawal"
            onClick={() => setActiveTab('withdrawal')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold font-display transition-all whitespace-nowrap ${
              activeTab === 'withdrawal'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ArrowDownCircle className="w-4 h-4" />
            <span>Withdraw Real ETH & SOL</span>
          </button>

          <button
            type="button"
            id="nav-tab-planner"
            onClick={() => setActiveTab('planner')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold font-display transition-all whitespace-nowrap ${
              activeTab === 'planner'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>$5,000/hr Profit Planner</span>
          </button>

          <button
            type="button"
            id="nav-tab-gallery"
            onClick={() => setActiveTab('gallery')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-display font-bold transition-all whitespace-nowrap ${
              activeTab === 'gallery'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Created NFTs Gallery ({nfts.length})</span>
          </button>

          <button
            type="button"
            id="nav-tab-handbook"
            onClick={() => setActiveTab('handbook')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-display font-bold transition-all whitespace-nowrap ${
              activeTab === 'handbook'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Creator Economics & FAQ</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Real Wallet Bar for MetaMask and Phantom */}
        <WalletBar wallet={wallet} onWalletChange={(w) => setWallet(w)} />

        {activeTab === 'studio' && (
          <NFTCreatorStudio
            wallet={wallet}
            onMintNFT={handleMintNFT}
            onOpenBatchStudio={() => setActiveTab('batch')}
          />
        )}

        {activeTab === 'batch' && (
          <BatchNFTStudio wallet={wallet} onMintNFT={handleMintNFT} />
        )}

        {activeTab === 'withdrawal' && (
          <CreatorVaultWithdrawal
            wallet={wallet}
            vault={vault}
            onWithdrawComplete={handleWithdrawComplete}
          />
        )}

        {activeTab === 'planner' && (
          <CreatorRevenuePlanner wallet={wallet} />
        )}

        {activeTab === 'gallery' && (
          <NFTGallery
            nfts={nfts}
            wallet={wallet}
            onDeleteNFT={handleDeleteNFT}
            onUpdateNFT={handleUpdateNFT}
          />
        )}

        {activeTab === 'handbook' && (
          <Web3CreatorEducation />
        )}
      </main>

      {/* Modern High-Contrast Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>MetaMask (EIP-1193) & Phantom (Solana Provider) Integrated</span>
          </div>

          <div className="text-slate-400 font-mono text-[11px]">
            Gasless EIP-712 Lazy Minting • Zero-Money Entry • Real On-Chain Settlement
          </div>
        </div>
      </footer>
    </div>
  );
}
