/**
 * api/_lib/copywriter-v2.js
 *
 * 增强版 AI 文案生成 - 集成图片模板系统
 * 支持 deal/content 两种 postType，各自使用对应的图片模板
 */

const Anthropic = require('@anthropic-ai/sdk');
const { getPrompt, supportedPostTypes } = require('./templates');
const { buildAffiliateLink } = require('./affiliate');
const { composeAndEncodeWithTemplate } = require('./image-composer-v2');
const { listTemplates } = require('./image-templates');

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * 将 postType 映射到图片模板
 * deal -> 'deal' 模板
 * content -> 'content' 模板
 */
function mapPostTypeToImageTemplate(postType) {
  const mapping = {
    deal: 'deal',        // 折扣驱动 -> deal 模板 (亮红色, 圆形)
    content: 'content',  // 种草 -> content 模板 (优雅, 矩形)
  };
  return mapping[postType] || 'deal';
}

/**
 * 生成 AI 文案 + 合成图片 (增强版)
 * @param {Object} product - 产品信息
 * @param {'deal' | 'content'} postType - 文案类型
 * @param {Object} affiliateConfig - { amazonTag, etc }
 * @param {Object} [imageOptions] - { compose, format, width, height }
 * @returns {Promise<Array>} - 结构化数据数组
 */
async function generateCopiesWithImages(
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

  // 1. 生成 AI 文案
  const prompt = getPrompt(postType, product);

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
    throw new Error('Claude 返回格式异常');
  }

  // 2. 后处理每个文案
  const imageTemplate = mapPostTypeToImageTemplate(postType);
  const { compose = false, format = 'jpeg', width = 1000, height = 1500 } = imageOptions;

  const copies = [];
  for (const copy of parsed.copies) {
    const result = {
      style: copy.style,
      pin_title: copy.title,
      pin_description: copy.description,
      hashtags: copy.hashtags || [],
      image_url: product.imageUrl,
      composed_image_url: null,
      image_template: imageTemplate,
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

    // 合成图片 (使用模板系统)
    if (product.imageUrl && compose) {
      try {
        result.composed_image_url = await composeAndEncodeWithTemplate(
          product.imageUrl,
          product.currentPrice,
          product.discountPercent || null,
          imageTemplate,
          format
        );
      } catch (imgErr) {
        console.warn('[generateCopiesWithImages] Image composition failed:', imgErr.message);
        // 继续，不中断
      }
    }

    copies.push(result);
  }

  return copies;
}

/**
 * 获取可用的图片模板列表 (供前端选择)
 */
function getAvailableImageTemplates() {
  return listTemplates();
}

module.exports = {
  generateCopiesWithImages,
  getAvailableImageTemplates,
  mapPostTypeToImageTemplate,
};
