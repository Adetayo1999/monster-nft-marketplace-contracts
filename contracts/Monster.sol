// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity 0.8.17;
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

error MonsterNFT__NotEnoughETH();
error MonsterNFT__WithdrawalFailed();

contract MonsterNFT is ERC721Enumerable, Ownable {
    // state variables
    uint s_nftPrice = 0.01 ether;
    uint s_tokenIds;

    // events
    event MonsterNFT__NFTMinted(
        address indexed buyer,
        uint tokenId,
        uint nftPrice
    );

    constructor() ERC721("Monster NFT", "MNFT") {}

    function mint() public payable {
        if (msg.value < s_nftPrice) {
            revert MonsterNFT__NotEnoughETH();
        }
        _safeMint(msg.sender, ++s_tokenIds);
        emit MonsterNFT__NFTMinted(msg.sender, s_tokenIds, s_nftPrice);
    }

    function changeNFTPrice(uint _nftPrice) public onlyOwner {
        s_nftPrice = _nftPrice;
    }

    function getNFTPrice() public view returns (uint) {
        return s_nftPrice;
    }

    function withdraw() public onlyOwner {
        (bool sent, ) = payable(msg.sender).call{value: address(this).balance}(
            ""
        );
        if (!sent) revert MonsterNFT__WithdrawalFailed();
    }
}
