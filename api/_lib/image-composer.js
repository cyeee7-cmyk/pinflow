/**
 * api/_lib/image-composer.js
 *
 * 图片合成模块 - 使用 Sharp 下载产品图 + 添加价格/折扣贴纸
 * 输出: JPEG buffer 或 base64 字符串
 */

const https = require('https');
const http = require('http');

let sharp;
try {
  sharp = require('sharp');
} catch {
  sharp = null;
}

/**
 * 从 URL 下载图片到 Buffer
 * @param {string} imageUrl
 * @returns {Promise<Buffer>}
 */
function downloadImage(imageUrl) {
  return new Promise((resolve, reject) => {
    const client = imageUrl.startsWith('https') ? https : http;
    const req = client.get(imageUrl, { timeout: 10000 }, (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${imageUrl}`));
      }
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    });
    req.on('error', reject);
    req.setTimeout(10000, () => req.destroy());
  });
}

/**
 * 创建价格贴纸 SVG (红色圆形 + 白字)
 * @param {number} price
 * @param {number} discount - 百分比 (如 24)
 * @returns {Buffer} - SVG 图片 Buffer
 */
function createPriceBadgeSvg(price, discount) {
  let badgeText = `$${price.toFixed(2)}`;
  let bgColor = '#C8344A'; // 红色

  if (discount > 0) {
    badgeText = `-${discount}%`;
    bgColor = '#E53238'; // 深红
  }

  const svg = `
    <svg width="120" height="120" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>
          .badge-circle { filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2)); }
          .badge-text {
            font-family: Arial, sans-serif;
            font-weight: bold;
            fill: white;
            text-anchor: middle;
            dominant-baseline: middle;
          }
        </style>
      </defs>
      <circle class="badge-circle" cx="60" cy="60" r="58" fill="${bgColor}"/>
      <text class="badge-text" x="60" y="60" font-size="${badgeText.length > 4 ? '32' : '40'}">
        ${badgeText}
      </text>
    </svg>
  `;

  return Buffer.from(svg);
}

/**
 * 合成产品图 + 价格贴纸
 * @param {string} productImageUrl - 产品图 URL
 * @param {number} price - 价格
 * @param {number} [discount] - 折扣百分比
 * @param {Object} [options]
 * @param {number} [options.width] - 输出宽度 (Pinterest 推荐 1000px)
 * @param {number} [options.height] - 输出高度 (Pinterest 推荐 1500px)
 * @param {string} [options.format] - 输出格式 ('jpeg' | 'png' | 'webp')
 * @returns {Promise<Buffer>} - 合成后的图片 Buffer
 */
async function composeProductImage(
  productImageUrl,
  price,
  discount = null,
  options = {}
) {
  if (!sharp) {
    throw new Error(
      'Sharp not installed. Run: npm install sharp'
    );
  }

  const { width = 1000, height = 1500, format = 'jpeg' } = options;

  try {
    // 1. 下载原图
    const imageBuffer = await downloadImage(productImageUrl);

    // 2. 用 Sharp 处理原图: 调整尺寸 + 填充背景
    let pipeline = sharp(imageBuffer)
      .resize(width, height, {
        fit: 'contain', // 保持宽高比，用背景填充
        background: { r: 250, g: 250, b: 247 }, // cream 色背景
      });

    // 3. 如果有折扣，创建价格贴纸
    if (discount !== null && discount > 0) {
      const badgeSvg = createPriceBadgeSvg(price, discount);
      // 贴纸大小 ~100px，放在右上角
      pipeline = pipeline.composite([
        {
          input: badgeSvg,
          gravity: 'northeast', // 右上角
          offset: { left: -10, top: 10 },
        },
      ]);
    } else if (price) {
      // 只有价格，没有折扣
      const badgeSvg = createPriceBadgeSvg(price, 0);
      pipeline = pipeline.composite([
        {
          input: badgeSvg,
          gravity: 'southeast', // 右下角
          offset: { left: -10, top: -10 },
        },
      ]);
    }

    // 4. 导出为指定格式
    if (format === 'jpeg') {
      return pipeline.jpeg({ quality: 85, progressive: true }).toBuffer();
    } else if (format === 'png') {
      return pipeline.png({ progressive: true }).toBuffer();
    } else {
      return pipeline.webp({ quality: 80 }).toBuffer();
    }
  } catch (err) {
    throw new Error(`Image composition failed: ${err.message}`);
  }
}

/**
 * 合成并返回 Base64 数据 URI (用于前端直接显示)
 * @param {string} productImageUrl
 * @param {number} price
 * @param {number} [discount]
 * @param {string} [format]
 * @returns {Promise<string>} - data:image/jpeg;base64,...
 */
async function composeAndEncode(
  productImageUrl,
  price,
  discount = null,
  format = 'jpeg'
) {
  const buffer = await composeProductImage(productImageUrl, price, discount, {
    format,
  });
  const mimeType = `image/${format}`;
  return `data:${mimeType};base64,${buffer.toString('base64')}`;
}

module.exports = {
  downloadImage,
  createPriceBadgeSvg,
  composeProductImage,
  composeAndEncode,
};
