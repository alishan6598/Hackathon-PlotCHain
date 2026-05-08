// SPDX-License-Identifier: MIT
pragma solidity ^0.8.35;

import "erc721a/contracts/ERC721A.sol";
import "./RoleManager.sol";

/// @dev ERC-721A NFT — one token per plot. TokenIds start at 1.
///      Per-token URIs stored in _tokenURIs mapping (ERC-721A has no built-in
///      per-token URI storage; it assumes a shared baseURI pattern).
contract PlotNFT is ERC721A {
    RoleManager public immutable roleManager;

    /// plotId is the human-readable identifier e.g. "C-14/247"
    mapping(uint256 => string) private _tokenURIs;
    mapping(uint256 => string) public plotIds;

    error NotAdmin();
    error URICountMismatch();
    error TokenDoesNotExist();

    event PlotMinted(uint256 indexed tokenId, string plotId, string tokenURI);
    event TokenURIUpdated(uint256 indexed tokenId, string newTokenURI);

    constructor(address roleManagerAddress) ERC721A("PlotChain C-14", "PLOT") {
        roleManager = RoleManager(roleManagerAddress);
    }

    modifier onlyAdmin() {
        if (!roleManager.isAdmin(msg.sender)) revert NotAdmin();
        _;
    }

    /// ERC-721A starts tokenIds at 0 by default. Override to 1 so that
    /// tokenId == human-readable plot number (plot 1 = tokenId 1).
    function _startTokenId() internal pure override returns (uint256) {
        return 1;
    }

    /// Batch mint N plots in one transaction. ERC-721A amortizes storage across
    /// the batch — minting 641 tokens costs ~2x a single mint, not 641x.
    /// Caller must chunk into batches of ~100 to stay under Sepolia block gas limit.
    function batchMint(
        address to,
        uint256 quantity,
        string[] calldata uris,
        string[] calldata ids
    ) external onlyAdmin {
        if (uris.length != quantity || ids.length != quantity) revert URICountMismatch();
        uint256 startId = _nextTokenId();
        _mint(to, quantity);
        for (uint256 i = 0; i < quantity; i++) {
            _tokenURIs[startId + i] = uris[i];
            plotIds[startId + i] = ids[i];
            emit PlotMinted(startId + i, ids[i], uris[i]);
        }
    }

    /// Single mint for admin dashboard one-at-a-time flow.
    function mint(
        address to,
        string calldata uri,
        string calldata plotId
    ) external onlyAdmin returns (uint256 tokenId) {
        tokenId = _nextTokenId();
        _mint(to, 1);
        _tokenURIs[tokenId] = uri;
        plotIds[tokenId] = plotId;
        emit PlotMinted(tokenId, plotId, uri);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        if (!_exists(tokenId)) revert TokenDoesNotExist();
        return _tokenURIs[tokenId];
    }

    /// Admin-only: update the tokenURI of an already-minted plot.
    /// Use after re-pinning corrected metadata to IPFS.
    function setTokenURI(uint256 tokenId, string calldata uri) external onlyAdmin {
        if (!_exists(tokenId)) revert TokenDoesNotExist();
        _tokenURIs[tokenId] = uri;
        emit TokenURIUpdated(tokenId, uri);
    }
}
