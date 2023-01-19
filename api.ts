import * as Kilt from '@kiltprotocol/sdk-js';
import axios from 'axios';

export async function apiConnect() {
    // await Kilt.connect('wss://spiritnet.kilt.io/');
    await Kilt.connect('wss://peregrine.kilt.io/parachain-public-ws');
    const api = Kilt.ConfigService.get('api');
    return api;
};

export async function apiDisconnect() {
    await Kilt.disconnect();
    return;
};