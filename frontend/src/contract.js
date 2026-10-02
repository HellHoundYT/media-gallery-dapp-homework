export const MEDIA_GALLERY_ABI = [
  "function addMedia(string imageUrl)",
  "function deleteMedia(uint256 mediaId)",
  "function getMedia(uint256 mediaId) view returns (tuple(uint256 id, string imageUrl, address creator, uint256 createdAt, bool deleted))",
  "function getActiveMedia() view returns (tuple(uint256 id, string imageUrl, address creator, uint256 createdAt, bool deleted)[])",
  "function activeMediaCount() view returns (uint256)",
  "function totalMediaCount() view returns (uint256)",
  "event MediaAdded(uint256 indexed mediaId, string imageUrl, address indexed creator, uint256 createdAt)",
  "event MediaDeleted(uint256 indexed mediaId, address indexed creator)"
];

export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || "";
