import React, { useState, useRef } from 'react';
import {
  Layers,
  Upload,
  FileText,
  ListPlus,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Download,
  Copy,
  Trash2,
  Edit3,
  Plus,
  Check,
  AlertCircle,
  Fuel,
  ShieldCheck,
  FileCode,
  ExternalLink,
  Wallet,
  Diamond,
  Zap,
  Search,
  Sliders,
  X,
  Droplets,
  Terminal,
} from 'lucide-react';
import {
  BlockchainNetwork,
  NFTItem,
  NFTTrait,
  ConnectedWallet,
  GasFeeMode,
  BatchNFTEntry,
  BatchDeploymentLog,
  MICRO_GAS_ETH,
  MICRO_GAS_SOL,
} from '../types';
import {
  DEFAULT_ETHEREUM_OWNER,
  DEFAULT_SOLANA_OWNER,
  generateMetadataJSON,
  CURRENT_ETH_PRICE_USD,
  CURRENT_SOL_PRICE_USD,
  PROCEDURAL_ART_TEMPLATES,
} from '../nftData';
import { sendNFTToWallet, getExplorerUrl } from '../walletService';

interface BatchNFTStudioProps {
  wallet: ConnectedWallet | null;
  onMintNFT: (nft: NFTItem) => void;
}

