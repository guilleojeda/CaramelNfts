// Create clients and set shared const values outside of the handler.

//fix authentication for lambda DONE
//deploy contract to polygon DONE
//put contract ABI in s3 bucket
//add permissions to lambda to read secret from secrets manager DONE
//add permissions to lambda to read contract ABI from s3 bucket DONE
//read contract ABI from s3 bucket and set it to const Asset

const aws = require("aws-sdk");
const region = process.env.REGION
const secretsManager = new aws.SecretsManager({
    region: region
});
const s3 = new aws.S3();

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

const publicKey = process.env.PUBLIC_KEY;
const privateKeySecretName = process.env.PRIVATE_KEY_SECRET_NAME;
const jsonsBucketName = process.env.JSONS_BUCKET_NAME;
const contractAbiBucketName = process.env.CONTRACT_ABI_BUCKET_NAME;
const contractAddress = process.env.CONTRACT_ADDRESS;

const GASSTATION_API_URL = 'https://gasstation-mainnet.matic.network';
const axios = require('axios')
const gasPriceSelection = 'fastest';

/**
 * A function that receives NFT data and mints an NFT.
 */
exports.mintCaramelNftHandler = async (event) => {
    if (event.httpMethod !== 'POST') {
        throw new Error(`mintCaramelNft only accepts POST method, you tried: ${event.httpMethod}`);
    }
    console.info('received:', event);
    const body = JSON.parse(event.body);
    const buyer = body.buyer;
    console.info('buyer is ', buyer)

    const personName = body.name;
    const shortName = body.shortName;
    const personAlias = body.alias;
    const imageUrl = body.imageUrl;
    const linkedinprofile = body.linkedIn
    
    const json = buildJson(personName, personAlias, imageUrl, linkedinprofile);
    const jsonPath = 'jsons/' + shortName + '.json';
    const jsonUri = await uploadToS3(jsonPath, json);
    console.info('jsonUri is ', jsonUri);
    
    const secret = await secretsManager.getSecretValue({ SecretId: privateKeySecretName }).promise()
    const privateKey = secret.SecretString;

    const contractAbi = await getContractAbi();
    console.log(contractAbi);
    const nftFactoryInstance = new web3.eth.Contract(contractAbi, contractAddress);
    let account = web3.eth.accounts.privateKeyToAccount(privateKey);

    let gasPrice = await getGasPrice();
    console.info('gasPrice is ', gasPrice);

    var encoded = await nftFactoryInstance.methods.mintNFT(buyer, jsonUri).encodeABI();
    var tx = {
        from: publicKey,
        to : contractAddress,
        data : encoded,
        gas: await web3.eth.estimateGas({
            from: publicKey,
            to: contractAddress,
            data: encoded
        }),
        nonce: await web3.eth.getTransactionCount(publicKey, 'pending'),
        // maxFeePerGas: web3.utils.toWei("" + gasPrice, 'gwei')
        gasPrice: web3.utils.toWei("" + gasPrice, 'gwei')
    }
    let signed = await web3.eth.accounts.signTransaction(tx, account.privateKey);
    const data = await sendTransaction(signed.rawTransaction)
    const tokenId = getTokenId(data);
    console.info('got token id ', tokenId);

    //update token id in json in s3
    const responseBody = '{ "tokenId":' + tokenId + '}';
    const response = {
        statusCode: 200,
        body: responseBody
    };

    console.info(`response from: ${event.path} statusCode: ${response.statusCode} body: ${response.body}`);
    return response;
}

async function uploadToS3(path, json) {
    let params = {
        Bucket: jsonsBucketName,
        Key: path,
        Body: JSON.stringify(json),
        ContentType: "application/json",
        ACL: 'public-read'
    };
    const result = await s3.upload(params).promise()
    const jsonUri = result.Location
    return jsonUri;
}

async function sendTransaction(transaction) {
    return new Promise((resolve, reject) => {
        web3.eth.sendSignedTransaction(transaction)
        .once('transactionHash', (hash) => { console.info('transaction hash is ', hash) })
        .on('receipt', (data) => {resolve(data)})
        .on('error', (error) => {
            console.info("Encountered an error");
            console.error(error);
        });
    });
}

function getTokenId(data) {
    console.info(data)
    let inputs = [{
      type: 'uint256',
      name: 'tokenId',
      indexed: false
    }];
    
    let hexString = data.logs[1].data;
  
    let topics = data.logs[1].topics;
  
    let parsedData = web3.eth.abi.decodeLog(inputs, hexString, topics);
    console.info(parsedData)
    let tokenId = parsedData.tokenId;
    return tokenId;
}

async function getGasPrice() {
    let gasPrice;
    let blockTime;
    await axios.get(GASSTATION_API_URL)
        .then(response => {
            console.info(response)
            gasPrice = (response.data[gasPriceSelection]).toFixed(4);
            blockTime = response.data["blockTime"];
        });
    console.info(`Gas price for ${gasPriceSelection} transaction is ${gasPrice}`);
    console.info(`Expected duration of the transaction is ${blockTime} seconds`);
    return gasPrice;
}

function buildJson(personName, personAlias, imageUrl, linkedinprofile) {
    const json = {
        "name": personName,
        "alias": personAlias,
        "image": imageUrl,
        "external_link": "https://www.caramelpoint.com",
        "attributes": [
            { 
                "trait_type": "LinkedIn profile", 
                "value": linkedinprofile
            }
        ]
    }
    console.info(json);
    return json;
}

async function getContractAbi() {
    const data = await s3.getObject({
        Bucket: contractAbiBucketName,
        Key: 'CaramelNfts.json',
    }).promise()
    const fileData = data.Body.toString('utf-8');
    const contractAbi = JSON.parse(fileData);
    return contractAbi;
}