/**
 * api/generate.js (更新版本)
 *
 * POST /api/generate
 * Body: {
 *   "url": "https://www.amazon.com/dp/B0XXXXXX",
 *   "postType": "deal" | "content" (可选，默认 "deal"),
 *   "composeImage": true | false (可选，是否合成图片)
 * }
 *
 * Response: { success, product, copies[] }
 * 每个 copy 包含: pin_title, pin_description, hashtags, affiliate_link, composed_image_url
 */

const { detectPlatform, supportedLabels } = require('./_lib/detect');
const { scrapeAmazon } = require('./_lib/scrapers/amazon');
const { generateCopiesByPostType } = require('./_lib/copywriter');
const { supportedPostTypes } = require('./_lib/templates');

/**
 * 根据平台路由到对应 scraper
 */
async function scrapeProduct(platform, url) {
  switch (platform) {
    case 'amazon':
      return scrapeAmazon(url);
    default:
      throw new Error(`Platform "${platform}" scraper not implemented.`);
  }
}

module.exports = async function handler(req, res) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Use POST method' });
  }

  const { url, postType = 'deal', composeImage = false } = req.body || {};

  // ---- 验证输入 ----
  if (!url || typeof url !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Missing required field: url',
    });
  }

  const platform = detectPlatform(url);
  if (!platform) {
    return res.status(400).json({
      success: false,
      error: `Unsupported URL. Supported platforms: ${supportedLabels()}`,
    });
  }

  // 暂时只支持 Amazon
  if (platform !== 'amazon') {
    return res.status(400).json({
      success: false,
      error: `${platform} support coming soon! Currently only Amazon is supported.`,
    });
  }

  // 验证 postType
  if (!supportedPostTypes().includes(postType)) {
    return res.status(400).json({
      success: false,
      error: `Invalid postType. Supported: ${supportedPostTypes().join(', ')}`,
    });
  }

  console.log(`[generate] Platform: ${platform}, PostType: ${postType}, URL: ${url}`);
  const startTime = Date.now();

  try {
    // ---- 1. 抓取商品信息 ----
    let product;
    try {
      product = await scrapeProduct(platform, url);
    } catch (scrapeErr) {
      console.error('[generate] Scrape error:', scrapeErr.message);
      return res.status(502).json({
        success: false,
        error: 'Failed to fetch product. Amazon may be blocking or URL requires login.',
        detail: scrapeErr.message,
      });
    }

    if (!product.title) {
      return res.status(422).json({
        success: false,
        error: 'Could not extract product title. Please use a direct product page URL.',
      });
    }

    console.log(`[generate] Scraped: "${product.title}" in ${Date.now() - startTime}ms`);

    // ---- 2. 生成 AI 文案 ----
    let copies;
    try {
      copies = await generateCopiesByPostType(
        product,
        postType,
        {
          amazonTag: process.env.AMAZON_ASSOCIATE_TAG,
        },
        {
          compose: composeImage,
          format: 'jpeg',
          width: 1000,
          height: 1500,
        }
      );
    } catch (aiErr) {
      console.error('[generate] AI error:', aiErr.message);
      return res.status(502).json({
        success: false,
        error: 'AI copywriting failed. Check ANTHROPIC_API_KEY.',
        detail: aiErr.message,
      });
    }

    console.log(
      `[generate] Generated ${copies.length} copies in ${Date.now() - startTime}ms`
    );

    // ---- 3. 返回结果 ----
    return res.status(200).json({
      success: true,
      meta: {
        platform,
        postType,
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
        description: product.description,
        bulletPoints: product.bulletPoints,
        asin: product.asin,
        url: product.url,
      },
      copies,
    });
  } catch (err) {
    console.error('[generate] Unexpected error:', err);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      detail: err.message,
    });
  }
};
