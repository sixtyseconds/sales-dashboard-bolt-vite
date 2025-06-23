module.exports = (req, res) => {
  res.json({ message: 'basic test', timestamp: new Date().toISOString() });
}; 