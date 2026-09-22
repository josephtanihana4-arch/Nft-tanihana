import React, { useState } from 'react';
import {
  Wallet,
  CheckCircle2,
  ExternalLink,
  AlertCircle,
  LogOut,
  RefreshCw,
  Download,
  Fuel,
} from 'lucide-react';
import { ConnectedWallet, BlockchainNetwork } from '../types';
import {
  isMetaMaskInstalled,
  isPhantomInstalled,
  connectMetaMask,
  connectPhantom,
  getAddressExplorerUrl,
  getDeviceWalletInfo,
} from '../walletService';

interface WalletBarProps {
  wallet: ConnectedWallet | null;
  onWalletChange: (wallet: ConnectedWallet | null) => void;
}

// Official brand SVG Logos
const MetaMaskLogo = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 318.6 318.6" fill="currentColor">
    <path d="M274.1 35.5L176.4 112.4l18.9-63.5-21-13.4-65 49-65-49-21 13.4 18.9 63.5L44.5 35.5 0 88.5l43.2 44.5L18.4 207l115.8 84.1 115.8-84.1-24.8-74 43.2-44.5-44.5-53z" fill="#E17726"/>
    <path d="M228.4 133l-18.4-62.2-61.5 41.6 30.6 30.6 49.3-10zm-138.2 0l18.4-62.2 61.5 41.6-30.6 30.6-49.3-10zM159.3 226c-31 0-56.2-25.2-56.2-56.2 0-14.8 5.7-28.3 15.1-38.4l41.1 33.2 41.1-33.2c9.4 10.1 15.1 23.6 15.1 38.4 0 31-25.2 56.2-56.2 56.2z" fill="#E27625"/>
    <path d="M159.3 164.6l-29.1-23.5 29.1-65.7 29.1 65.7-29.1 23.5z" fill="#D36B1E"/>
  </svg>
);

const PhantomLogo = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 128 128" fill="currentColor">
    <path d="M64 0C28.7 0 0 28.7 0 64s28.7 64 64 64 64-28.7 64-64S99.3 0 64 0zm25.8 85.5c-1.3 1.5-3.5 1.8-5.2.7-10.7-7.2-24-8.7-39.7-4.6-2 .5-4-1-4.2-3.1-.2-2.1 1.2-3.9 3.3-4.4 17.5-4.5 32.5-2.7 44.9 5.6 1.7 1.1 2.2 3.2 0.9 4.8zm7.5-20.2c-1.6 1.3-3.8 1-5.1-.6-6.8-8.2-16.6-12.8-29.5-13.8-2.2-.2-3.8-2-3.6-4.2.2-2.2 2-3.8 4.2-3.6 15.3 1.2 26.9 6.7 34.8 16.2 1.3 1.6 1 3.9-.8 2z" fill="#AB9FF2"/>
    <path d="M64 24C41.9 24 24 41.9 24 64s17.9 40 40 40 40-17.9 40-40-17.9-40-40-40z" fill="#5A3EBE"/>
  </svg>
);

const EthereumLogo = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 784.37 1277.39" fill="currentColor">
    <path d="M392.07,0L383.5,28.1v827.7l8.57,8.57L784.37,594.51L392.07,0Z" fillOpacity="0.6"/>
    <path d="M392.07,0L0,594.51l392.07,239.86V0Z"/>
    <path d="M392.07,956.52l-4.6,5.61v315.26l4.6,13.38L784.37,672.45L392.07,956.52Z" fillOpacity="0.6"/>
    <path d="M392.07,1290.77V956.52L0,672.45l392.07,618.32Z"/>
    <path d="M392.07,834.37l392.07-239.86L392.07,354.51V834.37Z" fillOpacity="0.2"/>
    <path d="M0,594.51l392.07,239.86V354.51L0,594.51Z" fillOpacity="0.6"/>
  </svg>
);

const SolanaLogo = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 397.7 317.6" fill="currentColor">
    <path d="M64.6 213.7c-17.3 17.3-17.3 45.4 0 62.7s45.4 17.3 62.7 0l225-225c17.3-17.3 17.3-45.4 0-62.7s-45.4-17.3-62.7 0l-225 225z" fill="#14F195"/>
    <path d="M64.6 41.3c-17.3-17.3-45.4-17.3-62.7 0s-17.3 45.4 0 62.7l225 225c17.3 17.3 45.4 17.3 62.7 0s17.3-45.4 0-62.7l-225-225z" fill="#9945FF"/>
    <path d="M333.1 140.9c-17.3-17.3-45.4-17.3-62.7 0l-225 225c-17.3 17.3-17.3 45.4 0 62.7s45.4 17.3 62.7 0l225-225c17.3-17.3 17.3-45.4 0-62.7z" fill="#00C2FF"/>
  </svg>
);


