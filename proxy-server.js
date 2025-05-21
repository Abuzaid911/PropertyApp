const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();
const port = process.env.PORT || 4000;

// Auth server routes
app.get('/auth/callback', (req, res) => {
  console.log('Received callback from UAE Pass');
  console.log('Query params:', req.query);
  
  const { code, state } = req.query;
  
  if (!code || !state) {
    return res.status(400).send('Missing required parameters');
  }
  
  // Construct the deep link URL to redirect back to the app
  const redirectUrl = `propertymanagement://callback?code=${code}&state=${state}`;
  
  // Return an HTML page with a button to redirect back to the app
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Redirecting to Property Management App</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          text-align: center;
          padding: 40px 20px;
          background-color: #f5f5f5;
        }
        .container {
          max-width: 500px;
          margin: 0 auto;
          background-color: white;
          border-radius: 10px;
          padding: 30px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        h1 {
          color: #333;
          font-size: 24px;
          margin-bottom: 20px;
        }
        p {
          color: #666;
          margin-bottom: 30px;
          line-height: 1.5;
        }
        .button {
          display: inline-block;
          background-color: #4CAF50;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 5px;
          font-weight: bold;
          cursor: pointer;
          border: none;
          font-size: 16px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Authentication Successful</h1>
        <p>You have successfully authenticated with UAE Pass. Click the button below to return to the Property Management App.</p>
        <a href="${redirectUrl}" class="button">Back to App</a>
      </div>
      <script>
        // Auto-redirect after a short delay
        setTimeout(() => {
          window.location.href = "${redirectUrl}";
        }, 1500);
      </script>
    </body>
    </html>
  `);
});

// Proxy all other requests to the Expo server
app.use('/', createProxyMiddleware({
  target: 'http://localhost:8081',
  changeOrigin: true,
  ws: true,
  logLevel: 'debug'
}));

// Start the server
app.listen(port, () => {
  console.log(`Proxy server running at http://localhost:${port}`);
}); 