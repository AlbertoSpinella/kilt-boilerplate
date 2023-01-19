import { apiConnect, apiDisconnect } from "./api";
import { createSimpleFullDid, createSimpleLightDid } from "./did";
import { addPair, createKeyring } from "./polkadot";
import { createDriversLicenseCType, useStoreTxSignCallback } from "./credentials";

const main = async () => {
    const api = await apiConnect();
    const keyring = createKeyring();
    console.log({ keyring });
    const pair = await addPair(keyring);
    console.log({ pair });

    const { address, addressRaw, publicKey, type } = pair;
    console.log({ address, addressRaw, publicKey, type });
    const simpleLightDid = createSimpleLightDid({ authentication: { publicKey, type } });
    console.log({ simpleLightDid });

    const signCallback = await useStoreTxSignCallback(pair.address);

    // const simpleFullDid = await createSimpleFullDid(pair, { authentication: { publicKey, type } }, signCallback);
    // console.log({ simpleFullDid });

    // const ctype = await createDriversLicenseCType(simpleLightDid.uri, pair, pair.sign);
    // console.log({ ctype });

    await apiDisconnect();
};

main();