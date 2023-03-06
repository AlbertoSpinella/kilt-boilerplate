import {
    Blockchain,
    ConfigService,
    Did
} from '@kiltprotocol/sdk-js';

import { getAccount, getKeypairs, authenticationSigner } from '../libs/utils';
import { connect } from 'http2';
import { disconnect } from 'process';

const WSS_ADDRESS = "wss://peregrine.kilt.io/parachain-public-ws";
const mnemonic1 = "one two three four five six seven eight nine ten eleven twelve";
const mnemonic2 = "thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty twentyone twentytwo twentythree twentyfour";
const did1 = "did:kilt:did";

const main = async () => {
    const api = ConfigService.get('api');
    const { authentication: authentication1 } = await getKeypairs(mnemonic1);
    const { assertion: assertion2 } = await getKeypairs(mnemonic2);

    const account = await getAccount(mnemonic2);

    const extrinsic = api.tx.did.setAttestationKey(Did.publicKeyToChain(assertion2));

    const tx = await Did.authorizeTx(
        did1,
        extrinsic,
        await authenticationSigner({
            authentication: authentication1
        }),
        account.address
    );

    try {
        const result = await Blockchain.signAndSubmitTx(tx, account);
        console.log({ result });
    } catch (error) {
        console.log({ KILTerror: error });
        return false;
    }
};

await connect(WSS_ADDRESS);
main();
await disconnect();