import * as Kilt from '@kiltprotocol/sdk-js';

// Return CType with the properties matching a given schema.
export function getCtypeSchema(): Kilt.ICType {
    return Kilt.CType.fromProperties('CType name', {
        field: { type: 'string' }
    })
}