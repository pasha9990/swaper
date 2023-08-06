const {Web3} = require('web3');
const web3 = new Web3('https://rpc.tenderly.co/fork/133a23fc-76ca-40a5-ba93-7d89ca98f998');
// const web3 = new Web3('https://rpc.phalcon.xyz/rpc_f0462055ecea4f4c81422d704c6da1a1');

const  routerAbi =  require('./routerAbi.json');
const factoryAbi  = require('./factoryAbi.json');
const erc20Abi = require('./erc20abi.json');
const pairAbi= require('./pairAbi.json');

const accountAddress = '0x0b78D6DA949f07Ad4A20bA4669971f3fFEf6fE04'; // Replace with the address of your Ethereum wallet.
const privateKey = '7ebf1582d5825914f5585698b87ff1ff1ce95fe159bfe9b4d6d2719fa9f8623d'; // Replace with your wallet's private key.
const routerAddress = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D'; // Replace with the Uniswap v2 router address.
const factoryAddress = '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f'; // Replace with the Uniswap v2 factory address.

const wethAddress = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
const targetTokenAddress =  '0x4306B12F8e824cE1fa9604BbD88f2AD4f0FE3c54';
// const targetTokenAddress =  '0xdAC17F958D2ee523a2206206994597C13D831ec7';

const factoryContract = new web3.eth.Contract(factoryAbi, factoryAddress);
const routerContract = new web3.eth.Contract(routerAbi, routerAddress);

const wethContract = new web3.eth.Contract(erc20Abi, wethAddress);
const targetContract = new web3.eth.Contract(erc20Abi,targetTokenAddress);

const swapTokens = async (amountIn) => {

  

  await wethContract.methods.approve(routerAddress,web3.utils.toWei('1000', 'ether')).send({from:accountAddress,gas:210000});

  const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // Set a deadline for the swap (20 minutes from now).

  const path = [wethAddress, targetTokenAddress]; // Path for swapping WETH to the target token.

  const amounts = await routerContract.methods.getAmountsOut(amountIn, path).call();
  const amountOut = amounts[1];

  
//   const pair_bal = await targetContract.methods.balanceOf(pair_address).call({from:accountAddress})


  const txObject = await routerContract.methods.swapExactTokensForTokens(
    amountIn,
    amountOut,
    path,
    accountAddress,
    deadline
  ).send({from:accountAddress,gas:210000});

};

const deposit = async function(amountIn){
  await wethContract.methods.deposit().send({from:accountAddress,gas:2100000,value:amountIn});

}

const transfer = async function(recipient,amount){

    await targetContract.methods.transfer(recipient,amount).send({from:accountAddress,gas:210000});
}
const main = async function main(){
    const amountIn = web3.utils.toWei('1', 'ether'); // Replace '1' with the amount of WETH you want to swap.
    let target_contract_bal = await targetContract.methods.balanceOf(accountAddress).call();
    const pair_address = await factoryContract.methods.getPair(targetTokenAddress,wethAddress).call();
    console.log("pair_address",pair_address);
    let pair_bal_before = await targetContract.methods.balanceOf(pair_address).call();

    let weth_bal = await wethContract.methods.balanceOf(accountAddress).call();
    if(weth_bal == 0){
        console.log('deposit');
        await deposit(amountIn);
    }
    weth_bal = await wethContract.methods.balanceOf(accountAddress).call();

    console.log('weth_bal:',weth_bal);
    console.log("trans amount:",target_contract_bal)
    if(target_contract_bal == 0){
        console.log('run swap');
        await swapTokens(amountIn);
        target_contract_bal = await targetContract.methods.balanceOf(accountAddress).call();

    }
    console.log("trans amount:",target_contract_bal)

    console.log("pair bal before trans:",pair_bal_before);

    let ts_before = await targetContract.methods.totalSupply().call();

    await targetContract.methods.transfer(pair_address,target_contract_bal - BigInt(100)).send({from:accountAddress,gas:210000});
    target_contract_bal = await targetContract.methods.balanceOf(accountAddress).call();
    console.log("burn account:",target_contract_bal);
    let ts_after = await targetContract.methods.totalSupply().call();
    

    let pair_bal_after = await targetContract.methods.balanceOf(pair_address).call();

    console.log("diff:", pair_bal_after - pair_bal_before);
    console.log(ts_after,ts_before);

}
main();