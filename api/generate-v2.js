
/**
 * api/generate-v2.js
 *
 * 增强版生成 API - 支持图片模板系统
 * POST /api/generate-v2
 *
 * 请求体:
 * {
 *   "url": "https://amazon.com/dp/...",
 *   "postType": "deal | content",
 *   "composeImage": true,
 *   "imageTemplate": "deal | content | premium" (可选，自动映射)
 * }
 *
 * 响应包含: pin_title, pin_description, hashtags, image_url, composed_image_url, image_template, affiliate_link
 */

const { detectPlatform, supportedLabels } = require('./_lib/detect');
const { scrapeAmazon } = require('./_lib/scrapers/amazon');
const { generateCopiesWithImages, mapPostTypeToImageTemplate } = require('./_lib/copywriter-v2');
const { supportedPostTypes } = require('./_lib/templates');

async function scrapeProduct(platform, url) {
  switch (platform) {
    case 'amazon':
      return scrapeAmazon(url);
    default:
      throw new Error(`Platform "${platform}" not implemented`);
  }
}

module.exports = async function handler(req, res) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Use POST' });
  }

  const { url, postType = 'deal', composeImage = false, imageTemplate } = req.body || {};

  // 验证输入
  if (!url || typeof url !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Missing field: url',
    });
  }

  const platform = detectPlatform(url);
  if (!platform) {
    return res.status(400).json({
      success: false,
      error: `Unsupported platform. Supported: ${supportedLabels()}`,
    });
  }

  if (platform !== 'amazon') {
    return res.status(400).json({
      success: false,
      error: `${platform} coming soon!`,
    });
  }

  if (!supportedPostTypes().includes(postType)) {
    return res.status(400).json({
      success: false,
      error: `Invalid postType. Supported: ${supportedPostTypes().join(', ')}`,
    });
  }

  console.log(
    `[generate-v2] Platform: ${platform}, PostType: ${postType}, ComposeImage: ${composeImage}`
  );
  const startTime = Date.now();

  try {
    // 1. 抓取商品
    let product;
    try {
      product = await scrapeProduct(platform, url);
    } catch (scrapeErr) {
      console.error('[generate-v2] Scrape error:', scrapeErr.message);
      return res.status(502).json({
        success: false,
        error: 'Failed to fetch product',
        detail: scrapeErr.message,
      });
    }

    if (!product.title) {
      return res.status(422).json({
        success: false,
        error: 'Could not extract product title',
      });
    }

    console.log(`[generate-v2] Scraped "${product.title}"`);

    // 2. 生成文案 + 合成图片
    let copies;
    try {
      const effectiveImageTemplate = imageTemplate || mapPostTypeToImageTemplate(postType);

      copies = await generateCopiesWithImages(
        product,
        postType,
        { amazonTag: process.env.AMAZON_ASSOCIATE_TAG },
        {
          compose: composeImage,
          format: 'jpeg',
          width: 1000,
          height: 1500,
        }
      );
    } catch (aiErr) {
      console.error('[generate-v2] AI error:', aiErr.message);
      return res.status(502).json({
        success: false,
        error: 'AI copywriting failed',
        detail: aiErr.message,
      });
    }

    console.log(`[generate-v2] Generated ${copies.length} copies in ${Date.now() - startTime}ms`);

    // 3. 返回结果
    return res.status(200).json({
      success: true,
      meta: {
        platform,
        postType,
        composeImage,
        processingMs: Date.now() - startTime,
      },
      product: {
        title: product.title,
        brand: product.brand,
        currentPrice: product.currentPrice,
        originalPrice: product.originalPrice,
        discountPercent: product.discountPercent,
        currency: product.currency,
        imageUrl: product.imageUrl,
        asin: product.asin,
        url: product.url,
      },
      copies,
    });
  } catch (err) {
    console.error('[generate-v2] Unexpected error:', err);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      detail: err.message,
    });
  }
};
