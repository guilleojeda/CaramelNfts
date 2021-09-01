// contracts/MyNFT.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/presets/ERC721PresetMinterPauserAutoId.sol";

contract CaramelNfts is ERC721 {
    constructor() ERC721("CaramelNfts", "CaramelNfts") {
    }
}