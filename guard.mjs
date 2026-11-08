/**
 * dsh-web-qa-preset — read-only guard for the Web Q&A agent preset.
 *
 * The official `@deepseek-ai/dsh-tool-fs` package registers read/write/edit as
 * one set. This preset only wants read-only local access, so this guard denies
 * every write/edit call and refuses to read credential or private-key files.
 *
 * It is mounted inside the preset's scope (the preset row names this package),
 * so it only affects sessions that select the `web-qa` preset.
 */

export const name = 'dsh-web-qa-preset'

/** The guard needs the tool registry. */
export const inject = ['tools']

/** Tool names that can change file state. */
const WRITE_TOOLS = new Set([
  'write',
  'edit',
  'str_replace_editor',
  'delete',
  'remove',
  'move',
  'rename',
  'copy',
])

/** Credential / private-key basenames that must never be read. */
const SENSITIVE_BASENAME = /^(?:\.credentials(?:\..+)?|\.env(?:\..+)?|id_(?:rsa|dsa|ed25519)(?:\.pub)?|.*\.(?:pem|key|p12|pfx))$/i

/** A path or glob expression that directly mentions a sensitive file. */
const SENSITIVE_MENTION = /(?:^|[\\/])(?:\.credentials(?:\.[^\\/]*)?|\.env(?:\.[^\\/]*)?|id_(?:rsa|dsa|ed25519)(?:\.pub)?)\b|\.(?:pem|key|p12|pfx)\b/i

/**
 * Whether a path's basename is a credential or private-key file.
 * @param {unknown} value
 * @returns {boolean}
 */
function isSensitivePath(value) {
  if (typeof value !== 'string' || value.length === 0) return false
  const normalized = value.replace(/\\/g, '/')
  const basename = normalized.split('/').pop() ?? ''
  return SENSITIVE_BASENAME.test(basename)
}

/**
 * Whether a path or glob expression mentions a sensitive file.
 * @param {unknown} value
 * @returns {boolean}
 */
function mentionsSensitive(value) {
  return typeof value === 'string' && value.length > 0 && SENSITIVE_MENTION.test(value)
}

/**
 * Return a denial reason for a tool call, or `undefined` to allow it.
 * @param {{ name?: string, arguments?: unknown } | undefined} execution
 * @returns {string | undefined}
 */
export function isDenied(execution) {
  if (execution === undefined || execution === null || typeof execution !== 'object') {
    return undefined
  }

  const toolName = typeof execution.name === 'string' ? execution.name : ''
  if (WRITE_TOOLS.has(toolName)) {
    return 'This preset is read-only: creating, editing, deleting, or moving files is not allowed.'
  }

  const args = execution.arguments
  if (args === null || typeof args !== 'object') return undefined

  if (toolName === 'read' || toolName === 'read_image') {
    if (isSensitivePath(args.file_path)) {
      return 'That path is a credential or private-key file; this preset does not read it.'
    }
    return undefined
  }

  if (toolName === 'glob') {
    if (mentionsSensitive(args.pattern) || mentionsSensitive(args.path)) {
      return 'That search scope touches credential or private-key files; this preset does not search it.'
    }
    return undefined
  }

  if (toolName === 'grep') {
    if (mentionsSensitive(args.path) || mentionsSensitive(args.include)) {
      return 'That search scope touches credential or private-key files; this preset does not search it.'
    }
    return undefined
  }

  return undefined
}

/**
 * Register the guard in the preset's scope.
 * @param {{ tools: { guard: (guard: (execution: unknown) => string | undefined) => unknown } }} ctx
 */
export function apply(ctx) {
  ctx.tools.guard((execution) => isDenied(execution))
}
