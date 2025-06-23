// Ultra-simple ping endpoint for Vercel testing
module.exports = (req, res) => {
  res.status(200).json({ 
    ping: 'pong',
    time: new Date().toISOString()
  });
}; 