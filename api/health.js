module.exports = async function handler(req, res) {
  res.json({
    status: 'healthy',
    service: 'PinFlow Backend',
    timestamp: new Date().toISOString()
  });
};
