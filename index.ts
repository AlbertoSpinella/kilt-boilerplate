import { apiConnect, apiDisconnect } from "./api";
import { createSimpleFullDid, createSimpleLightDid } from "./did";
import { addPair, createKeyring } from "./polkadot";
import { createDriversLicenseCType, useStoreTxSignCallback } from "./credentials";
import { queryPublishedCredentials } from "./w3name";

const main = async () => {
    const api = await apiConnect();
    const keyring = createKeyring();
    const pair = await addPair(keyring);
    console.log({ keyring, pair });

    const { address, addressRaw, isLocked, meta, publicKey, type } = pair;
    console.log({ address, addressRaw, isLocked, meta, publicKey, type });

    const simpleLightDid = createSimpleLightDid({ authentication: { publicKey, type } });
    console.log({ simpleLightDid });

    const signCallback = await useStoreTxSignCallback(pair.address, pair);

    try {
        const simpleFullDid = await createSimpleFullDid(pair, { authentication: { publicKey, type } }, signCallback);
        console.log({ simpleFullDid });

        // const ctype = await createDriversLicenseCType(simpleFullDid.uri, pair, signCallback);
        // console.log({ ctype });
    } catch (error) {
        console.log({ error });
    }

    await apiDisconnect();
};

main();