export default function WalletBar({ wallet, onWalletChange }: WalletBarProps) {
  const [connectingType, setConnectingType] = useState<'metamask' | 'phantom' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showInstallModal, setShowInstallModal] = useState<'metamask' | 'phantom' | null>(null);

  const handleConnect = async (type: 'metamask' | 'phantom') => {
    setErrorMessage(null);
    setConnectingType(type);

    try {
      if (type === 'metamask') {
        if (!isMetaMaskInstalled()) {
          setShowInstallModal('metamask');
          setConnectingType(null);
          return;
        }
        const connected = await connectMetaMask();
        onWalletChange(connected);
      } else {
        if (!isPhantomInstalled()) {
          setShowInstallModal('phantom');
          setConnectingType(null);
          return;
        }
        const connected = await connectPhantom();
        onWalletChange(connected);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Connection failed.');
    } finally {
      setConnectingType(null);
    }
  };

  const handleDisconnect = () => {
    onWalletChange(null);
  };

  return (
    <div id="wallet-connection-bar" className="w-full">
      {wallet && wallet.isConnected ? (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white/90 border border-slate-200 rounded-2xl shadow-xs">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-xs ${
                wallet.type === 'metamask'
                  ? 'bg-amber-100 border border-amber-300'
                  : 'bg-purple-100 border border-purple-300'
              }`}
            >
              {wallet.type === 'metamask' ? (
                <MetaMaskLogo className="w-5 h-5 text-amber-600" />
              ) : (
                <PhantomLogo className="w-5 h-5 text-purple-600" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800 font-display capitalize">
                  {wallet.type} Connected
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {wallet.networkName}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono text-slate-500 mt-0.5">
                <span className="truncate max-w-[140px] sm:max-w-[200px]" title={wallet.address}>
                  {wallet.address}
                </span>
                <span className="font-bold text-slate-800">
                  {wallet.balance} {wallet.network === 'ethereum' ? 'ETH' : 'SOL'}
                </span>
                <button
                  type="button"
                  id="btn-refresh-balance"
                  onClick={() => handleConnect(wallet.type as any)}
                  className="p-1 text-slate-400 hover:text-indigo-600 rounded-md transition-colors"
                  title="Refresh Balance"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${connectingType !== null ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden lg:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200/80 text-[11px] font-mono text-slate-700">
              <Fuel className="w-3.5 h-3.5 text-indigo-600" />
              <span>Gas: <strong>0.000000 Free</strong> or <strong>0.000001 Real</strong></span>
            </div>

            <a
              href={getAddressExplorerUrl(wallet)}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-indigo-600 hover:text-indigo-800 font-mono flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 transition-colors"
            >
              <span>Explorer</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <button
              type="button"
              id="btn-disconnect-wallet"
              onClick={handleDisconnect}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title="Disconnect Wallet"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-white/80 border border-slate-200/90 rounded-2xl shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-slate-100 rounded-xl text-slate-600">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800">Connect Web3 Wallet</span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 capitalize">
                  {getDeviceWalletInfo().deviceType} Wallet Detected
                </span>
              </div>
              <div className="text-[11px] text-slate-400">
                Supports Mobile & Laptop Wallets (MetaMask, Phantom, Coinbase, Trust) • Real Mainnet On-Chain
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* MetaMask Button */}
            <button
              type="button"
              id="btn-connect-metamask"
              disabled={connectingType !== null}
              onClick={() => handleConnect('metamask')}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold font-mono transition-all bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 shadow-2xs active:scale-95"
            >
              <MetaMaskLogo className="w-4 h-4" />
              <span>
                {connectingType === 'metamask' ? 'Connecting...' : 'MetaMask (ETH)'}
              </span>
            </button>

            {/* Phantom Button */}
            <button
              type="button"
              id="btn-connect-phantom"
              disabled={connectingType !== null}
              onClick={() => handleConnect('phantom')}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold font-mono transition-all bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 shadow-2xs active:scale-95"
            >
              <PhantomLogo className="w-4 h-4" />
              <span>
                {connectingType === 'phantom' ? 'Connecting...' : 'Phantom (SOL)'}
              </span>
            </button>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="mt-2 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2 font-mono">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Extension Install / Sandbox Guidance Modal */}
      {showInstallModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900 font-display">
                  {showInstallModal === 'metamask' ? 'MetaMask' : 'Phantom'} Not Detected
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowInstallModal(null)}
                className="text-slate-400 hover:text-slate-700 font-bold p-1 text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              We couldn't detect the{' '}
              <strong>{showInstallModal === 'metamask' ? 'MetaMask' : 'Phantom'}</strong> browser
              extension in this environment. To connect your real personal wallet, install the
              official extension below:
            </p>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <a
                href={
                  showInstallModal === 'metamask'
                    ? 'https://metamask.io/download/'
                    : 'https://phantom.app/download'
                }
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>
                  Install {showInstallModal === 'metamask' ? 'MetaMask' : 'Phantom'} Extension
                </span>
                <ExternalLink className="w-3.5 h-3.5 ml-1 opacity-70" />
              </a>
            </div>

            <div className="pt-2 border-t border-slate-100 text-center">
              <p className="text-[10px] text-slate-400">
                A verified Web3 wallet is required for all operations.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
