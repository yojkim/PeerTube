import * as WebFinger from 'webfinger.js'
import { WebFingerData } from '../../shared'
import { ActorModel } from '../models/activitypub/actor'
import { isTestInstance } from './core-utils'
import { isActivityPubUrlValid } from './custom-validators/activitypub/misc'

const webfinger = new WebFinger({
  webfist_fallback: false,
  tls_only: isTestInstance(),
  uri_fallback: false,
  request_timeout: 3000
})

async function loadActorUrlOrGetFromWebfinger (name: string, host: string) {
  const actor = await ActorModel.loadByNameAndHost(name, host)
  if (actor) return actor.url

  return getUrlFromWebfinger(name, host)
}

async function getUrlFromWebfinger (name: string, host: string) {
  const webfingerData: WebFingerData = await webfingerLookup(name + '@' + host)
  return getLinkOrThrow(webfingerData)
}

// ---------------------------------------------------------------------------

export {
  getUrlFromWebfinger,
  loadActorUrlOrGetFromWebfinger
}

// ---------------------------------------------------------------------------

function getLinkOrThrow (webfingerData: WebFingerData) {
  if (Array.isArray(webfingerData.links) === false) throw new Error('WebFinger links is not an array.')

  const selfLink = webfingerData.links.find(l => l.rel === 'self')
  if (selfLink === undefined || isActivityPubUrlValid(selfLink.href) === false) {
    throw new Error('Cannot find self link or href is not a valid URL.')
  }

  return selfLink.href
}

function webfingerLookup (nameWithHost: string) {
  return new Promise<WebFingerData>((res, rej) => {
    webfinger.lookup(nameWithHost, (err, p) => {
      if (err) return rej(err)

      return res(p.object)
    })
  })
}
