import { expect } from "chai";
import { network } from "hardhat";

const { ethers, networkHelpers } = await network.create();

async function deployFixture() {
  const [owner, alice, bob] = await ethers.getSigners();
  const gallery = await ethers.deployContract("MediaGallery");
  await gallery.waitForDeployment();
  return { gallery, owner, alice, bob };
}

describe("MediaGallery", function () {
  it("adds Media with creator, timestamp and deleted=false", async function () {
    const { gallery, alice } = await networkHelpers.loadFixture(deployFixture);

    await expect(
      gallery.connect(alice).addMedia("https://example.com/photo-1.jpg"),
    ).to.emit(gallery, "MediaAdded");

    const media = await gallery.getMedia(0);

    expect(media.id).to.equal(0n);
    expect(media.imageUrl).to.equal("https://example.com/photo-1.jpg");
    expect(media.creator).to.equal(alice.address);
    expect(media.createdAt).to.be.greaterThan(0n);
    expect(media.deleted).to.equal(false);
    expect(await gallery.activeMediaCount()).to.equal(1n);
  });

  it("returns only active Media objects", async function () {
    const { gallery, alice } = await networkHelpers.loadFixture(deployFixture);

    await gallery.connect(alice).addMedia("https://example.com/photo-1.jpg");
    await gallery.connect(alice).addMedia("https://example.com/photo-2.jpg");
    await gallery.connect(alice).deleteMedia(0);

    const active = await gallery.getActiveMedia();

    expect(active).to.have.length(1);
    expect(active[0].id).to.equal(1n);
    expect(active[0].imageUrl).to.equal("https://example.com/photo-2.jpg");
  });

  it("deletes an image by setting the deleted flag", async function () {
    const { gallery, alice } = await networkHelpers.loadFixture(deployFixture);

    await gallery.connect(alice).addMedia("https://example.com/photo.jpg");

    await expect(gallery.connect(alice).deleteMedia(0))
      .to.emit(gallery, "MediaDeleted")
      .withArgs(0n, alice.address);

    const storedMedia = await gallery.getMedia(0);

    expect(storedMedia.deleted).to.equal(true);
    expect(await gallery.activeMediaCount()).to.equal(0n);
    expect(await gallery.totalMediaCount()).to.equal(1n);
  });

  it("allows only the creator to delete an image", async function () {
    const { gallery, alice, bob } = await networkHelpers.loadFixture(deployFixture);

    await gallery.connect(alice).addMedia("https://example.com/photo.jpg");

    await expect(gallery.connect(bob).deleteMedia(0)).to.be.revertedWith(
      "Only media creator",
    );
  });

  it("rejects deleting the same image twice", async function () {
    const { gallery, alice } = await networkHelpers.loadFixture(deployFixture);

    await gallery.connect(alice).addMedia("https://example.com/photo.jpg");
    await gallery.connect(alice).deleteMedia(0);

    await expect(gallery.connect(alice).deleteMedia(0)).to.be.revertedWith(
      "Media already deleted",
    );
  });

  it("shows newly added active media after a previous item was deleted", async function () {
    const { gallery, alice } = await networkHelpers.loadFixture(deployFixture);

    await gallery.connect(alice).addMedia("https://example.com/old.jpg");
    await gallery.connect(alice).deleteMedia(0);
    await gallery.connect(alice).addMedia("https://example.com/new.jpg");

    const active = await gallery.getActiveMedia();

    expect(active).to.have.length(1);
    expect(active[0].id).to.equal(1n);
    expect(active[0].imageUrl).to.equal("https://example.com/new.jpg");
    expect(active[0].deleted).to.equal(false);
  });
});
