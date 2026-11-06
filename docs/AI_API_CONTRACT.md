# AI 健康问答 API 合同

前端只调用自有 HTTP 端点，不包含或接收任何模型供应商密钥。仓库的独立 `server/` 包已实现该合同，默认监听127.0.0.1:8787且禁用供应商调用；真实密钥与模型由运行时注入，见../server/README.md。公网认证与持久配额不在本机服务内。

## 公开配置

`VITE_AI_API_BASE_URL` 是可公开的自有 API 基础地址，例如 `/api/ai`。它会进入前端构建产物，不能用来存放密钥。未配置、格式无效或任何模式下使用非 localhost/loopback 的 HTTP 时，客户端不发起请求。

## 请求

`POST {base}/v1/operations/health-chat`

```json
{
  "version": 1,
  "input": {
    "question": "用户问题，去除首尾空白后 1–2000 字符"
  }
}
```

前端不传递 provider、model、system prompt 或 API key。后端必须再次执行输入上限、配额与输出验证；本合同不假定登录或计费方案。

## 成功响应

```json
{
  "ok": true,
  "data": {
    "answer": "回复文本，1–8000 字符",
    "confidence": 0.8,
    "suggestions": ["后续问题"]
  }
}
```

`confidence` 必须为 `0..1` 的有限数字；`suggestions` 最多 5 项，每项最多 200 字符。前端拒绝非合同 JSON 及超过 64,000 bytes的整体响应。

## 失败响应

```json
{
  "ok": false,
  "error": {
    "code": "SERVICE_UNAVAILABLE",
    "message": "可展示的简短错误",
    "retryable": true
  }
}
```

客户端不向页面透传后端原始异常、供应商响应或密钥信息。超时、网络失败和无效响应会转成稳定错误，页面只可显示明确标注的离线固定资料。
