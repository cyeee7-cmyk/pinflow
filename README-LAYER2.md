# PinFlow Backend - Layer 2

Amazon 商品抓取 + Claude AI 文案生成 + 图片合成 · 完整后端解决方案

## 架构概览

```
Layer 1: 商品信息抓取 ✅
  └─ Playwright 无头浏览器 → Amazon 商品页 → 标题/价格/图片/描述

Layer 2: 内容生成模块 ✅ (NEW)
  ├─ 模板系统
  │  ├─ deal (折扣/价格对比) 
  │  └─ content (种草/生活场景化)
  ├─ Claude AI 文案生成
  │  └─ 结构化输出: pin_title, pin_description, hashtags
  ├─ 联盟链接转换
  │  └─ Amazon Associates tag 自动拼接
  └─ 图片合成
     └─ Sharp: 下载图片 + 价格贴纸叠加

Layer 3: 图片处理 (后续)
  └─ 生图工具集成 (Stable Diffusion / DALL-E)

Layer 4: 发布/导出 (后续)
  └─ 下载打包 / CSV 生成 / Pinterest API
```

---

## 文件结构 (Layer 2)

```
api/
├── generate.js                    # POST /api/generate (主接口，支持 postType)
├── image.js                       # GET /api/image (图片合成接口)
├── health.js                      # GET /api/health
└── _lib/
    ├── detect.js                  # URL 平台检测
    ├── browser.js                 # Playwright 工厂
    ├── affiliate.js               # 联盟链接转换 ⭐ NEW
    ├── image-composer.js          # 图片合成 (Sharp) ⭐ NEW
    ├── copywriter.js              # AI 文案生成 (更新版)
    ├── scrapers/
    │   └── amazon.js              # Amazon 抓取器
    └── templates/                 # 文案模板系统 ⭐ NEW
        ├── index.js               # 模板路由
        ├── deal.js                # deal 帖模板
        └── content.js             # content 帖模板
```

---

## 快速开始

### 1. 安装依赖

```bash
npm install
# 包含新增: sharp (图片处理)
npx playwright install chromium
```

### 2. 配置环境

```bash
cp .env.example .env
```

编辑 `.env`：

```
ANTHROPIC_API_KEY=sk-ant-...
AMAZON_ASSOCIATE_TAG=mystore-20
```

### 3. 启动开发服务

```bash
vercel dev
# 访问 http://localhost:3000
```

---

## API 端点

### POST /api/generate

**请求体**

```json
{
  "url": "https://www.amazon.com/dp/B0XXXXXX",
  "postType": "deal | content",
  "composeImage": true | false
}
```

**参数说明**

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `url` | string | ✅ | Amazon 商品页 URL |
| `postType` | string | ❌ | `deal` (折扣驱动) 或 `content` (种草风格) 默认 `deal` |
| `composeImage` | boolean | ❌ | 是否合成图片 (叠加价格贴纸) 默认 `false` |

**响应示例 200 OK**

```json
{
  "success": true,
  "meta": {
    "platform": "amazon",
    "postType": "deal",
    "processingMs": 5234
  },
  "product": {
    "title": "Apple AirPods Pro (2nd Generation)...",
    "brand": "Apple",
    "currentPrice": 189.99,
    "originalPrice": 249.00,
    "discountPercent": 24,
    "currency": "USD",
    "imageUrl": "https://m.media-amazon.com/images/...",
    "asin": "B0CRMZHDG8",
    "url": "https://www.amazon.com/dp/B0CRMZHDG8"
  },
  "copies": [
    {
      "style": "deal_discount",
      "pin_title": "🔥 AirPods Pro NOW $189 – Save $60!",
      "pin_description": "Premium noise-cancelling at the best price. Grab them before stock runs out 🛍️",
      "hashtags": ["AirPodsPro", "TechDeals", "Apple", "SaveMoney", "LimitedOffer"],
      "image_url": "https://m.media-amazon.com/images/...",
      "composed_image_url": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
      "affiliate_link": "https://www.amazon.com/dp/B0CRMZHDG8/?tag=mystore-20"
    },
    { "style": "deal_limited", ... },
    { "style": "deal_comparison", ... }
  ]
}
```

**输出字段说明**

