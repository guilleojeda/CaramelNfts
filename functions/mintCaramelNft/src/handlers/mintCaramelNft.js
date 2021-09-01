// Create clients and set shared const values outside of the handler.

//fix authentication for lambda DONE
//deploy contract to polygon
//put contract ABI in s3 bucket
//add permissions to lambda to read secret from secrets manager

//read contract ABI from s3 bucket and set it to const Asset

const Web3 = require("web3");
const infuraProjectId = process.env.INFURA_KEY;
const networks = {
    "80001": "https://polygon-mumbai.infura.io/v3/",
    "137": "https://polygon-mainnet.infura.io/v3/",
    "1": "https://mainnet.infura.io/v3/",
    "4": "https://rinkeby.infura.io/v3/"
};
var networkId = process.env.NETWORK_ID
let web3 = new Web3(new Web3.providers.HttpProvider(networks[networkId] + infuraProjectId));
// const deployedNetwork = Asset.networks[networkId];
// console.info(`deployed contract address: ${deployedNetwork.address}`);

const publicKey = process.env.PUBLIC_KEY;
const privateKeySecretName = process.env.PRIVATE_KEY_SECRET_NAME

const GASSTATION_API_URL = 'https://gasstation-mainnet.matic.network';
import fetch from 'node-fetch';
const gasPriceSelection = 'fastest';

/**
 * A function that receives NFT data and mints an NFT.
 */
exports.mintCaramelNftHandler = async (event) => {
    if (event.httpMethod !== 'POST') {
        throw new Error(`mintCaramelNft only accepts POST method, you tried: ${event.httpMethod}`);
    }
    // All log statements are written to CloudWatch
    console.info('received:', event);

    const buyer = event.buyer;
    
    //get NFT data from event
    //build json
    //save json to S3
    //get uri from json in s3
    
    //get private key from secrets manager

    // const nftFactoryInstance = new web3.eth.Contract(Asset.abi, deployedNetwork && deployedNetwork.address);
    // let account = web3.eth.accounts.privateKeyToAccount(privateKey);

    let gasPrice = 15;
    let blockTime;
    await fetch(GASSTATION_API_URL)
        .then(response => response.json())
        .then(json => {
            gasPrice = (json[gasPriceSelection]).toFixed(4); 
            blockTime = json["blockTime"];
        });
    console.info(`Gas price for ${gasPriceSelection} transaction is ${gasPrice}`);
    console.info(`Expected duration of the transaction is ${blockTime} seconds`);

    // var encoded = await nftFactoryInstance.methods.mint(buyer, uri).encodeABI();
    // var tx = {
    //     from: publicKey,
    //     to : deployedNetwork.address,
    //     data : encoded,
    //     gas: await web3.eth.estimateGas({
    //         from: publicKey,
    //         to: deployedNetwork.address,
    //         data: encoded
    //     }),
    //     nonce: await web3.eth.getTransactionCount(publicKey, 'pending'),
    //     maxFeePerGas: web3.utils.toWei("" + gasPrice, 'gwei')
    // }
    // let signed = await web3.eth.accounts.signTransaction(tx, account.privateKey);
    // const data = await sendTransaction(signed.rawTransaction)
    // const tokenId = getTokenId(data);
    // console.info('got token id ', tokenId);

    //update token id in json in s3

    const response = {
        statusCode: 200,
        body: JSON.stringify(infuraProjectId)
    };

    // All log statements are written to CloudWatch
    console.info(`response from: ${event.path} statusCode: ${response.statusCode} body: ${response.body}`);
    return response;
}

function sendTransaction(transaction) {
    return new Promise((resolve, reject) => {
        web3.eth.sendSignedTransaction(transaction)
        .once('transactionHash', (hash) => { console.info('transaction hash is ', hash) })
        .on('receipt', (data) => {resolve(data)})
        .on('error', (error) => {
            console.log("Encountered an error");
            console.error(error);
        });
    });
}

function getTokenId(data) {
    let inputs = [{
      type: 'uint256',
      name: 'tokenId',
      indexed: false
    }];
    
    let hexString = data.logs[1].data;
  
    let topics = data.logs[1].topics;
  
    let parsedData = web3.eth.abi.decodeLog(inputs, hexString, topics);
    let tokenId = parsedData.tokenId;
    return tokenId;
}
