import * as Kilt from '@kiltprotocol/sdk-js'

export async function createDriversLicenseCType(
    creator: Kilt.DidUri,
    submitterAccount: Kilt.KiltKeyringPair,
    signCallback: Kilt.SignExtrinsicCallback
): Promise<Kilt.ICType> {
    const api = Kilt.ConfigService.get('api')

    // Create a new CType definition.
    const ctype = Kilt.CType.fromProperties(`Drivers License by ${creator}`, {
        name: {
            type: 'string'
        },
        age: {
            type: 'integer'
        },
        id: {
            type: 'string'
        }
    })

    // Generate a creation tx.
    const ctypeCreationTx = api.tx.ctype.add(Kilt.CType.toChain(ctype))
    // Sign it with the right DID key.
    const authorizedCtypeCreationTx = await Kilt.Did.authorizeTx(
        creator,
        ctypeCreationTx,
        signCallback,
        submitterAccount.address
    )
    // Submit the creation tx to the KILT blockchain
    // using the KILT account specified in the creation operation.
    await Kilt.Blockchain.signAndSubmitTx(
        authorizedCtypeCreationTx,
        submitterAccount
    )

    return ctype
}

export async function useStoreTxSignCallback(
    submitterAddress: Kilt.KiltKeyringPair['address'],
    authenticationKey
): Promise<Kilt.Did.GetStoreTxSignCallback> {
    // Here we create a new key pair for the DID that will be created later.
    // This step might happen in an extension or else where, depending on your application.
    // const authenticationKey: Kilt.KiltKeyringPair =
    //     Kilt.Utils.Crypto.makeKeypairFromSeed()

    // This is the sign callback. We use the just created key to sign arbitrary data
    // and return the signature together with the key type.
    const getStoreTxSignCallback: Kilt.Did.GetStoreTxSignCallback = async ({
        data
    }) => ({
        signature: authenticationKey.sign(data),
        keyType: authenticationKey.type
    })
    
    return getStoreTxSignCallback;

    // Here we use the call back
    // return await Kilt.Did.getStoreTx(
    //     {
    //         authentication: [authenticationKey]
    //     },
    //     submitterAddress,
    //     getStoreTxSignCallback
    // )
}