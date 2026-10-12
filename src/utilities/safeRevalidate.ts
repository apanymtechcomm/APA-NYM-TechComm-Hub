import { revalidatePath, revalidateTag } from 'next/cache'

function isStaticStoreInvariant(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'message' in err &&
    typeof (err as { message?: unknown }).message === 'string' &&
    (err as { message: string }).message.includes('static generation store missing')
  )
}

/**
 * revalidatePath/revalidateTag throw `Invariant: static generation store missing`
 * when called from a Local API script (outside a request). Scripted content writes
 * are this repo's convention, so every content hook routes through these helpers:
 * swallow ONLY that invariant, rethrow everything else.
 */
export function safeRevalidatePath(path: string, type: 'page' | 'layout' = 'page'): undefined {
  try {
    revalidatePath(path, type)
  } catch (err: unknown) {
    if (isStaticStoreInvariant(err)) return undefined
    throw err
  }
}

export function safeRevalidateTag(tag: string): void {
  try {
    revalidateTag(tag, 'max')
  } catch (err: unknown) {
    if (isStaticStoreInvariant(err)) return
    throw err
  }
}