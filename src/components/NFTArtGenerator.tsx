import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Upload, RefreshCw, Palette, Layers } from 'lucide-react';
import { BlockchainNetwork } from '../types';
import { PROCEDURAL_ART_TEMPLATES } from '../nftData';

interface NFTArtGeneratorProps {
  network: BlockchainNetwork;
  onImageChange: (imageUrl: string) => void;
  currentImage: string;
}

export default function NFTArtGenerator({
  network,
  onImageChange,
  currentImage,
}: NFTArtGeneratorProps) {
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState(0);
  const [customText, setCustomText] = useState('GENESIS');
  const [accentColor, setAccentColor] = useState(
    network === 'ethereum' ? '#627eea' : '#14f195'
  );
  const [isCustomUpload, setIsCustomUpload] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Redraw procedural artwork on changes
  useEffect(() => {
    if (isCustomUpload && currentImage) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const template = PROCEDURAL_ART_TEMPLATES[selectedTemplateIndex] || PROCEDURAL_ART_TEMPLATES[0];
    const width = canvas.width;
    const height = canvas.height;

    // Background gradient
    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    if (network === 'ethereum') {
      bgGradient.addColorStop(0, '#0c1024');
      bgGradient.addColorStop(0.5, '#1e1e38');
      bgGradient.addColorStop(1, '#080811');
    } else {
      bgGradient.addColorStop(0, '#0b191e');
      bgGradient.addColorStop(0.5, '#122c2a');
      bgGradient.addColorStop(1, '#080a14');
    }
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Dynamic procedural geometry / grid
    ctx.save();
    ctx.strokeStyle = `${accentColor}33`;
    ctx.lineWidth = 1;
    const gridSize = 32;
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    ctx.restore();

    // Central geometric badge
    const centerX = width / 2;
    const centerY = height / 2;

    // Glowing outer rings
    for (let r = 120; r >= 40; r -= 25) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
      ctx.strokeStyle = `${accentColor}${Math.floor((1 - r / 150) * 80).toString(16).padStart(2, '0')}`;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    }

    // Network Symbol Shape (Ethereum diamond or Solana tri-bars)
    ctx.save();
    ctx.shadowColor = accentColor;
    ctx.shadowBlur = 24;

    if (network === 'ethereum') {
      // Draw stylized Ethereum Diamond
      ctx.fillStyle = accentColor;
      // Top pyramid
      ctx.beginPath();
      ctx.moveTo(centerX, centerY - 80);
      ctx.lineTo(centerX + 50, centerY);
      ctx.lineTo(centerX, centerY + 25);
      ctx.lineTo(centerX - 50, centerY);
      ctx.closePath();
      ctx.fill();

      // Lower diamond
      ctx.fillStyle = `${accentColor}bb`;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY + 35);
      ctx.lineTo(centerX + 48, centerY + 10);
      ctx.lineTo(centerX, centerY + 80);
      ctx.lineTo(centerX - 48, centerY + 10);
      ctx.closePath();
      ctx.fill();
    } else {
      // Draw stylized Solana bars
      const barHeight = 22;
      const barWidth = 100;
      const slant = 18;

      const drawParallelogram = (yPos: number, fillHex: string) => {
        ctx.fillStyle = fillHex;
        ctx.beginPath();
        ctx.moveTo(centerX - barWidth / 2 + slant, yPos);
        ctx.lineTo(centerX + barWidth / 2, yPos);
        ctx.lineTo(centerX + barWidth / 2 - slant, yPos + barHeight);
        ctx.lineTo(centerX - barWidth / 2, yPos + barHeight);
        ctx.closePath();
        ctx.fill();
      };

      drawParallelogram(centerY - 50, '#9945ff');
      drawParallelogram(centerY - 10, '#14f195');
      drawParallelogram(centerY + 30, '#00c2ff');
    }
    ctx.restore();

    // Text Label overlay at bottom
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.letterSpacing = '3px';
    ctx.fillText(customText.toUpperCase(), centerX, height - 32);

    ctx.fillStyle = `${accentColor}cc`;
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillText(network.toUpperCase() + ' // VERIFIED CREATOR 1/1', centerX, height - 14);
    ctx.restore();

    // Export to data URL
    const dataUrl = canvas.toDataURL('image/png');
    onImageChange(dataUrl);
  }, [selectedTemplateIndex, customText, accentColor, network, isCustomUpload]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setIsCustomUpload(true);
        onImageChange(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetToGenerative = () => {
    setIsCustomUpload(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div id="nft-art-generator" className="glass-panel p-5 rounded-2xl border border-slate-200/80">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="p-1.5 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600">
            <Palette className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-slate-800 font-display">Artwork Studio</h3>
            <p className="text-[11px] text-slate-400">Generate algorithmic art or upload custom files</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isCustomUpload ? (
            <button
              type="button"
              onClick={handleResetToGenerative}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 bg-indigo-50 px-2.5 py-1 rounded-lg"
            >
              <RefreshCw className="w-3 h-3" /> Procedural
            </button>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-slate-600 hover:text-slate-900 font-semibold flex items-center gap-1 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition-colors"
            >
              <Upload className="w-3 h-3" /> Upload File
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>
      </div>

      {/* Main Canvas / Image Preview */}
      <div className="flex flex-col sm:flex-row gap-5 items-center">
        <div className="relative w-56 h-56 rounded-2xl overflow-hidden shadow-lg border border-slate-700/30 shrink-0 bg-slate-950 flex items-center justify-center">
          {isCustomUpload && currentImage ? (
            <img
              src={currentImage}
              alt="Custom NFT Artwork"
              className="w-full h-full object-cover"
            />
          ) : (
            <canvas
              ref={canvasRef}
              width={320}
              height={320}
              className="w-full h-full object-contain"
            />
          )}

          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider backdrop-blur-md bg-black/60 text-white border border-white/10">
            {network === 'ethereum' ? 'ERC-721' : 'Solana Core'}
          </div>
        </div>

        {/* Generator Controls */}
        <div className="flex-1 w-full space-y-3">
          {!isCustomUpload ? (
            <>
              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                  Generative Style Template
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {PROCEDURAL_ART_TEMPLATES.map((tmpl, idx) => (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => {
                        setSelectedTemplateIndex(idx);
                        setAccentColor(tmpl.accentColor);
                      }}
                      className={`p-2 rounded-xl text-left border text-xs font-mono transition-all ${
                        selectedTemplateIndex === idx
                          ? 'border-indigo-500 bg-indigo-50/80 font-bold text-indigo-900 shadow-xs'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <div className="truncate text-[11px]">{tmpl.name}</div>
                      <span className="text-[9px] text-slate-400 block">{tmpl.category}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                    Visual Watermark
                  </label>
                  <input
                    type="text"
                    value={customText}
                    maxLength={16}
                    onChange={(e) => setCustomText(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:border-indigo-500"
                    placeholder="GENESIS #01"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                    Neon Accent Hue
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer p-0.5 bg-white"
                    />
                    <span className="text-xs font-mono text-slate-600 uppercase">
                      {accentColor}
                    </span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-emerald-700 text-xs font-semibold">
                <Sparkles className="w-4 h-4 text-emerald-500" /> Custom Artwork Loaded
              </div>
              <p className="text-[11px] text-slate-500">
                Your uploaded image is ready to be bound with Ethereum ERC-721 or Solana Metaplex metadata standards.
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-semibold text-indigo-600 hover:underline"
              >
                Choose another file...
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
