const Token = artifacts.require("Token");
const TransferToken = artifacts.require("TransferToken");

module.exports = function (deployer) {
    const name = "";
    const symbol = "";
    const decimals = 0;
    const price = 0;
    deployer.deploy(Token, name, symbol, decimals).then(function(){
            return deployer.deploy(TransferToken, Token.address, Token.address, price)
        });
};
