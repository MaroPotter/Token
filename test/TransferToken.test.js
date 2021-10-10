const Token = artifacts.require('Token');
const TransferToken = artifacts.require('TransferToken');
require('chai')
    .use(require('chai-as-promised'))
    .should();


async function testIfAccountBalanceHasExpectedValue (_address, _token, _amount) {
    ((await _token.balanceOf(_address)).toNumber()).should.equal(_amount)
}

contract('Token', accounts => {

    describe('testing Token', function () {
        it('Created tokens A & B with appropriate names', async function () {
            const expectedNameA = 'Ala';
            const expectedNameB = 'Bla';
            const tokenA = await Token.new('Ala', 'AL');
            const tokenB = await Token.new('Bla', 'BL');
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

        before(async() => {
            tokenA = await Token.new('Ala', 'AL');
            addressTokenA = tokenA.address;
            tokenB = await Token.new('Bla', 'BL');
            addressTokenB = tokenB.address;

            transferToken = await TransferToken.new(addressTokenA, addressTokenB, 2);
            addressTransferToken = transferToken.address;
            owner = await transferToken.owner();
        });

        it('owner got 1000 A-tokens and 1000 B-tokens', async function() {
             testIfAccountBalanceHasExpectedValue(owner, tokenA, 1000);
             testIfAccountBalanceHasExpectedValue(owner, tokenB, 1000);
        });

        it('owner approved TransferToken and called function deposit()', async function() {
            await tokenA.approve(addressTransferToken, 500);
            await tokenB.approve(addressTransferToken, 250);

            await transferToken.deposit(addressTokenB, 250);
            testIfAccountBalanceHasExpectedValue(addressTransferToken, tokenB, 250);
        });

        it('owner sent a certain amount of tokenA to user, user set an allowance to transferToken', async function() {
            await tokenA.transfer(user, 400);
            testIfAccountBalanceHasExpectedValue(user, tokenA, 400);

            await tokenA.approve(addressTransferToken, 400, {from: user});
        });

        it('user exchanged tokenA for tokenB', async function() {
            await transferToken.exchange(addressTokenA, 400, {from: user});

            testIfAccountBalanceHasExpectedValue(user, tokenA, 0);
            testIfAccountBalanceHasExpectedValue(addressTransferToken, tokenA, 400);
            testIfAccountBalanceHasExpectedValue(user, tokenB, 200);
            testIfAccountBalanceHasExpectedValue(addressTransferToken, tokenB, 50);
        });

        it('owner called updatePrice and user exchanged tokens for the new price', async function() {
            await transferToken.updatePrice(3);
            await tokenB.approve(addressTransferToken, 200, {from: user});
            await transferToken.exchange(addressTokenB, 100, {from: user});
            testIfAccountBalanceHasExpectedValue(user, tokenA, 300);
            testIfAccountBalanceHasExpectedValue(addressTransferToken, tokenA, 100);
            testIfAccountBalanceHasExpectedValue(user, tokenB, 100);
            testIfAccountBalanceHasExpectedValue(addressTransferToken, tokenB, 150);
        });

        it('transferToken didn\'t exchange tokens due to its insufficient balance checked by require condition', async function() {
            transferToken.exchange(addressTokenB, 100, {from: user})
                .should.be.rejectedWith(Error, "Returned error: VM Exception while processing transaction: revert");

        });

        it('Rejected deposit and exchange with wrong addresses', async function() {
            transferToken.deposit(addressTransferToken, 500)
                .should.be.rejectedWith(Error, "Returned error: VM Exception while processing transaction: revert");
            transferToken.exchange("0xrtknhth", 100)
                .should.be.rejectedWith(Error, "invalid address (argument=\"address\", value=\"0xrtknhth\"," +
                " code=INVALID_ARGUMENT, version=address/5.0.5) (argument=\"_tokenAddress\", value=\"0xrtknhth\"," +
                " code=INVALID_ARGUMENT, version=abi/5.0.7)");
        });

        it('Rejected owner\'s transaction when he didn\'t have enough funds', async function() {
            transferToken.deposit(addressTokenA, 1100)
                .should.be.rejectedWith(Error, "Returned error: VM Exception while processing transaction: revert ERC20:" +
                " transfer amount exceeds balance -- Reason given: ERC20: transfer amount exceeds balance.");
        });
    });
});
