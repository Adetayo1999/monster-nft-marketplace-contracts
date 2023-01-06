// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity 0.8.17;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

error NftMarketPlace__NftListed();
error NftMarketPlace__NotNftOwner();
error NftMarketPlace__NFTNotApprovedForSale();
error NftMarketPlace__InvalidPriceSent(address, uint256, uint256, address);
error NftMarketPlace__NftNotListed();
error NftMarketPlace__NotEnoughETH(address, uint256, uint256, uint256);
error NftMarketPlace__NotEnoughProceeds();
error NftMarketPlace__ProceedsWithdrawalFailed();
error NftMarketPlace__InvalidNFTAddress();

contract NftMarketPlace is ReentrancyGuard {
    struct Listing {
        uint256 tokenId;
        uint256 price;
        address nftAddress;
        address owner;
    }

    mapping(address => uint256) s_proceeds;
    mapping(address => mapping(uint => Listing)) s_listings;

    event NFTListed(
        address indexed seller,
        uint256 indexed tokenId,
        address indexed nftAddress,
        uint256 price
    );

    event NFTListingCancelled(
        address indexed owner,
        uint256 indexed tokenId,
        address indexed nftAddress
    );

    event NFTBought(
        address indexed seller,
        address indexed buyer,
        uint256 indexed tokenId,
        address nftAddress,
        uint256 price
    );

    modifier isNotListed(address _nftAddress, uint256 _tokenId) {
        Listing memory listing = s_listings[_nftAddress][_tokenId];
        if (listing.price != 0 || listing.owner != address(0)) {
            revert NftMarketPlace__NftListed();
        }
        _;
    }

    modifier isListed(address _nftAdddress, uint256 _tokenId) {
        Listing memory listing = s_listings[_nftAdddress][_tokenId];
        if (listing.price == 0 || listing.owner == address(0)) {
            revert NftMarketPlace__NftNotListed();
        }
        _;
    }

    modifier isTokenOwner(
        address _spender,
        uint256 _tokenId,
        address _nftAddress
    ) {
        IERC721 nftTokenContract = IERC721(_nftAddress);

        // if (!nftTokenContract.supportsInterface(type(IERC721).interfaceId)) {
        //     revert NftMarketPlace__InvalidNFTAddress();
        // }

        if (nftTokenContract.ownerOf(_tokenId) != _spender) {
            revert NftMarketPlace__NotNftOwner();
        }
        _;
    }

    function listItem(
        uint256 _tokenId,
        address _nftAddress,
        uint256 _price
    )
        public
        isTokenOwner(msg.sender, _tokenId, _nftAddress)
        isNotListed(_nftAddress, _tokenId)
    {
        if (_price == 0) {
            revert NftMarketPlace__InvalidPriceSent(
                msg.sender,
                _price,
                _tokenId,
                _nftAddress
            );
        }

        IERC721 nftContract = IERC721(_nftAddress);
        if (nftContract.getApproved(_tokenId) != address(this)) {
            revert NftMarketPlace__NFTNotApprovedForSale();
        }

        Listing memory listing = Listing(
            _tokenId,
            _price,
            _nftAddress,
            msg.sender
        );
        s_listings[_nftAddress][_tokenId] = listing;
        emit NFTListed(msg.sender, _tokenId, _nftAddress, _price);
    }

    function cancelListing(
        uint _tokenId,
        address _nftAddress
    )
        external
        isTokenOwner(msg.sender, _tokenId, _nftAddress)
        isListed(_nftAddress, _tokenId)
    {
        delete s_listings[_nftAddress][_tokenId];
        emit NFTListingCancelled(msg.sender, _tokenId, _nftAddress);
    }

    function updateListing(
        uint256 _price,
        uint256 _tokenId,
        address _nftAddress
    )
        external
        isTokenOwner(msg.sender, _tokenId, _nftAddress)
        isListed(_nftAddress, _tokenId)
        nonReentrant
    {
        if (_price == 0) {
            revert NftMarketPlace__InvalidPriceSent(
                msg.sender,
                _price,
                _tokenId,
                _nftAddress
            );
        }
        s_listings[_nftAddress][_tokenId].price = _price;
        emit NFTListed(msg.sender, _tokenId, _nftAddress, _price);
    }

    function buyItem(
        uint256 _tokenId,
        address _nftAddress
    ) external payable isListed(_nftAddress, _tokenId) nonReentrant {
        Listing memory listing = s_listings[_nftAddress][_tokenId];
        if (msg.value < listing.price) {
            revert NftMarketPlace__NotEnoughETH(
                msg.sender,
                msg.value,
                listing.price,
                _tokenId
            );
        }
        s_proceeds[listing.owner] += msg.value;
        delete s_listings[_nftAddress][_tokenId];
        IERC721 nftContract = IERC721(listing.nftAddress);
        nftContract.safeTransferFrom(listing.owner, msg.sender, _tokenId);
        emit NFTBought(
            listing.owner,
            msg.sender,
            _tokenId,
            listing.nftAddress,
            msg.value
        );
    }

    function withdrawProceeds() public nonReentrant {
        uint amount = s_proceeds[msg.sender];
        if (amount == 0) {
            revert NftMarketPlace__NotEnoughProceeds();
        }
        s_proceeds[msg.sender] = 0;
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        if (!success) revert NftMarketPlace__ProceedsWithdrawalFailed();
    }

    function getListing(
        address _nftAddress,
        uint256 _tokenId
    ) external view returns (Listing memory) {
        return s_listings[_nftAddress][_tokenId];
    }

    function getProceed() external view returns (uint256) {
        return s_proceeds[msg.sender];
    }

    fallback() external payable {}

    receive() external payable {}
}
