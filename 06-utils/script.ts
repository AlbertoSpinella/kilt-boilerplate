import { connect, disconnect, ConfigService, Blockchain } from '@kiltprotocol/sdk-js';
import { getAccount } from './libs/utils';
import { PublicCredential } from '@kiltprotocol/core';

const WSS_ADDRESS = "wss://peregrine.kilt.io/parachain-public-ws";
const mnemonic2 = "sail forest where unfold future rent mass ozone dismiss click iron rose";

const main = async () => {
    await connect(WSS_ADDRESS);
    const api = ConfigService.get('api');
    
    const result = await PublicCredential.fetchCredentialsFromChain("did:asset:eip155:1287.erc721:0xec911a84a7ef5a05686c671cae02fafa1e23f447");

    console.dir({ result }, { depth: null });

    await disconnect();
};

main();