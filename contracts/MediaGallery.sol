// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract MediaGallery {
    struct Media {
        uint256 id;
        string imageUrl;
        address creator;
        uint256 createdAt;
        bool deleted;
    }

    Media[] private mediaItems;
    uint256 public activeMediaCount;

    event MediaAdded(
        uint256 indexed mediaId,
        string imageUrl,
        address indexed creator,
        uint256 createdAt
    );

    event MediaDeleted(
        uint256 indexed mediaId,
        address indexed creator
    );

    function addMedia(string calldata imageUrl) external {
        require(bytes(imageUrl).length > 0, "Image URL is required");

        uint256 mediaId = mediaItems.length;

        mediaItems.push(
            Media({
                id: mediaId,
                imageUrl: imageUrl,
                creator: msg.sender,
                createdAt: block.timestamp,
                deleted: false
            })
        );

        activeMediaCount += 1;

        emit MediaAdded(
            mediaId,
            imageUrl,
            msg.sender,
            block.timestamp
        );
    }

    function deleteMedia(uint256 mediaId) external {
        require(mediaId < mediaItems.length, "Media does not exist");

        Media storage item = mediaItems[mediaId];

        require(!item.deleted, "Media already deleted");
        require(item.creator == msg.sender, "Only media creator");

        item.deleted = true;
        activeMediaCount -= 1;

        emit MediaDeleted(mediaId, msg.sender);
    }

    function getMedia(uint256 mediaId)
        external
        view
        returns (Media memory)
    {
        require(mediaId < mediaItems.length, "Media does not exist");
        return mediaItems[mediaId];
    }

    function getActiveMedia()
        external
        view
        returns (Media[] memory)
    {
        Media[] memory result = new Media[](activeMediaCount);
        uint256 resultIndex;

        for (uint256 i = 0; i < mediaItems.length; i++) {
            if (!mediaItems[i].deleted) {
                result[resultIndex] = mediaItems[i];
                resultIndex += 1;
            }
        }

        return result;
    }

    function totalMediaCount() external view returns (uint256) {
        return mediaItems.length;
    }
}
