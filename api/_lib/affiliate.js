/**
 * api/_lib/affiliate.js
 *
 * 联盟链接管理 - 自动转换为用户的联盟链接
 */

/**
 * Amazon 链接转换为 Associates 链接
 * @param {string} amazonUrl - 原始 Amazon URL (任何格式)
 * @param {string} associateTag - 用户的 Associate Tag (如 "mystore-20")
 * @returns {string} - 带 tag 参数的 Associate 链接
 */
function toAmazonAffiliateLink(amazonUrl, associateTag) {
  if (!amazonUrl || !associateTag) return amazonUrl;

  try {
    const url = new URL(amazonUrl);
    // 确保是 Amazon 域名
    if (!url.hostname.includes('amazon')) return amazonUrl;

    // 提取 ASIN (在 /dp/XXXX 或 /gp/product/XXXX)
    const asinMatch = url.pathname.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/);
    if (!asinMatch) return amazonUrl;

    const asin = asinMatch[1];

    // 构建标准 Associates 链接
    const domain = url.hostname;
    const affiliateUrl = `https://${domain}/dp/${asin}/?tag=${encodeURIComponent(associateTag)}`;
    return affiliateUrl;
  } catch {
    return amazonUrl;
  }
}

/**
 * 根据平台生成联盟链接
 * @param {'amazon' | 'etsy' | 'shopify'} platform
 * @param {string} productUrl
 * @param {Object} affiliateConfig - { amazonTag, etsyPartner, shopifyAffiliate, etc }
 * @returns {string}
 */
function generateAffiliateLink(platform, productUrl, affiliateConfig = {}) {
  switch (platform) {
    case 'amazon':
      return toAmazonAffiliateLink(productUrl, affiliateConfig.amazonTag);
    case 'etsy':
      // Etsy 暂不支持，返回原 URL
      return productUrl;
    case 'shopify':
      // Shopify 暂不支持，返回原 URL
      return productUrl;
    default:
      return productUrl;
  }
}

/**
 * 从产品信息生成完整的联盟链接和元数据
 * @param {'amazon' | 'etsy' | 'shopify'} platform
 * @param {string} productUrl
 * @param {Object} affiliateConfig
 * @returns {{ linkUrl: string, isAffiliate: boolean, platform: string }}
 */
function buildAffiliateLink(platform, productUrl, affiliateConfig = {}) {
  const affiliateUrl = generateAffiliateLink(platform, productUrl, affiliateConfig);
  const isAffiliate = affiliateUrl !== productUrl; // 如果 URL 变了，说明成功转换

  return {
    linkUrl: affiliateUrl,
    isAffiliate,
    platform,
    originalUrl: productUrl,
  };
}

module.exports = {
  toAmazonAffiliateLink,
  generateAffiliateLink,
  buildAffiliateLink,
};
