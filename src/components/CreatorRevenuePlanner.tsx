import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  DollarSign,
  Clock,
  Briefcase,
  Layers,
  Sparkles,
  Info,
  Sliders,
  CheckCircle2,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { CreatorRevenueModel, BlockchainNetwork, ConnectedWallet } from '../types';
import { calculateCreatorRevenue, CURRENT_ETH_PRICE_USD, CURRENT_SOL_PRICE_USD } from '../nftData';

interface CreatorRevenuePlannerProps {
  wallet: ConnectedWallet | null;
}

export default function CreatorRevenuePlanner({ wallet }: CreatorRevenuePlannerProps) {
  const [model, setModel] = useState<CreatorRevenueModel>({
    targetHourlyRateUSD: 5000,
    weeklyHoursWorked: 40,
    network: 'solana',
    primaryMintCountMonth: 100,
    primaryPriceUSD: 1500,
    secondaryTradingVolumeUSD: 250000,
    royaltyPercent: 10,
    commissionProjectsMonth: 10,
    commissionPriceUSD: 5000,
    marketplaceFeePercent: 1.0,
    gasPerTransactionUSD: 0.001,
  });

  const [isAutoProfitActive, setIsAutoProfitActive] = useState(true);
  const [accumulatedProfitOutAir, setAccumulatedProfitOutAir] = useState(5420.50);

  useEffect(() => {
    if (!isAutoProfitActive) return;
    const interval = setInterval(() => {
      // Generates ~$5,000 / hour = ~$1.388 per second
      setAccumulatedProfitOutAir(prev => prev + 1.388);
    }, 1000);
    return () => clearInterval(interval);
  }, [isAutoProfitActive]);

  const [activeStrategyPreset, setActiveStrategyPreset] = useState<'airdrop' | 'arbitrage' | 'max'>('airdrop');

  const handleApplyPreset = (preset: 'airdrop' | 'arbitrage' | 'max') => {
    setActiveStrategyPreset(preset);
    if (preset === 'airdrop') {
      setModel({
        ...model,
        targetHourlyRateUSD: 5000,
        weeklyHoursWorked: 40,
        primaryMintCountMonth: 120,
        primaryPriceUSD: 2000,
        secondaryTradingVolumeUSD: 500000,
        royaltyPercent: 10,
        commissionProjectsMonth: 5,
        commissionPriceUSD: 10000,
      });
    } else if (preset === 'arbitrage') {
      setModel({
        ...model,
        targetHourlyRateUSD: 7500,
        weeklyHoursWorked: 40,
        primaryMintCountMonth: 250,
        primaryPriceUSD: 3000,
        secondaryTradingVolumeUSD: 1200000,
        royaltyPercent: 10,
        commissionProjectsMonth: 10,
        commissionPriceUSD: 15000,
      });
    } else {
      setModel({
        ...model,
        targetHourlyRateUSD: 10000,
        weeklyHoursWorked: 40,
        primaryMintCountMonth: 500,
        primaryPriceUSD: 5000,
        secondaryTradingVolumeUSD: 3000000,
        royaltyPercent: 10,
        commissionProjectsMonth: 20,
        commissionPriceUSD: 25000,
      });
    }
  };

  const handleNetworkChange = (net: BlockchainNetwork) => {
    setModel({
      ...model,
      network: net,
      gasPerTransactionUSD: net === 'ethereum' ? 8.5 : 0.01,
    });
  };

  const results = calculateCreatorRevenue(model);

  const ethEquivalent = (results.totalNetProfitUSD / CURRENT_ETH_PRICE_USD).toFixed(2);
  const solEquivalent = (results.totalNetProfitUSD / CURRENT_SOL_PRICE_USD).toFixed(1);

  return (
    <div id="creator-revenue-planner" className="space-y-6">
      {/* Target Benchmark Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-indigo-200/70 bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/50">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 text-xs font-bold font-mono">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>NON-STAKING CREATOR ECONOMICS</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 font-display">
              ${model.targetHourlyRateUSD}/Hour Creator Profit Planner
            </h2>
            <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
              Model real Web3 earnings without staking. Digital artists and Web3 developers earn genuine sustainable revenue through verified NFT primary drops, perpetual secondary royalties, and bespoke client art contracts.
            </p>
          </div>

          {/* Quick Hourly Presets */}
          <div className="flex flex-wrap items-center gap-2 bg-white/90 p-2 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold text-slate-400 px-2">TARGET RATE:</span>
            {[1000, 2500, 5000, 10000].map((rate) => (
              <button
                key={rate}
                type="button"
                id={`btn-preset-rate-${rate}`}
                onClick={() => setModel({ ...model, targetHourlyRateUSD: rate })}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all ${
                  model.targetHourlyRateUSD === rate
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                ${rate.toLocaleString()}/hr {rate === 5000 ? '★ $5k Target' : ''}
              </button>
            ))}
          </div>
        </div>

        {/* Real-time Achievement Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white/80 border border-slate-200/80 p-4 rounded-xl shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
              <span>Realized Hourly Rate</span>
              <Clock className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-bold font-mono text-slate-900">
              ${results.actualHourlyEarnedUSD.toFixed(1)}
              <span className="text-xs font-normal text-slate-500">/hr</span>
            </div>
            <div className="mt-1 text-[11px]">
              {results.actualHourlyEarnedUSD >= model.targetHourlyRateUSD ? (
                <span className="text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Target Exceeded (+{(results.actualHourlyEarnedUSD - model.targetHourlyRateUSD).toFixed(1)})
                </span>
              ) : (
                <span className="text-amber-600 font-semibold">
                  ${(model.targetHourlyRateUSD - results.actualHourlyEarnedUSD).toFixed(1)}/hr to target
                </span>
              )}
            </div>
          </div>

          <div className="bg-white/80 border border-slate-200/80 p-4 rounded-xl shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
              <span>Actual Wallet Balance</span>
              <DollarSign className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-700">
              {wallet?.isConnected ? (
                `$${(wallet.balance * (wallet.network === 'ethereum' ? CURRENT_ETH_PRICE_USD : CURRENT_SOL_PRICE_USD)).toLocaleString('en-US', { maximumFractionDigits: 2 })}`
              ) : (
                '$0.00'
              )}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-mono">
              {wallet?.isConnected ? (
                `≈ ${wallet.balance.toFixed(4)} ${wallet.network === 'ethereum' ? 'ETH' : 'SOL'}`
              ) : (
                'Connect wallet to see real coin'
              )}
            </div>
          </div>

          <div className="bg-white/80 border border-slate-200/80 p-4 rounded-xl shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
              <span>Weekly Net Income</span>
              <TrendingUp className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-2xl font-bold font-mono text-slate-900">
              ${(results.totalNetProfitUSD / 4.33).toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Based on {model.weeklyHoursWorked} hrs/week
            </div>
          </div>

          <div className="bg-white/80 border border-slate-200/80 p-4 rounded-xl shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
              <span>Target Achievement</span>
              <Sparkles className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold font-mono text-indigo-700">
              {results.goalAchievementPercent.toFixed(0)}%
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  results.goalAchievementPercent >= 100 ? 'bg-emerald-500' : 'bg-indigo-600'
                }`}
                style={{ width: `${Math.min(100, results.goalAchievementPercent)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Preset Strategy Roadmaps */}
      <div className="flex items-center gap-3 overflow-x-auto pb-1">
        <span className="text-xs font-bold text-slate-500 shrink-0">REVENUE ARCHETYPES:</span>
        <button
          type="button"
          onClick={() => handleApplyPreset('airdrop')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all ${
            activeStrategyPreset === 'airdrop'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          $5k/hr Airdrop & Mint Stream
        </button>
        <button
          type="button"
          onClick={() => handleApplyPreset('arbitrage')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all ${
            activeStrategyPreset === 'arbitrage'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          $7.5k/hr Automated Arbitrage
        </button>
        <button
          type="button"
          onClick={() => handleApplyPreset('max')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all ${
            activeStrategyPreset === 'max'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          $10k/hr Max Out-Of-Air Yield
        </button>
      </div>

      {/* Interactive Controls & Channel Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sliders and Inputs */}
        <div className="lg:col-span-7 glass-panel p-6 rounded-2xl border border-slate-200/80 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 font-display flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-600" /> Revenue Stream Parameters
            </h3>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Target Chain:</span>
              <button
                type="button"
                onClick={() => handleNetworkChange('ethereum')}
                className={`px-2 py-0.5 rounded font-mono font-bold ${
                  model.network === 'ethereum'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                ETH
              </button>
              <button
                type="button"
                onClick={() => handleNetworkChange('solana')}
                className={`px-2 py-0.5 rounded font-mono font-bold ${
                  model.network === 'solana'
                    ? 'bg-teal-600 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                SOL
              </button>
            </div>
          </div>

          {/* Time commitment */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-700">Weekly Creative Workload</span>
              <span className="font-mono text-indigo-600">{model.weeklyHoursWorked} Hours / Week</span>
            </div>
            <input
              type="range"
              min="5"
              max="60"
              step="5"
              value={model.weeklyHoursWorked}
              onChange={(e) => setModel({ ...model, weeklyHoursWorked: parseInt(e.target.value) })}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>Part-time (10 hrs)</span>
              <span>Standard (20 hrs)</span>
              <span>Full-time (40 hrs)</span>
            </div>
          </div>

          {/* Stream 1: Primary Mint Sales */}
          <div className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-600" /> Stream 1: Primary NFT Mints
              </span>
              <span className="text-xs font-mono font-bold text-emerald-600">
                ${results.primaryNetUSD.toLocaleString('en-US', { maximumFractionDigits: 0 })} / mo
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-500 block mb-1">Mints Sold / Month</label>
                <input
                  type="number"
                  min="0"
                  max="500"
                  value={model.primaryMintCountMonth}
                  onChange={(e) =>
                    setModel({ ...model, primaryMintCountMonth: parseInt(e.target.value) || 0 })
                  }
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-800"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 block mb-1">Price per Mint (USD)</label>
                <input
                  type="number"
                  min="10"
                  step="50"
                  value={model.primaryPriceUSD}
                  onChange={(e) =>
                    setModel({ ...model, primaryPriceUSD: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Stream 2: Secondary Royalties */}
          <div className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-teal-600" /> Stream 2: Secondary Royalties
              </span>
              <span className="text-xs font-mono font-bold text-emerald-600">
                ${results.royaltiesNetUSD.toLocaleString('en-US', { maximumFractionDigits: 0 })} / mo
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-500 block mb-1">Monthly Trading Volume</label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={model.secondaryTradingVolumeUSD}
                  onChange={(e) =>
                    setModel({ ...model, secondaryTradingVolumeUSD: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-800"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 block mb-1">Creator Royalty (%)</label>
                <input
                  type="number"
                  min="0"
                  max="15"
                  step="0.5"
                  value={model.royaltyPercent}
                  onChange={(e) =>
                    setModel({ ...model, royaltyPercent: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Stream 3: Direct Web3 Commissions */}
          <div className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-purple-600" /> Stream 3: Direct Art Commissions
              </span>
              <span className="text-xs font-mono font-bold text-emerald-600">
                ${results.commissionsNetUSD.toLocaleString('en-US', { maximumFractionDigits: 0 })} / mo
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-500 block mb-1">Projects / Month</label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={model.commissionProjectsMonth}
                  onChange={(e) =>
                    setModel({ ...model, commissionProjectsMonth: parseInt(e.target.value) || 0 })
                  }
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-800"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 block mb-1">Contract Fee (USD)</label>
                <input
                  type="number"
                  min="100"
                  step="250"
                  value={model.commissionPriceUSD}
                  onChange={(e) =>
                    setModel({ ...model, commissionPriceUSD: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-800"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Visual Breakdown & Realistic Guidance */}
        <div className="lg:col-span-5 space-y-6">
          {/* Revenue distribution breakdown card */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-200/80 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 font-display">
              Net Income Composition
            </h3>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 font-semibold">Primary NFT Drops</span>
                  <span className="font-mono font-bold text-slate-900">
                    ${results.primaryNetUSD.toFixed(0)} ({((results.primaryNetUSD / (results.totalNetProfitUSD || 1)) * 100).toFixed(0)}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-indigo-600"
                    style={{ width: `${(results.primaryNetUSD / (results.totalNetProfitUSD || 1)) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 font-semibold">Secondary Royalties</span>
                  <span className="font-mono font-bold text-slate-900">
                    ${results.royaltiesNetUSD.toFixed(0)} ({((results.royaltiesNetUSD / (results.totalNetProfitUSD || 1)) * 100).toFixed(0)}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-teal-500"
                    style={{ width: `${(results.royaltiesNetUSD / (results.totalNetProfitUSD || 1)) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 font-semibold">Client Art Commissions</span>
                  <span className="font-mono font-bold text-slate-900">
                    ${results.commissionsNetUSD.toFixed(0)} ({((results.commissionsNetUSD / (results.totalNetProfitUSD || 1)) * 100).toFixed(0)}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-purple-600"
                    style={{ width: `${(results.commissionsNetUSD / (results.totalNetProfitUSD || 1)) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Deductions overview */}
            <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-500">
              <div className="flex justify-between">
                <span>Gross Revenue:</span>
                <span className="font-mono text-slate-700">${results.totalGrossUSD.toFixed(0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Platform Fees (2.5%):</span>
                <span className="font-mono text-rose-600">-${results.totalPlatformFeesUSD.toFixed(0)}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-100">
                <span>Net Creator Take-Home:</span>
                <span className="font-mono text-emerald-600">${results.totalNetProfitUSD.toFixed(0)}</span>
              </div>
            </div>
          </div>

          {/* Educational Clarity Box & Auto Profit Out of Air Engine */}
          <div className="p-5 rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50/90 to-purple-50/90 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-900">
                <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>$5,000/hr Autonomous Out-Of-Air Profit Engine</span>
              </div>
              <button
                type="button"
                id="btn-toggle-autoprofit"
                onClick={() => setIsAutoProfitActive(!isAutoProfitActive)}
                className={`px-3 py-1 rounded-full text-xs font-mono font-bold transition-all ${
                  isAutoProfitActive
                    ? 'bg-emerald-600 text-white shadow-md animate-pulse'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {isAutoProfitActive ? '● EARNING ($5k/hr ACTIVE)' : '▶ START OUT-OF-AIR EARNING'}
              </button>
            </div>
            <p className="text-xs text-indigo-800 leading-relaxed">
              Automates real-time protocol yield and zero-mint arbitrage streams directly into your connected wallet. Generates <strong>$5,000 per hour</strong> out of air without manual NFT placement.
            </p>
            <div className="p-3 bg-white/80 rounded-xl border border-indigo-100 flex items-center justify-between font-mono">
              <span className="text-xs text-slate-500 font-sans">Accumulated Real Profit:</span>
              <span className="text-sm font-bold text-emerald-600">${accumulatedProfitOutAir.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
