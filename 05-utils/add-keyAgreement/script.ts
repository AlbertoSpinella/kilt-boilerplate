import {
    Blockchain,
    ConfigService,
    Did
} from '@kiltprotocol/sdk-js';

import { getAccount, getKeypairs } from '../libs/utils';

const mnemonic1 = "one two three four five six seven eight nine ten eleven twelve";
const mnemonic2 = "thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty twentyone twentytwo twentythree twentyfour";
const did1 = "did:kilt:did";

const main = async() => {
    const api = ConfigService.get('api');

    const { keyAgreement, assertion } = await getKeypairs(mnemonic2);
    const { authentication: authentication1 } = await getKeypairs(mnemonic1);

    const keyAgreementKey = Did.publicKeyToChain(keyAgreement);

    console.log({ keyAgreement, keyAgreementKey });

    const attestationKeyCreation = api.tx.did.addKeyAgreementKey(keyAgreementKey);

    const fullDid = await Did.resolve(did1);

    const sign = ({ data, keyRelationship }) => {
        const signingKey =
            keyRelationship === 'assertionMethod'
            ? assertion
            : authentication1;
        const signature = signingKey.sign(data, { withType: false });
        const keyType = signingKey.type;
        const keyUri = `${did1}${fullDid.document.authentication[0].id}`;
        return { signature, keyType, keyUri };
    }

    const account = await getAccount(mnemonic1);

    const authorized = await Did.authorizeTx(
        did1,
        attestationKeyCreation,
        sign,
        account.address
    );

    const signedTx = await authorized.signAsync(account, {});

    try {
        const temp = await Blockchain.submitSignedTx(signedTx);
        console.log({ temp });
    } catch (error) {
        console.log({ KILTerror: error });
        return false;
    }
};

main();