var backend = "fix_nodes";

function parseLogon(s) {
    s.on('upload', function (data, flags) {
        if (data.length > 0) {
            var str = data.toString();
            var match = str.match(/49=([^\x01]+)/);
            if (match) {
                var sender = match[1];
                s.log("Found SenderCompID: " + sender);
                if (sender === "CLIENT_A") {
                    backend = "shard_A";
                } else if (sender === "CLIENT_B") {
                    backend = "shard_B";
                } else {
                    backend = "fix_nodes";
                }
            }
            s.done(); // Proceed to proxy_pass
        }
    });
}

function getBackend(s) {
    return backend;
}

export default { parseLogon, getBackend };
