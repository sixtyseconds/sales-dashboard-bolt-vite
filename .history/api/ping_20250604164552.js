// Ultra-simple ping endpoint for Vercel testing
export default function handler(req, res) {
  console.log('Ping endpoint called at:', new Date().toISOString());
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  res.status(200).json({ 
    ping: 'pong',
    time: new Date().toISOString(),
    method: req.method
  });
} 