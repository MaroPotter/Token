const TokenA = artifacts.require('TokenA');
const TokenB = artifacts.require('TokenB');
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
            const tokenA = await TokenA.new('Ala', 'AL');
            const tokenB = await TokenB.new('Bla', 'BL');
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
        const user = accounts[9];
        let price;

        before(async() => {
            tokenA = await TokenA.new('Ala', 'AL');
            addressTokenA = tokenA.address;
            tokenB = await TokenB.new('Bla', 'BL');
            addressTokenB = tokenB.address;
            price = BigInt(2.85 * 1e18);
            transferToken = await TransferToken.new(addressTokenA, addressTokenB, price);
            addressTransferToken = transferToken.address;
            owner = await transferToken.owner();
        });

        it('owner got 1000 A-tokens and 1000 B-tokens', async function() {
             await testIfAccountBalanceHasExpectedValue(owner, tokenA, BigInt(1000 * 1e18));
             await testIfAccountBalanceHasExpectedValue(owner, tokenB, BigInt(1000 * 1e18));
        });

        it('owner approved TransferToken and called function deposit()', async function() {
            // await tokenA.safeApprove(addressTransferToken, BigInt(500 * 1e18));
            await tokenA.approve(addressTransferToken, BigInt(500 * 1e18));
            await tokenB.approve(addressTransferToken, BigInt(250 * 1e18));

            await transferToken.deposit(addressTokenB, BigInt(250 * 1e18));
            await testIfAccountBalanceHasExpectedValue(addressTransferToken, tokenB, BigInt(250 * 1e18));
        });

        it('owner sent a certain amount of tokenA to user, user set an allowance to transferToken', async function() {
            await tokenA.transfer(user, BigInt(500 * 1e18));
            await testIfAccountBalanceHasExpectedValue(user, tokenA, BigInt(500 * 1e18));

            await tokenA.approve(addressTransferToken, BigInt(500 * 1e18), {from: user});
        });

        it('user exchanged tokenA for tokenB', async function() {
            await transferToken.exchange(addressTokenA, BigInt(500 * 1e18), {from: user});

            await testIfAccountBalanceHasExpectedValue(user, tokenA, BigInt(0));
            await testIfAccountBalanceHasExpectedValue(addressTransferToken, tokenA, BigInt(500 * 1e18));
            await testIfAccountBalanceHasExpectedValue(user, tokenB, BigInt(175438596491228070175n)); //~175.4*10^18
            await testIfAccountBalanceHasExpectedValue(addressTransferToken, tokenB, BigInt(74561403508771929825n)); // ~74.6*10^18
        });

        it('owner called updatePrice and user exchanged tokens for the new price', async function() {
            price = BigInt(2.1911 * 1e18);
            await transferToken.updatePrice(price);
            await tokenB.approve(addressTransferToken, BigInt(175 * 1e18), {from: user});
            await transferToken.exchange(addressTokenB, BigInt(175 * 1e18),{from: user});

            await testIfAccountBalanceHasExpectedValue(user, tokenA, BigInt(3834425) * BigInt(1e14));
            await testIfAccountBalanceHasExpectedValue(addressTransferToken, tokenA, BigInt(1165575) * BigInt(1e14));
            //
            await testIfAccountBalanceHasExpectedValue(user, tokenB, BigInt(438596491228070175n)); // ~ 0.4*10^18
            await testIfAccountBalanceHasExpectedValue(addressTransferToken, tokenB, BigInt(175 * 1e18) + BigInt(74561403508771929825n)); // 249.6
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
