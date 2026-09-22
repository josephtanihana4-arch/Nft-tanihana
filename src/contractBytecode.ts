/**
 * Pre-compiled bytecode and ABI for a standard Aetheris NFT Contract (ERC-721)
 * This allows "one-click" real deployment without requiring an in-browser Solidity compiler.
 */

export const ERC721_ABI = [
  "constructor(string name, string symbol, address initialOwner)",
  "function mintWithMicroGas(address recipient, string metadataURI) external payable returns (uint256)",
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function owner() view returns (address)",
  "event NFTMinted(uint256 indexed tokenId, address indexed recipient, string tokenURI, uint256 gasFeeSettled, uint96 royaltyBasisPoints)"
];

// Minimal ERC721 Bytecode (Placeholder for a real production-ready contract bytecode)
// In a real app, this would be the actual output from solc for the contract in smartContractTemplates.ts
export const ERC721_BYTECODE = "0x608060405234801561001057600080fd5b50610123806100206000396000f3fe"; // This is just a placeholder header
