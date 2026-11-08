# dsh-web-qa-preset

[![DSH plugin](https://img.shields.io/badge/DSH-plugin-8257D0.svg)](https://github.com/deepseek-ai/deepseek-harness)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A read-only **web Q&A agent preset bundle** for [DeepSeek Harness (DSH)](https://github.com/deepseek-ai/deepseek-harness). It registers a `web-qa` preset that answers questions instead of operating your machine: it searches the web when facts may be time-sensitive, cites sources, can read local files in read-only mode, and ends each answer with concrete next-step suggestions.

## Features

- **Search-first answers** — for news, prices, policies, product specs, people/company updates, verifiable data, or an explicit “search for it” request, the preset searches with `web_search` before answering and cites the relevant URLs.
- **Local read-only context** — `read`, `read_image`, `glob`, and `grep` are available for workspace files, DSH configuration/logs, and user-specified paths.
- **Hard read-only boundary** — the preset does not mount a shell. `write`/`edit` are denied by a guard even though official `tool-fs` registers them alongside `read`.
- **Credential protection** — direct reads of `.credentials.yaml`, `.env`, private keys, and similar sensitive files are refused.
- **Next-step suggestions** — every answer ends with a short `下一步建议` section containing 1–3 concrete, prioritized suggestions.
- **DSH bundle, no build step** — plain ESM plus a `dsh.bundle.patch` layer; installable from GitHub or a local checkout.

## Requirements

- DSH desktop **0.2.2-rc.1** (tested), or a DSH build that supports the inline `@deepseek-ai/dsh-agent-preset` registry.
- Node.js **>= 20** for running the package tests.
- A usable DSH web search provider. The bundle does **not** configure or switch one for you.

## Install

### From GitHub

```sh
dsh plugin --profile desktop add github:xiaoxiaosrm/dsh-web-qa-preset
```

### From a local checkout

```sh
git clone https://github.com/xiaoxiaosrm/dsh-web-qa-preset.git
dsh plugin --profile desktop add ./dsh-web-qa-preset
```

Or, from a DSH session, use the built-in plugin manager:

```text
plugin_manager { action: "install_bundle", target: "D:\\path\\to\\dsh-web-qa-preset" }
```

No `prepare`/build script is needed; the package ships the runnable files.

After installation, reload/restart DSH if your build asks for it, then create a new session and choose the **网页问答** preset in the preset picker.

## Configure a search provider

The preset only uses DSH's `web_search` / `web_fetch` tools. Your DSH profile must have a working search provider. Recommended: the official DeepSeek Search API and Fetch API, for example in the profile's `cordis.patch.yml`:

```yaml
- id: web
  name: "@deepseek-ai/dsh-web"
  config:
    searchProvider: deepseek-search-api
    fetchProvider: deepseek-fetch-api
```

This uses `DEEPSEEK_API_KEY`. Alternatively, use your own provider (for example Tavily or Exa through `dsh-search-picker`) and set `web.searchProvider` / `web.fetchProvider` accordingly.

If no provider is usable, `web_search` returns a structured error; the preset tells the model to state that it could not verify the answer instead of inventing sources.

## Usage

1. Create a new session and pick **网页问答**.
2. Ask a question. The preset decides whether it needs a live search; it can also search proactively when it is unsure.
3. For local questions, it reads files in read-only mode.
4. Every answer ends with **下一步建议**.

## Tool surface and safety

| Tool | Purpose |
|---|---|
| `web_search` | Search public web sources |
| `web_fetch` | Read a specific public page |
| `read` | Read a text file |
| `read_image` | Read a supported image |
| `glob` | Find files by pattern |
| `grep` | Search file contents |

- No shell, terminal, skill, subagent, plan-mode, todo, or file-delivery tools are mounted.
- Official `tool-fs` registers `write`/`edit` next to `read`; the bundle guard denies those calls. They may appear in the tool catalog but cannot modify files.
- Reads of `.credentials.yaml`, `.env`, private keys, and similar files are refused.
- The guard is mounted inside this preset's scope; other sessions and presets are unaffected.
- Do not send local secrets or private file contents to external websites. The preset's own prompt asks the model not to do so.

## Limitations

- It is a Q&A preset, not a general coding agent.
- It cannot edit files, run commands, install packages, or change your system.
- Local file reads are subject to DSH's filesystem backend and sandbox permissions.
- The search provider is external and must be configured by the user.
- The preset id is `web-qa`; if your profile already defines a preset with that id, remove the old declaration first.
- Behavior is guided by the preset prompt. Search triggering is intelligent, not a hard “search on every turn” rule.

## Development

```sh
npm run check       # node --check guard.mjs
npm test            # node --test test/guard.test.mjs
npm run test:node   # single-process fallback for Windows sandboxes
```

The plugin has no build step. Edit `guard.mjs` for the read-only policy and `cordis.patch.yml` for the preset definition, then reinstall/reload the bundle.

## 中文

见 [README.zh-CN.md](README.zh-CN.md).

## License

MIT © 2026 xiaoxiaosrm
