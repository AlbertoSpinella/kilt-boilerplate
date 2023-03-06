import { blake2AsU8a } from '@polkadot/util-crypto/blake2/asU8a';
import { keyExtractPath } from '@polkadot/util-crypto/key/extractPath';
import { keyFromPath } from '@polkadot/util-crypto/key/fromPath';
import { mnemonicToMiniSecret } from '@polkadot/util-crypto/mnemonic/toMiniSecret';
import { naclBoxPairFromSecret } from '@polkadot/util-crypto/nacl/box/fromSecret';
import { sr25519PairFromSeed } from '@polkadot/util-crypto/sr25519/pair/fromSeed';
import { Keypair } from '@polkadot/util-crypto/types';

import {
    Blockchain,
    ConfigService,
    Did,
    KiltKeyringPair,
    NewDidEncryptionKey,
    Utils
} from '@kiltprotocol/sdk-js';

export interface Keypairs {
    authentication: KiltKeyringPair
    assertion: KiltKeyringPair
    keyAgreement: NewDidEncryptionKey & Keypair
}

const getAccount = (mnemonic) => {
    const signingKeyPairType = 'sr25519';
    const keyring = new Utils.Keyring({
        ss58Format: 38,
        type: signingKeyPairType
    });
    return keyring.addFromMnemonic(mnemonic);
};

const getKeypairs = async (mnemonic): Promise<Keypairs> => {
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

const authenticationSigner = async ({
    authentication
}) => {
    if (!authentication) throw new Error('no authentication key');

    return async ({ data }) => ({
        signature: authentication.sign(data),
        keyType: authentication.type
    });
};

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

main();