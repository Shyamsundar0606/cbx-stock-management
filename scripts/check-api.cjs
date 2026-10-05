const http = require('node:http');

const request = http.get('http://127.0.0.1:3000/api/health', (response) => {
  let body = '';
  response.on('data', (chunk) => {
    body += chunk;
  });
  response.on('end', () => {
    try {
      const health = JSON.parse(body);
      process.exit(health.status === 'ok' ? 0 : 2);
    } catch {
      process.exit(2);
    }
  });
});

request.on('error', () => process.exit(1));
request.setTimeout(700, () => {
  request.destroy();
  process.exit(1);
});
