// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
//import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";


contract TokenB is ERC20 {
//    using SafeERC20 for IERC20;
    constructor(string memory _name, string memory _symbol) ERC20(_name, _symbol)  {
        _mint(msg.sender, 1000*10**18);
    }
    function decimals() public pure override returns (uint8) {
        return 6;
    }
}