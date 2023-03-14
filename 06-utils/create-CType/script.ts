import { connect, disconnect, ConfigService, Did } from '@kiltprotocol/sdk-js';

import { ensureStoredCtype } from './generateCtype';
import { getAccount, getKeypairs } from '../libs/utils';

const WSS_ADDRESS = "wss://spiritnet.kilt.io";
const MNEMONIC = "sail forest where unfold future rent mass ozone dismiss click iron rose";
const DID_ORIG = "did:kilt:4rp7YSRLcKGXNhUaF7fs93XLrQ2virs72vWkhMiheunRAWu1";
const DID_VERIFIER = "did:kilt:4qN3i5XUfMqox8w4z7iMnhrU1TdmnsQUpJ2PGUryujq9MtG3";

const main = async () => {
    try {
        await connect(WSS_ADDRESS);

        const account = await getAccount(MNEMONIC);
        const { assertion } = await getKeypairs(MNEMONIC);

        
        const did: any = await Did.resolve(DID_ORIG);

        const keyUri = `${did.document.uri}${did.document.assertionMethod[0].id}`;

            const done = await ensureStoredCtype(DID_ORIG, account, async ({ data }) => ({
                signature: assertion.sign(data, { withType: false }),
                keyType: assertion.type,
                keyUri
            }))
        console.log({ done });
    } catch (e) {
        console.log('Error while checking on chain ctype')
        throw e
    }
    await disconnect();
};

main();