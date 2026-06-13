/**
 * api/_lib/copywriter.js (更新版本)
 *
 * AI 文案生成 - 使用模板系统生成 Pinterest 风格的内容
 * 支持 'deal' 和 'content' 两种风格
 *
 * 返回结构化数据:
 * {
 *   pin_title, pin_description, hashtags,
 *   style, image_url, composed_image_url, affiliate_link
 * }
 */

const Anthropic = require('@anthropic-ai/sdk');
const { getPrompt, supportedPostTypes } = require('./templates');
const { buildAffiliateLink } = require('./affiliate');
const { composeAndEncode } = require('./image-composer');

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * 生成 AI 文案 (原始版本 - 3 种风格混合)
 * @deprecated 使用 generateCopiesByPostType 替代
 */
async function generateCopies(product) {
  const prompt = `You are an expert Pinterest content creator specializing in affiliate marketing copy.

Generate 3 distinct Pinterest pin copies for this product. Each must be optimized for Pinterest SEO and high click-through rates.

PRODUCT DETAILS:
- Title: ${product.title || 'Unknown Product'}
- Brand: ${product.brand || 'Unknown'}
- Price: ${product.currentPrice ? `$${product.currentPrice}` : 'N/A'}${product.discountPercent ? ` (${product.discountPercent}% off)` : ''}
- Key Features: ${product.bulletPoints.slice(0, 4).map((b) => `• ${b}`).join('\n')}

REQUIREMENTS:
Each copy needs:
1. Pin Title: 40-60 chars, keyword-rich, compelling
2. Pin Description: 100-150 chars, conversational, soft CTA
3. Hashtags: 5 relevant Pinterest hashtags (no spaces, no # prefix)

Generate 3 styles: "benefit", "urgency", "story"

Respond ONLY with valid JSON, no markdown:
{
  "copies": [
    { "style": "benefit", "title": "...", "description": "...", "hashtags": [...] },
    { "style": "urgency", "title": "...", "description": "...", "hashtags": [...] },
    { "style": "story", "title": "...", "description": "...", "hashtags": [...] }
  ]
}`;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const rawText = message.content
    .filter((c) => c.type === 'text')
    .map((c) => c.text)
    .join('');

  const cleaned = rawText
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/gi, '')
    .trim();

  try {
    const parsed = JSON.parse(cleaned);
    return parsed.copies || [];
  } catch (e) {
    throw new Error(`Claude 返回无效 JSON: ${e.message}`);
  }
}

/**
 * 按 postType 生成文案 (新版本)
 * @param {Object} product - 产品信息
 * @param {'deal' | 'content'} postType - 文案类型
 * @param {Object} affiliateConfig - 联盟配置 { amazonTag, etc }
 * @param {Object} [imageOptions] - 图片合成选项 { format, width, height }
 * @returns {Promise<Array>} - 结构化数据数组
 */
async function generateCopiesByPostType(
  product,
  postType,
  affiliateConfig = {},
  imageOptions = {}
) {
  if (!supportedPostTypes().includes(postType)) {
    throw new Error(
      `Unsupported postType: ${postType}. Use: ${supportedPostTypes().join(', ')}`
    );
  }

  // 1. 获取对应的 prompt
  const prompt = getPrompt(postType, product);

  // 2. 调用 Claude
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const rawText = message.content
    .filter((c) => c.type === 'text')
    .map((c) => c.text)
    .join('');

  const cleaned = rawText
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/gi, '')
    .trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    throw new Error(`Claude 返回无效 JSON: ${e.message}`);
  }

  if (!parsed.copies || !Array.isArray(parsed.copies)) {
    throw new Error('Claude 返回格式异常: 缺少 copies 数组');
  }

  // 3. 后处理: 添加 image_url, composed_image_url, affiliate_link
  const copies = [];
  for (const copy of parsed.copies) {
    const result = {
      style: copy.style,
      pin_title: copy.title,
      pin_description: copy.description,
      hashtags: copy.hashtags || [],
      image_url: product.imageUrl,
      composed_image_url: null,
      affiliate_link: null,
    };

    // 生成联盟链接
    if (product.platform && product.url) {
      const affiliateInfo = buildAffiliateLink(
        product.platform,
        product.url,
        affiliateConfig
      );
      result.affiliate_link = affiliateInfo.linkUrl;
    }

    // 合成图片 (如果有图且选项要求)
    if (product.imageUrl && imageOptions.compose) {
      try {
        result.composed_image_url = await composeAndEncode(
          product.imageUrl,
          product.currentPrice,
          product.discountPercent,
          imageOptions.format || 'jpeg'
        );
      } catch (imgErr) {
        console.warn('[generateCopiesByPostType] Image composition failed:', imgErr);
        // 不中断，继续返回其他字段
      }
    }

    copies.push(result);
  }

  return copies;
}

module.exports = {
  generateCopies,
  generateCopiesByPostType,
};
