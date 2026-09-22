import React, { useState } from 'react';
import {
  Wallet,
  ArrowDownCircle,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Info,
  Clock,
  ArrowUpRight,
  Droplets,
  DollarSign,
  Diamond,
  Zap,
  Fuel,
} from 'lucide-react';
import { ConnectedWallet, CreatorVaultBalance, GasFeeMode, MICRO_GAS_ETH, MICRO_GAS_SOL } from '../types';
import { processWalletWithdrawal, getExplorerUrl } from '../walletService';
import { CURRENT_ETH_PRICE_USD, CURRENT_SOL_PRICE_USD } from '../nftData';

interface CreatorVaultWithdrawalProps {
  wallet: ConnectedWallet | null;
  vault: CreatorVaultBalance;
  onWithdrawComplete: (
    amount: number,
    currency: 'ETH' | 'SOL',
    txHash: string,
    gasFeePaid: number,
    netReceived: number,
    gasFeeMode: GasFeeMode
  ) => void;
}

export default function CreatorVaultWithdrawal({
  wallet,
  vault,
  onWithdrawComplete,
}: CreatorVaultWithdrawalProps) {
  const [selectedCurrency, setSelectedCurrency] = useState<'ETH' | 'SOL'>('ETH');
  const [withdrawAmount, setWithdrawAmount] = useState<string>('0.25');
  const [gasFeeMode, setGasFeeMode] = useState<GasFeeMode>('zero-gas');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
    txHash?: string;
    explorerUrl?: string;
  } | null>(null);

  const availableBalance = selectedCurrency === 'ETH' ? vault.pendingEth : vault.pendingSol;
  const currentGasFee = gasFeeMode === 'zero-gas' ? 0.000000 : (selectedCurrency === 'ETH' ? MICRO_GAS_ETH : MICRO_GAS_SOL);
  const parsedAmount = parseFloat(withdrawAmount) || 0;
  const netReceived = Math.max(0, parsedAmount - currentGasFee);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid positive withdrawal amount.' });
      return;
    }

    if (amount > availableBalance) {
      setStatusMessage({
        type: 'error',
        text: `Insufficient creator vault balance. You currently have ${availableBalance} ${selectedCurrency} available.`,
      });
      return;
    }

    if (!wallet || !wallet.isConnected) {
      setStatusMessage({
        type: 'error',
        text: 'Please connect your MetaMask or Phantom wallet at the top of the page first.',
      });
      return;
    }

    // Check if network matches selected currency
    if (selectedCurrency === 'ETH' && wallet.network !== 'ethereum') {
      setStatusMessage({
        type: 'error',
        text: 'To withdraw Ether (ETH), please connect your MetaMask Ethereum wallet.',
      });
      return;
    }

    if (selectedCurrency === 'SOL' && wallet.network !== 'solana') {
      setStatusMessage({
        type: 'error',
        text: 'To withdraw Solana (SOL), please connect your Phantom Solana wallet.',
      });
      return;
    }

    setIsProcessing(true);

    try {
      const gasFeePaid = gasFeeMode === 'zero-gas' ? 0.000000 : (selectedCurrency === 'ETH' ? MICRO_GAS_ETH : MICRO_GAS_SOL);
      const calculatedNet = Math.max(0, amount - gasFeePaid);

      const result = await processWalletWithdrawal(wallet, amount, selectedCurrency, {
        mode: gasFeeMode,
        gasFeeAmount: gasFeePaid,
      });

      onWithdrawComplete(amount, selectedCurrency, result.txHash, gasFeePaid, calculatedNet, gasFeeMode);

      setStatusMessage({
        type: 'success',
        text: `Successfully initiated withdrawal of ${amount} ${selectedCurrency}! Gas: ${
          gasFeeMode === 'zero-gas'
            ? '0.000000 (Zero Gas Fee)'
            : `${gasFeePaid.toFixed(6)} ${selectedCurrency} (Real Micro-Gas)`
        }. Net: ${calculatedNet.toFixed(6)} ${selectedCurrency} sent to ${wallet.address}!`,
        txHash: result.txHash,
        explorerUrl: result.explorerUrl,
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Withdrawal could not be processed.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const ethUSD = (vault.pendingEth * CURRENT_ETH_PRICE_USD).toFixed(2);
  const solUSD = (vault.pendingSol * CURRENT_SOL_PRICE_USD).toFixed(2);

  return (
    <div id="creator-vault-withdrawal-container" className="space-y-6">
      {/* Header and Balances Overview */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 font-display flex items-center gap-2">
              <ArrowDownCircle className="w-5 h-5 text-emerald-600" />
              Creator Royalties & Real Crypto Withdrawals
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Direct settlement of accumulated NFT sales and secondary royalties to your verified wallet
            </p>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-mono font-bold border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Non-Custodial Direct Settlement</span>
          </div>
        </div>

        {/* Vault Balances Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* ETH Vault */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50/80 to-white border border-indigo-100 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5 font-bold text-slate-700">
                <Diamond className="w-4 h-4 text-indigo-600" /> Ethereum Creator Vault
              </span>
              <span className="text-[11px] font-mono font-bold text-indigo-700">ERC-721 Royalties</span>
            </div>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold font-mono text-slate-900">
                {vault.pendingEth.toFixed(4)} <span className="text-sm font-normal text-slate-500">ETH</span>
              </div>
              <span className="text-xs font-mono text-slate-500">≈ ${ethUSD} USD</span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              Total Withdrawn: {vault.withdrawnEth.toFixed(3)} ETH
            </div>
          </div>

          {/* SOL Vault */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-teal-50/80 to-white border border-teal-100 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5 font-bold text-slate-700">
                <Zap className="w-4 h-4 text-teal-600" /> Solana Creator Vault
              </span>
              <span className="text-[11px] font-mono font-bold text-teal-700">Metaplex Royalties</span>
            </div>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold font-mono text-slate-900">
                {vault.pendingSol.toFixed(3)} <span className="text-sm font-normal text-slate-500">SOL</span>
              </div>
              <span className="text-xs font-mono text-slate-500">≈ ${solUSD} USD</span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              Total Withdrawn: {vault.withdrawnSol.toFixed(2)} SOL
            </div>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout: Withdrawal Form & Free Faucet / Gasless Guide */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Withdrawal Form */}
        <div className="lg:col-span-6 glass-panel p-6 rounded-2xl border border-slate-200/80 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 font-display flex items-center gap-2">
            <ArrowUpRight className="w-4 h-4 text-indigo-600" /> Withdraw Real Ether or Solana
          </h3>

          <form onSubmit={handleWithdraw} className="space-y-4">
            {/* Currency selector */}
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1.5">
                Select Asset to Withdraw
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCurrency('ETH');
                    setWithdrawAmount(vault.pendingEth.toFixed(3));
                  }}
                  className={`p-3 rounded-xl border text-xs font-mono font-bold flex items-center justify-between transition-all ${
                    selectedCurrency === 'ETH'
                      ? 'border-indigo-500 bg-indigo-50/80 text-indigo-900 shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Diamond className="w-4 h-4 text-indigo-600" />
                    <span>Ether (ETH)</span>
                  </div>
                  <span className="text-slate-400">{vault.pendingEth.toFixed(3)} max</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedCurrency('SOL');
                    setWithdrawAmount(vault.pendingSol.toFixed(2));
                  }}
                  className={`p-3 rounded-xl border text-xs font-mono font-bold flex items-center justify-between transition-all ${
                    selectedCurrency === 'SOL'
                      ? 'border-teal-500 bg-teal-50/80 text-teal-900 shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-teal-600" />
                    <span>Solana (SOL)</span>
                  </div>
                  <span className="text-slate-400">{vault.pendingSol.toFixed(2)} max</span>
                </button>
              </div>
            </div>

            {/* Amount input */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-600">
                  Withdrawal Amount ({selectedCurrency})
                </label>
                <button
                  type="button"
                  onClick={() => setWithdrawAmount(availableBalance.toString())}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800"
                >
                  Use Max Available
                </button>
              </div>

              <div className="relative">
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  max={availableBalance}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                  placeholder="0.00"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-400">
                  {selectedCurrency}
                </span>
              </div>
            </div>

            {/* Web3 Gas Fee Policy Selector for Withdrawal */}
            <div className="space-y-2 p-3 bg-slate-50 border border-slate-200/90 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <Fuel className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Withdrawal Gas Policy</span>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-100/80 text-indigo-800">
                  {gasFeeMode === 'zero-gas' ? '0.000000 ZERO GAS' : `0.000001 ${selectedCurrency}`}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  id="btn-withdraw-gas-zero"
                  onClick={() => setGasFeeMode('zero-gas')}
                  className={`p-2 rounded-lg border text-left transition-all ${
                    gasFeeMode === 'zero-gas'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-400'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="flex items-center gap-1">
                      <Droplets className="w-3 h-3 text-emerald-600" />
                      Zero Gas
                    </span>
                    <span className="font-mono text-[10px] text-emerald-700">0.000000</span>
                  </div>
                  <span className="text-[10px] text-emerald-700 block mt-0.5">
                    100% Relayer Sponsored
                  </span>
                </button>

                <button
                  type="button"
                  id="btn-withdraw-gas-micro"
                  onClick={() => setGasFeeMode('micro-gas')}
                  className={`p-2 rounded-lg border text-left transition-all ${
                    gasFeeMode === 'micro-gas'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-950 ring-1 ring-indigo-400'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="flex items-center gap-1">
                      <Fuel className="w-3 h-3 text-indigo-600" />
                      Real Micro-Gas
                    </span>
                    <span className="font-mono text-[10px] text-indigo-700">0.000001</span>
                  </div>
                  <span className="text-[10px] text-indigo-700 block mt-0.5">
                    Exact 0.000001 {selectedCurrency}
                  </span>
                </button>
              </div>

              {/* Net Settlement Breakdown */}
              <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-500">Net to Wallet:</span>
                <span className="font-bold text-slate-900">
                  {netReceived.toFixed(6)} {selectedCurrency}{' '}
                  <span className="text-slate-400 font-normal">
                    (≈ ${(netReceived * (selectedCurrency === 'ETH' ? CURRENT_ETH_PRICE_USD : CURRENT_SOL_PRICE_USD)).toFixed(2)} USD)
                  </span>
                </span>
              </div>
            </div>

            {/* Destination Wallet Preview */}
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
              <span className="text-[11px] text-slate-400 block">Destination Wallet:</span>
              {wallet && wallet.isConnected ? (
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-semibold text-slate-800 truncate max-w-[220px]">
                    {wallet.address}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600 uppercase">
                    {wallet.type}
                  </span>
                </div>
              ) : (
                <div className="text-xs text-amber-600 flex items-center gap-1.5 font-semibold">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>No wallet connected. Please connect MetaMask or Phantom above.</span>
                </div>
              )}
            </div>

            {statusMessage && (
              <div
                className={`p-3 rounded-xl border text-xs font-mono ${
                  statusMessage.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  {statusMessage.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{statusMessage.text}</span>
                </div>
                {statusMessage.explorerUrl && (
                  <div className="mt-2 pt-2 border-t border-emerald-200/60 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">On-Chain Verification:</span>
                    <a
                      href={statusMessage.explorerUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-indigo-700 underline flex items-center gap-1 font-bold"
                    >
                      <span>View Explorer Transaction</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={isProcessing || !wallet || !wallet.isConnected}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs font-mono rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <ArrowDownCircle className="w-4 h-4" />
              <span>
                {isProcessing
                  ? 'Requesting Wallet Signature...'
                  : `Withdraw ${withdrawAmount || '0'} ${selectedCurrency} to Wallet`}
              </span>
            </button>
          </form>

          {/* Past Withdrawals History */}
          {vault.withdrawalHistory.length > 0 && (
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <span className="text-xs font-bold text-slate-700 block">Recent Settlement Transfers</span>
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {vault.withdrawalHistory.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg text-xs font-mono flex items-center justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-800">
                          +{item.amount} {item.currency}
                        </span>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${
                            item.gasFeeMode === 'micro-gas'
                              ? 'bg-indigo-100 text-indigo-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {item.gasFeeMode === 'micro-gas'
                            ? `Gas: ${(item.gasFeePaid ?? (item.currency === 'ETH' ? MICRO_GAS_ETH : MICRO_GAS_SOL)).toFixed(6)}`
                            : 'Zero Gas'}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block">
                        Net: {(item.netReceived ?? item.amount).toFixed(6)} {item.currency} •{' '}
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <a
                      href={getExplorerUrl(wallet, item.txHash)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] text-indigo-600 hover:underline flex items-center gap-1 shrink-0 font-bold"
                    >
                      <span>Verified Tx</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Free Deposit Without Money & Testnet Faucet Hub */}
        <div className="lg:col-span-6 space-y-4">
          <div className="glass-panel p-6 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex items-center gap-2 text-indigo-700 text-xs font-bold font-mono">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>FREE DEPOSIT: ZERO-MONEY NFT CREATION</span>
            </div>

            <h4 className="text-sm font-bold text-slate-900 font-display">
              How to Create & Receive NFTs with $0.00 Upfront
            </h4>

            <p className="text-xs text-slate-600 leading-relaxed">
              You do not need personal funds to start creating and receiving NFTs. Web3 provides two legitimate, standard architectural pathways:
            </p>

            <div className="space-y-2.5 pt-1">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> 1. Gasless Lazy Minting (EIP-712)
                </span>
                <p className="text-[11px] text-slate-500 leading-normal">
                  The creator signs an on-chain voucher for free without paying gas. The NFT is anchored to your wallet and the blockchain mint fee is paid by the collector when sold.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Droplets className="w-3.5 h-3.5 text-teal-600" /> 2. Official Free Developer Faucets
                </span>
                <p className="text-[11px] text-slate-500 leading-normal">
                  Receive free testnet Ether and free testnet Solana directly to your MetaMask or Phantom wallet to deploy, mint, and test contracts without spending real currency.
                </p>
              </div>
            </div>

            {/* Official Faucet Links */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <span className="text-xs font-bold text-slate-700 block">Official Free Testnet Faucets</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                <a
                  href="https://sepoliafaucet.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="p-2.5 bg-indigo-50/70 hover:bg-indigo-100 border border-indigo-200 rounded-xl text-indigo-900 flex items-center justify-between transition-colors"
                >
                  <span className="font-semibold">Sepolia ETH Faucet</span>
                  <ExternalLink className="w-3.5 h-3.5 text-indigo-600" />
                </a>

                <a
                  href="https://faucet.solana.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="p-2.5 bg-teal-50/70 hover:bg-teal-100 border border-teal-200 rounded-xl text-teal-900 flex items-center justify-between transition-colors"
                >
                  <span className="font-semibold">Solana Devnet Faucet</span>
                  <ExternalLink className="w-3.5 h-3.5 text-teal-600" />
                </a>
              </div>
            </div>
          </div>

          {/* Honest Financial Perspective Disclaimer */}
          <div className="p-5 rounded-2xl border border-amber-200/80 bg-amber-50/70 space-y-2 text-xs text-amber-900">
            <div className="flex items-center gap-2 font-bold text-amber-800">
              <Info className="w-4 h-4 shrink-0" />
              <span>Financial Reality Disclosure</span>
            </div>
            <p className="leading-relaxed text-amber-800/90">
              Real Mainnet Ether and Solana are digital assets that carry monetary value. Web applications cannot unilaterally create free Mainnet ETH or SOL out of thin air. Real withdrawals come exclusively from genuine buyer purchases, peer-to-peer commissions, or testnet faucet distributions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
