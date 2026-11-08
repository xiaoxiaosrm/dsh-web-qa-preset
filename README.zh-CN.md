# dsh-web-qa-preset

[![DSH plugin](https://img.shields.io/badge/DSH-plugin-8257D0.svg)](https://github.com/deepseek-ai/deepseek-harness)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

一个面向 [DeepSeek Harness（DSH）](https://github.com/deepseek-ai/deepseek-harness) 的**只读网页问答 preset bundle**。安装后自动注册 `web-qa` 预设：只回答问题，不操作你的机器；遇到可能过时的事实先联网搜索，回答带来源；可以只读本地文件和配置；每次回答末尾给出具体的下一步建议。

## 功能

- **先搜后答**：新闻、价格、政策、产品规格、人物/公司近况、可核实数据，或用户明确要求“搜一下/查一下/最新”时，先用 `web_search` 检索，再基于结果回答并给出链接。
- **本地只读上下文**：`read`、`read_image`、`glob`、`grep` 可读取工作区文件、DSH 配置/日志，以及用户明确指定的路径。
- **硬性只读边界**：不挂 shell；官方 `tool-fs` 会在 `read` 旁边注册 `write`/`edit`，但本插件的守卫会拒绝所有写/编辑调用。
- **凭据保护**：拒绝直接读取 `.credentials.yaml`、`.env`、私钥等敏感文件。
- **下一步建议**：每次回答末尾固定输出「下一步建议」，给 1–3 条具体、可执行的建议并标优先级。
- **真正的 DSH bundle**：`dsh.bundle.patch` 声明插件层，无构建步骤，可从 GitHub 或本地目录安装。

## 前置条件

- DSH 桌面版 **0.2.2-rc.1**（已测试），或支持内联 `@deepseek-ai/dsh-agent-preset` 注册机制的 DSH 版本。
- Node.js **>= 20**（仅运行测试需要）。
- 一个可用的 DSH 联网搜索 provider。本 bundle **不会**自动配置或切换搜索后端。

## 安装

### 从 GitHub

```sh
dsh plugin --profile desktop add github:xiaoxiaosrm/dsh-web-qa-preset
```

### 从本地目录

```sh
git clone https://github.com/xiaoxiaosrm/dsh-web-qa-preset.git
dsh plugin --profile desktop add ./dsh-web-qa-preset
```

或者在 DSH 会话里用内置插件管理器：

```text
plugin_manager { action: "install_bundle", target: "D:\\path\\to\\dsh-web-qa-preset" }
```

不需要 `prepare`/构建脚本；包里就是可直接运行的文件。

安装后按你的 DSH 版本要求刷新/重启，然后新建会话，在预设选择器里选「网页问答」。

## 配置搜索后端

该预设只使用 DSH 的 `web_search` / `web_fetch` 工具，因此你的 profile 需要可用的搜索 provider。推荐 DeepSeek 官方 Search API + Fetch API，例如在 profile 的 `cordis.patch.yml` 中：

```yaml
- id: web
  name: "@deepseek-ai/dsh-web"
  config:
    searchProvider: deepseek-search-api
    fetchProvider: deepseek-fetch-api
```

这需要 `DEEPSEEK_API_KEY`。也可以使用你自己的 provider（例如通过 `dsh-search-picker` 切换到 Tavily / Exa），并相应设置 `web.searchProvider` / `web.fetchProvider`。

如果没有可用 provider，`web_search` 会返回结构化错误；预设会要求模型明确说明“未能核实”，而不是编造来源。

## 使用

1. 新建会话，选择「网页问答」。
2. 直接提问。预设会判断是否需要实时搜索；不确定时也会主动搜索。
3. 本地文件问题会以只读方式读取。
4. 每次回答末尾都有「下一步建议」。

## 工具与安全边界

| 工具 | 用途 |
|---|---|
| `web_search` | 搜索公开网页 |
| `web_fetch` | 读取指定公开页面 |
| `read` | 读取文本文件 |
| `read_image` | 读取支持的图片 |
| `glob` | 按模式查找文件 |
| `grep` | 搜索文件内容 |

- 不挂 shell、终端、技能、子代理、计划模式、任务清单或文件交付工具。
- 官方 `tool-fs` 会在 `read` 旁边注册 `write`/`edit`；本包的守卫会拒绝这些调用。它们可能出现在工具列表里，但不能修改文件。
- 拒绝读取 `.credentials.yaml`、`.env`、私钥等敏感文件。
- 守卫挂载在预设作用域内，不影响其他会话或预设。
- 不要把本地密钥或私有文件内容发送到外部网站；预设提示词也要求模型不要这样做。

## 已知限制

- 这是问答预设，不是通用编码 Agent。
- 不能改文件、执行命令、安装软件或修改系统。
- 本地读取受 DSH 文件系统和沙箱权限限制。
- 搜索 provider 在外部，需要用户自行配置。
- 预设 id 是 `web-qa`；如果你 profile 里已有同名预设，请先移除旧声明。
- 行为由预设提示词约束；搜索触发是“智能判断”，不是每轮强制搜索。

## 开发

```sh
npm run check       # node --check guard.mjs
npm test            # node --test test/guard.test.mjs
npm run test:node   # Windows 沙箱下单进程兜底
```

没有构建步骤。改守卫就改 `guard.mjs`，改预设定义就改 `cordis.patch.yml`，然后重新安装/重载 bundle。

## English

See [README.md](README.md).

## License

MIT © 2026 xiaoxiaosrm
