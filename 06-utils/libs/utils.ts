import {
    KiltKeyringPair,
    NewDidEncryptionKey,
    Utils,
    ConfigService,
    Did,
    Blockchain
} from '@kiltprotocol/sdk-js';

import { blake2AsU8a } from '@polkadot/util-crypto/blake2/asU8a';
import { keyExtractPath } from '@polkadot/util-crypto/key/extractPath';
import { keyFromPath } from '@polkadot/util-crypto/key/fromPath';
import { mnemonicToMiniSecret } from '@polkadot/util-crypto/mnemonic/toMiniSecret';
import { naclBoxPairFromSecret } from '@polkadot/util-crypto/nacl/box/fromSecret';
import { sr25519PairFromSeed } from '@polkadot/util-crypto/sr25519/pair/fromSeed';
import { Keypair } from '@polkadot/util-crypto/types';

interface Keypairs {
    authentication: KiltKeyringPair
    assertion: KiltKeyringPair
    keyAgreement: NewDidEncryptionKey & Keypair
}

export const getAccount = (mnemonic: any) => {
    const signingKeyPairType = 'sr25519';
    const keyring = new Utils.Keyring({
        ss58Format: 38,
        type: signingKeyPairType
    });
    return keyring.addFromMnemonic(mnemonic);
};

export const getKeypairs = async (mnemonic: any): Promise<Keypairs> => {
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

export const authenticationSigner = async ({
    authentication
}: any) => {
    if (!authentication) throw new Error('no authentication key');

    return async ({ data }: any) => ({
        signature: authentication.sign(data),
        keyType: authentication.type
    });
};