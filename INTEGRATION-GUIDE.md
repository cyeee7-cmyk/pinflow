# PinFlow Backend 完整集成指南

Layers 1 + 2 + 3 完全集成方案

---

## 📦 项目结构总览

```
pinflow-backend/
├── api/
│   ├── generate.js              (v1: Layer 1+2基础版)
│   ├── generate-v2.js           (v2: Layer 3增强版) ⭐ 推荐
│   ├── image.js                 (v1: 基础图片合成)
│   ├── image-v2.js              (v2: 增强图片合成) ⭐ 推荐
│   ├── health.js                (健康检查)
│   └── _lib/
│       ├── detect.js            (URL检测)
│       ├── browser.js           (浏览器工厂)
│       ├── affiliate.js         (联盟链接)
│       ├── copywriter.js        (v1: 基础文案)
│       ├── copywriter-v2.js     (v2: 增强文案) ⭐ 推荐
│       ├── image-composer.js    (v1: 基础合成)
│       ├── image-composer-v2.js (v2: 增强合成) ⭐ 推荐
│       ├── image-templates.js   (模板系统)
│       ├── templates/
│       │   ├── index.js
│       │   ├── deal.js
│       │   └── content.js
│       └── scrapers/
│           └── amazon.js
│
├── test-image-composition.js    (本地测试脚本)
├── package.json
├── vercel.json
├── README.md                    (项目说明)
├── README-LAYER2.md             (Layer 2详解)
├── README-LAYER3.md             (Layer 3详解)
├── LAYER2-CHECKLIST.md
├── LAYER3-SUMMARY.md
└── INTEGRATION-GUIDE.md         (本文件)
```

---

## 🚀 快速开始 (3 分钟)

### 1. 下载并安装

```bash
# 下载所有 Layer 3 文件
unzip pinflow-backend-layer3.zip

# 安装依赖
npm install

# 安装 Sharp 依赖
npm install sharp

# 下载 Playwright Chromium
npx playwright install chromium
```

### 2. 配置环境

```bash
cp .env.example .env

# 编辑 .env
ANTHROPIC_API_KEY=sk-ant-...
AMAZON_ASSOCIATE_TAG=mystore-20
```

### 3. 本地测试

```bash
# 测试图片合成
node test-image-composition.js

# 查看生成的测试图片
ls -la test-output/
open test-output/deal-with-discount.jpg
```

### 4. 启动开发服务

```bash
vercel dev
# 访问 http://localhost:3000
```

---

## 🔄 使用流程

### 完整请求流

```
用户输入 Amazon 链接
  ↓
POST /api/generate-v2
  ├─ Layer 1: 抓取商品信息 (Playwright)
  ├─ Layer 2: AI 文案生成 (Claude)
  └─ Layer 3: 图片合成 (Sharp + 模板)
  ↓
返回: {
  product: { title, price, discount, imageUrl, ... },
  copies: [{
    pin_title,
    pin_description,
    hashtags,
    image_url (原始),
    composed_image_url (base64合成图),
    image_template,
    affiliate_link,
    ...
  }, ...]
}
  ↓
前端显示: 
  ├─ 产品卡 (图片 + 信息)
  ├─ 3 个文案卡 (含合成图预览)
  └─ 复制 / 分享 / 链接按钮
```

---

## 📍 API 快速参考

### 推荐使用 (v2 版本)

#### POST /api/generate-v2 ⭐

```bash
curl -X POST http://localhost:3000/api/generate-v2 \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.amazon.com/dp/B0CRMZHDG8",
    "postType": "deal",
    "composeImage": true
  }'
```

**响应字段**

```json
{
  "success": true,
  "product": {
    "title": "Apple AirPods Pro (2nd Generation)...",
    "brand": "Apple",
    "currentPrice": 189.99,
    "originalPrice": 249.00,
    "discountPercent": 24,
    "currency": "USD",
    "imageUrl": "https://m.media-amazon.com/...",
    "asin": "B0CRMZHDG8"
  },
  "copies": [
    {
      "style": "deal_discount",
      "pin_title": "🔥 AirPods Pro NOW $189 – Save $60!",
      "pin_description": "Premium noise-cancelling...",
      "hashtags": ["AirPodsPro", "TechDeals", ...],
      "image_url": "https://...",
      "composed_image_url": "data:image/jpeg;base64,...",
      "image_template": "deal",
      "affiliate_link": "https://amazon.com/dp/B0CRMZHDG8/?tag=mystore-20"
    },
    { ...deal_limited... },
    { ...deal_comparison... }
  ]
}
```

#### GET /api/image-v2 ⭐

```bash
# 合成单张图片
curl "http://localhost:3000/api/image-v2?imageUrl=https://...&price=189.99&discount=24&template=deal" \
  --output composed.jpg

# 列出可用模板
curl http://localhost:3000/api/image-v2/templates
```

