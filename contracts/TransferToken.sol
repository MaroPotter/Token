// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;
import "@openzeppelin/contracts/access/Ownable.sol";
import "./Token.sol";

contract TransferToken is Ownable {

    address tokenAddressA;
    address tokenAddressB;
    uint amountTokenA;
    uint amountTokenB;
    uint priceTokenB;

    constructor(address _tokenAddressA, address _tokenAddressB, uint _priceTokenB) {
        tokenAddressA = _tokenAddressA;
        tokenAddressB = _tokenAddressB;
        priceTokenB = _priceTokenB;
    }
    
    function updatePrice(uint _newPriceTokenB) public onlyOwner {
        priceTokenB = _newPriceTokenB;
    }

    function deposit(address _tokenAddress, uint _amount) public onlyOwner {

        Token token = Token(_tokenAddress);
        token.transferFrom(owner(), address(this), _amount);

        if(_tokenAddress == tokenAddressA) {
            amountTokenA += _amount;
        }
        if(_tokenAddress == tokenAddressB) {
            amountTokenB += _amount;
        }
    }

    function exchange(address _tokenAddress, uint _amountToken) external {

        if (_tokenAddress == tokenAddressA) {

            Token tokenA = Token(_tokenAddress);
            uint exchangedAmountTokenB = _amountToken / priceTokenB;
            require(exchangedAmountTokenB <= amountTokenB);
            tokenA.transferFrom(msg.sender, address(this), _amountToken);
            amountTokenA += _amountToken;

            Token tokenB = Token(tokenAddressB);
            tokenB.transfer(msg.sender, exchangedAmountTokenB);
            amountTokenB -= exchangedAmountTokenB;
        }

        if(_tokenAddress == tokenAddressB ) {

            Token tokenB = Token(_tokenAddress);
            uint exchangedAmountTokenA = _amountToken * priceTokenB;
            require(exchangedAmountTokenA <= amountTokenA);
            tokenB.transferFrom(msg.sender, address(this), _amountToken);
            amountTokenB += _amountToken;

            Token tokenA = Token(tokenAddressA);
            tokenA.transfer(msg.sender, exchangedAmountTokenA);
            amountTokenA -= exchangedAmountTokenA;
        }
    }
}