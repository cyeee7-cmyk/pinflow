/**
 * api/_lib/templates/deal.js
 *
 * "Deal Post" 模板 - 强调价格/折扣的文案生成
 * 适用于有折扣、价格对比的商品
 */

function buildDealPrompt(product) {
  const priceInfo = product.currentPrice
    ? `$${product.currentPrice}${product.originalPrice ? ` (was $${product.originalPrice})` : ''}`
    : 'price varies';

  const discountTag = product.discountPercent
    ? `🔥 ${product.discountPercent}% OFF`
    : '💰 DEAL';

  const bullets = product.bulletPoints.length > 0
    ? product.bulletPoints.slice(0, 3).map((b) => `• ${b}`).join('\n')
    : product.description || '';

  return `You are an expert Pinterest deal curator specializing in high-converting product pins.

Generate 3 deal-focused pin copies that highlight VALUE and URGENCY. Use deal language that gets clicks on Pinterest.

PRODUCT:
• ${product.title || 'Unknown'}
• Brand: ${product.brand || 'Unknown'}
• Price: ${priceInfo}
• ${discountTag}
• Key Features: ${bullets}

REQUIREMENTS:
Each copy needs:
1. Pin Title (40-60 chars): Must include price, "SAVE", deal language, emoji
   Examples: "💰 Save $X on [Product] - Deal Alert!", "🔥 [Product] FINALLY on Sale - $X"
2. Pin Description (100-150 chars): Create FOMO, highlight savings, call to action
   End with: "Link in bio ⬇️" or "Shop the deal 🛍️"
3. Hashtags (5 tags): Mix of #ProductName #PriceDeals #BudgetFriendly #SaveMoney #[Category]

TONE: Urgent, excited, deal-focused. Use caps for emphasis. Emojis = clicks.

Respond ONLY with valid JSON, no markdown:
{
  "copies": [
    {
      "style": "deal_discount",
      "title": "🔥 [title] ...",
      "description": "...",
      "hashtags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
    },
    {
      "style": "deal_limited",
      "title": "⏰ Limited Time...",
      "description": "...",
      "hashtags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
    },
    {
      "style": "deal_comparison",
      "title": "💰 [Price comparison]...",
      "description": "...",
      "hashtags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
    }
  ]
}`;
}

module.exports = { buildDealPrompt };