---

### 兼容版本 (v1 原版)

仍可使用 `/api/generate` 和 `/api/image`，功能相同但功能较少。

---

## 🎨 PostType 和模板对应

| postType | 自动使用模板 | 贴纸样式 | 位置 | 颜色 | 适用场景 |
|----------|-----------|--------|------|------|--------|
| `deal` | deal | 圆形 | 右上 | 🔴 深红 | 折扣商品 |
| `content` | content | 矩形 | 右下 | ◻️ 白+红框 | 种草内容 |
| (自定义) | premium | 圆形 | 右上 | 🟡 金色边 | 高端品牌 |

---

## 🧪 测试清单

### 本地单元测试

```bash
# 1. 图片合成测试
node test-image-composition.js
✅ 检查 6 张测试图片质量

# 2. API 端点测试
curl http://localhost:3000/api/health
✅ 确认服务正常

# 3. 完整流程测试
curl -X POST http://localhost:3000/api/generate-v2 \
  -H "Content-Type: application/json" \
  -d '{"url":"https://amazon.com/dp/B0CRMZHDG8","postType":"deal","composeImage":true}'
✅ 确认返回完整数据
```

### 前端集成测试

```javascript
// 1. 测试 API 连接
fetch('http://localhost:3000/api/health')
  .then(r => r.json())
  .then(data => console.log('✅ API OK', data))
  .catch(e => console.error('❌ API 失败', e))

// 2. 测试完整生成流程
const formData = {
  url: 'https://www.amazon.com/dp/B0CRMZHDG8',
  postType: 'deal',
  composeImage: true
};

fetch('http://localhost:3000/api/generate-v2', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(formData)
})
  .then(r => r.json())
  .then(data => {
    console.log('✅ 生成成功');
    console.log('产品:', data.product.title);
    console.log('文案数:', data.copies.length);
    console.log('首张合成图:', data.copies[0].composed_image_url.substring(0, 50));
  })
  .catch(e => console.error('❌ 生成失败', e));
```

---

## 📱 前端演示组件

使用 `demo-widget-v2.html` 的增强版本:

```html
<!-- 复制到你的 landing page -->
<script>
  // 修改这一行为你的实际 API 地址
  const API_BASE = 'http://localhost:3000'; // 本地开发
  // const API_BASE = 'https://your-domain.vercel.app'; // 生产
</script>

<section id="demo">
  <!-- UI 组件: deal/content 模式切换 -->
  <!-- UI 组件: URL 输入 -->
  <!-- UI 组件: 生成按钮 -->
  <!-- UI 组件: 产品卡 + 文案预览 + 合成图 -->
</section>
```

---

## 🔧 常见配置

### 自定义图片模板

编辑 `api/_lib/image-templates.js`:

```javascript
const CUSTOM_TEMPLATE = {
  name: 'custom',
  badge: {
    style: 'discount_circle',
    bgColor: '#FF6B6B',        // 自定义颜色
    position: 'south',         // 底部中央
    size: 160,                 // 更大尺寸
  },
  overlay: {
    enabled: true,
    text: '🎉 FLASH SALE',
  }
};
```

### 调整图片质量

编辑 `api/_lib/image-composer-v2.js`:

```javascript
// 行 ~280
if (format === 'jpeg') {
  return pipeline.jpeg({ 
    quality: 85,        // 改为 70-90 (越低越小)
    progressive: true 
  }).toBuffer();
}
```

### 修改合成图片尺寸

请求时指定:

```bash
curl "http://localhost:3000/api/image-v2?imageUrl=...&price=189.99&width=1200&height=1800"
```

---

## 🚀 部署到 Vercel

### 方案 A: CLI 部署 (快速)

```bash
npm install -g vercel
vercel login

# 部署
vercel deploy --prod

# 设置环境变量
vercel env add ANTHROPIC_API_KEY
vercel env add AMAZON_ASSOCIATE_TAG
```

### 方案 B: GitHub 自动部署 (推荐)

1. 推送到 GitHub
```bash
git add .
git commit -m "Add Layer 3: Advanced image composition"
git push origin main
```

2. 在 Vercel Dashboard 导入
- New Project → Import from GitHub
- 选择仓库
- 添加环境变量
- 自动部署

### 部署检查

```bash
# 部署后验证
curl https://your-domain.vercel.app/api/health
curl https://your-domain.vercel.app/api/image-v2/templates
```

---

## 🔒 安全建议

### 1. API 限流

在 `vercel.json` 中设置:

```json
{
  "functions": {
    "api/**/*.js": {
      "maxDuration": 30,
      "memory": 1024
    }
  }
}
```

### 2. 环境变量保护

