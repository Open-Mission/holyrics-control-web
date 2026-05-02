import { z } from 'zod'

export const holyricsLocalEnvelopeSchema = z.object({
  status: z.string(),
  data: z.unknown().optional(),
  error: z.unknown().optional(),
})

export const holyricsInternetEnvelopeSchema = z.object({
  status: z.string(),
  response_status: z.string().optional(),
  response: holyricsLocalEnvelopeSchema.optional(),
  error: z.unknown().optional(),
  data: z.unknown().optional(),
})

export const holyricsHashSessionSchema = z.object({
  sid: z.string().min(1),
  nonce: z.string().min(1),
  rid: z.number().int().min(0),
  authenticatedAt: z.string().optional(),
})

export const holyricsAuthStateSchema = z.object({
  token: z.string(),
  sid: z.string().optional(),
  nonce: z.string().optional(),
  rid: z.number().int().min(0).optional(),
  authenticatedAt: z.string().optional(),
})

export type HolyricsLocalEnvelope = z.infer<typeof holyricsLocalEnvelopeSchema>
export type HolyricsInternetEnvelope = z.infer<typeof holyricsInternetEnvelopeSchema>
export type HolyricsHashSession = z.infer<typeof holyricsHashSessionSchema>
export type HolyricsAuthStateShape = z.infer<typeof holyricsAuthStateSchema>
