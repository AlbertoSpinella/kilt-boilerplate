import * as Kilt from '@kiltprotocol/sdk-js'

import { getCtypeSchema } from './ctypeSchema'

export async function ensureStoredCtype(
    attesterDid: Kilt.DidUri,
    account: Kilt.KeyringPair,
    signCallback: Kilt.SignExtrinsicCallback
): Promise<Kilt.ICType> {
    const api = Kilt.ConfigService.get('api')

    // Get the CTYPE and see if it's stored, if yes return it.
    const ctype = getCtypeSchema()
    try {
        await Kilt.CType.verifyStored(ctype)
        console.log('Ctype already stored. Skipping creation')
        return ctype
    } catch {
        console.log('Ctype not present. Creating it now...')
        // Authorize the tx.
        const encodedCtype = Kilt.CType.toChain(ctype)
        const tx = api.tx.ctype.add(encodedCtype)
        console.log("AAA", Kilt.Did.getKeyRelationshipForTx(tx));
        const extrinsic = await Kilt.Did.authorizeTx(
            attesterDid,
            tx,
            signCallback,
            account.address as `4${string}`
        )

        // Write to chain then return the CType.
        try {            
            await Kilt.Blockchain.signAndSubmitTx(extrinsic, account)
        } catch (error) {
            console.log(error);
        }

        return ctype
    }
}