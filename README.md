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
You can test the load balancer using `curl` or your browser:

**Using curl:**
```bash
for i in {1..6}; do curl http://localhost:9999; done
```
*Note: If you are using a shell that doesn't support the above syntax, run `curl http://localhost:9999` manually multiple times.*

**Expected Output:**
```
Hello from Node 1
Hello from Node 2
Hello from Node 3
...
```

### 4. Stop the Environment
To stop and remove the containers:
```bash
docker-compose down
```

- `docker-compose.yml`: Docker orchestration file.
- `Dockerfile`: Image definition for the Node.js app.
- `k8s/`: Kubernetes manifests.

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

### 3. Verify
Watch the pods until they are running:
```bash
kubectl get pods
```

Access the load balancer. If using `minikube`:
```bash
minikube service nginx-service
```
Or use port-forwarding:
```bash
kubectl port-forward service/nginx-service 8888:80
```
Then test with:
```bash
for i in {1..6}; do curl http://localhost:8888; done
```

### 4. Cleanup
```bash
kubectl delete -f k8s/
```
