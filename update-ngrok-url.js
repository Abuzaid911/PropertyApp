const fs = require('fs');
const path = require('path');
const http = require('http');

// Function to get the current ngrok URL
async function getNgrokUrl() {
  return new Promise((resolve, reject) => {
    // Try to get the ngrok URL from the API
    const options = {
      hostname: 'localhost',
      port: 4040,
      path: '/api/tunnels',
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const tunnels = JSON.parse(data).tunnels;
          // Find the secure tunnel
          const secureTunnel = tunnels.find(tunnel => tunnel.proto === 'https');
          
          if (secureTunnel) {
            resolve(secureTunnel.public_url);
          } else {
            reject(new Error('No secure ngrok tunnel found'));
          }
        } catch (error) {
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.end();
  });
}

// Function to update the .env file
async function updateEnvFile() {
  try {
    const ngrokUrl = await getNgrokUrl();
    console.log(`Found ngrok URL: ${ngrokUrl}`);
    
    // Prepare the new .env content
    const envContent = `NGROK_URL=${ngrokUrl}\n`;
    
    // Write to the .env file
    const envPath = path.join(__dirname, '.env');
    fs.writeFileSync(envPath, envContent);
    
    console.log(`Updated .env file with ngrok URL: ${ngrokUrl}`);
  } catch (error) {
    console.error('Error updating .env file:', error);
    process.exit(1);
  }
}

// Run the update
updateEnvFile(); 