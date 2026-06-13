export const config = {
  runtime: "nodejs18.x",
  maxDuration: 60,
  memory: 1024,
};

/**
 * api/image-v2.js
 *
 * 增强版图片合成 API
 * GET /api/image-v2?imageUrl=...&price=29.99&discount=24&template=deal&format=jpeg
 *
 * 新参数: template ('deal' | 'content' | 'premium')
 */

const { composeProductImageWithTemplate } = require('./_lib/image-composer-v2');
const { listTemplates } = require('./_lib/image-templates');

/**
 * 图片列表端点 - 获取可用模板
 */
function handleListTemplates(req, res) {
  return res.status(200).json({
    templates: listTemplates(),
  });
}

/**
 * 主合成端点
 */
async function handleCompose(req, res) {
  const { imageUrl, price, discount, template = 'deal', format = 'jpeg', width, height } =
    req.query;

  // 验证必需参数
  if (!imageUrl) {
    return res.status(400).json({ error: 'Missing imageUrl' });
  }

  if (!price) {
    return res.status(400).json({ error: 'Missing price' });
  }

  const priceNum = parseFloat(price);
  const discountNum = discount ? parseInt(discount, 10) : null;

  if (isNaN(priceNum)) {
    return res.status(400).json({ error: 'Invalid price' });
  }

  try {
    const buffer = await composeProductImageWithTemplate(imageUrl, priceNum, discountNum, {
      template,
      width: width ? parseInt(width, 10) : 1000,
      height: height ? parseInt(height, 10) : 1500,
      format,
    });

    res.setHeader('Content-Type', `image/${format}`);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('Content-Length', buffer.length);

    return res.status(200).send(buffer);
  } catch (err) {
    console.error('[image-v2]', err);
    return res.status(500).json({
      error: 'Image composition failed',
      detail: err.message,
    });
  }
}

/**
 * 路由处理
 */
module.exports = function handler(req, res) {
  // CORS
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // GET /api/image-v2/templates
  if (req.url === '/templates') {
    return handleListTemplates(req, res);
  }

  // GET /api/image-v2?...
  if (req.method === 'GET') {
    return handleCompose(req, res);
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
