// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC721/presets/ERC721PresetMinterPauserAutoId.sol";

contract CaramelNfts is ERC721PresetMinterPauserAutoId {

    constructor() ERC721PresetMinterPauserAutoId("CaramelToken", "CARAMEL", "https://www.caramelpoint.com/nfts/metadata/") {}

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
       return string(abi.encodePacked(super.tokenURI(tokenId),".json"));
    }
}