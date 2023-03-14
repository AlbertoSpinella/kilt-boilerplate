import cbor from 'cbor';

const main = async () => {
    const decoded = cbor.decodeFirstSync("a16661727469737469617370696e656c6c61");
    console.log({ decoded });
};

main();