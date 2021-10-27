const Token = artifacts.require('Token');
const TransferToken = artifacts.require('TransferToken');
require('chai')
    .use(require('chai-as-promised'))
    .should();

// This is a workaround till BigInt is fully supported by the standard
// If this is not done, then a JSON.stringify(BigInt) throws
// "TypeError: Do not know how to serialize a BigInt"
BigInt.prototype.toJSON = function() {
    return this.toString();
};

async function testIfAccountBalanceHasExpectedValue (_address, _token, _amount) {
    (BigInt(await (_token.balanceOf(_address)))).should.equal(_amount);
}


contract('Token', accounts => {

    describe('testing Token', function () {
        it('Created tokens A & B with appropriate names', async function () {
            const expectedNameA = 'Ala';
            const expectedNameB = 'Bla';
            const tokenA = await Token.new('Ala', 'AL', 6);
            const tokenB = await Token.new('Bla', 'BL', 2);
            (await tokenA.name()).should.equal(expectedNameA);
            (await tokenB.name()).should.equal(expectedNameB);
        });
    });
});


contract('TransferToken', accounts => {

    describe('testing TransferToken', function() {
        let tokenA;
        let addressTokenA;
        let tokenB;
        let addressTokenB;
        let transferToken;
        let addressTransferToken;
        let owner;
        let price;
        const user = accounts[9];

        before(async() => {
            tokenA = await Token.new('Ala', 'AL', 6);
            addressTokenA = tokenA.address;
            tokenB = await Token.new('Bla', 'BL', 2);
            addressTokenB = tokenB.address;
            price = BigInt(2.93 * 1e18);
            transferToken = await TransferToken.new(addressTokenA, addressTokenB, price);
            addressTransferToken = transferToken.address;
            owner = await transferToken.owner();
        });

        it('owner got 1000 A-tokens and 1000 B-tokens', async function() {
             await testIfAccountBalanceHasExpectedValue(owner, tokenA, BigInt(1000 * 1e6));
             await testIfAccountBalanceHasExpectedValue(owner, tokenB, BigInt(1000 * 1e2));
        });

        it('owner approved TransferToken and called function deposit()', async function() {
            await tokenA.approve(addressTransferToken, BigInt(500 * 1e6));
            await tokenB.approve(addressTransferToken, BigInt(250 * 1e2));

            await transferToken.deposit(addressTokenB, BigInt(250 * 1e2));
            await testIfAccountBalanceHasExpectedValue(addressTransferToken, tokenB, BigInt(250 * 1e2));
        });

        it('owner sent a certain amount of tokenA to user, user set an allowance to transferToken', async function() {
            await tokenA.transfer(user, BigInt(500 * 1e6));
            await testIfAccountBalanceHasExpectedValue(user, tokenA, BigInt(500 * 1e6));

            await tokenA.approve(addressTransferToken, BigInt(500 * 1e6), {from: user});
        });

        it('user exchanged tokenA for tokenB', async function() {

            await transferToken.exchange(addressTokenA, BigInt(500 * 1e6), {from: user});

            await testIfAccountBalanceHasExpectedValue(user, tokenA, BigInt(0));
            await testIfAccountBalanceHasExpectedValue(addressTransferToken, tokenA, BigInt(500 * 1e6));
            await testIfAccountBalanceHasExpectedValue(user, tokenB, BigInt(17065)); // ~ 170.648 *1e2
            await testIfAccountBalanceHasExpectedValue(addressTransferToken, tokenB, BigInt(7935)); // 79.35 * 1e2
        });

        it('owner called updatePrice and user exchanged tokens for the new price', async function() {

            price = BigInt(2.1112 * 1e18);
            await transferToken.updatePrice(price);

            await tokenB.approve(addressTransferToken, BigInt(170.65 * 1e2), {from: user});
            await transferToken.exchange(addressTokenB, BigInt(170.65 * 1e2),{from: user});

            await testIfAccountBalanceHasExpectedValue(user, tokenA, BigInt(360.276280 * 1e6));
            await testIfAccountBalanceHasExpectedValue(addressTransferToken, tokenA, BigInt(139.723720 * 1e6));
            await testIfAccountBalanceHasExpectedValue(user, tokenB, BigInt(0));
            await testIfAccountBalanceHasExpectedValue(addressTransferToken, tokenB, BigInt(7935) + BigInt(17065)); // 250.00 * 1e2
        });

        it('transferToken didn\'t exchange tokens due to insufficient balance', async function() {
            transferToken.exchange(addressTokenB, BigInt(100 * 1e18), {from: user})
                .should.be.rejectedWith(Error, "Returned error: VM Exception while processing transaction: revert");
        });

        it('Rejected deposit and exchange with wrong addresses', async function() {
            transferToken.deposit(addressTransferToken, BigInt(500*1e18))
                .should.be.rejectedWith(Error, "Returned error: VM Exception while processing transaction: revert");
            transferToken.exchange("0xrtknhth", BigInt(100 * 1e18))
                .should.be.rejectedWith(Error, "invalid address (argument=\"address\", value=\"0xrtknhth\"," +
                " code=INVALID_ARGUMENT, version=address/5.0.5) (argument=\"_tokenAddress\", value=\"0xrtknhth\"," +
                " code=INVALID_ARGUMENT, version=abi/5.0.7)");
        });

        it('Rejected owner\'s transaction when he didn\'t have enough funds', async function() {
            transferToken.deposit(addressTokenA, BigInt(1100 * 1e18))
                .should.be.rejectedWith(Error, "Returned error: VM Exception while processing transaction: revert ERC20:" +
                " transfer amount exceeds balance -- Reason given: ERC20: transfer amount exceeds balance.");
        });
    });
});
