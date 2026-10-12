// Local Payload access helper for server components / route handlers.
import config from '@payload-config'
import { getPayload } from 'payload'

export async function getPayloadClient() {
  return getPayload({ config: await config })
}