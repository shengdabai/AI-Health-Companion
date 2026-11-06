# Local AI BFF

本目录提供八个现有前端共用的本机 AI 边界服务。服务默认监听 `127.0.0.1:8787`，默认禁用所有 AI 调用；只有显式设置 `AI_SERVICE_ENABLED=true`，并同时提供相应 Provider 的 key 与 model 后，操作才会创建 Provider 客户端和产生外部调用。程序不会自动读取 `.env` 文件。

## 安装、验证和启动

需要 Node.js 22.12+（也支持项目声明的 Node 24/26）：

```bash
npm ci --ignore-scripts
npm run check
npm test
npm run build
```

默认安全启动（所有 AI 操作返回 `503 SERVICE_UNAVAILABLE`）：

```bash
npm start
```

启用时，在当前 shell 或进程管理器中注入真实值；不要把密钥写入浏览器构建或提交到仓库：

```bash
AI_SERVICE_ENABLED=true \
ANTHROPIC_API_KEY='<runtime-secret>' \
ANTHROPIC_MODEL='<chosen-model>' \
GEMINI_API_KEY='<runtime-secret>' \
GEMINI_MODEL='<chosen-model>' \
GEMINI_TTS_MODEL='<chosen-tts-model>' \
GEMINI_LIVE_MODEL='<chosen-live-model>' \
AI_ALLOWED_ORIGINS='http://localhost:3000,http://127.0.0.1:3000,http://localhost:5174,http://127.0.0.1:5174' \
npm start
```

前端使用：

```bash
VITE_AI_API_BASE_URL='http://127.0.0.1:8787'
```

`AI_ALLOWED_ORIGINS` 必须是带端口的、精确的 loopback HTTP origin。默认端口如下：

| 前端 | 默认端口 | 默认允许的精确 Origin |
| --- | ---: | --- |
| AI健康管理 | 5174 | `http://localhost:5174`、`http://127.0.0.1:5174` |
| 七个语言应用 | 3000 | `http://localhost:3000`、`http://127.0.0.1:3000` |
| Vite 常用回退 | 5173 | `http://localhost:5173`、`http://127.0.0.1:5173` |

同时运行多个语言应用时，每个应用应选择独立的显式端口，并把对应的精确 Origin 加入 `AI_ALLOWED_ORIGINS`；不要使用通配符。`Host` 与 `Origin` 会在创建 Provider 客户端前校验。官方 Provider endpoint 在服务端固定，客户端不能传入 model、system prompt、URL 或 key。

## HTTP 与 Live 契约

HTTP 仅接受 `POST /v1/operations/<operation>`、`Content-Type: application/json` 和 `{ "version": 1, "input": ... }`。实现了 14 个现有操作：

- `health-chat`, `practice-material`, `pronunciation-evaluation`
- `word-in-context`, `sentence-grammar`, `translate-to-chinese`
- `text-to-speech`, `image-language-analysis`, `reader-tts`, `clean-reader-text`
- `english-word-context`, `refine-english-script`, `shadowing-text`, `image-language-analysis-extended`

Live 使用 `ws://127.0.0.1:8787/v1/live/<operation>`，实现 `language-live`、`roleplay-live` 和 `multimodal-live`。首帧为 `{ "type": "start", "version": 1, "input": ... }`。输入音频固定为 `audio/pcm;rate=16000`，输出音频固定为 `audio/pcm;rate=24000`。断开、超时、Provider 关闭和服务器关闭都会清理上游会话。

TTS 单次输入上限为 180 个 JavaScript 字符，PCM 输出上限 1,450,000 bytes，以保证现有客户端 2 MB 响应边界不会在付费调用后才失败。长文本前端应按句切分，并限制一次用户动作的总字符数和分片数。

## 边界与可调限制

默认限制包括：12 MB JSON body、4 个并发 Provider 调用、每个本机地址每分钟 20 次请求、25 秒 Provider 超时、Live 10 分钟、每秒 30 帧、会话输入/输出各 20 MB。可通过 `AI_MAX_BODY_BYTES`、`AI_MAX_CONCURRENT`、`AI_REQUESTS_PER_MINUTE`、`AI_PROVIDER_TIMEOUT_MS`、`AI_LIVE_MAX_MS`、`AI_LIVE_MESSAGES_PER_SECOND`、`AI_LIVE_INPUT_BYTES`、`AI_LIVE_OUTPUT_BYTES` 在硬上限内调整。

这是单用户本机服务。CORS、Host 校验和进程内预算不是公网身份认证。若部署到公网，必须在它前面增加真实认证、TLS、持久配额、审计和网关级请求限制。进程重启会重置速率预算。
