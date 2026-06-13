/**
 * api/_lib/image-templates.js
 *
 * 图片模板系统 - 支持多种设计风格
 * 为不同的 postType 提供专门的合成配置
 */

/**
 * Deal 风格模板 - 强调折扣和紧迫感
 * 特点: 亮红色贴纸, 显眼的折扣百分比, 倒计时感
 */
const DEAL_TEMPLATE = {
  name: 'deal',
  description: 'Deal-focused design - bold colors, discount emphasis',
  badge: {
    style: 'discount_circle',
    bgColor: '#E53238',      // 深红
    textColor: '#FFFFFF',
    size: 140,
    position: 'northeast',   // 右上角
    shadow: true,
  },
  overlay: {
    enabled: true,
    type: 'ribbon',          // 顶部丝带横幅
    bgColor: 'rgba(229, 50, 56, 0.95)',
    textColor: '#FFFFFF',
    text: '🔥 LIMITED OFFER',
    fontSize: 18,
    height: 50,
  },
  watermark: {
    enabled: false,
  },
};

/**
 * Content 风格模板 - 强调产品本身
 * 特点: 柔和的颜色, 轻微的价格标签, 优雅设计
 */
const CONTENT_TEMPLATE = {
  name: 'content',
  description: 'Lifestyle-focused design - elegant, subtle',
  badge: {
    style: 'price_box',      // 矩形而非圆形
    bgColor: '#FFFFFF',
    textColor: '#C8344A',
    borderColor: '#C8344A',
    borderWidth: 2,
    size: 100,
    position: 'southeast',   // 右下角
    shadow: false,
  },
  overlay: {
    enabled: false,
  },
  watermark: {
    enabled: true,
    text: 'PinFlow',
    opacity: 0.15,
    fontSize: 24,
    position: 'bottom-right',
  },
};

/**
 * Premium 风格模板 - 高端产品
 * 特点: 简约黑白, 金色装饰, 高端感
 */
const PREMIUM_TEMPLATE = {
  name: 'premium',
  description: 'Premium product design - minimalist, luxury feel',
  badge: {
    style: 'gold_circle',
    bgColor: '#2C2C2C',
    borderColor: '#D4AF37',  // 金色
    borderWidth: 3,
    textColor: '#D4AF37',
    size: 130,
    position: 'northeast',
    shadow: true,
  },
  overlay: {
    enabled: true,
    type: 'gradient',
    bgColor: 'linear-gradient(to bottom, rgba(0,0,0,0), rgba(0,0,0,0.1))',
    textColor: '#FFFFFF',
    text: '✨ PREMIUM ✨',
    fontSize: 16,
    height: 60,
    position: 'bottom',
  },
  watermark: {
    enabled: false,
  },
};

/**
 * 获取模板
 * @param {'deal' | 'content' | 'premium'} templateName
 * @returns {Object}
 */
function getTemplate(templateName = 'deal') {
  const templates = {
    deal: DEAL_TEMPLATE,
    content: CONTENT_TEMPLATE,
    premium: PREMIUM_TEMPLATE,
  };

  return templates[templateName] || templates.deal;
}

/**
 * 获取可用模板列表
 */
function listTemplates() {
  return [
    { name: 'deal', label: '💰 Deal', description: 'Bold discount focus' },
    { name: 'content', label: '✨ Lifestyle', description: 'Elegant & subtle' },
    { name: 'premium', label: '👑 Premium', description: 'Luxury feel' },
  ];
}

module.exports = {
  DEAL_TEMPLATE,
  CONTENT_TEMPLATE,
  PREMIUM_TEMPLATE,
  getTemplate,
  listTemplates,
};
