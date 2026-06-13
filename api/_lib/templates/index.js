/**
 * api/_lib/templates/index.js
 *
 * 模板路由器 - 根据 postType 选择对应的 prompt 生成器
 */

const { buildDealPrompt } = require('./deal');
const { buildContentPrompt } = require('./content');

/**
 * @param {'deal' | 'content'} postType
 * @param {import('../scrapers/amazon').ProductInfo} product
 * @returns {string} - Claude prompt
 */
function getPrompt(postType, product) {
  switch (postType) {
    case 'deal':
      return buildDealPrompt(product);
    case 'content':
      return buildContentPrompt(product);
    default:
      throw new Error(`Unknown post type: ${postType}. Use 'deal' or 'content'.`);
  }
}

/**
 * 获取支持的 post type 列表
 */
function supportedPostTypes() {
  return ['deal', 'content'];
}

module.exports = { getPrompt, supportedPostTypes };
