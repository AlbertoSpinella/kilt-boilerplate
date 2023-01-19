import { Keyring } from '@polkadot/keyring';
import { cryptoWaitReady, mnemonicGenerate } from '@polkadot/util-crypto';

export const createKeyring = () => {
    // create a keyring with some non-default values specified
    const keyring = new Keyring({ type: 'sr25519', ss58Format: 0 });
    return keyring;
};

export const addPair = async (keyring) => {
    // generate a mnemonic with default params (we can pass the number
    // of words required 12, 15, 18, 21 or 24, less than 12 words, while
    // valid, is not supported since it is more-easily crackable)
    const mnemonic = mnemonicGenerate();
    await cryptoWaitReady();

    // create & add the pair to the keyring with the type and some additional
    // metadata specified
    const pair = keyring.addFromUri(mnemonic, { name: 'first pair' }, 'sr25519');

    // the pair has been added to our keyring
    console.log(keyring.pairs.length, 'pairs available');

    // log the name & address (the latter encoded with the ss58Format)
    console.log(pair.meta.name, 'has address', pair.address);
    return pair;
};