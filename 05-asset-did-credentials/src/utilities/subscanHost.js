"use strict";
exports.__esModule = true;
var subscanHosts = {
    'wss://peregrine.kilt.io/parachain-public-ws': 'https://kilt-testnet.subscan.io',
    'wss://spiritnet.kilt.io': 'https://spiritnet.subscan.io',
    'wss://kilt-rpc.dwellir.com': 'https://spiritnet.subscan.io'
};
function getSubscanHost() {
    var endpoint = process.env.CHAIN_ENDPOINT;
    if (!endpoint) {
        throw new Error('Chain endpoint not defined');
    }
    return subscanHosts[endpoint];
}
exports.getSubscanHost = getSubscanHost;
