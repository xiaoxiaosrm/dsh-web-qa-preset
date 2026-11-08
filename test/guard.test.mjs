import test from 'node:test'
import assert from 'node:assert/strict'
import { apply, isDenied } from '../guard.mjs'

const call = (name, args = {}) => isDenied({ name, arguments: args })

test('denies every write/edit tool', () => {
  for (const name of ['write', 'edit', 'str_replace_editor', 'delete', 'remove', 'move', 'rename', 'copy']) {
    assert.equal(typeof call(name), 'string', `${name} should be denied`)
  }
})

test('allows ordinary reads', () => {
  assert.equal(call('read', { file_path: 'D:/dsh/AGENTS.md' }), undefined)
  assert.equal(call('read', { file_path: 'C:/Users/Lenovo/AppData/Roaming/example.txt' }), undefined)
  assert.equal(call('read_image', { file_path: 'D:/dsh/assets/diagram.png' }), undefined)
})

test('denies credential and private-key reads', () => {
  for (const file_path of [
    'C:/Users/Lenovo/.dsh/.credentials.yaml',
    'C:/Users/Lenovo/.dsh/.env',
    'C:/Users/Lenovo/.env.local',
    'C:/Users/Lenovo/id_rsa',
    'C:/Users/Lenovo/id_ed25519.pub',
    'D:/dsh/secrets/server.pem',
    'D:/dsh/secrets/client.key',
  ]) {
    assert.equal(typeof call('read', { file_path }), 'string', `${file_path} should be denied`)
  }
})

test('denies searches that target sensitive files', () => {
  assert.equal(typeof call('glob', { pattern: '**/.credentials*' }), 'string')
  assert.equal(typeof call('glob', { pattern: '**/*.pem' }), 'string')
  assert.equal(typeof call('grep', { pattern: 'token', path: 'C:/Users/Lenovo/.dsh/.env' }), 'string')
  assert.equal(typeof call('grep', { pattern: 'token', include: '*.key' }), 'string')
})

test('allows web tools and normal patterns', () => {
  assert.equal(call('web_search', { queries: ['DeepSeek Harness'] }), undefined)
  assert.equal(call('web_fetch', { url: 'https://example.com' }), undefined)
  assert.equal(call('glob', { pattern: '**/*.md' }), undefined)
  assert.equal(call('grep', { pattern: 'preset', path: 'D:/dsh' }), undefined)
})

test('apply registers a guard function', () => {
  let registered
  apply({ tools: { guard(guard) { registered = guard } } })
  assert.equal(typeof registered, 'function')
  assert.equal(typeof registered({ name: 'write', arguments: {} }), 'string')
  assert.equal(registered({ name: 'read', arguments: { file_path: 'D:/dsh/AGENTS.md' } }), undefined)
})
