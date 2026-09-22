import React, { useState } from 'react';
import {
  HelpCircle,
  ShieldCheck,
  Zap,
  Diamond,
  AlertTriangle,
  DollarSign,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface FAQ {
  question: string;
  answer: string;
  badge: string;
}

const FAQS: FAQ[] = [
  {
    badge: 'Creator Economics',
    question: 'How do Web3 digital creators legitimately earn $200/hour without staking?',
    answer:
      'In genuine market economies, $200/hour is earned through skill, commercial value, and intellectual property. For Web3 creators, this involves three real channels: (1) Primary mint sales of 1/1 original art and limited collections, (2) Enforceable on-chain secondary royalties (typically 5%–10%) as art changes hands on OpenSea, Magic Eden, or Tensor, and (3) Direct commercial freelance contracts for gaming studios, decentralized brands, and NFT protocols. These generate real revenue from paying clients and collectors, not artificial token emissions.',
  },
  {
    badge: 'Risk Analysis',
    question: 'Why avoid promises of "guaranteed 5,000% staking yields"?',
    answer:
      'Any platform promising "guaranteed real profit", "guaranteed 5,000 ROI", or passive daily windfalls is describing an unsustainable model or a scam. Real blockchain staking yields derive strictly from network transaction fees and protocol inflation (typically 3% to 7% annually on Ethereum or Solana). High artificial APYs invariably lead to token dilution, liquidity collapse, or rug pulls. Sustainable Web3 careers focus on product creation, utility, and verified ownership rather than staking gimmicks.',
  },
  {
    badge: 'Chain Comparison',
    question: 'Ethereum vs. Solana: Which chain is better for NFT creators?',
    answer:
      'Both ecosystems have distinct strengths. Ethereum (ERC-721 / ERC-1155) is the historic home of high-valuation 1/1 fine art, institutional collectors, and high-ticket auction records; however, it has higher gas fees during network congestion. Solana (Metaplex) offers lightning-fast ~400ms block finality and fractions of a cent ($0.0002) in minting fees, making it ideal for high-volume drops, interactive dynamic NFTs, and low-barrier digital collectibles.',
  },
  {
    badge: 'Web3 Gas Architecture',
    question: 'How do Zero Gas Fee (Free Deposit) and Real 0.000001 Gas Fee work?',
    answer:
      'We support two distinct Web3 execution modes: (1) Zero Gas Fee (0.000000 ETH/SOL Free Deposit): Utilizes ERC-4337 Account Abstraction paymasters, EIP-712 lazy-minting signatures, and Solana relayer subsidies. This enables creators to register ownership vouchers with $0.00 initial capital. (2) Real Micro-Gas Fee (0.000001 ETH/SOL): Sets an ultra-low, fixed 0.000001 cryptocurrency gas fee (≈ $0.0034 on Ethereum / ≈ $0.00015 on Solana). This provides transparent on-chain broadcasting and cryptographic anchoring while minimizing transaction overhead.',
  },
  {
    badge: 'Ownership Standards',
    question: 'What is the role of JSON metadata and decentralized IPFS storage?',
    answer:
      'An NFT on-chain is a cryptographic token pointing to a structured metadata JSON file (ERC-721 or Metaplex). This JSON links the digital artwork URI (stored permanently on IPFS or Arweave), the creator wallet address, royalty fee basis points, and custom attributes. By exporting standard-compliant metadata from this studio, your assets can be directly uploaded to decentralized storage and minted via any standard smart contract.',
  },
];

export default function Web3CreatorEducation() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleIndex = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <div id="web3-creator-education" className="glass-panel p-6 rounded-2xl border border-slate-200/80 space-y-6">
      <div className="flex items-center gap-3">
        <span className="p-2 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600">
          <HelpCircle className="w-5 h-5" />
        </span>
        <div>
          <h2 className="text-lg font-bold text-slate-900 font-display">
            Web3 Creator Handbook & Economic Insights
          </h2>
          <p className="text-xs text-slate-500">
            Transparent guide to NFT standards, creator ownership, and sustainable digital career modeling
          </p>
        </div>
      </div>

      {/* Chain Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-slate-50/80 border border-indigo-100 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-indigo-800 text-xs font-bold font-mono">
            <Diamond className="w-4 h-4 text-indigo-600" />
            <span>ETHEREUM CREATOR SUITE</span>
          </div>
          <ul className="text-xs text-slate-600 space-y-1.5 font-mono">
            <li>• Standard: ERC-721 (Unique 1/1) & ERC-1155 (Multi-edition)</li>
            <li>• Key Marketplaces: OpenSea, SuperRare, Foundation</li>
            <li>• Typical 1/1 Valuation: $500 – $10,000+ per piece</li>
            <li>• Gas Cost: $3 – $15 per deployment</li>
          </ul>
        </div>

        <div className="p-4 bg-slate-50/80 border border-teal-100 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-teal-800 text-xs font-bold font-mono">
            <Zap className="w-4 h-4 text-teal-600" />
            <span>SOLANA METAPLEX SUITE</span>
          </div>
          <ul className="text-xs text-slate-600 space-y-1.5 font-mono">
            <li>• Standard: Metaplex Certified NFT / Metaplex Core</li>
            <li>• Key Marketplaces: Magic Eden, Tensor, Exchange.art</li>
            <li>• Typical Valuation: 1 – 30+ SOL per piece</li>
            <li>• Gas Cost: &lt; $0.01 per mint (instant settlement)</li>
          </ul>
        </div>
      </div>

      {/* Accordion FAQs */}
      <div className="space-y-3 pt-2">
        {FAQS.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className="border border-slate-200/80 rounded-xl overflow-hidden bg-white/70"
            >
              <button
                type="button"
                onClick={() => toggleIndex(idx)}
                className="w-full p-4 text-left flex items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-600 border border-slate-200">
                    {faq.badge}
                  </span>
                  <span className="text-xs font-bold text-slate-800">{faq.question}</span>
                </div>
                {isOpen ? (
                  <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                )}
              </button>

              {isOpen && (
                <div className="px-4 pb-4 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
