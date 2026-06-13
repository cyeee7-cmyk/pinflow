/**
 * api/_lib/templates/content.js
 *
 * "Content Post" 模板 - 种草/生活场景化文案生成
 * 强调产品如何改善生活、场景化、情感连接
 */

function buildContentPrompt(product) {
  const bullets = product.bulletPoints.length > 0
    ? product.bulletPoints.slice(0, 3).map((b) => `• ${b}`).join('\n')
    : product.description || '';

  const pricePoint = product.currentPrice
    ? `at just $${product.currentPrice}`
    : 'and affordable';

  return `You are an expert Pinterest lifestyle content creator specializing in aspirational product recommendations.

Generate 3 lifestyle/content pins that position this product as a must-have for a better life. Focus on HOW it improves daily life, not just WHAT it is.

PRODUCT:
• ${product.title || 'Unknown'}
• Brand: ${product.brand || 'Unknown'}
• Price: $${product.currentPrice || 'varies'} ${product.discountPercent ? `(save ${product.discountPercent}%)` : ''}
• Benefits: ${bullets}

REQUIREMENTS:
Each copy needs:
1. Pin Title (40-60 chars): Paint a lifestyle scene or transformation
   Examples: "The [Product] I Can't Live Without 💖", "How [Product] Changed My [Area] Game", "Finally Found The [Feature] [Product] 🙌"
2. Pin Description (100-150 chars): Tell why YOUR audience needs this
   - Start with benefit/transformation
   - Mention who it's for (moms, students, home workers, etc)
   - End with soft CTA: "Grabbed mine + loving it" or "This changed everything"
3. Hashtags (5 tags): Lifestyle + aspirational + product-specific
   Mix: #LifestyleUpgrade #HomeMustHave #ProductName #WorthTheSplurge #GameChanger

TONE: Inspirational, relatable, personal. Less "deal language", more "life improvement". Focus on dreams, not discounts.

Respond ONLY with valid JSON, no markdown:
{
  "copies": [
    {
      "style": "lifestyle_transformation",
      "title": "🌟 [lifestyle scene]...",
      "description": "...",
      "hashtags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
    },
    {
      "style": "lifestyle_daily_essential",
      "title": "💫 Can't Imagine Life Without...",
      "description": "...",
      "hashtags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
    },
    {
      "style": "lifestyle_recommendation",
      "title": "✨ If You [Pain Point], Try This...",
      "description": "...",
      "hashtags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
    }
  ]
}`;
}

module.exports = { buildContentPrompt };
