#!/usr/bin/env node

/**
 * test-image-composition.js
 *
 * 本地测试脚本 - 测试图片合成功能
 * 使用: node test-image-composition.js
 *
 * 会生成几个测试图片到 ./test-output/ 目录
 */

const fs = require('fs');
const path = require('path');

// 尝试加载 v2 composer
let composer;
try {
  composer = require('./api/_lib/image-composer-v2');
} catch (err) {
  console.error('❌ 无法加载 image-composer-v2.js');
  console.error('请确保已运行: npm install sharp');
  process.exit(1);
}

// 创建输出目录
const outputDir = path.join(__dirname, 'test-output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
  console.log(`✅ Created ${outputDir}`);
}

// 测试用的真实亚马逊产品图 URL
const TEST_IMAGE_URL =
  'https://m.media-amazon.com/images/I/71-jXoUxV2L._AC_SX679_.jpg'; // AirPods Pro

const TEST_CASES = [
  {
    name: 'deal-with-discount',
    template: 'deal',
    price: 189.99,
    discount: 24,
    description: 'Deal style with discount badge (红色圆形 -24%)',
  },
  {
    name: 'deal-no-discount',
    template: 'deal',
    price: 189.99,
    discount: 0,
    description: 'Deal style with price only (红色圆形 $189)',
  },
  {
    name: 'content-with-discount',
    template: 'content',
    price: 189.99,
    discount: 24,
    description: 'Content/lifestyle style with discount (白色矩形 -24%)',
  },
  {
    name: 'content-no-discount',
    template: 'content',
    price: 189.99,
    discount: 0,
    description: 'Content/lifestyle style (白色矩形 $189.99)',
  },
  {
    name: 'premium-with-discount',
    template: 'premium',
    price: 189.99,
    discount: 24,
    description: 'Premium style with gold border (金色圆形 -24%)',
  },
  {
    name: 'premium-expensive',
    template: 'premium',
    price: 599.99,
    discount: 15,
    description: 'Premium style with higher price (金色圆形 -15%)',
  },
];

/**
 * 运行所有测试
 */
async function runTests() {
  console.log('\n🎨 Testing Image Composition\n');
  console.log(`Test image: ${TEST_IMAGE_URL}\n`);

  let successCount = 0;
  let failCount = 0;

  for (const testCase of TEST_CASES) {
    console.log(`Testing: ${testCase.name}`);
    console.log(`  Template: ${testCase.template}`);
    console.log(`  Price: $${testCase.price}, Discount: ${testCase.discount || 'none'}`);
    console.log(`  ${testCase.description}`);

    try {
      // 合成图片
      const buffer = await composer.composeProductImageWithTemplate(
        TEST_IMAGE_URL,
        testCase.price,
        testCase.discount > 0 ? testCase.discount : null,
        {
          template: testCase.template,
          width: 1000,
          height: 1500,
          format: 'jpeg',
        }
      );

      // 保存到文件
      const outputPath = path.join(outputDir, `${testCase.name}.jpg`);
      fs.writeFileSync(outputPath, buffer);

      console.log(`  ✅ Success! (${(buffer.length / 1024).toFixed(1)}KB)\n`);
      successCount++;
    } catch (err) {
      console.log(`  ❌ Failed: ${err.message}\n`);
      failCount++;
    }
  }

  // 总结
  console.log('─'.repeat(50));
  console.log(`📊 Results: ${successCount} passed, ${failCount} failed`);
  console.log(`📁 Output: ${outputDir}`);
  console.log('\n💡 Tips:');
  console.log('  1. Check the generated JPG files in test-output/');
  console.log('  2. Each file shows a different template style');
  console.log('  3. Verify badge position, colors, and text');
  console.log('  4. Use these images to compare with your frontend\n');

  if (failCount === 0) {
    console.log('🎉 All tests passed!');
  }
}

// 运行
runTests().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
