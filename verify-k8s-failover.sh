#!/bin/bash

# Configuration
FIX_PORT=9876
SERVICE_NAME="nginx-service"
CLIENT_ID="CLIENT_A" # Routes to shard_A (node-backend-0 primary, node-backend-1 backup)
LOGON_MSG="8=FIX.4.2\x019=12\x0135=A\x0149=${CLIENT_ID}\x0156=SERVER\x01"

echo "=== Starting K8s FIX Failover Verification ==="

# 1. Start Port Forwarding if not running
if ! pgrep -f "port-forward service/${SERVICE_NAME} ${FIX_PORT}" > /dev/null; then
    echo "Starting port-forwarding for ${SERVICE_NAME} on port ${FIX_PORT}..."
    kubectl port-forward "service/${SERVICE_NAME}" ${FIX_PORT}:${FIX_PORT} &
    PF_PID=$!
    sleep 5
else
    echo "Port-forwarding is already running."
fi

function cleanup {
    if [ ! -z "$PF_PID" ]; then
        echo "Stopping port-forwarding..."
        kill $PF_PID
    fi
}
trap cleanup EXIT

function send_fix {
    echo -e "$LOGON_MSG" | nc -w 1 localhost $FIX_PORT
}

echo "--- Step 1: Testing Primary Node (node-backend-0) ---"
echo "Sending FIX Logon for ${CLIENT_ID}..."
send_fix
sleep 2
echo "Logs from node-backend-0:"
kubectl logs node-backend-0 --tail=10 | grep "Received FIX message" || echo "No logs found on pod 0"

echo ""
echo "--- Step 2: Simulating Failure (Deleting node-backend-0) ---"
echo "Deleting pod node-backend-0..."
kubectl delete pod node-backend-0 --now
echo "Waiting for Nginx to detect failure and DNS to propagate (10s)..."
sleep 10

echo ""
echo "--- Step 3: Testing Failover to Backup (node-backend-1) ---"
echo "Sending FIX Logon for ${CLIENT_ID}..."
send_fix
sleep 2
echo "Logs from node-backend-1:"
kubectl logs node-backend-1 --tail=10 | grep "Received FIX message" || echo "No logs found on pod 1"

echo ""
echo "--- Step 4: Verification Complete ---"
echo "Shard A traffic should have migrated from node-backend-0 to node-backend-1."
echo "Note: Automatic failback to the primary node may require an Nginx restart or a DNS cache expiration (configured to 5s)."
