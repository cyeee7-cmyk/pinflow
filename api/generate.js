module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url, postType = 'deal' } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    // 这里应该调用实际的生成逻辑
    // 现在返回示例数据
    const mockData = {
      success: true,
      product: {
        title: 'Sample Product',
        price: 99.99,
        originalPrice: 199.99,
        image: 'https://via.placeholder.com/300'
      },
      copies: [
        {
          title: '🔥 Amazing Deal - Save 50%',
          description: 'High-quality product at an unbeatable price',
          hashtags: '#deal #save #bestprice'
        },
        {
          title: '⚡ Limited Time Offer',
          description: 'Don\'t miss out on this incredible opportunity',
          hashtags: '#limited #offer #exclusive'
        },
        {
          title: '✨ Premium Quality',
          description: 'Top-rated product by thousands of customers',
          hashtags: '#quality #bestseller #recommended'
        }
      ]
    };

    res.json(mockData);
  } catch (error) {
    res.status(500).json({
      error: 'Generation failed',
      message: error.message
    });
  }
};
