// SPDX-License-Identifier: MIT
pragma solidity ^0.8.35;

import "./PlotNFT.sol";
import "./RoleManager.sol";

/// @dev Handles all plot listings and purchases. Commission logic lives here
///      exclusively — never replicate it in PlotNFT or anywhere else.
///      Primary sales (Admin → anyone): no commission, full price to Admin.
///      Secondary sales (anyone else → anyone): commissionRate% to Admin, remainder to seller.
contract PlotMarketplace {
    PlotNFT public immutable plotNFT;
    RoleManager public immutable roleManager;

    uint256 public commissionRate; // basis: percent, e.g. 2 = 2%

    struct Listing {
        address seller;
        uint256 price;
        bool isActive;
        uint256 listedAt;
    }

    mapping(uint256 => Listing) public listings;

    error NotOwner();
    error NotAdmin();
    error AlreadyListed();
    error NotListed();
    error InsufficientPayment();
    error TransferFailed();
    error InvalidPrice();

    event PlotListed(uint256 indexed tokenId, address indexed seller, uint256 price);
    event PlotDelisted(uint256 indexed tokenId, address indexed seller);
    event PriceUpdated(uint256 indexed tokenId, uint256 oldPrice, uint256 newPrice);
    event PlotSold(
        uint256 indexed tokenId,
        address indexed seller,
        address indexed buyer,
        uint256 price,
        uint256 commission
    );

    constructor(address plotNFTAddress, address roleManagerAddress, uint256 initialCommissionRate) {
        plotNFT = PlotNFT(plotNFTAddress);
        roleManager = RoleManager(roleManagerAddress);
        commissionRate = initialCommissionRate;
    }

    modifier onlyAdmin() {
        if (!roleManager.isAdmin(msg.sender)) revert NotAdmin();
        _;
    }

    function listPlot(uint256 tokenId, uint256 price) external {
        if (plotNFT.ownerOf(tokenId) != msg.sender) revert NotOwner();
        if (listings[tokenId].isActive) revert AlreadyListed();
        if (price == 0) revert InvalidPrice();

        // Marketplace must be approved to transfer the token on sale.
        // Caller must call plotNFT.approve(marketplaceAddress, tokenId) before listing.
        listings[tokenId] = Listing({
            seller: msg.sender,
            price: price,
            isActive: true,
            listedAt: block.timestamp
        });

        emit PlotListed(tokenId, msg.sender, price);
    }

    function buyPlot(uint256 tokenId) external payable {
        Listing memory listing = listings[tokenId];
        if (!listing.isActive) revert NotListed();
        if (msg.value < listing.price) revert InsufficientPayment();

        address admin = roleManager.admin();
        uint256 commission = 0;

        listings[tokenId].isActive = false;

        if (listing.seller == admin) {
            // Primary sale: full price to Admin, no commission deducted.
            (bool ok, ) = payable(admin).call{value: listing.price}("");
            if (!ok) revert TransferFailed();
        } else {
            // Secondary sale: split between admin (commission) and seller (remainder).
            commission = (listing.price * commissionRate) / 100;
            uint256 sellerAmount = listing.price - commission;
            (bool ok1, ) = payable(admin).call{value: commission}("");
            (bool ok2, ) = payable(listing.seller).call{value: sellerAmount}("");
            if (!ok1 || !ok2) revert TransferFailed();
        }

        plotNFT.transferFrom(listing.seller, msg.sender, tokenId);

        // Refund any overpayment.
        if (msg.value > listing.price) {
            (bool ok, ) = payable(msg.sender).call{value: msg.value - listing.price}("");
            if (!ok) revert TransferFailed();
        }

        emit PlotSold(tokenId, listing.seller, msg.sender, listing.price, commission);
    }

    function delistPlot(uint256 tokenId) external {
        if (listings[tokenId].seller != msg.sender) revert NotOwner();
        if (!listings[tokenId].isActive) revert NotListed();
        listings[tokenId].isActive = false;
        emit PlotDelisted(tokenId, msg.sender);
    }

    function updatePrice(uint256 tokenId, uint256 newPrice) external {
        if (listings[tokenId].seller != msg.sender) revert NotOwner();
        if (!listings[tokenId].isActive) revert NotListed();
        if (newPrice == 0) revert InvalidPrice();
        uint256 old = listings[tokenId].price;
        listings[tokenId].price = newPrice;
        emit PriceUpdated(tokenId, old, newPrice);
    }

    function setCommissionRate(uint256 newRate) external onlyAdmin {
        commissionRate = newRate;
    }

    function getListingDetails(uint256 tokenId) external view returns (Listing memory) {
        return listings[tokenId];
    }
}
