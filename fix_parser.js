function parseLogon(s) {
    s.on('upload', function (data, flags) {
        if (data.length > 0) {
            var str = data.toString();
            var match = str.match(/49=([^\x01]+)/);

            // Use s.ctx for connection-scoped state
            s.ctx = s.ctx || {};

            if (match) {
                var sender = match[1];
                s.log("Found SenderCompID: " + sender);
                if (sender === "CLIENT_A") {
                    s.ctx.backend = "shard_A";
                } else if (sender === "CLIENT_B") {
                    s.ctx.backend = "shard_B";
                } else {
                    s.ctx.backend = "fix_nodes";
                }
            }
            s.done(); // Proceed to proxy_pass
        }
    });
}

function getBackend(s) {
    return (s.ctx && s.ctx.backend) ? s.ctx.backend : "fix_nodes";
}

export default { parseLogon, getBackend };
