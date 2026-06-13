# PinFlow 快速参考卡

## 🚀 启动 (3 分钟)

```bash
npm install
npm install sharp
npx playwright install chromium
cp .env.example .env
# 编辑 .env - 添加 ANTHROPIC_API_KEY

vercel dev
# 访问 http://localhost:3000
```

---

## 🧪 测试

```bash
# 图片合成测试
node test-image-composition.js

# API 健康检查
curl http://localhost:3000/api/health
```

---

## 📌 API 端点

### POST /api/generate-v2 ⭐

```bash
curl -X POST http://localhost:3000/api/generate-v2 \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://amazon.com/dp/B0CRMZHDG8",
    "postType": "deal | content",
    "composeImage": true
  }'
```

**返回:**
```json
{
  "success": true,
  "product": { title, price, discount, imageUrl, asin, ... },
  "copies": [{
    "pin_title": "🔥 ...",
    "pin_description": "...",
    "hashtags": [...],
    "composed_image_url": "data:image/jpeg;base64,...",
    "affiliate_link": "https://amazon.com/dp/.../?tag=...",
    ...
  }, ...]
}
```

---

### GET /api/image-v2

```bash
# 合成图片
curl "http://localhost:3000/api/image-v2?imageUrl=https://...&price=189.99&discount=24&template=deal"

# 列表模板
curl http://localhost:3000/api/image-v2/templates
```

---

## 🎨 PostType & Template 映射

| PostType | Template | 样式 |
|----------|----------|------|
| `deal` | deal | 🔴 圆形红色 |
| `content` | content | ◻️ 白色矩形 |

---

## 🔧 常见操作

### 自定义图片质量

编辑 `image-composer-v2.js` ~280 行:
```javascript
quality: 70  // 改为 70-90
```

### 部署到 Vercel

```bash
git push origin main
# Vercel 自动部署

# 或手动
vercel deploy --prod
```

### 设置环境变量

```bash
vercel env add ANTHROPIC_API_KEY
vercel env add AMAZON_ASSOCIATE_TAG
```

---

## 📂 关键文件

| 文件 | 功能 |
|------|------|
| `api/generate-v2.js` | 主 API 端点 |
| `api/image-v2.js` | 图片合成 API |
| `api/_lib/image-composer-v2.js` | Sharp 图片处理 |
| `api/_lib/image-templates.js` | 模板配置 |
| `api/_lib/copywriter-v2.js` | AI 文案生成 |
| `test-image-composition.js` | 本地测试 |

---

## 🐛 快速排查

| 问题 | 解决 |
|------|------|
| `Cannot find module 'sharp'` | `npm rebuild sharp` |
| 图片超时 | `npm install sharp --build-from-source` |
| Playwright 失败 | `npx playwright install chromium --with-deps` |
| API 超时 | `vercel.json` 中设置 `maxDuration: 40` |

---

## 📊 性能

| 操作 | 耗时 |
|------|------|
| 抓取商品 | 3-5s |
| AI 文案生成 | 2-3s |
| 图片合成 | 1-2s |
| **总耗时** | **6-10s** |

---

## ✅ 部署前检查清单

- [ ] `npm install` ✓
- [ ] `node test-image-composition.js` ✓
- [ ] `vercel dev` 启动 ✓
- [ ] `/api/health` 200 OK ✓
- [ ] `/api/generate-v2` 成功 ✓
- [ ] 环境变量设置 ✓
- [ ] 部署到 Vercel ✓

---

## 🔗 重要链接

- API Key: https://console.anthropic.com/settings/keys
- Vercel Dashboard: https://vercel.com
- Sharp 文档: https://sharp.pixelplumbing.com

---

## 🎯 主要特性

✅ Playwright 商品抓取  
✅ Claude AI 文案生成  
✅ Sharp 图片合成  
✅ 三种设计模板  
✅ 联盟链接转换  
✅ Base64 输出  
✅ 完整 API  
✅ 本地测试脚本  

---

## 📞 获取帮助

参考:
- `README-LAYER3.md` - 详细文档
- `INTEGRATION-GUIDE.md` - 集成指南
- `test-image-composition.js` - 示例代码

---

**Ready to launch?** 🚀 部署到 Vercel 然后开始赚钱!
