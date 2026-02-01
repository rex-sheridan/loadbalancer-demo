# Nginx Load Balancer Demo

This project demonstrates a simple Nginx load balancer forwarding traffic to three Node.js backend nodes using a round-robin strategy.

## Architecture

- **Nginx**: Serves as the load balancer on port `9999`.
- **Node.js Nodes**: Three identical services (`node1`, `node2`, `node3`) responding with their specific `NODE_ID`.

## Execution Steps

### 1. Prerequisites
Ensure you have Docker and Docker Compose installed.

### 2. Start the Environment
Run the following command in the project root:
```bash
docker-compose up -d
```

### 3. Verify Load Balancing

#### A. Round-Robin / Sticky Sessions (Default)
By default, the load balancer is configured with `ip_hash`, meaning requests from the same IP hit the same node.
```bash
for i in {1..6}; do curl http://localhost:9999; done
```

#### B. Shard Pinning (HTTP Headers)
You can pin a request to a specific node using the `X-Shard-ID` header.
- `1` -> Node 1
- `2` -> Node 2
- `3` -> Node 3
```bash
curl -H "X-Shard-ID: 1" http://localhost:9999
curl -H "X-Shard-ID: 2" http://localhost:9999
```

#### C. FIX-Aware Load Balancing (TCP)
The load balancer inspects Tag 49 (`SenderCompID`) in the FIX Logon message to route TCP traffic on port `9876`.
- `CLIENT_A` -> Node 1 (Shard A)
- `CLIENT_B` -> Node 2 (Shard B)

**Testing with Netcat:**
```bash
# Connect as CLIENT_A
echo -e "8=FIX.4.2\x019=12\x0135=A\x0149=CLIENT_A\x0156=SERVER\x01" | nc localhost 9876

# Connect as CLIENT_B
echo -e "8=FIX.4.2\x019=12\x0135=A\x0149=CLIENT_B\x0156=SERVER\x01" | nc localhost 9876
```
Check the node logs to verify: `docker-compose logs node1 node2`

#### D. High Availability / Failover (FIX)
Each FIX shard has a primary and a backup node:
- **Shard A**: `node1` (Primary), `node2` (Backup)
- **Shard B**: `node2` (Primary), `node3` (Backup)

**Testing Failover:**
1. Send a request for `CLIENT_A`:
   ```bash
   echo -e "8...49=CLIENT_A..." | nc localhost 9876 # Hits Node 1
   ```
2. Stop Node 1:
   ```bash
   docker-compose stop node1
   ```
3. Send the request again:
   ```bash
   echo -e "8...49=CLIENT_A..." | nc localhost 9876 # Hits Node 2 (Backup)
   ```
4. Restart Node 1 to test failback:
   ```bash
   docker-compose start node1
   ```

### 4. Stop the Environment
To stop and remove the containers:
```bash
docker-compose down
```

## Project Structure

- `app.js`: Node.js server (HTTP).
- `fix-server.js`: Node.js server (FIX simulator).
- `fix_parser.js`: Nginx JavaScript (njs) for FIX tag parsing.
- `nginx.conf`: Load balancer configuration.
- `docker-compose.yml`: Docker orchestration.
- `Dockerfile`: Image definition.
- `k8s/`: Kubernetes manifests (StatefulSet, ConfigMap, Services).

---

## Kubernetes Execution Steps

### 1. Build the Image
If using `minikube`, point your shell to the minikube docker daemon:
```bash
eval $(minikube docker-env)
```
Build the image:
```bash
docker build -t loadbalancer-node:latest .
```

### 2. Apply Manifests
Deploy the nodes and the load balancer:
```bash
kubectl apply -f k8s/
```

> [!IMPORTANT]
> If you get an error like `spec.clusterIPs[0]: Invalid value: ["None"]: may not change once set`, it's because the service is being converted to a Headless Service. Delete it first: `kubectl delete service node-service` then re-apply.

### 3. Verify

#### A. HTTP Load Balancing
```bash
kubectl port-forward service/nginx-service 8888:80
curl http://localhost:8888
```

#### B. FIX Load Balancing
```bash
kubectl port-forward service/nginx-service 9876:9876
echo -e "8=FIX.4.2\x019=12\x0135=A\x0149=CLIENT_A\x0156=SERVER\x01" | nc localhost 9876
```

#### C. Automated Failover Test
A script is provided to automate the primary/backup failover check:
```bash
./verify-k8s-failover.sh
```
This script will:
1. Send a Logon for `CLIENT_A` (hits `node-backend-0`).
2. Delete pod `node-backend-0`.
3. Send a Logon again (hits `node-backend-1` as backup).

### 4. Cleanup
```bash
kubectl delete -f k8s/
```