export default function BatchNFTStudio({ wallet, onMintNFT }: BatchNFTStudioProps) {
  // Input Method state: 'generator' | 'csv' | 'json'
  const [importMethod, setImportMethod] = useState<'generator' | 'csv' | 'json'>('generator');

  // Network selection for batch
  const [batchNetwork, setBatchNetwork] = useState<BlockchainNetwork>(wallet?.network || 'ethereum');
  const [gasFeeMode, setGasFeeMode] = useState<GasFeeMode>('micro-gas');

  // Batch Generator Form state
  const [genPrefix, setGenPrefix] = useState('Cyber Vanguard');
  const [genSymbol, setGenSymbol] = useState('CVANG');
  const [genCount, setGenCount] = useState<number>(5);
  const [genPriceUSD, setGenPriceUSD] = useState<number>(250);
  const [genRoyalty, setGenRoyalty] = useState<number>(5.0);
  const [genSupply, setGenSupply] = useState<number>(1);
  const [genDescription, setGenDescription] = useState(
    'A high-fidelity digital collectible generated as part of a creator-verified Web3 series with embedded royalties.'
  );
  const [genImageBase, setGenImageBase] = useState<string>('');
  const [genIncludeTraits, setGenIncludeTraits] = useState<boolean>(true);

  // Paste Text state
  const [csvText, setCsvText] = useState<string>('');
  const [jsonText, setJsonText] = useState<string>('');
  const [parseError, setParseError] = useState<string | null>(null);

  // Main Batch Queue state
  const [queue, setQueue] = useState<BatchNFTEntry[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'minted' | 'failed'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Editing Item modal/drawer state
  const [editingItem, setEditingItem] = useState<BatchNFTEntry | null>(null);

  // Execution & Queue runner state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const isPausedRef = useRef(false);
  isPausedRef.current = isPaused;

  const [logs, setLogs] = useState<BatchDeploymentLog[]>([]);
  const [copiedLogJson, setCopiedLogJson] = useState<boolean>(false);

  // File upload ref
  const csvFileInputRef = useRef<HTMLInputElement>(null);
  const jsonFileInputRef = useRef<HTMLInputElement>(null);

  // Helper to add log
  const addLog = (
    type: 'info' | 'success' | 'warning' | 'error',
    message: string,
    txHash?: string,
    explorerUrl?: string
  ) => {
    setLogs((prev) => [
      {
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        timestamp: Date.now(),
        type,
        message,
        txHash,
        explorerUrl,
      },
      ...prev,
    ]);
  };

  // 1. GENERATE BATCH FROM SEQUENCE
  const handleGenerateBatch = (e: React.FormEvent) => {
    e.preventDefault();
    setParseError(null);

    const newEntries: BatchNFTEntry[] = [];
    const owner = wallet?.address || (batchNetwork === 'ethereum' ? DEFAULT_ETHEREUM_OWNER : DEFAULT_SOLANA_OWNER);
    const creator = owner;
    const tokenStandard =
      batchNetwork === 'ethereum'
        ? genSupply === 1
          ? 'ERC-721'
          : 'ERC-1155'
        : 'Metaplex Master Edition';

    const rarityTiers = ['Mythic 1/1', 'Legendary', 'Epic', 'Rare', 'Uncommon', 'Common'];
    const factions = ['Neon Syndicate', 'Solaris Guild', 'Void Alliance', 'Cyber Cybernetics', 'Quantum Core'];

    for (let i = 1; i <= genCount; i++) {
      const numFormatted = i.toString().padStart(3, '0');
      const itemTitle = `${genPrefix} #${numFormatted}`;

      // Image selection: custom base URL or preset procedural SVG template rotation
      const presetTemplate = PROCEDURAL_ART_TEMPLATES[(i - 1) % PROCEDURAL_ART_TEMPLATES.length];
      const imageUrl =
        genImageBase.trim() !== ''
          ? genImageBase.replace('{n}', i.toString()).replace('{0n}', numFormatted)
          : '';

      const traits: NFTTrait[] = [];
      if (genIncludeTraits) {
        traits.push({
          id: `t1-${i}`,
          trait_type: 'Rarity Tier',
          value: rarityTiers[(i - 1) % rarityTiers.length],
        });
        traits.push({
          id: `t2-${i}`,
          trait_type: 'Faction',
          value: factions[(i - 1) % factions.length],
        });
        traits.push({
          id: `t3-${i}`,
          trait_type: 'Sequence Index',
          value: `#${numFormatted}`,
        });
      }

      newEntries.push({
        id: `batch-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
        name: itemTitle,
        symbol: genSymbol.toUpperCase(),
        description: genDescription,
        network: batchNetwork,
        ownerAddress: owner,
        creatorAddress: creator,
        imageUrl,
        royaltyFeePercent: genRoyalty,
        supply: genSupply,
        tokenStandard,
        attributes: traits,
        estimatedPriceUSD: genPriceUSD,
        gasFeeMode,
        status: 'pending',
      });
    }

    setQueue((prev) => [...prev, ...newEntries]);
    addLog('info', `Generated ${newEntries.length} new NFT metadata entries for "${genPrefix}".`);
  };

  // 2. PARSE CSV DATA
  const parseCSVContent = (content: string) => {
    try {
      setParseError(null);
      const lines = content
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      if (lines.length < 2) {
        throw new Error('CSV must contain a header row and at least one data row.');
      }

      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/[^a-z0-9_]/g, ''));
      const entries: BatchNFTEntry[] = [];
      const owner = wallet?.address || (batchNetwork === 'ethereum' ? DEFAULT_ETHEREUM_OWNER : DEFAULT_SOLANA_OWNER);

      for (let i = 1; i < lines.length; i++) {
        // Handle basic quoted CSV fields
        const row = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || lines[i].split(',');
        const values = row.map((v) => v.replace(/^"|"$/g, '').trim());

        const getVal = (possibleHeaders: string[], fallback: string = '') => {
          for (const ph of possibleHeaders) {
            const idx = headers.indexOf(ph);
            if (idx !== -1 && values[idx] !== undefined) {
              return values[idx];
            }
          }
          return fallback;
        };

        const itemName = getVal(['name', 'title', 'nft_name'], `Batch NFT #${i}`);
        const itemSymbol = getVal(['symbol', 'ticker'], 'BATCH').toUpperCase();
        const itemDesc = getVal(['description', 'desc'], 'NFT created via batch import studio.');
        const itemImg = getVal(['image', 'imageurl', 'img', 'uri'], '');
        const itemRoyalty = parseFloat(getVal(['royalty', 'royaltyfee', 'royalty_percent'], '5.0')) || 5.0;
        const itemSupply = parseInt(getVal(['supply', 'editions'], '1'), 10) || 1;
        const itemPrice = parseFloat(getVal(['price', 'priceusd', 'value'], '100')) || 100;

        // Parse traits from remaining columns or 'traits' column
        const traitsStr = getVal(['traits', 'attributes', 'properties'], '');
        const attributes: NFTTrait[] = [];

        if (traitsStr) {
          // Expected format: "TraitType:Value; TraitType2:Value2"
          const traitPairs = traitsStr.split(/;|\|/);
          traitPairs.forEach((tp, idx) => {
            const [k, v] = tp.split(':').map((s) => s.trim());
            if (k && v) {
              attributes.push({ id: `csv-trait-${i}-${idx}`, trait_type: k, value: v });
            }
          });
        }

        const tokenStandard =
          batchNetwork === 'ethereum'
            ? itemSupply === 1
              ? 'ERC-721'
              : 'ERC-1155'
            : 'Metaplex Master Edition';

        entries.push({
          id: `csv-batch-${Date.now()}-${i}`,
          name: itemName,
          symbol: itemSymbol,
          description: itemDesc,
          network: batchNetwork,
          ownerAddress: owner,
          creatorAddress: owner,
          imageUrl: itemImg,
          royaltyFeePercent: itemRoyalty,
          supply: itemSupply,
          tokenStandard,
          attributes,
          estimatedPriceUSD: itemPrice,
          gasFeeMode,
          status: 'pending',
        });
      }

      setQueue((prev) => [...prev, ...entries]);
      addLog('info', `Successfully parsed and queued ${entries.length} items from CSV.`);
    } catch (err: any) {
      setParseError(err.message || 'Failed to parse CSV file.');
      addLog('error', `CSV Parse Error: ${err.message || 'Invalid format'}`);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'csv' | 'json') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (type === 'csv') {
        parseCSVContent(content);
      } else {
        parseJSONContent(content);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // 3. PARSE JSON DATA
  const parseJSONContent = (content: string) => {
    try {
      setParseError(null);
      const parsed = JSON.parse(content);
      const itemsArray = Array.isArray(parsed) ? parsed : [parsed];

      const entries: BatchNFTEntry[] = [];
      const owner = wallet?.address || (batchNetwork === 'ethereum' ? DEFAULT_ETHEREUM_OWNER : DEFAULT_SOLANA_OWNER);

      itemsArray.forEach((item: any, i: number) => {
        const itemName = item.name || item.title || `JSON NFT #${i + 1}`;
        const itemSymbol = item.symbol || item.ticker || 'JNFT';
        const itemDesc = item.description || 'NFT created from JSON batch array.';
        const itemImg = item.image || item.imageUrl || item.image_url || '';
        const itemRoyalty = parseFloat(item.royaltyFeePercent || item.seller_fee_basis_points / 100 || 5.0) || 5.0;
        const itemSupply = parseInt(item.supply || 1, 10) || 1;
        const itemPrice = parseFloat(item.estimatedPriceUSD || item.priceUSD || 150) || 150;

        let rawAttrs: any[] = item.attributes || item.traits || [];
        const attributes: NFTTrait[] = rawAttrs.map((a: any, idx: number) => ({
          id: `json-trait-${i}-${idx}`,
          trait_type: a.trait_type || a.traitType || a.name || 'Property',
          value: String(a.value || a.val || ''),
        }));

        const tokenStandard =
          batchNetwork === 'ethereum'
            ? itemSupply === 1
              ? 'ERC-721'
              : 'ERC-1155'
            : 'Metaplex Master Edition';

        entries.push({
          id: `json-batch-${Date.now()}-${i}`,
          name: itemName,
          symbol: itemSymbol.toUpperCase(),
          description: itemDesc,
          network: batchNetwork,
          ownerAddress: owner,
          creatorAddress: owner,
          imageUrl: itemImg,
          royaltyFeePercent: itemRoyalty,
          supply: itemSupply,
          tokenStandard,
          attributes,
          estimatedPriceUSD: itemPrice,
          gasFeeMode,
          status: 'pending',
        });
      });

      setQueue((prev) => [...prev, ...entries]);
      addLog('info', `Successfully parsed and queued ${entries.length} items from JSON.`);
    } catch (err: any) {
      setParseError(err.message || 'Failed to parse JSON file.');
      addLog('error', `JSON Parse Error: ${err.message || 'Invalid JSON syntax'}`);
    }
  };

  // Sample CSV Download
  const handleDownloadSampleCSV = () => {
    const csvContent =
      `Name,Symbol,Description,ImageUrl,RoyaltyFeePercent,Supply,PriceUSD,Traits\n` +
      `Cyber Vanguard #001,CVANG,"Rare cybernetic artifact on Ethereum.",https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe,7.5,1,300,"Rarity Tier:Mythic; Faction:Neon Syndicate; Element:Quantum"\n` +
      `Cyber Vanguard #002,CVANG,"EVM verified digital asset with royalties.",https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4,7.5,1,300,"Rarity Tier:Legendary; Faction:Solaris Guild; Element:Plasma"\n` +
      `Cyber Vanguard #003,CVANG,"Batch minted creator-owned NFT.",https://images.unsplash.com/photo-1620641788421-7a1c342ea42e,7.5,1,300,"Rarity Tier:Epic; Faction:Void Alliance; Element:Cyber"`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sample-nft-collection.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  // Sample JSON Download
  const handleDownloadSampleJSON = () => {
    const sampleJSON = [
      {
        name: 'Solana Solar Beacon #001',
        symbol: 'SOLBEACON',
        description: 'Certified Metaplex Master Edition NFT defined via batch JSON.',
        image: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4',
        royaltyFeePercent: 5.0,
        supply: 1,
        estimatedPriceUSD: 200,
        attributes: [
          { trait_type: 'Cluster', value: 'Validator Prime' },
          { trait_type: 'Speed', value: '400ms TPS' },
        ],
      },
      {
        name: 'Solana Solar Beacon #002',
        symbol: 'SOLBEACON',
        description: 'High performance Web3 digital collectible.',
        image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe',
        royaltyFeePercent: 5.0,
        supply: 1,
        estimatedPriceUSD: 200,
        attributes: [
          { trait_type: 'Cluster', value: 'Metaplex Core' },
          { trait_type: 'Speed', value: 'Sub-second' },
        ],
      },
    ];

    const blob = new Blob([JSON.stringify(sampleJSON, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sample-nft-collection.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  // Bulk Actions
  const handleApplyWalletToAll = () => {
    if (!wallet || !wallet.address) {
      alert('Please connect your wallet first.');
      return;
    }
    setQueue((prev) =>
      prev.map((item) => ({
        ...item,
        ownerAddress: wallet.address,
        creatorAddress: wallet.address,
        network: wallet.network,
      }))
    );
    addLog('info', `Updated wallet address for all queued items to ${wallet.address}`);
  };

  const handleSetNetworkAll = (net: BlockchainNetwork) => {
    setBatchNetwork(net);
    setQueue((prev) =>
      prev.map((item) => ({
        ...item,
        network: net,
        tokenStandard:
          net === 'ethereum'
            ? item.supply === 1
              ? 'ERC-721'
              : 'ERC-1155'
            : 'Metaplex Master Edition',
      }))
    );
    addLog('info', `Switched all queue items to ${net.toUpperCase()} network.`);
  };

  const handleSetGasModeAll = (mode: GasFeeMode) => {
    setGasFeeMode(mode);
    setQueue((prev) => prev.map((item) => ({ ...item, gasFeeMode: mode })));
    addLog('info', `Set gas fee policy for all queue items to ${mode === 'zero-gas' ? 'Zero Gas' : 'Micro-Gas'}.`);
  };

  const handleExportQueueJSON = () => {
    const queueExport = queue.map((item) => ({
      name: item.name,
      symbol: item.symbol,
      description: item.description,
      image: item.imageUrl,
      network: item.network,
      creatorAddress: item.creatorAddress,
      ownerAddress: item.ownerAddress,
      royaltyFeePercent: item.royaltyFeePercent,
      supply: item.supply,
      attributes: item.attributes.map((a) => ({ trait_type: a.trait_type, value: a.value })),
      estimatedPriceUSD: item.estimatedPriceUSD,
      metadataJson: generateMetadataJSON(item),
    }));

    const blob = new Blob([JSON.stringify(queueExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `batch-queue-export-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    addLog('info', 'Exported batch queue metadata as JSON file.');
  };

  const handleClearQueue = () => {
    if (confirm('Are you sure you want to clear the entire deployment queue?')) {
      setQueue([]);
      addLog('warning', 'Cleared all items from the batch deployment queue.');
    }
  };

  const handleDeleteItem = (id: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
  };

  const handleDuplicateItem = (item: BatchNFTEntry) => {
    const newItem: BatchNFTEntry = {
      ...item,
      id: `copy-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: `${item.name} (Copy)`,
      status: 'pending',
      mintTxHash: undefined,
      explorerUrl: undefined,
    };
    setQueue((prev) => [...prev, newItem]);
  };

  // EXECUTE BATCH DEPLOYMENT QUEUE
  const handleStartBatchDeployment = async () => {
    const pendingItems = queue.filter((i) => i.status === 'pending' || i.status === 'failed');

    if (pendingItems.length === 0) {
      alert('There are no pending items in the queue to deploy.');
      return;
    }

    if (!wallet || !wallet.isConnected) {
      alert('Please connect your MetaMask or Phantom wallet to deploy batch NFTs on the blockchain.');
      return;
    }

    setIsProcessing(true);
    setIsPaused(false);
    addLog(
      'info',
      `Starting batch deployment for ${pendingItems.length} items on ${batchNetwork.toUpperCase()} using ${
        gasFeeMode === 'zero-gas' ? 'Zero-Gas Off-Chain Signature' : 'Real On-Chain Micro-Gas'
      }...`
    );

    for (const item of queue) {
      if (item.status === 'minted') continue;

      if (isPausedRef.current) {
        addLog('warning', 'Batch deployment paused by user.');
        break;
      }

      // Mark item as deploying
      setQueue((prev) =>
        prev.map((q) => (q.id === item.id ? { ...q, status: 'deploying' as const } : q))
      );

      addLog('info', `Deploying item [${item.name}] (${item.symbol})...`);

      try {
        const metadataJson = generateMetadataJSON({
          name: item.name,
          symbol: item.symbol,
          description: item.description,
          network: item.network,
          ownerAddress: wallet.address,
          creatorAddress: wallet.address,
          imageUrl: item.imageUrl || 'ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi',
          royaltyFeePercent: item.royaltyFeePercent,
          supply: item.supply,
          tokenStandard: item.tokenStandard,
          attributes: item.attributes,
          estimatedPriceUSD: item.estimatedPriceUSD,
        });

        const gasFeePaid =
          gasFeeMode === 'zero-gas'
            ? 0.000000
            : item.network === 'ethereum'
            ? MICRO_GAS_ETH
            : MICRO_GAS_SOL;
        const gasFeeCurrency: 'ETH' | 'SOL' = item.network === 'ethereum' ? 'ETH' : 'SOL';

        // Sign / broadcast with real connected wallet
        const result = await sendNFTToWallet(wallet, {
          name: item.name,
          symbol: item.symbol,
          metadataJson,
          isGasless: gasFeeMode === 'zero-gas',
          gasFeeMode,
          gasFeeAmount: gasFeePaid,
        });

        // Update item state to minted
        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id
              ? {
                  ...q,
                  status: 'minted' as const,
                  mintTxHash: result.txHash,
                  explorerUrl: result.explorerUrl,
                  ownerAddress: wallet.address,
                  creatorAddress: wallet.address,
                }
              : q
          )
        );

        // Add minted item to app state gallery
        const completedNFT: NFTItem = {
          id: `nft-batch-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          name: item.name,
          symbol: item.symbol,
          description: item.description,
          network: item.network,
          ownerAddress: wallet.address,
          creatorAddress: wallet.address,
          imageUrl: item.imageUrl || '',
          royaltyFeePercent: item.royaltyFeePercent,
          supply: item.supply,
          tokenStandard: item.tokenStandard,
          attributes: item.attributes,
          createdAt: Date.now(),
          estimatedPriceUSD: item.estimatedPriceUSD,
          metadataJson,
          isSentToWallet: true,
          mintTxHash: result.txHash,
          isGaslessLazyMint: gasFeeMode === 'zero-gas',
          gasFeeMode,
          gasFeePaid,
          gasFeeCurrency,
          recipientWallet: wallet.address,
        };

        onMintNFT(completedNFT);

        addLog(
          'success',
          `Minted [${item.name}]! Tx: ${result.txHash.substring(0, 16)}...`,
          result.txHash,
          result.explorerUrl
        );
      } catch (err: any) {
        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id
              ? {
                  ...q,
                  status: 'failed' as const,
                  errorMessage: err.message || 'Transaction rejected by wallet.',
                }
              : q
          )
        );
        addLog('error', `Failed to mint [${item.name}]: ${err.message || 'Rejected'}`);
      }
    }

    setIsProcessing(false);
    addLog('info', 'Batch deployment queue run finished.');
  };

  const handlePauseQueue = () => {
    setIsPaused(true);
    addLog('warning', 'Pausing queue after current transaction completes...');
  };

  const handleRetryFailed = () => {
    setQueue((prev) =>
      prev.map((item) => (item.status === 'failed' ? { ...item, status: 'pending' as const } : item))
    );
    addLog('info', 'Reset all failed queue items to pending state for retry.');
  };

  const handleClearCompleted = () => {
    setQueue((prev) => prev.filter((item) => item.status !== 'minted'));
    addLog('info', 'Removed completed/minted items from queue view.');
  };

  // Stats calculations
  const totalCount = queue.length;
  const pendingCount = queue.filter((i) => i.status === 'pending').length;
  const mintedCount = queue.filter((i) => i.status === 'minted').length;
  const failedCount = queue.filter((i) => i.status === 'failed').length;

  const totalValueUSD = queue.reduce((sum, item) => sum + (item.estimatedPriceUSD || 0), 0);
  const totalValueEth = totalValueUSD / CURRENT_ETH_PRICE_USD;
  const totalValueSol = totalValueUSD / CURRENT_SOL_PRICE_USD;

  const totalGasEstimated =
    gasFeeMode === 'zero-gas'
      ? 0
      : pendingCount * (batchNetwork === 'ethereum' ? MICRO_GAS_ETH : MICRO_GAS_SOL);

  // Filtered queue items
  const filteredQueue = queue.filter((item) => {
    if (filterStatus !== 'all' && item.status !== filterStatus) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.symbol.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div id="batch-nft-studio-container" className="space-y-6">
      {/* Top Banner & Quick Metrics */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-200/90 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
                <ListPlus className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 font-display flex items-center gap-2">
                  Batch NFT Creator & Queue Deployment Studio
                </h2>
                <p className="text-xs text-slate-500">
                  Upload, generate, or define multiple NFT metadata entries simultaneously and execute batch on-chain deployment
                </p>
              </div>
            </div>
          </div>

          {/* Network Selector Toggle */}
          <div className="flex items-center gap-2 p-1 bg-slate-100/90 rounded-xl border border-slate-200 self-start md:self-auto">
            <button
              type="button"
              id="btn-batch-network-eth"
              onClick={() => handleSetNetworkAll('ethereum')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                batchNetwork === 'ethereum'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Diamond className="w-3.5 h-3.5 text-indigo-600" />
              <span>Ethereum</span>
            </button>
            <button
              type="button"
              id="btn-batch-network-sol"
              onClick={() => handleSetNetworkAll('solana')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                batchNetwork === 'solana'
                  ? 'bg-white text-teal-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-teal-600" />
              <span>Solana</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Total Batch Queue
            </div>
            <div className="text-lg font-bold text-slate-900 font-mono mt-0.5">
              {totalCount} <span className="text-xs text-slate-500 font-sans font-normal">NFTs</span>
            </div>
          </div>

          <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl">
            <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">
              Pending Deployment
            </div>
            <div className="text-lg font-bold text-indigo-900 font-mono mt-0.5">
              {pendingCount}
            </div>
          </div>

          <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl">
            <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
              Minted / Completed
            </div>
            <div className="text-lg font-bold text-emerald-900 font-mono mt-0.5">
              {mintedCount}
            </div>
          </div>

          <div className="p-3 bg-amber-50/70 border border-amber-100 rounded-xl">
            <div className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">
              Collection Valuation
            </div>
            <div className="text-lg font-bold text-amber-900 font-mono mt-0.5">
              ${totalValueUSD.toLocaleString('en-US', { minimumFractionDigits: 0 })}
            </div>
            <div className="text-[10px] text-amber-700/80 font-mono">
              ≈ {batchNetwork === 'ethereum' ? `${totalValueEth.toFixed(2)} ETH` : `${totalValueSol.toFixed(1)} SOL`}
            </div>
          </div>

          <div className="p-3 bg-slate-900 text-white border border-slate-800 rounded-xl col-span-2 sm:col-span-1">
            <div className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider flex items-center justify-between">
              <span>Gas Policy</span>
              <span className="font-mono text-[9px] text-emerald-400 font-bold">
                {gasFeeMode === 'zero-gas' ? '0.00 FREE' : '0.000001 MICRO'}
              </span>
            </div>
            <div className="text-xs font-bold font-mono mt-1 text-slate-200">
              {gasFeeMode === 'zero-gas'
                ? '$0.00 (Gasless EIP-712)'
                : `${totalGasEstimated.toFixed(6)} ${batchNetwork === 'ethereum' ? 'ETH' : 'SOL'}`}
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {gasFeeMode === 'zero-gas' ? 'Zero upfront fees' : 'Real transaction anchor'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Studio Grid: Definition Forms vs Deployment Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Import / Definition Tools */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel p-5 rounded-2xl border border-slate-200/90 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Define Batch Metadata</span>
              </span>

              {/* Import Method Tabs */}
              <div className="flex items-center p-1 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  id="tab-method-gen"
                  onClick={() => setImportMethod('generator')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all ${
                    importMethod === 'generator'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Generator
                </button>
                <button
                  type="button"
                  id="tab-method-csv"
                  onClick={() => setImportMethod('csv')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all ${
                    importMethod === 'csv'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  CSV Upload
                </button>
                <button
                  type="button"
                  id="tab-method-json"
                  onClick={() => setImportMethod('json')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all ${
                    importMethod === 'json'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  JSON Array
                </button>
              </div>
            </div>

            {/* TAB 1: BATCH GENERATOR */}
            {importMethod === 'generator' && (
              <form onSubmit={handleGenerateBatch} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Collection Title / Name Prefix
                  </label>
                  <input
                    id="input-gen-prefix"
                    type="text"
                    required
                    value={genPrefix}
                    onChange={(e) => setGenPrefix(e.target.value)}
                    placeholder="e.g. Cyber Vanguard"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Will generate: {genPrefix} #001, {genPrefix} #002...
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Symbol / Ticker
                    </label>
                    <input
                      id="input-gen-symbol"
                      type="text"
                      required
                      value={genSymbol}
                      onChange={(e) => setGenSymbol(e.target.value.toUpperCase())}
                      placeholder="e.g. CVANG"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold uppercase text-slate-800 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Batch Quantity
                    </label>
                    <input
                      id="input-gen-count"
                      type="number"
                      min={1}
                      max={100}
                      value={genCount}
                      onChange={(e) => setGenCount(parseInt(e.target.value) || 1)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Valuation per Item ($)
                    </label>
                    <input
                      id="input-gen-price"
                      type="number"
                      step={10}
                      min={1}
                      value={genPriceUSD}
                      onChange={(e) => setGenPriceUSD(parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Creator Royalty (%)
                    </label>
                    <input
                      id="input-gen-royalty"
                      type="number"
                      step={0.5}
                      min={0}
                      max={20}
                      value={genRoyalty}
                      onChange={(e) => setGenRoyalty(parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Base Description & Backstory
                  </label>
                  <textarea
                    id="input-gen-desc"
                    rows={2}
                    value={genDescription}
                    onChange={(e) => setGenDescription(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Image Pattern / IPFS Base URL (Optional)
                  </label>
                  <input
                    id="input-gen-img-base"
                    type="text"
                    value={genImageBase}
                    onChange={(e) => setGenImageBase(e.target.value)}
                    placeholder="https://ipfs.io/ipfs/Qm.../{n}.png (or leave blank for procedural artwork)"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Use <code className="text-indigo-600 font-bold">{'{n}'}</code> for index (1, 2) or{' '}
                    <code className="text-indigo-600 font-bold">{'{0n}'}</code> for padded index (001, 002).
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    id="input-gen-traits-toggle"
                    type="checkbox"
                    checked={genIncludeTraits}
                    onChange={(e) => setGenIncludeTraits(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="input-gen-traits-toggle" className="text-xs text-slate-700 font-semibold cursor-pointer">
                    Auto-generate Rarity Tiers & Faction Traits across batch
                  </label>
                </div>

                <button
                  type="submit"
                  id="btn-submit-generate-batch"
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Generate {genCount} Metadata Entries into Queue</span>
                </button>
              </form>
            )}

            {/* TAB 2: CSV UPLOAD / PASTE */}
            {importMethod === 'csv' && (
              <div className="space-y-4">
                {/* Drag and Drop Zone */}
                <div
                  onClick={() => csvFileInputRef.current?.click()}
                  className="p-6 border-2 border-dashed border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 rounded-2xl text-center cursor-pointer transition-all space-y-2 group"
                >
                  <input
                    ref={csvFileInputRef}
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, 'csv')}
                  />
                  <div className="w-10 h-10 mx-auto rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-bold text-slate-800">
                    Click to browse or drop your <span className="text-indigo-600">.csv</span> file
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Supports headers: Name, Symbol, Description, ImageUrl, RoyaltyFeePercent, Supply, PriceUSD, Traits
                  </p>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-bold text-slate-700">Need a format template?</span>
                  <button
                    type="button"
                    id="btn-download-sample-csv"
                    onClick={handleDownloadSampleCSV}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 bg-indigo-50 px-2.5 py-1 rounded-lg"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Sample CSV</span>
                  </button>
                </div>

                {/* Direct CSV Paste */}
                <div className="space-y-2 border-t border-slate-100 pt-3">
                  <label className="block text-xs font-semibold text-slate-700">
                    Or Paste CSV Raw Text Directly:
                  </label>
                  <textarea
                    id="input-csv-paste"
                    rows={4}
                    value={csvText}
                    onChange={(e) => setCsvText(e.target.value)}
                    placeholder={`Name,Symbol,Description,ImageUrl,RoyaltyFeePercent,PriceUSD\nCyber #001,CYBER,"Art description",https://...,5.0,200`}
                    className="w-full bg-slate-900 text-emerald-400 font-mono text-[11px] p-3 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    id="btn-parse-pasted-csv"
                    disabled={!csvText.trim()}
                    onClick={() => parseCSVContent(csvText)}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    <FileText className="w-4 h-4 text-indigo-400" />
                    <span>Parse & Append Pasted CSV</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: JSON ARRAY UPLOAD / PASTE */}
            {importMethod === 'json' && (
              <div className="space-y-4">
                <div
                  onClick={() => jsonFileInputRef.current?.click()}
                  className="p-6 border-2 border-dashed border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 rounded-2xl text-center cursor-pointer transition-all space-y-2 group"
                >
                  <input
                    ref={jsonFileInputRef}
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, 'json')}
                  />
                  <div className="w-10 h-10 mx-auto rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FileCode className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-bold text-slate-800">
                    Click to browse or drop your <span className="text-indigo-600">.json</span> file
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Supports JSON Array of objects adhering to EIP-721 or Solana Metaplex structure
                  </p>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-bold text-slate-700">Need a format template?</span>
                  <button
                    type="button"
                    id="btn-download-sample-json"
                    onClick={handleDownloadSampleJSON}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 bg-indigo-50 px-2.5 py-1 rounded-lg"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Sample JSON</span>
                  </button>
                </div>

                {/* Direct JSON Paste */}
                <div className="space-y-2 border-t border-slate-100 pt-3">
                  <label className="block text-xs font-semibold text-slate-700">
                    Or Paste JSON Raw Text Directly:
                  </label>
                  <textarea
                    id="input-json-paste"
                    rows={4}
                    value={jsonText}
                    onChange={(e) => setJsonText(e.target.value)}
                    placeholder={`[\n  {\n    "name": "Beacon #1",\n    "symbol": "BCN",\n    "description": "JSON metadata entry",\n    "estimatedPriceUSD": 200\n  }\n]`}
                    className="w-full bg-slate-900 text-emerald-400 font-mono text-[11px] p-3 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    id="btn-parse-pasted-json"
                    disabled={!jsonText.trim()}
                    onClick={() => parseJSONContent(jsonText)}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    <FileCode className="w-4 h-4 text-emerald-400" />
                    <span>Parse & Append Pasted JSON</span>
                  </button>
                </div>
              </div>
            )}

            {parseError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{parseError}</span>
              </div>
            )}
          </div>

          {/* Wallet Alignment Card */}
          <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-indigo-900">
              <span className="flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-indigo-600" />
                <span>Connected Deployment Wallet</span>
              </span>
              <span className="font-mono text-[10px] bg-white px-2 py-0.5 rounded border border-indigo-200">
                {wallet?.type ? wallet.type.toUpperCase() : 'NO WALLET'}
              </span>
            </div>

            <p className="text-xs text-indigo-800/80 leading-relaxed">
              {wallet && wallet.isConnected
                ? `Ready to deploy on ${wallet.networkName} (${wallet.address.substring(0, 6)}...${wallet.address.slice(-4)}).`
                : 'Connect MetaMask or Phantom to enable batch deployment on real networks.'}
            </p>

            {wallet && wallet.isConnected && (
              <button
                type="button"
                id="btn-apply-wallet-all"
                onClick={handleApplyWalletToAll}
                className="w-full py-2 bg-white hover:bg-indigo-100/50 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 transition-all flex items-center justify-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5 text-indigo-600" />
                <span>Apply Connected Wallet Address ({wallet.address.substring(0, 8)}...) to All Queue Items</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Queue Inspector & Batch Execution Controls */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-200/90 space-y-5">
            {/* Queue Execution Controls Bar */}
            <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-3 border border-slate-800 shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Fuel className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                      Batch On-Chain Execution Engine
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Progressively signs and broadcasts NFT mint entries to the connected blockchain
                  </p>
                </div>

                {/* Gas Mode Selector in Runner Bar */}
                <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-xl border border-slate-700">
                  <button
                    type="button"
                    id="btn-exec-gas-zero"
                    onClick={() => handleSetGasModeAll('zero-gas')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                      gasFeeMode === 'zero-gas'
                        ? 'bg-emerald-500 text-slate-950 shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Zero-Gas
                  </button>
                  <button
                    type="button"
                    id="btn-exec-gas-micro"
                    onClick={() => handleSetGasModeAll('micro-gas')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                      gasFeeMode === 'micro-gas'
                        ? 'bg-indigo-500 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Micro-Gas
                  </button>
                </div>
              </div>

              {/* Action Trigger Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {!isProcessing ? (
                  <button
                    type="button"
                    id="btn-start-batch-deploy"
                    disabled={pendingCount === 0 || !wallet?.isConnected}
                    onClick={handleStartBatchDeployment}
                    className="flex-1 py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-40 text-slate-950 font-extrabold text-xs rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4 fill-slate-950" />
                    <span>
                      Start Batch Deployment ({pendingCount} Pending)
                    </span>
                  </button>
                ) : (
                  <button
                    type="button"
                    id="btn-pause-batch-deploy"
                    onClick={handlePauseQueue}
                    className="flex-1 py-3 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    <Pause className="w-4 h-4 fill-slate-950" />
                    <span>Pause Batch Queue</span>
                  </button>
                )}

                {failedCount > 0 && (
                  <button
                    type="button"
                    id="btn-retry-failed-batch"
                    onClick={handleRetryFailed}
                    className="py-3 px-3 bg-slate-800 hover:bg-slate-700 text-rose-300 border border-rose-900/50 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Retry ({failedCount})</span>
                  </button>
                )}

                {mintedCount > 0 && (
                  <button
                    type="button"
                    id="btn-clear-completed-batch"
                    onClick={handleClearCompleted}
                    className="py-3 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all"
                  >
                    Clear Completed ({mintedCount})
                  </button>
                )}
              </div>

              {/* Real-time Queue Progress Bar */}
              {totalCount > 0 && (
                <div className="space-y-1.5 pt-2">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-400">Queue Progress:</span>
                    <span className="text-emerald-400 font-bold">
                      {mintedCount} of {totalCount} Minted ({Math.round((mintedCount / totalCount) * 100)}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden p-0.5 border border-slate-700">
                    <div
                      className="bg-gradient-to-r from-emerald-400 via-teal-400 to-indigo-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${(mintedCount / totalCount) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Queue Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-1.5 bg-slate-100/90 p-1 rounded-xl">
                <button
                  type="button"
                  id="filter-all"
                  onClick={() => setFilterStatus('all')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    filterStatus === 'all'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({totalCount})
                </button>
                <button
                  type="button"
                  id="filter-pending"
                  onClick={() => setFilterStatus('pending')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    filterStatus === 'pending'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Pending ({pendingCount})
                </button>
                <button
                  type="button"
                  id="filter-minted"
                  onClick={() => setFilterStatus('minted')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    filterStatus === 'minted'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Minted ({mintedCount})
                </button>
                {failedCount > 0 && (
                  <button
                    type="button"
                    id="filter-failed"
                    onClick={() => setFilterStatus('failed')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                      filterStatus === 'failed'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Failed ({failedCount})
                  </button>
                )}
              </div>

              {/* Quick Queue Operations */}
              <div className="flex items-center gap-2">
                {totalCount > 0 && (
                  <>
                    <button
                      type="button"
                      id="btn-export-queue-json"
                      onClick={handleExportQueueJSON}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 bg-indigo-50 px-2.5 py-1.5 rounded-lg"
                      title="Export Queue as JSON"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export JSON</span>
                    </button>
                    <button
                      type="button"
                      id="btn-clear-queue-all"
                      onClick={handleClearQueue}
                      className="text-xs text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 bg-rose-50 px-2.5 py-1.5 rounded-lg"
                      title="Clear All Items"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Clear All</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Queue List / Grid Table */}
            {filteredQueue.length === 0 ? (
              <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-2xl space-y-3 bg-slate-50/50">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center">
                  <ListPlus className="w-6 h-6" />
                </div>
                <div className="text-sm font-bold text-slate-800">
                  {totalCount === 0 ? 'Queue is Currently Empty' : 'No Items Match Current Filter'}
                </div>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {totalCount === 0
                    ? 'Use the Batch Generator, CSV Upload, or JSON Array importer on the left to queue NFT entries for deployment.'
                    : 'Try selecting "All" or clearing the search query to see other queue items.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {filteredQueue.map((item, idx) => (
                  <div
                    key={item.id}
                    className={`p-4 rounded-xl border transition-all space-y-3 ${
                      item.status === 'deploying'
                        ? 'border-indigo-400 bg-indigo-50/70 ring-1 ring-indigo-300'
                        : item.status === 'minted'
                        ? 'border-emerald-200 bg-emerald-50/50'
                        : item.status === 'failed'
                        ? 'border-rose-200 bg-rose-50/50'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {/* Image Thumbnail / SVG Preview */}
                        <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center text-xs font-mono font-bold text-slate-400">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <span>NFT</span>
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-slate-900 font-display">
                              {item.name}
                            </h4>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 font-bold text-slate-700">
                              {item.symbol}
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold border border-indigo-100 capitalize">
                              {item.network}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                            {item.description}
                          </p>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="flex items-center gap-2 shrink-0">
                        {item.status === 'pending' && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>Pending</span>
                          </span>
                        )}
                        {item.status === 'deploying' && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-indigo-600 text-white flex items-center gap-1 animate-pulse">
                            <div className="w-2.5 h-2.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Deploying...</span>
                          </span>
                        )}
                        {item.status === 'minted' && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Minted</span>
                          </span>
                        )}
                        {item.status === 'failed' && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                            <XCircle className="w-3 h-3 text-rose-600" />
                            <span>Failed</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Metadata Detail Row */}
                    <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-500 border-t border-slate-100 pt-2 gap-2">
                      <div className="flex items-center gap-3">
                        <span>
                          Valuation: <strong className="text-slate-800">${item.estimatedPriceUSD}</strong>
                        </span>
                        <span>
                          Royalty: <strong className="text-emerald-600">{item.royaltyFeePercent}%</strong>
                        </span>
                        <span>
                          Traits: <strong className="text-indigo-600">{item.attributes.length}</strong>
                        </span>
                      </div>

                      {/* Row Action Buttons */}
                      <div className="flex items-center gap-1.5">
                        {item.explorerUrl && (
                          <a
                            href={item.explorerUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 hover:bg-slate-100 rounded text-indigo-600 font-bold flex items-center gap-0.5 text-[10px]"
                            title="View on Explorer"
                          >
                            <span>Explorer</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}

                        <button
                          type="button"
                          onClick={() => setEditingItem(item)}
                          className="p-1 hover:bg-slate-100 rounded text-slate-600"
                          title="Edit Metadata"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDuplicateItem(item)}
                          className="p-1 hover:bg-slate-100 rounded text-slate-600"
                          title="Duplicate Entry"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-600"
                          title="Delete Entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {item.errorMessage && (
                      <div className="text-[10px] text-rose-700 bg-rose-50 p-2 rounded-lg font-mono">
                        Error: {item.errorMessage}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Batch Deployment Console Logs */}
            {logs.length > 0 && (
              <div className="space-y-2 border-t border-slate-200 pt-4">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span className="flex items-center gap-1.5">
                    <Terminal className="w-4 h-4 text-indigo-600" />
                    <span>Batch Execution Terminal Log ({logs.length})</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setLogs([])}
                    className="text-[11px] text-slate-400 hover:text-slate-600 font-mono"
                  >
                    Clear Terminal
                  </button>
                </div>

                <div className="p-4 bg-slate-950 text-slate-300 rounded-xl text-[11px] font-mono overflow-y-auto max-h-48 border border-slate-800 space-y-1">
                  {logs.map((log) => (
                    <div key={log.id} className="flex items-start gap-2 leading-relaxed">
                      <span className="text-slate-500 shrink-0">
                        [{new Date(log.timestamp).toLocaleTimeString()}]
                      </span>
                      <span
                        className={
                          log.type === 'success'
                            ? 'text-emerald-400'
                            : log.type === 'error'
                            ? 'text-rose-400 font-bold'
                            : log.type === 'warning'
                            ? 'text-amber-400'
                            : 'text-indigo-300'
                        }
                      >
                        {log.message}
                      </span>
                      {log.explorerUrl && (
                        <a
                          href={log.explorerUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-400 underline shrink-0 font-bold"
                        >
                          [Explorer]
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Item Quick-Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 font-display">
                <Edit3 className="w-4 h-4 text-indigo-600" />
                <span>Edit Batch Entry Metadata</span>
              </h3>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">NFT Name</label>
                <input
                  type="text"
                  value={editingItem.name}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, name: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Symbol</label>
                  <input
                    type="text"
                    value={editingItem.symbol}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, symbol: e.target.value.toUpperCase() })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold uppercase text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Valuation ($)</label>
                  <input
                    type="number"
                    value={editingItem.estimatedPriceUSD}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, estimatedPriceUSD: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editingItem.description}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, description: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Image URL</label>
                <input
                  type="text"
                  value={editingItem.imageUrl}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, imageUrl: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setQueue((prev) =>
                    prev.map((q) => (q.id === editingItem.id ? editingItem : q))
                  );
                  setEditingItem(null);
                  addLog('info', `Saved updated metadata for ${editingItem.name}.`);
                }}
                className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
