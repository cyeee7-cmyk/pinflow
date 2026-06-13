module.exports = async function handler(req, res) {
  const { format = 'csv', type = 'csv' } = req.query;
  const { url, data } = req.body || {};

  try {
    if (type === 'csv') {
      // 返回 CSV 数据
      const csv = 'Product Title,Price,Description,Link\n' +
                  'Sample Product,99.99,High quality product,https://amazon.com/dp/xxx';
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="export.csv"');
      res.send(csv);
    } else if (type === 'json') {
      res.json({
        format: format,
        data: {
          product: 'Sample Product',
          price: 99.99,
          copies: []
        }
      });
    }
  } catch (error) {
    res.status(500).json({
      error: 'Export failed',
      message: error.message
    });
  }
};
