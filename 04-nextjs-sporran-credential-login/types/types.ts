import {
  IEncryptedMessage,
  DidUri,
  KiltAddress,
  DidResourceUri,
} from '@kiltprotocol/types'
import { HexString } from '@polkadot/util/types'
import { isHex } from '@polkadot/util'
import { SelfSignedProof, VerifiableCredential } from '@kiltprotocol/vc-export'
import { KILT_CREDENTIAL_IRI_PREFIX } from '../utilities/wellKnownDidConfiguration'

export type This = typeof globalThis
const DEFAULT_VERIFIABLECREDENTIAL_CONTEXT =
  'https://www.w3.org/2018/credentials/v1'

export interface IEncryptedMessageV1 {
  /** ID of the key agreement key of the receiver DID used to encrypt the message */
  receiverKeyId: DidResourceUri

  /** ID of the key agreement key of the sender DID used to encrypt the message */
  senderKeyId: DidResourceUri

  /** ciphertext as hexadecimal */
  ciphertext: string

  /** 24 bytes nonce as hexadecimal */
  nonce: string
}

export interface PubSubSessionV1 {
  /** Configure the callback the extension must use to send messages to the dApp. Overrides previous values. */
  listen: (
    callback: (message: IEncryptedMessageV1) => Promise<void>
  ) => Promise<void>

  /** send the encrypted message to the extension */
  send: (message: IEncryptedMessageV1) => Promise<void>

  /** close the session and stop receiving further messages */
  close: () => Promise<void>

  /** ID of the key agreement key of the temporary DID the extension will use to encrypt the session messages */
  encryptionKeyId: string

  /** bytes as hexadecimal */
  encryptedChallenge: string

  /** 24 bytes nonce as hexadecimal */
  nonce: string
}

export interface PubSubSessionV2 {
  /** Configure the callback the extension must use to send messages to the dApp. Overrides previous values. */
  listen: (
    callback: (message: IEncryptedMessage) => Promise<void>
  ) => Promise<void>

  /** send the encrypted message to the extension */
  send: (message: IEncryptedMessage) => Promise<void>

  /** close the session and stop receiving further messages */
  close: () => Promise<void>

  /** ID of the key agreement key of the temporary DID the extension will use to encrypt the session messages */
  encryptionKeyUri: DidResourceUri

  /** bytes as hexadecimal */
  encryptedChallenge: string

  /** 24 bytes nonce as hexadecimal */
  nonce: string
}

export interface InjectedWindowProvider<T> {
  startSession: (
    dAppName: string,
    dAppEncryptionKeyId: DidResourceUri,
    challenge: string
  ) => Promise<T>

  name: string
  version: string
  specVersion: '1.0' | '3.0'

  signWithDid: (
    plaintext: string
  ) => Promise<{ signature: string; didKeyUri: DidResourceUri }>

  signExtrinsicWithDid: (
    extrinsic: HexString,
    signer: KiltAddress
  ) => Promise<{ signed: HexString; didKeyUri: DidResourceUri }>

  getSignedDidCreationExtrinsic: (
    submitter: KiltAddress
  ) => Promise<{ signedExtrinsic: HexString }>
}

export interface ApiWindow extends This {
  kilt: Record<
    string,
    InjectedWindowProvider<PubSubSessionV1 | PubSubSessionV2>
  >
}

export interface CredentialSubject {
  id: DidUri
  origin: string
}

const context = [
  DEFAULT_VERIFIABLECREDENTIAL_CONTEXT,
  'https://identity.foundation/.well-known/did-configuration/v1',
]
export interface DomainLinkageCredential
  extends Omit<
    VerifiableCredential,
    '@context' | 'legitimationIds' | 'credentialSubject' | 'proof'
  > {
  '@context': typeof context
  credentialSubject: CredentialSubject
  proof: SelfSignedProof
}

export interface VerifiableDomainLinkagePresentation {
  '@context': string
  linked_dids: [DomainLinkageCredential]
}

export function fromCredentialIRI(credentialId: string): HexString {
  const hexString = credentialId.startsWith(KILT_CREDENTIAL_IRI_PREFIX)
    ? credentialId.substring(KILT_CREDENTIAL_IRI_PREFIX.length)
    : credentialId
  if (!isHex(hexString))
    throw new Error(
      'Credential id is not a valid identifier (could not extract base16 / hex encoded string)'
    )
  return hexString
}

export function toCredentialIRI(rootHash: string): string {
  if (rootHash.startsWith(KILT_CREDENTIAL_IRI_PREFIX)) {
    return rootHash
  }
  if (!isHex(rootHash))
    throw new Error('Root hash is not a base16 / hex encoded string)')
  return KILT_CREDENTIAL_IRI_PREFIX + rootHash
}
