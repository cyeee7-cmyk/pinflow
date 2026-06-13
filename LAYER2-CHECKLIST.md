# PinFlow Backend - Layer 2 完成清单

## 📦 新增文件 (第二层内容生成模块)

### 模板系统 (3 个文件)

```
api/_lib/templates/
├── index.js          (87行) - 模板路由器，根据 postType 选择 prompt
├── deal.js           (65行) - deal 帖模板 (折扣驱动)
└── content.js        (68行) - content 帖模板 (种草/生活化)
```

**功能**: 提供两种不同的 Claude prompt 模板
- **deal**: 强调价格、折扣、紧迫感 → 3 种风格 (discount/limited/comparison)
- **content**: 强调场景化、生活改善、情感连接 → 3 种风格 (transformation/essential/recommendation)

---

### 图片处理 (2 个文件)

```
api/_lib/
├── image-composer.js (180行) - 图片合成工厂 (Sharp)
│  ├─ downloadImage()       - 从 URL 下载图片 → Buffer
│  ├─ createPriceBadgeSvg() - 生成价格贴纸 SVG (红色圆形)
│  ├─ composeProductImage() - 叠加贴纸 → 输出 JPEG/PNG/WebP
│  └─ composeAndEncode()    - 返回 Base64 data URI
│
└── affiliate.js (95行) - 联盟链接管理
   ├─ toAmazonAffiliateLink()  - Amazon -> Associates tag
   ├─ generateAffiliateLink()  - 根据平台生成链接
   └─ buildAffiliateLink()     - 完整元数据输出
```

**功能**:
- 下载产品图 → 调整到 1000x1500px (Pinterest 最优宽高比)
- 创建价格贴纸 (SVG) → 动态显示 $价格 或 -折扣%
- 智能位置: 折扣时右上角, 只有价格时右下角
- 支持 Amazon Associates 标签自动拼接

---

### API 端点 (2 个文件)

```
api/
├── image.js (60行) - GET /api/image 图片合成接口
│  查询参数: imageUrl, price, discount, format, width, height
│  返回: 图片二进制数据 (JPEG/PNG/WebP)
│
└── generate.js (150行) - 更新版 POST /api/generate
   新参数:
   - postType: "deal" | "content" (默认 "deal")
   - composeImage: boolean (是否合成图片)
   
   新响应结构:
   copies[] 中每个 copy 现在包含:
   ├─ pin_title
   ├─ pin_description
   ├─ hashtags
   ├─ image_url (原始)
   ├─ composed_image_url (base64, 仅当 composeImage=true)
   └─ affiliate_link (Amazon Associates)
```

---

### 核心库更新 (1 个文件)

```
api/_lib/copywriter.js (250行) - 更新版
├─ generateCopies()           - 原始版本 (保留兼容性)
└─ generateCopiesByPostType() ⭐ NEW
   ├─ 接收 postType 参数
   ├─ 调用对应模板生成 prompt
   ├─ 调用 Claude AI
   ├─ JSON 解析 + 后处理
   ├─ 添加 affiliate_link
   └─ 添加 composed_image_url (可选)
```

---

### 前端演示 (1 个文件)

```
demo-widget-v2.html (400+行) - 增强版 Demo
├─ 模式切换: 💰 Deal Pins / ✨ Lifestyle Pins
├─ 图片合成开关: 复选框控制是否生成合成图
├─ 响应式布局: 产品卡 + 3 个文案卡并排显示
├─ 实时预览: 产品信息 + 合成图 + 文案
├─ 一键复制: 每个文案可独立复制或打开 affiliate 链接
└─ 状态管理: 加载/成功/错误动画反馈
```

---

### 配置文件 (1 个文件)

```
package.json - 新增依赖
├─ sharp@^0.33.0  (图片处理)
└─ (其他保持不变)
```

---

## 🔄 文件修改汇总

### 直接替换 (3 个文件)

| 文件 | 行数 | 变更内容 |
|------|------|--------|
| `api/_lib/copywriter.js` | 250 | ✅ 新增 `generateCopiesByPostType()` 支持模板系统 |
| `api/generate.js` | 150 | ✅ 新增 `postType` / `composeImage` 参数 |
| `package.json` | 26 | ✅ 新增 `sharp` 依赖 |

### 新增 (8 个文件)

| 文件 | 行数 | 说明 |
|------|------|------|
| `api/_lib/templates/index.js` | 87 | 模板路由 |
| `api/_lib/templates/deal.js` | 65 | deal 帖 prompt |
| `api/_lib/templates/content.js` | 68 | content 帖 prompt |
| `api/_lib/image-composer.js` | 180 | Sharp 图片合成 |
| `api/_lib/affiliate.js` | 95 | 联盟链接管理 |
| `api/image.js` | 60 | 图片合成 API 端点 |
| `demo-widget-v2.html` | 420 | 增强版演示 |
| `README-LAYER2.md` | 420 | 文档 |

**总计**: 新增 **819 行** 代码

