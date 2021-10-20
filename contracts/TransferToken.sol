// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;
import "@openzeppelin/contracts/access/Ownable.sol";
import "prb-math/contracts/PRBMathSD59x18.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./TokenA.sol";
import "./TokenB.sol";


contract TransferToken is Ownable {
    using SafeERC20 for IERC20;
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
        if(_tokenAddress == tokenAddressA) {
            TokenA tokenA = TokenA(_tokenAddress);
//            require(tokenA.safeTransferFrom(owner(), address(this), _amount), "transferFrom failed");
            tokenA.transferFrom(owner(), address(this), _amount);
            amountTokenA += _amount;
        }
        if(_tokenAddress == tokenAddressB) {
            TokenB tokenB = TokenB(_tokenAddress);
            tokenB.transferFrom(owner(), address(this), _amount);
            amountTokenB += _amount;
        }
    }

    function exchange(address _tokenAddress, uint256 _amountToken) external {
        if (_tokenAddress == tokenAddressA) {
            uint256 exchangedAmountTokenB = uint256(int256(_amountToken).div(int256(priceTokenB))); // exchangedAmountTokenB = _amountToken / priceTokenB
            require(exchangedAmountTokenB <= amountTokenB);

            TokenA tokenA = TokenA(_tokenAddress);
//            require(tokenA.safeTransferFrom(msg.sender, address(this), _amountToken), "transferFrom failed");
            tokenA.transferFrom(msg.sender, address(this), _amountToken);
            amountTokenA += _amountToken;

            TokenB tokenB = TokenB(tokenAddressB);
//            require(tokenB.safeTransfer(msg.sender, exchangedAmountTokenB));
            tokenB.transfer(msg.sender, exchangedAmountTokenB);
            amountTokenB -= exchangedAmountTokenB;
        }

        if(_tokenAddress == tokenAddressB ) {
            uint256 exchangedAmountTokenA = uint256(int256(_amountToken).mul(int256(priceTokenB))); // exchangedAmountTokenA = _amountToken * priceTokenB
            require(exchangedAmountTokenA <= amountTokenA);

            TokenB tokenB = TokenB(_tokenAddress);
//            require(tokenB.safeTransferFrom(msg.sender, address(this), _amountToken), "transferFrom failed");
            tokenB.transferFrom(msg.sender, address(this), _amountToken);
            amountTokenB += _amountToken;

            TokenA tokenA = TokenA(tokenAddressA);
            tokenA.transfer(msg.sender, exchangedAmountTokenA);
            amountTokenA -= exchangedAmountTokenA;
        }
    }
}