```bash
# 绝不要在代码中硬编码
# 始终使用环境变量

# 本地开发
export ANTHROPIC_API_KEY=sk-ant-...

# Vercel 部署
vercel env add ANTHROPIC_API_KEY
```

### 3. CORS 配置

如需跨域请求，在 API 中添加:

```javascript
res.setHeader('Access-Control-Allow-Origin', 'https://your-domain.com');
res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
```

---

## 📊 性能优化

### 1. 启用缓存

```javascript
// 图片 API 已启用 24 小时缓存
res.setHeader('Cache-Control', 'public, max-age=86400');
```

### 2. 用 WebP 格式

```bash
curl "...?format=webp"  # 比 JPEG 小 30%
```

### 3. CDN 加速

```
原始图片 URL → CloudFlare CDN → 用户
合成图片     → S3 + CloudFront  → 用户
```

### 4. 后台处理 (可选)

如需处理 100+ 链接，使用队列:

```javascript
// 伪代码
const queue = new Bull('image-generation');

queue.add({ url, postType }, {
  delay: Math.random() * 10000  // 随机延迟避免突刺
});

queue.process(async (job) => {
  return generateCopiesWithImages(job.data);
});
```

---

## 🐛 常见问题排查

### 问题 1: Sharp 编译失败

```
❌ Error: Cannot find module 'sharp'
```

**解决方案:**

```bash
npm install sharp --build-from-source
# 或
npm rebuild sharp
```

### 问题 2: 图片合成超时

```
❌ Error: ETIMEDOUT downloading image
```

**解决方案:**

```javascript
// 在 downloadImage() 中增加超时时间
const req = client.get(imageUrl, { timeout: 20000 }, ...);
```

### 问题 3: Playwright 启动失败

```
❌ Error: Failed to launch browser
```

**解决方案:**

```bash
npx playwright install chromium --with-deps
```

### 问题 4: Claude API 超时

```
❌ Error: Request timeout
```

**解决方案:**

- 增加 Vercel 函数超时: `vercel.json` 中设置 `maxDuration: 40`
- 使用更小的模型或减少 max_tokens

---

## 📚 文档导航

| 文档 | 内容 |
|------|------|
| `README.md` | 项目概览 |
| `README-LAYER2.md` | Layer 2 详细文档 |
| `README-LAYER3.md` | Layer 3 详细文档 |
| `LAYER2-CHECKLIST.md` | Layer 2 完成清单 |
| `LAYER3-SUMMARY.md` | Layer 3 总结 |
| `INTEGRATION-GUIDE.md` | 本文件 (集成指南) |

---

## 🎯 核心功能速览

### Layer 1: 商品信息抓取
✅ Playwright 无头浏览器  
✅ Amazon 商品页解析  
✅ 标题、价格、图片、描述抽取  

### Layer 2: 内容生成模块
✅ 双模式文案生成 (deal / content)  
✅ Claude AI 生成 3 种风格  
✅ 联盟链接自动转换  
✅ 结构化数据输出  

### Layer 3: 高级图片合成
✅ 三种设计模板 (deal / content / premium)  
✅ Sharp 图片合成  
✅ SVG 贴纸、丝带、水印  
✅ 自动模板映射  
✅ Base64 输出  

---

## 📈 Next Steps

### 立即可做

- ✅ 本地测试并验证功能
- ✅ 部署到 Vercel
- ✅ 集成到前端 landing page
- ✅ 测试 deal 和 content 两种模式

### 后续优化

- ⏳ 启用图片缓存 (Redis)
- ⏳ 用队列处理批量请求
- ⏳ 自定义模板编辑器
- ⏳ A/B 测试不同贴纸样式

### 未来扩展

- ⏳ Layer 4: 批量处理 + 导出
- ⏳ 生图工具集成 (Stable Diffusion / DALL-E)
- ⏳ Pinterest 官方 API 直接发布

---

## ✅ 最终检查清单

在生产部署前:

- [ ] 本地 `npm install` 成功
- [ ] 本地 `node test-image-composition.js` 通过
- [ ] 6 张测试图片质量满意
- [ ] `vercel dev` 启动成功
- [ ] `/api/health` 返回 200 OK
- [ ] `/api/generate-v2` 完整流程测试通过
- [ ] 前端集成测试通过
- [ ] Vercel 环境变量已设置
- [ ] 部署后再次验证 API
- [ ] CORS 配置正确 (如需跨域)

---

## 🎉 就绪！

所有三层都已实现并测试。可以立即部署到生产环境!

```bash
# 最后检查
npm run dev

# 部署
vercel deploy --prod
```

**成功部署后，您将拥有一个完整的:**
- Pinterest 内容生成系统
- AI 驱动的文案生成
- 高级图片合成工具
- 联盟链接管理

开始赚取被动收入吧! 💰📌✨
