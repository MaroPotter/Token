const TokenA = artifacts.require("TokenA");
const TokenB = artifacts.require("TokenB");
const TransferToken = artifacts.require("TransferToken");

module.exports = function (deployer) {
    const name = "";
    const symbol = "";
    const price = 0;
    deployer.deploy(TokenA, name, symbol).then(function(){
        return deployer.deploy(TokenB, name, symbol).then(function(){
            return deployer.deploy(TransferToken, TokenA.address, TokenB.address, price)
        });
    });
};
