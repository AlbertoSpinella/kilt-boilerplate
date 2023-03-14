# KILT protocol

## Index
- 1. Sporran & KILT login
    - 1.1. APIs flow **[developers]**
    - 1.2. Install Sporran & create identity **[users]**
- 2. AssetDID for NFTs
    - 2.1. Sign the assetDID and make identity B act on behalf of identity A **[developers]**
        - 2.1.1. Make identity B act on behalf of identity A
        - 2.1.2. Sign the assetDID
    - 2.2. Verify the attester identity and the artist claim **[users]**
        - 2.2.1. How to verify that the NFT has been attested by Public Pressure through Kilt Protocol
        - 2.2.2. How to view the claim content and see who is the artist

## 1. Sporran & KILT login
Public Pressure's brand new feature consists in an alternative way to login. This is made through Sporran extension, which is available [for Firefox](https://addons.mozilla.org/en-US/firefox/addon/sporran/) and [for Chrome](https://chrome.google.com/webstore/detail/sporran/djdnajgjcbjhhbdblkegbcgodlkkfhcl).
This document intends to guide you through the entire implementation process and teaches the final user how to setup and use the extension.

### 1.1. APIs flow [developers]

[Here is the reference repository](https://github.com/KILTprotocol/nextjs-sporran-credential-login). This project implements both frontend and backend side.
- On the BE side, you need to have a verifier identity in order to verify the presentation provided by the user during the login process. The verifier identity needs to have an on-chain DID, which costs around 2-3 KILTs. If you're testing on the Peregrine (the testnet), you can use [the faucet](https://faucet.peregrine.kilt.io); otherwise, if you're on the Spiritnet (the mainnet) you need to pay in order to create an on-chain DID.
- In your BE, you need to store some secrets related to the verifier identity. To be precise, you need:
  - its mnemonic
  - its address
  - its DID

### 1.2. Install Sporran & create identity [users]
Once the extension is installed in your browser, you need to create an identity. If you already have one, you can import it.
- While creating the identity, Sporran provides you a mnemonic, which is a 12-words secret phrase that you need to carefully store in a safe place. If you lose your mnemonic, you lose your identity!
- Once created the account, Sporran asks you to provide a local password for the extension. This step is less important than the mnemonic; if you lose the local password you don't lose your identity, but you need to re-import the mnemonic.
- Now that you have an identity, you need to add a credential to the extension. In order to be able to login to Public Pressure, you need an `email` credential. To do so, open the Sporran extension and click on `Show credentials` and `How to Get Credentials`. This will redirect you to [socialkyc.io](https://socialkyc.io/). Follow the instructions and select `>Email Address`: **you need to use the same email address you have in your Public Pressure account**. Following the instructions, socialKYC will send you a confirmation email, so confirm it and this will generate a credential file. We recommend you to download it and store it carefully. Finally, import the credential and your setup is done!
- Visit [Public Pressure's login page](https://app.publicpressure.io/login) and click on `Login with KILT`. This will open up the Sporran extension; be sure to check the email address you just added, confirm with your local password and you're logged in.

## 2. AssetDID for NFTs

### 2.1. Sign the assetDID and make identity B act on behalf of identity A [developers]
[Here is the reference repository](https://github.com/BTE-Trusted-Entity/asset-did-credentials). This repository uses the Sporran extension to sign AssetDIDs; Public Pressure automated this process for each NFT deployed on each chain.

### 2.1.1. Make identity B act on behalf of identity A
The reason we need to make an identity B act on behalf of identity A (a "delegation" mechanism) is that if the identity gets compromised, at least this is a rotatable credential: identity A can revoke permissions to attest from identity B, and "delegate" to a newer identity C.
- We need to set the assertion of identity B as the attestation key of identity A. Here is a sample snippet:
```javascript
import {
    Blockchain,
    ConfigService,
    Did,
    connect,
    disconnect
} from '@kiltprotocol/sdk-js';

const WSS_ADDRESS = "wss://peregrine.kilt.io/parachain-public-ws";
const mnemonicA = "one two three four five six seven eight nine ten eleven twelve";
const mnemonicB = "thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty twentyone twentytwo twentythree twentyfour";
const didA = "did:kilt:did";

const main = async () => {
    const api = ConfigService.get('api');
    const { authentication: authenticationA } = await getKeypairs(mnemonicA);
    const { assertion: assertionB } = await getKeypairs(mnemonicB);

    const account = await getAccount(mnemonicB);

    const extrinsic = api.tx.did.setAttestationKey(Did.publicKeyToChain(assertionB));

    const tx = await Did.authorizeTx(
        didA,
        extrinsic,
        await authenticationSigner({
            authentication: authenticationA
        }),
        account.address
    );

    try {
        const result = await Blockchain.signAndSubmitTx(tx, account);
        console.log({ result });
    } catch (error) {
        console.log({ error });
        return false;
    }
};

connect(WSS_ADDRESS);
main();
disconnect();
```

Be sure to replace the value of `WSS_ADDRESS`, `mnemonicA`, `mnemonicB` and `didA`.
- The process needed to sign the assetDID can be resumed by this snippet:
```javascript
export const signAssetDID = async (contractAddress, chainId, artist) => {
    const api = ConfigService.get('api');

    const { assertion } = await getKeypairs(VERIFIER_MNEMONIC_B);

    const assetDidUri = `did:asset:eip155:${chainId}.erc721:${contractAddress}`;
    
    const claim = {
        cTypeHash: CType.idToChain(CTYTPEHASH),
        contents: { artist },
        subject: assetDidUri
    };

    const credential = PublicCredential.fromClaim(claim);

    const extrinsic = api.tx.publicCredentials.add(PublicCredential.toChain(credential));

    const fullDid: any = await Did.resolve(VERIFIER_DID_URI_A);

    const sign: any = ({ data, keyRelationship }) => {
        const signingKey: any =
            keyRelationship === 'assertionMethod' ?
                assertion :
                [];
        const signature = signingKey.sign(data, { withType: false });
        const keyType = signingKey.type;
        const keyUri = `${fullDid.uri}${fullDid.document.assertionMethod[0].id}`;
    
        return { signature, keyType, keyUri };
    };

    const account = await getAccount(VERIFIER_MNEMONIC_B);

    const authorized = await Did.authorizeTx(
        VERIFIER_DID_URI_A,
        extrinsic,
        sign,
        account.address
    );

    const signedTx = await authorized.signAsync(account, {});

    try {
        await Blockchain.submitSignedTx(signedTx);
    } catch (error) {
        // console.log({ KILTerror: error });
        return false;
    }
    return signedTx.hash.toHex();
};
```

This will return the transaction hash. You can visit the subscan website:
- [Peregrine](https://kilt-testnet.subscan.io/)
- [Spiritnet](https://spiritnet.subscan.io/)

and search for the transaction hash, which is called "extrinsic".

### 2.2. Verify the attester identity and the artist claim [users]

#### 2.2.1. How to verify that the NFT has been attested by Public Pressure through Kilt Protocol

- Visiting the NFT page, under the voice `Kilt attestations`, you can see one or more button that proves you the attestation process of the NFT, attested by Public Pressure. The Public Pressure's DID is `did:kilt:4qHgPwSDG7gxvCWSSeiNaW22DvApUFCFFyfqieEGrH3AshvK`: this identifies uniquely Public Pressure, [as verifiable here](https://w3n.id/publicpressure).
- When you click the button, it will redirects you to [subscan](https://spiritnet.subscan.io), pointing to the extrinsic in which Public Pressure verified this NFT. There you should see a `Block number` section: copy it's value.
 - Visit [polkadot website](https://polkadot.js.org/apps/#/explorer): here you can view all information related to the specific block. **Be sure you're on the right chain, which should be `Kilt Spiritnet` (under `Polkadot & parachains`)**, and eventually press `Switch` in the top-left corner, and paste the block number you just copied in the top-right corner and press enter.
 - In the left column, open the link in the third voice, called `did.submitDidCall`.
 - Here you can see the identity of the attester, under the voice `did: AccountId32`. Its value should be as the one in the top of this document, `4qHgPwSDG7gxvCWSSeiNaW22DvApUFCFFyfqieEGrH3AshvK`.
 - If you're curious, here you can also see the assetDID under the voice `subject: Bytes`. Its format is `did:asset:chainID.tokenStandard:contractAddress`. Back to the NFT page:
   - if you clicked Moonbeam, the `chainID` is `1284`
   - if you clicked Exosama, the `chainID` is `2109`
 - The `contractAddress` is the actual address in which the NFT has been minted.

#### 2.2.2. How to view the claim content and see who is the artist
   - Visiting the NFT page and following the button link under `Kilt attestations` you can see a voice called `Parameter`: scrolling down, there's a voice called `"claims"`. It's value is the hexadecimal encoding of the artist.
   - You can search online for an hexadecimal decoder, paste the value and see who the artist is.
