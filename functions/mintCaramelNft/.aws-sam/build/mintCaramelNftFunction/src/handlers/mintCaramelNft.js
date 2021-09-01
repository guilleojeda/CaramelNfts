// Create clients and set shared const values outside of the handler.

/**
 * A function that receives NFT data and mints an NFT.
 */
exports.mintCaramelNftHandler = async (event) => {
    if (event.httpMethod !== 'POST') {
        throw new Error(`mintCaramelNft only accepts POST method, you tried: ${event.httpMethod}`);
    }
    // All log statements are written to CloudWatch
    console.info('received:', event);

    const response = {
        statusCode: 200,
        body: JSON.stringify(items)
    };

    // All log statements are written to CloudWatch
    console.info(`response from: ${event.path} statusCode: ${response.statusCode} body: ${response.body}`);
    return response;
}