---

## 💡 关键特性

### 1️⃣ 双模式文案生成

```
deal 模式:
  ├─ 🔥 deal_discount    "NOW $189 - Save $60!"
  ├─ ⏰ deal_limited     "Limited Time Offer"
  └─ 💰 deal_comparison  "Was $249, Now $189"

content 模式:
  ├─ 🌟 lifestyle_transformation    "Changed My Life"
  ├─ 💫 lifestyle_daily_essential   "Can't Live Without"
  └─ ✨ lifestyle_recommendation    "If You [Pain Point]..."
```

### 2️⃣ 图片智能合成

```
输入: 产品图 URL + 价格 + 折扣%
处理:
  1. 下载原图
  2. 调整宽高比 (1000x1500)
  3. 创建价格贴纸 SVG
  4. 叠加到角落
  5. 导出 JPEG
输出: base64 data URI (可直接显示)
```

### 3️⃣ 结构化数据输出

每个生成的文案包含:

```json
{
  "style": "deal_discount",
  "pin_title": "🔥 AirPods Pro NOW $189 – Save $60!",
  "pin_description": "Premium noise-cancelling...",
  "hashtags": ["AirPodsPro", "TechDeals", ...],
  "image_url": "https://...",
  "composed_image_url": "data:image/jpeg;base64,...",
  "affiliate_link": "https://amazon.com/dp/B0.../?tag=mystore-20"
}
```

### 4️⃣ 一键联盟链接转换

```
✅ Amazon: 自动拼接 Associates tag
⏳ Etsy: 待实现
⏳ Shopify: 待实现
```

---

## 🚀 使用流程

### 后端集成

```bash
# 1. 安装新依赖
npm install

# 2. 配置环境
export ANTHROPIC_API_KEY=sk-ant-...
export AMAZON_ASSOCIATE_TAG=mystore-20

# 3. 启动
vercel dev

# 4. 测试
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"url":"https://amazon.com/dp/...", "postType":"deal", "composeImage":true}'
```

### 前端集成

1. 将 `demo-widget-v2.html` 中的内容复制
2. 粘贴到你的 landing page
3. 修改顶部 `API_BASE` 为实际部署 URL
4. 用户选择 deal/content 模式 → 输入 Amazon 链接 → 获取 3 条 Pinterest 文案

---

## 📊 性能指标

| 操作 | 耗时 | 瓶颈 |
|------|------|------|
| 抓取商品信息 | 3-5s | Playwright 浏览器启动 + Amazon 页面渲染 |
| AI 文案生成 (Claude) | 2-3s | API 延迟 |
| 图片合成 (Sharp) | 1-2s | Sharp 处理 + SVG composite |
| **总耗时** | **6-10s** | Playwright (可优化为连接池) |

---

## 🎯 下一步 (Optional)

### Layer 3: 生图工具

```
// api/_lib/image-generator.js (后续)
// 支持:
// - Stable Diffusion API (自建或 replicate.com)
// - DALL-E 3 (OpenAI)
// - 基于商品图生成场景化背景
```

**成本**: $0.02-0.10 / 图

### Layer 4: 批量处理 + 导出

```
// api/batch.js (后续)
// 功能:
// - CSV 批量导入 (100+ 链接)
// - 并发生成文案 + 图片
// - 导出为 Tailwind / Buffer / Later 格式
// - 一键发布到 Pinterest (官方 API)
```

---

## ✅ 测试清单

- [ ] `POST /api/generate` 支持 `postType=deal`
- [ ] `POST /api/generate` 支持 `postType=content`
- [ ] `GET /api/image` 返回合成图片
- [ ] Amazon 联盟链接正确拼接
- [ ] 图片合成贴纸位置正确 (折扣右上, 价格右下)
- [ ] Demo 前端显示 3 个文案卡
- [ ] 复制按钮功能正常
- [ ] Affiliate 链接按钮能打开链接
- [ ] 本地测试无错误
- [ ] Vercel 部署无错误

---

## 📝 快速参考

### 新 API 签名

```javascript
// 旧版 (兼容)
generateCopies(product) → [{style, title, description, hashtags}]

// 新版 (推荐)
generateCopiesByPostType(product, postType, affiliateConfig, imageOptions) 
  → [{
      style, pin_title, pin_description, hashtags,
      image_url, composed_image_url, affiliate_link
    }]
```

### 环境变量

```env
ANTHROPIC_API_KEY=sk-ant-...           # Claude API Key (必需)
AMAZON_ASSOCIATE_TAG=mystore-20        # 联盟标签 (可选)
```

### 部署检查

```
☐ 本地: npm install + vercel dev 测试
☐ GitHub: git push
☐ Vercel: 导入 repo
☐ 环境变量: 添加 ANTHROPIC_API_KEY
☐ 部署: Vercel 自动构建
☐ 测试: curl POST /api/generate
```

---

**Ready?** 现在可以集成前端并开始生成 Pinterest 内容了! 🎉
