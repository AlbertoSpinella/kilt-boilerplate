import { DidResourceUri } from '@kiltprotocol/sdk-js'
import { useState, useEffect } from 'react'
import {
  IEncryptedMessageV1,
  InjectedWindowProvider,
  PubSubSessionV1,
  PubSubSessionV2,
} from '../types/types'

const endpoint = "/api";

export default function useSporran() {
  const [sporran, setSporran] =
    useState<InjectedWindowProvider<PubSubSessionV1 | PubSubSessionV2>>(null)
  const [sessionObject, setSessionObject] = useState<{
    sessionId: string
    session: PubSubSessionV1 | PubSubSessionV2
  }>(null)
  const [waiting, setWaiting] = useState(false)

  async function presentCredential() {
    setWaiting(true)
    if (!sessionObject) throw Error('startSession first')

    const { sessionId } = sessionObject
    const result = await fetch(`${endpoint}/verify?sessionId=${sessionId}`, {
      method: 'GET'
    })

    const message = await result.json()
    const encryptedMessage: IEncryptedMessageV1 = {
      ciphertext: message.ciphertext,
      nonce: message.nonce,
      receiverKeyId: message.receiverKeyUri as DidResourceUri,
      senderKeyId: message.senderKeyUri as DidResourceUri,
    }
    //@ts-ignore
    await sessionObject.session.send(encryptedMessage)

    sessionObject.session.listen(async (message) => {
      const result = await fetch(`${endpoint}/verify`, {
        credentials: 'include',
        method: 'POST',
        headers: {
          "Content-Type": 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({ sessionId, message }),
      })
      await sessionObject.session.send(message)
      setWaiting(false)
    })
  }

  async function startSession() {
    setWaiting(true)
    const values = await fetch(`${endpoint}/session`, {
      mode: "cors"
    })

    if (!values.ok) throw Error(values.statusText)

    const { sessionId, challenge, dappName, dAppEncryptionKeyId } =
      await values.json()

    const session = await sporran.startSession(
      dappName,
      dAppEncryptionKeyId,
      challenge
    )

    const valid = await fetch(`${endpoint}/session`, {
      credentials: 'include',
      method: 'POST',
      mode: "cors",
      headers: {
        "Content-Type": 'application/json',
        Accept: 'application/json',
        "Access-Control-Allow-Credentials": "true"
      },
      body: JSON.stringify({ ...session, sessionId }),
    })

    if (!valid.ok) throw Error(valid.statusText)

    setWaiting(false)
    setSessionObject({ sessionId, session })
  }

  useEffect(() => {
    const inState = !!sporran
    //@ts-ignore
    const inWindow = window.kilt && window.kilt.sporran
    if (!inState && inWindow) {
      //@ts-ignore

      setSporran(window.kilt.sporran)
    }

    if (!inState) {
      //@ts-ignore

      window.kilt = new Proxy(
        {},
        {
          set(target, prop, value) {
            console.log("PROP", prop);
            if (prop === 'sporran') {
              setSporran(value)
            }
            return !!(target[prop] = value)
          },
        }
      )
    }
  })

  return {
    sporran,
    sessionObject,
    waiting,
    startSession,
    presentCredential,
  }
}
