import {
    KiltKeyringPair,
    NewDidEncryptionKey,
    Utils,
    connect
} from '@kiltprotocol/sdk-js';
import { ensureStoredCtype } from './generateCtype';

import { blake2AsU8a } from '@polkadot/util-crypto/blake2/asU8a';
import { keyExtractPath } from '@polkadot/util-crypto/key/extractPath';
import { keyFromPath } from '@polkadot/util-crypto/key/fromPath';
import { mnemonicToMiniSecret } from '@polkadot/util-crypto/mnemonic/toMiniSecret';
import { naclBoxPairFromSecret } from '@polkadot/util-crypto/nacl/box/fromSecret';
import { sr25519PairFromSeed } from '@polkadot/util-crypto/sr25519/pair/fromSeed';
import { Keypair } from '@polkadot/util-crypto/types';

export interface Keypairs {
    authentication: KiltKeyringPair
    assertion: KiltKeyringPair
    keyAgreement: NewDidEncryptionKey & Keypair
}

const WSS_ADDRESS = "wss://peregrine.kilt.io/parachain-public-ws";
const MNEMONIC = "one two three four five six seven eight nine ten eleven twelve";
const DID_ORIG = "did:kilt:did";

const getAccount = (mnemonic: any) => {
    const signingKeyPairType = 'sr25519';
    const keyring = new Utils.Keyring({
        ss58Format: 38,
        type: signingKeyPairType
    });
    return keyring.addFromMnemonic(mnemonic);
};

const getKeypairs = async (mnemonic: any): Promise<Keypairs> => {
    const account = await getAccount(mnemonic);
    const authentication = {
        ...account.derive('//did//0'),
        type: 'sr25519'
    } as KiltKeyringPair;
    const assertion = {
        ...account.derive('//did//assertion//0'),
        type: 'sr25519'
    } as KiltKeyringPair;
    const keyAgreement: NewDidEncryptionKey & Keypair = (function () {
        const secretKeyPair = sr25519PairFromSeed(mnemonicToMiniSecret(mnemonic));
        const { path } = keyExtractPath('//did//keyAgreement//0');
        const { secretKey } = keyFromPath(secretKeyPair, path, 'sr25519');
        return {
            ...naclBoxPairFromSecret(blake2AsU8a(secretKey)),
            type: 'x25519'
        };
    })();

    return {
        authentication,
        assertion,
        keyAgreement
    };
};

const main = async () => {

    try {
        await connect(WSS_ADDRESS as string);
    
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

main();
