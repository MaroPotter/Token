// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;
import "@openzeppelin/contracts/access/Ownable.sol";
import "prb-math/contracts/PRBMathSD59x18.sol";

import "./TokenA.sol";
import "./TokenB.sol";


contract TransferToken is Ownable {
    using PRBMathSD59x18 for int256;
    address tokenAddressA;
    address tokenAddressB;
    uint256 amountTokenA;
    uint256 amountTokenB;
    uint256 priceTokenB;

    constructor(address _tokenAddressA, address _tokenAddressB, uint256 _priceTokenB) {
        tokenAddressA = _tokenAddressA;
        tokenAddressB = _tokenAddressB;
        priceTokenB = _priceTokenB;
    }

    function updatePrice(uint256 _newPriceTokenB) public onlyOwner {
        priceTokenB = _newPriceTokenB;
    }

    function deposit(address _tokenAddress, uint256 _amount) public onlyOwner {
        TokenB token = TokenB(_tokenAddress);
        token.transferFrom(owner(), address(this), _amount);

        if(_tokenAddress == tokenAddressA) {
            amountTokenA += _amount;
        }
        if(_tokenAddress == tokenAddressB) {
            amountTokenB += _amount;
        }
    }

    function exchange(address _tokenAddress, uint256 _amountToken) external {
        if (_tokenAddress == tokenAddressA) {
            uint256 exchangedAmountTokenB = uint256(int256(_amountToken).div(int256(priceTokenB)));
            require(exchangedAmountTokenB <= amountTokenB);

            TokenA tokenA = TokenA(_tokenAddress);
            tokenA.transferFrom(msg.sender, address(this), _amountToken);
            amountTokenA += _amountToken;

            TokenB tokenB = TokenB(tokenAddressB);
            tokenB.transfer(msg.sender, exchangedAmountTokenB);
            amountTokenB -= exchangedAmountTokenB;
        }

        if(_tokenAddress == tokenAddressB ) {
            uint256 exchangedAmountTokenA = uint256(int256(_amountToken).mul(int256(priceTokenB)));
            require(exchangedAmountTokenA <= amountTokenA);

            TokenB tokenB = TokenB(_tokenAddress);
            tokenB.transferFrom(msg.sender, address(this), _amountToken);
            amountTokenB += _amountToken;

            TokenA tokenA = TokenA(tokenAddressA);
            tokenA.transfer(msg.sender, exchangedAmountTokenA);
            amountTokenA -= exchangedAmountTokenA;
        }
    }
}