import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("MediaGalleryModule", (m) => {
  const mediaGallery = m.contract("MediaGallery");
  return { mediaGallery };
});
