const net = require('net');

const port = process.env.FIX_PORT || 9876;
const nodeId = process.env.NODE_ID || process.env.HOSTNAME || 'unknown';

const server = net.createServer((socket) => {
    console.log(`[Node ${nodeId}] New TCP connection established`);

    socket.on('data', (data) => {
        const message = data.toString().replace(/\x01/g, '|');
        console.log(`[Node ${nodeId}] Received FIX message: ${message}`);

        // Simple acknowledgment
        socket.write(`8=FIX.4.2\x019=50\x0135=0\x0149=NODE_${nodeId}\x0156=CLIENT\x0110=123\x01`);
    });

    socket.on('end', () => {
        console.log(`[Node ${nodeId}] Connection closed`);
    });

    socket.on('error', (err) => {
        console.error(`[Node ${nodeId}] Socket error: ${err.message}`);
    });
});

server.listen(port, '0.0.0.0', () => {
    console.log(`FIX Server running at 0.0.0.0:${port} on Node ${nodeId}`);
});
