const http = require('http');

const port = process.env.PORT || 3000;
const nodeId = process.env.NODE_ID || process.env.HOSTNAME || 'unknown';

const server = http.createServer((req, res) => {
    console.log(`Received request on Node ${nodeId}`);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.end(`Hello from Node ${nodeId}\n`);
});

server.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${port}/ on Node ${nodeId}`);
});
