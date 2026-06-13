/**
 * api/image.js
 *
 * GET /api/image?imageUrl=...&price=29.99&discount=24&format=jpeg
 *
 * 合成产品图 + 价格贴纸，返回图片 buffer
 * 用于前端图片预览或作为内容生成的一部分
 */

const { composeProductImage } = require('./_lib/image-composer');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed. Use GET.' });
  }

  const { imageUrl, price, discount, format = 'jpeg', width, height } = req.query;

  if (!imageUrl) {
    return res.status(400).json({
      error: 'Missing required parameter: imageUrl',
    });
  }

  if (!price) {
    return res.status(400).json({
      error: 'Missing required parameter: price',
    });
  }

  const priceNum = parseFloat(price);
  const discountNum = discount ? parseInt(discount, 10) : null;

  if (isNaN(priceNum)) {
    return res.status(400).json({ error: 'Invalid price value' });
  }

  try {
    const buffer = await composeProductImage(imageUrl, priceNum, discountNum, {
      width: width ? parseInt(width, 10) : 1000,
      height: height ? parseInt(height, 10) : 1500,
      format,
    });

    // 设置响应头
    res.setHeader('Content-Type', `image/${format}`);
    res.setHeader('Cache-Control', 'public, max-age=86400'); // 缓存 24 小时
    res.setHeader('Content-Length', buffer.length);

    return res.status(200).send(buffer);
  } catch (err) {
    console.error('[image]', err);
    return res.status(500).json({
      error: 'Image composition failed',
      detail: err.message,
    });
  }
};