| 字段 | 说明 |
|------|------|
| `pin_title` | Pinterest 优化标题 (40-60 字符) |
| `pin_description` | 描述文案 (100-150 字符) + CTA |
| `hashtags` | 5 个相关标签数组 (无 # 前缀) |
| `image_url` | 原始产品图 URL |
| `composed_image_url` | 合成图 (base64) 仅当 `composeImage=true` |
| `affiliate_link` | Amazon Associates 链接 |

---

### GET /api/image

**查询参数**

```
GET /api/image?imageUrl=https://...&price=29.99&discount=24&format=jpeg
```

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `imageUrl` | string | ✅ | 产品图 URL |
| `price` | number | ✅ | 价格 |
| `discount` | number | ❌ | 折扣百分比 (0-100) |
| `format` | string | ❌ | `jpeg` / `png` / `webp` 默认 `jpeg` |
| `width` | number | ❌ | 宽度像素 默认 1000 |
| `height` | number | ❌ | 高度像素 默认 1500 |

**响应**

返回合成后的图片二进制数据（可直接用 `<img src>` 显示，浏览器缓存 24h）

---

## 内容生成模板

### 1. Deal 模板 (折扣驱动)

**目标**: 突出价格、折扣、紧迫感

**生成的 3 种风格**

```javascript
"deal_discount"    // 🔥 [价格对比] - SAVE $X
"deal_limited"     // ⏰ Limited Time - 紧迫感
"deal_comparison"  // 💰 Was vs Now - 价格对比
```

**示例**

- 标题: `🔥 AirPods Pro NOW $189 – Save $60!`
- 描述: `Premium noise-cancelling at the best price. Grab them before stock runs out 🛍️`
- 标签: `#AirPodsPro #TechDeals #SaveMoney`

### 2. Content 模板 (种草/生活化)

**目标**: 场景化、情感连接、生活改善

**生成的 3 种风格**

```javascript
"lifestyle_transformation"  // 🌟 [生活变化]
"lifestyle_daily_essential" // 💫 Can't Live Without...
"lifestyle_recommendation"  // ✨ If You [痛点], Try This...
```

**示例**

- 标题: `✨ The Gadget That Finally Changed My Work Setup`
- 描述: `Productivity boost is REAL. My morning routine hit different 💼`
- 标签: `#ProductivityHacks #HomeOffice #GameChanger`

---

## 图片合成 (Sharp)

### 工作流程

```
1. 下载产品图 (URL → Buffer)
2. 调整尺寸到 1000x1500 (Pinterest 最优宽高比)
3. 创建价格贴纸 SVG (红色圆形 + 白字)
4. Composite: 贴纸叠加到右上/右下角
5. 输出 JPEG
```

### 贴纸样式

**折扣时** (右上角)

```
┌─────┐
│ -24%│ ← 深红色圆形
└─────┘
```

**只有价格** (右下角)

```
        ┌─────────┐
        │ $189.99 │ ← 亮红色圆形
        └─────────┘
```

---

## 联盟链接转换

### Amazon Associates

```javascript
// 输入
"https://www.amazon.com/dp/B0CRMZHDG8"

// 输出 (自动拼接 tag)
"https://www.amazon.com/dp/B0CRMZHDG8/?tag=mystore-20"
```

### 支持的平台

- ✅ **Amazon** - Associates tag 参数
- ⏳ **Etsy** - 待实现
- ⏳ **Shopify** - 待实现

---

## 本地测试

### 测试 deal 模式

```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.amazon.com/dp/B0CRMZHDG8",
    "postType": "deal",
    "composeImage": false
  }'
```

### 测试 content 模式

```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.amazon.com/dp/B0CRMZHDG8",
    "postType": "content",
    "composeImage": true
  }'
```

### 测试图片合成

```bash
curl "http://localhost:3000/api/image?imageUrl=https://m.media-amazon.com/images/I/71-jXoUxV2L._AC_SX679_.jpg&price=189.99&discount=24" \
  --output composed.jpg
```

---

## 部署到 Vercel

### 1. 推送到 GitHub

```bash
git init && git add . && git commit -m "Layer 2 complete"
git remote add origin https://github.com/your-repo/pinflow-backend.git
git push -u origin main
```

### 2. 在 Vercel 导入

- 访问 [vercel.com/new](https://vercel.com/new)
- Import Repository → 选择你的 repo
- 添加环境变量
  - `ANTHROPIC_API_KEY`
  - `AMAZON_ASSOCIATE_TAG`
- Deploy!

### 3. 部署后配置

在 Vercel Dashboard → Settings → Function Memory：

```
memory: 1024 MB  (默认已配置在 vercel.json)
maxDuration: 30  (图片处理可能需要时间)
```

---

## 下一步 (Layer 3 & 4)

### Layer 3: 生图工具集成

```javascript
// api/_lib/image-generator.js (后续)
// 接入 Stable Diffusion API / DALL-E
// 基于商品图 → 场景化生成
```

**成本**: 每张 $0.02-0.10 (DALL-E) / 或自建 SD

### Layer 4: 批量处理 & 发布

```
CSV 批量导入 → 生成多个商品的 3x 文案 + 图片
↓
导出为 Tailwind / Buffer / Later 格式
↓
一键上传到 Pinterest
```

---

## 常见问题

**Q: Sharp 在 Vercel 上报错?**
A: Vercel 自动支持 Sharp。本地需要 `npm install sharp`。如果出错，运行 `npm rebuild sharp`。

**Q: 图片合成太慢?**
A: Sharp 的 SVG composite 有时会卡。可改为预生成 PNG 贴纸或用 Canvas API。

**Q: 如何自定义贴纸样式?**
A: 编辑 `image-composer.js` 中的 `createPriceBadgeSvg()` 函数，修改 SVG。

**Q: 支持其他平台吗?**
A: 当前只支持 Amazon。要加 Etsy/Shopify，新建 `api/_lib/scrapers/etsy.js` 并在 `generate.js` 中添加 case。

---

## 文件修改记录

```
✅ NEW:
  - api/_lib/templates/deal.js
  - api/_lib/templates/content.js
  - api/_lib/templates/index.js
  - api/_lib/affiliate.js
  - api/_lib/image-composer.js
  - api/image.js
  - demo-widget-v2.html

📝 UPDATED:
  - api/_lib/copywriter.js (新增 generateCopiesByPostType)
  - api/generate.js (支持 postType 参数)
  - package.json (新增 sharp 依赖)
```

---

**准备好了吗?** 下一步是 Layer 3: 生图工具集成或 Layer 4: 批量导出功能。
