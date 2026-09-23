const http = require('http');

const data = JSON.stringify({
  firstName: 'Anant',
  lastName: 'Tyagi',
  companyName: 'movinsync',
  email: 'tyagianant125@gmail.com',
  password: 'password'
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/auth/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, res => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log('Response:', res.statusCode, body));
});
req.on('error', console.error);
req.write(data);
req.end();
