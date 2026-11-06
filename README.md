# AI健康管理 — 本地健康教育与记录原型

> 本地健康教育与记录原型：健康问答、热量估算和运动计划。

## 产品简介

AI健康顾问提供健康信息参考与本地计算工具。在线问答需要配置独立服务端；未配置时只展示明确标注的固定资料。当前不是已上线的医疗或诊断服务，也未实现付费会员权益与每日用户额度。

**适合谁用：**
- 关注健康的普通人：日常健康疑问随时问
- 慢性病患者：饮食和运动的日常管理参考
- 健身爱好者：个性化训练和营养方案
- 亚健康人群：疲劳、失眠等问题的改善建议

## 核心功能

### 智能健康问答
- 通过自有 API 端点提供 AI 健康问答
- 涵盖疲劳、睡眠、营养、运动等常见健康话题
- AI 端点未配置或不可用时，只显示明确标注的离线固定资料

### 个性化饮食建议
- 输入身高、体重、目标，自动生成营养方案
- BMR/TDEE 热量计算
- 详细的三大营养素配比分析

### 科学运动指导
- 基于体能评估制定运动计划
- 有氧 + 力量训练组合
- 内置运动计时器

## 快速开始

```bash
# 1. 安装依赖
npm ci --ignore-scripts

# 2. 配置可公开的自有 API 基础地址
# VITE_AI_API_BASE_URL=/api/ai

# 3. 启动
npm run dev
```

访问 `http://127.0.0.1:5174` 即可体验。未配置 API 端点时，AI 功能会失败关闭，对话页仍可查看明确标注的离线健康资料。请勿在 `VITE_*` 变量中放置模型供应商密钥。

后端请求与响应合同见 [`docs/AI_API_CONTRACT.md`](docs/AI_API_CONTRACT.md)。本机后端已实现于 [`server/README.md`](server/README.md)，默认禁用供应商调用；真实密钥与模型后配。公网身份认证与持久配额仍需部署阶段实现。

## 测试

```bash
npm run check
npm run lint
npm test
npm run build
```

## Docker

```bash
docker compose up -d
```

访问 http://localhost:3000

## 技术栈

- React 18 + TypeScript + Vite 6
- Tailwind CSS + Zustand 状态管理
- React Router 7 路由
- 自有 HTTP API 适配层 + 独立本机 Node 服务（真实供应商后配）
- Vitest + Testing Library（测试）

## 定价页面原型（尚未接入收款与权益）

| 计划 | 价格 | 功能 |
|------|------|------|
| 免费版 | ¥0 | AI 健康问答（每日 20 条） |
| 会员版 | ¥29/月 | 无限问答 + 饮食方案 + 运动计划 |
| VIP 版 | ¥99/月 | 全部功能 + 个人健康档案 + 优先响应 |

## 支持项目

如果这个项目对你有帮助，欢迎 [赞助支持](https://github.com/sponsors/shengdabai) ☕

---

**AI健康顾问** — 本地健康教育与记录原型

## 本地验证与工具链（2026-09-17）

Node 22.12+（支持22/24/26，具体见engines），`npm ci` 后 `npm run check`、`npm run lint`、`npm test`、`npm run build`。Vitest/coverage-v8已升级5.0.1，完整依赖审计本次0。设计token采用tailwind.config.js声明的Tailwind默认尺度与项目扩展；全局基础样式消费theme token，聊天高度为height.chat。旧组件仍有未改造的任意值，不宣称全项目100%token化。

Docker前端构建现使用实际npm锁文件与Node24，公开endpoint用build arg `VITE_AI_API_BASE_URL`，不会复制server或环境文件进构建步骤。运行镜像只含静态资源与Nginx配置。本机没有Docker CLI，因此未执行镜像构建/启动；已验证相同前端的npm构建与浏览器流程。

## 本机前后端联动

前端与服务端是两个独立包，各自安装、构建和测试。先在server目录执行`npm ci --ignore-scripts && npm run build && npm start`，默认会启动不调用供应商的本机服务。另一个终端在本目录运行：

```bash
VITE_AI_API_BASE_URL='http://127.0.0.1:8787' npm run dev
```

打开`http://127.0.0.1:5174`。默认服务返回明确的未配置状态；启用步骤、模型字段、允许的本机origin与调用预算见server/README.md。前端只配置可公开的地址。不要把真实供应商key写入VITE变量。
