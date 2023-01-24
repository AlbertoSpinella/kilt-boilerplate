import * as Kilt from '@kiltprotocol/sdk-js';
import { mnemonicGenerate } from '@polkadot/util-crypto';
import { config as envConfig } from 'dotenv';

import { generateAccount } from "./attester/generateAccount";
import { ensureStoredCtype } from "./attester/generateCtype";
import { createFullDid } from "./attester/generateDid";
import { generateKeypairs } from "./attester/generateKeypairs";
import readline from "readline";
import { generateCredential } from './claimer/generateCredential';
import { generateLightDid } from './claimer/generateLightDid';
import { attestingFlow } from './attester/attestCredential';
import { verificationFlow } from './verify';

const askQuestion = (query: string) => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise(resolve => rl.question(query, ans => {
        rl.close();
        resolve(ans);
    }))
};

const main = async () => {
    envConfig();

    console.log({ WSS_ADDRESS: process.env.WSS_ADDRESS });
    await Kilt.connect(process.env.WSS_ADDRESS as string);

    //phase 1
    const { account: attesterAccount, mnemonic: attesterMnemonic } = generateAccount();
    process.env.ATTESTER_ACCOUNT_MNEMONIC = attesterMnemonic;
    process.env.ATTESTER_ACCOUNT_ADDRESS = attesterAccount.address;

    console.log({
        ATTESTER_ACCOUNT_MNEMONIC: process.env.ATTESTER_ACCOUNT_MNEMONIC,
        ATTESTER_ACCOUNT_ADDRESS: process.env.ATTESTER_ACCOUNT_ADDRESS
    });

    // before this step, it's necessary to request PILT to faucet (https://faucet.peregrine.kilt.io/)
    await askQuestion("Go to https://faucet.peregrine.kilt.io and paste your address");

    //phase 2
    const { mnemonic: attesterDidMnemonic } = await createFullDid(attesterAccount);
    process.env.ATTESTER_DID_MNEMONIC = attesterDidMnemonic;

    console.log({ ATTESTER_DID_MNEMONIC: process.env.ATTESTER_DID_MNEMONIC });

    //phase 3
    const {
        authentication: attesterAuthentication,
        attestation: attesterAttestation
    } = generateKeypairs(attesterDidMnemonic);
    const attesterDidUri = Kilt.Did.getFullDidUriFromKey(attesterAuthentication);
    console.log({ attesterDidUri });
    await ensureStoredCtype(attesterAccount, attesterDidUri, async ({ data }) => ({
        signature: attesterAttestation.sign(data),
        keyType: attesterAttestation.type
    }));

    //phase 4
    const claimerMnemonic = mnemonicGenerate();
    process.env.CLAIMER_DID_MNEMONIC = claimerMnemonic;

    console.log({ CLAIMER_DID_MNEMONIC: process.env.CLAIMER_DID_MNEMONIC });

    //phase 5
    const data = {
        age: 28,
        name: 'Max Mustermann'
    };
    const claimerDid = generateLightDid(claimerMnemonic)
    const request = generateCredential(claimerDid.uri, data);
    console.log(JSON.stringify(request));

    //phase 6
    const credential = await attestingFlow(claimerDid.uri, attesterAccount, attesterDidUri, async ({ data }) => ({
        signature: attesterAttestation.sign(data),
        keyType: attesterAttestation.type
    }));
    process.env.CLAIMER_CREDENTIAL = JSON.stringify(credential);
    console.log({ CLAIMER_CREDENTIAL: process.env.CLAIMER_CREDENTIAL });

    //phase 7
    const {
        authentication: claimerAuthentication,
        attestation: claimerAttestation
    } = generateKeypairs(claimerMnemonic);

    await verificationFlow(credential, async ({ data }) => ({
        signature: claimerAuthentication.sign(data),
        keyType: claimerAuthentication.type,
        keyUri: `${claimerDid.uri}${claimerDid.authentication[0].id}`
    }));

    await Kilt.disconnect();
};

main();