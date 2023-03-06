import { connect, disconnect } from '@kiltprotocol/sdk-js';

import { ensureStoredCtype } from './generateCtype';
import { getAccount, getKeypairs } from '../libs/utils';

const WSS_ADDRESS = "wss://peregrine.kilt.io/parachain-public-ws";
const MNEMONIC = "one two three four five six seven eight nine ten eleven twelve";
const DID_ORIG = "did:kilt:did";

const main = async () => {
    try {    
        const account = await getAccount(MNEMONIC);
        const { assertion } = await getKeypairs(MNEMONIC);

        const done = await ensureStoredCtype(DID_ORIG, account, async ({ data }) => ({
            signature: assertion.sign(data),
            keyType: assertion.type
        }))
        console.log({ done });
    } catch (e) {
        console.log('Error while checking on chain ctype')
        throw e
    }
};

await connect(WSS_ADDRESS);
main();
await disconnect();