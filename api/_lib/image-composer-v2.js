/**
 * api/_lib/image-composer-v2.js
 *
 * 增强版图片合成 - 支持模板系统、文字叠加、复杂设计
 * 基于 Sharp，支持:
 * - 圆形 / 矩形 / 金色边框贴纸
 * - 顶部丝带横幅
 * - 水印
 * - 自定义字体和颜色
 */

const https = require('https');
const http = require('http');

let sharp;
try {
  sharp = require('sharp');
} catch {
  sharp = null;
}

const { getTemplate } = require('./image-templates');

/**
 * 下载图片到 Buffer
 */
function downloadImage(imageUrl) {
  return new Promise((resolve, reject) => {
    const client = imageUrl.startsWith('https') ? https : http;
    const req = client.get(imageUrl, { timeout: 10000 }, (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}`));
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
 * 创建圆形贴纸 SVG (deal 风格)
 */
function createCircleBadgeSvg(price, discount, template) {
  const { bgColor, textColor, size = 140 } = template.badge;
  const badgeText = discount > 0 ? `-${discount}%` : `$${price.toFixed(0)}`;
  const fontSize = badgeText.length > 4 ? size * 0.45 : size * 0.6;

  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" flood-opacity="0.4"/>
        </filter>
      </defs>
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 2}"
              fill="${bgColor}" filter="url(#shadow)"/>
      <text x="${size / 2}" y="${size / 2}"
            font-family="Arial, sans-serif"
            font-weight="900"
            font-size="${fontSize}"
            fill="${textColor}"
            text-anchor="middle"
            dominant-baseline="middle">
        ${badgeText}
      </text>
    </svg>
  `;

  return Buffer.from(svg);
}

/**
 * 创建矩形价格贴纸 SVG (content 风格)
 */
function createBoxBadgeSvg(price, discount, template) {
  const { bgColor, textColor, borderColor, borderWidth = 2, size = 100 } = template.badge;
  const badgeText = discount > 0 ? `-${discount}%` : `$${price.toFixed(2)}`;
  const width = size + 40;
  const height = size;
  const fontSize = size * 0.5;

  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect x="${borderWidth}" y="${borderWidth}"
            width="${width - borderWidth * 2}" height="${height - borderWidth * 2}"
            fill="${bgColor}"
            stroke="${borderColor}"
            stroke-width="${borderWidth}"
            rx="8"/>
      <text x="${width / 2}" y="${height / 2}"
            font-family="Arial, sans-serif"
            font-weight="900"
            font-size="${fontSize}"
            fill="${textColor}"
            text-anchor="middle"
            dominant-baseline="middle">
        ${badgeText}
      </text>
    </svg>
  `;

  return Buffer.from(svg);
}

/**
 * 创建金色边框圆形贴纸 SVG (premium 风格)
 */
function createGoldCircleBadgeSvg(price, discount, template) {
  const { bgColor, textColor, borderColor, borderWidth = 3, size = 130 } = template.badge;
  const badgeText = discount > 0 ? `-${discount}%` : `$${price.toFixed(0)}`;
  const fontSize = badgeText.length > 4 ? size * 0.4 : size * 0.55;
  const radius = size / 2;

  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="6" stdDeviation="6" flood-opacity="0.6"/>
        </filter>
      </filter>
      </defs>
      <!-- 背景圆 -->
      <circle cx="${radius}" cy="${radius}" r="${radius - borderWidth}"
              fill="${bgColor}" filter="url(#shadow)"/>
      <!-- 金色边框 -->
      <circle cx="${radius}" cy="${radius}" r="${radius - borderWidth / 2}"
              fill="none" stroke="${borderColor}" stroke-width="${borderWidth}"/>
      <!-- 文本 -->
      <text x="${radius}" y="${radius}"
            font-family="Arial, sans-serif"
            font-weight="900"
            font-size="${fontSize}"
            fill="${textColor}"
            text-anchor="middle"
            dominant-baseline="middle">
        ${badgeText}
      </text>
    </svg>
  `;

  return Buffer.from(svg);
}

/**
 * 创建顶部丝带横幅 SVG
 */
function createRibbonSvg(width, template) {
  const { bgColor, textColor, text, fontSize = 18, height = 50 } = template.overlay;

  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="${bgColor}"/>
      <text x="${width / 2}" y="${height / 2}"
            font-family="Arial, sans-serif"
            font-weight="900"
            font-size="${fontSize}"
            fill="${textColor}"
            text-anchor="middle"
            dominant-baseline="middle"
            letter-spacing="2">
        ${text}
      </text>
    </svg>
  `;

  return Buffer.from(svg);
}

/**
 * 主合成函数 - 支持模板
 * @param {string} productImageUrl - 产品图 URL
 * @param {number} price
 * @param {number} [discount]
 * @param {Object} [options]
 * @param {string} [options.template] - 模板名称 ('deal' | 'content' | 'premium')
 * @param {number} [options.width] - 输出宽度
 * @param {number} [options.height] - 输出高度
 * @param {string} [options.format] - 输出格式
 * @returns {Promise<Buffer>}
 */
async function composeProductImageWithTemplate(
  productImageUrl,
  price,
  discount = null,
  options = {}
) {
  if (!sharp) {
    throw new Error('Sharp not installed. Run: npm install sharp');
  }

  const {
    template: templateName = 'deal',
    width = 1000,
    height = 1500,
    format = 'jpeg',
  } = options;

  const template = getTemplate(templateName);

  try {
    // 1. 下载原图
    const imageBuffer = await downloadImage(productImageUrl);

    // 2. 基础处理: 调整尺寸
    let pipeline = sharp(imageBuffer).resize(width, height, {
      fit: 'contain',
      background: { r: 250, g: 250, b: 247 },
    });

    // 3. 创建合成层数组
    const composites = [];

    // 3a. 顶部丝带 (如果启用)
    if (template.overlay && template.overlay.enabled && template.overlay.type === 'ribbon') {
      const ribbonSvg = createRibbonSvg(width, template.overlay);
      composites.push({
        input: ribbonSvg,
        gravity: 'north',
        offset: { left: 0, top: 0 },
      });
    }

    // 3b. 价格贴纸 (根据样式选择)
    let badgeSvg;
    const badgeStyle = template.badge.style;

    if (discount !== null && discount > 0) {
      // 有折扣时，显示折扣百分比
      if (badgeStyle === 'discount_circle') {
        badgeSvg = createCircleBadgeSvg(price, discount, template);
      } else if (badgeStyle === 'price_box') {
        badgeSvg = createBoxBadgeSvg(price, discount, template);
      } else if (badgeStyle === 'gold_circle') {
        badgeSvg = createGoldCircleBadgeSvg(price, discount, template);
      } else {
        badgeSvg = createCircleBadgeSvg(price, discount, template);
      }
    } else if (price) {
      // 只有价格
      if (badgeStyle === 'discount_circle') {
        badgeSvg = createCircleBadgeSvg(price, 0, template);
      } else if (badgeStyle === 'price_box') {
        badgeSvg = createBoxBadgeSvg(price, 0, template);
      } else if (badgeStyle === 'gold_circle') {
        badgeSvg = createGoldCircleBadgeSvg(price, 0, template);
      } else {
        badgeSvg = createCircleBadgeSvg(price, 0, template);
      }
    }

    if (badgeSvg) {
      composites.push({
        input: badgeSvg,
        gravity: template.badge.position || 'northeast',
        offset: { left: -10, top: 10 },
      });
    }

    // 3c. 水印 (如果启用)
    if (template.watermark && template.watermark.enabled) {
      const watermarkSvg = createWatermarkSvg(
        width,
        template.watermark.text || 'PinFlow',
        template.watermark
      );
      composites.push({
        input: watermarkSvg,
        gravity: 'south',
        offset: { left: 0, top: -20 },
      });
    }

    // 4. 应用所有合成
    if (composites.length > 0) {
      pipeline = pipeline.composite(composites);
    }

    // 5. 导出
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
 * 创建水印 SVG
 */
function createWatermarkSvg(width, text, config) {
  const { fontSize = 24, opacity = 0.15 } = config;
  const svg = `
    <svg width="${width}" height="80" xmlns="http://www.w3.org/2000/svg">
      <text x="${width / 2}" y="40"
            font-family="Arial, sans-serif"
            font-size="${fontSize}"
            fill="rgba(0, 0, 0, ${opacity})"
            text-anchor="middle"
            dominant-baseline="middle"
            font-weight="600">
        ${text}
      </text>
    </svg>
  `;
  return Buffer.from(svg);
}

/**
 * 合成并返回 Base64
 */
async function composeAndEncodeWithTemplate(
  productImageUrl,
  price,
  discount = null,
  templateName = 'deal',
  format = 'jpeg'
) {
  const buffer = await composeProductImageWithTemplate(
    productImageUrl,
    price,
    discount,
    { template: templateName, format }
  );
  const mimeType = `image/${format}`;
  return `data:${mimeType};base64,${buffer.toString('base64')}`;
}

module.exports = {
  downloadImage,
  createCircleBadgeSvg,
  createBoxBadgeSvg,
  createGoldCircleBadgeSvg,
  createRibbonSvg,
  createWatermarkSvg,
  composeProductImageWithTemplate,
  composeAndEncodeWithTemplate,
};
