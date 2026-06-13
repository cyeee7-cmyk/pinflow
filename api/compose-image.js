module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text, imageUrl, template = 'deal' } = req.body;

  if (!text || !imageUrl) {
    return res.status(400).json({ error: 'Text and imageUrl are required' });
  }

  try {
    // 这里应该调用 image-composer-v2.js 的逻辑
    // 现在返回示例图片 URL
    res.json({
      success: true,
      composedImageUrl: imageUrl,
      template: template,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Image composition failed',
      message: error.message
    });
  }
};
