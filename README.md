# StreamingApp

A MERN-based video streaming platform built using a microservice architecture and deployed on AWS EKS using Docker, Amazon ECR, Kubernetes, Helm, Jenkins, MongoDB, and NGINX Ingress.

The application provides user authentication, video catalogue and playback, administrator video management, and real-time chat for watch parties.

---

## Architecture

| Service | Port | Description |
|---|---:|---|
| authService | 3001 | User registration, login and JWT authentication |
| streamingService | 3002 | Video catalogue and S3-backed video streaming |
| adminService | 3003 | Administrator authentication and video management/upload |
| chatService | 3004 | REST and Socket.IO real-time chat |
| frontend | 80 | React SPA served through NGINX |
| mongo | 27017 | Persistent MongoDB database |

### AWS / Kubernetes Architecture

```text
Internet
   |
   v
AWS Load Balancer
   |
   v
NGINX Ingress
   |
   +--> frontend-svc --> Frontend
   +--> auth-svc --> authService
   +--> streaming-svc --> streamingService
   +--> admin-svc --> adminService
   +--> chat-svc --> chatService
                         |
                         v
                      MongoDB
                         |
                         v
                    AWS EBS / PVC
```

---

## Technology Stack

- React
- Node.js
- Express
- MongoDB
- Socket.IO
- Docker
- Kubernetes
- Helm
- Jenkins
- AWS ECR
- AWS EKS
- AWS EBS
- AWS S3
- NGINX Ingress

---

## Project Structure

```text
StreamingAppCICD/
├── backend/
│   ├── authService/
│   ├── streamingService/
│   ├── adminService/
│   ├── chatService/
│   └── common/
├── frontend/
├── streamingapp/
│   ├── Chart.yaml
│   ├── values.yaml
│   └── templates/
├── Jenkinsfile
└── README.md
```

---

# AWS Environment

## EKS

Cluster:

```text
streaming-eks
```

Region:

```text
ap-south-1
```

Namespace:

```text
streamingapp
```

## ECR

Registry:

```text
038501649978.dkr.ecr.ap-south-1.amazonaws.com
```

Images:

```text
streaming-frontend
streaming-auth
streaming-service
streaming-admin
streaming-chat
```

## S3

Video assets are stored using an AWS S3 bucket configured through Kubernetes configuration and secrets.

## EBS

MongoDB uses persistent Kubernetes storage backed by AWS EBS.

> Do not delete the MongoDB PVC during normal troubleshooting because it contains persistent application data.

---

# Prerequisites

Install:

- Git
- Docker
- AWS CLI
- kubectl
- Helm

AWS access is required for ECR, EKS, S3, and EBS-backed Kubernetes storage.

The Jenkins agent must also have Git, Docker, AWS CLI, and kubectl.

---

# Kubernetes Deployment

Create the namespace if required:

```bash
kubectl create namespace streamingapp
```

Validate the Helm chart:

```bash
helm lint ./streamingapp
```

Install:

```bash
helm install streamingapp ./streamingapp -n streamingapp
```

Upgrade an existing release:

```bash
helm upgrade streamingapp ./streamingapp -n streamingapp
```

Check Helm:

```bash
helm status streamingapp -n streamingapp
```

---

# Verify Kubernetes Resources

```bash
kubectl get pods -n streamingapp
kubectl get deployments -n streamingapp
kubectl get svc -n streamingapp
kubectl get ingress -n streamingapp
```

---

# MongoDB Persistence

MongoDB is deployed as a StatefulSet with a PersistentVolumeClaim.

```bash
kubectl get statefulset -n streamingapp
kubectl get pod mongo-0 -n streamingapp
kubectl get pvc -n streamingapp
```

MongoDB data is stored on an AWS EBS-backed persistent volume.

---

# Ingress

NGINX Ingress provides a single external entry point.

Routes:

```text
/                  -> frontend-svc
/api/auth          -> auth-svc
/api/streaming     -> streaming-svc
/api/admin         -> admin-svc
/api/chat          -> chat-svc
/socket.io         -> chat-svc
```

Check:

```bash
kubectl get ingress -n streamingapp
```

---

# Jenkins CI/CD

The Jenkins pipeline automates image creation, publishing, and EKS rollout.

Pipeline:

```text
Checkout
   |
Check Tools
   |
AWS Login
   |
Build Images
   |
Push Images
   |
Deploy to EKS
```

The pipeline:

1. Checks out the repository.
2. Verifies Git, Docker, AWS CLI and kubectl.
3. Authenticates to Amazon ECR.
4. Builds five Docker images.
5. Pushes the images to ECR.
6. Updates kubeconfig for the EKS cluster.
7. Restarts the frontend Deployment.
8. Waits for the frontend rollout to complete.

AWS credentials are configured in Jenkins and are not stored in source control.

---

# Frontend Configuration

The React frontend receives API endpoints during the Docker build using build arguments:

```text
REACT_APP_AUTH_API_URL
REACT_APP_STREAMING_API_URL
REACT_APP_STREAMING_PUBLIC_URL
REACT_APP_ADMIN_API_URL
REACT_APP_CHAT_API_URL
REACT_APP_CHAT_SOCKET_URL
```

The deployed frontend uses the NGINX Ingress Load Balancer as the common external API entry point.

---

# Kubernetes Scaling

The Streaming Deployment can be scaled horizontally.

Scale to four replicas:

```bash
kubectl scale deployment streaming --replicas=4 -n streamingapp
```

Verify:

```bash
kubectl get deployment streaming -n streamingapp
```

Expected:

```text
READY   UP-TO-DATE   AVAILABLE
4/4     4            4
```

Verify pods:

```bash
kubectl get pods -n streamingapp -l app=streaming
```

---

# Rolling Updates

Deployments use:

```yaml
strategy:
  type: RollingUpdate
  rollingUpdate:
    maxUnavailable: 0
    maxSurge: 1
```

Verify the live configuration:

```bash
kubectl get deployment streaming -n streamingapp -o jsonpath="{.spec.strategy.type}{'\n'}{.spec.strategy.rollingUpdate.maxUnavailable}{'\n'}{.spec.strategy.rollingUpdate.maxSurge}{'\n'}"
```

Expected:

```text
RollingUpdate
0
1
```

Perform a rollout:

```bash
kubectl rollout restart deployment/streaming -n streamingapp
```

Monitor:

```bash
kubectl rollout status deployment/streaming -n streamingapp
```

Expected:

```text
deployment "streaming" successfully rolled out
```

---

# Kubernetes Self-Healing

Kubernetes automatically recreates pods managed by a Deployment.

Check:

```bash
kubectl get pods -n streamingapp -l app=chat
```

Delete one pod:

```bash
kubectl delete pod <chat-pod-name> -n streamingapp
```

Verify:

```bash
kubectl get pods -n streamingapp -l app=chat
```

A replacement pod should reach:

```text
1/1 Running
```

---

# Application Smoke Tests

The deployed application has been verified for:

## Authentication

- User registration
- User login
- JWT authentication
- Authenticated API access

## Admin Upload

The admin dashboard supports video and thumbnail upload through the admin microservice.

API base path:

```text
/api/admin
```

## Video Catalogue and Playback

The Streaming service provides catalogue and playback APIs.

Example:

```text
/api/streaming/videos
```

Video playback uses S3-backed content and supports range requests.

## Chat REST API

Chat history:

```text
/api/chat/history/<videoId>
```

Unauthenticated requests return:

```text
401 Unauthorized
```

Authenticated requests return:

```text
200 OK
```

## Live Chat

Live chat uses Socket.IO.

Live messaging was verified using two browser tabs connected to the same video. Messages sent from one tab were received by the other without refreshing the page.

---

# Health Checks

Check all pods:

```bash
kubectl get pods -n streamingapp
```

Healthy pods should show:

```text
READY   STATUS
1/1     Running
```

The Chat service exposes:

```text
/api/health
```

Kubernetes liveness and readiness probes are configured for the application deployments.

---

# Environment Variables and Secrets

Sensitive configuration must not be committed to Git.

Runtime configuration is provided through Kubernetes ConfigMaps and Secrets.

Typical configuration includes:

```text
MONGO_DB
AWS_REGION
CLIENT_URLS
JWT_SECRET
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_S3_BUCKET
AWS_CDN_URL
STREAMING_PUBLIC_URL
```

For production, AWS IAM-based authentication should be preferred over static AWS credentials.

---

# Local Development

Install dependencies:

```bash
cd backend/authService
npm install

cd ../streamingService
npm install

cd ../adminService
npm install

cd ../chatService
npm install

cd ../../frontend
npm install
```

Run backend services in separate terminals after MongoDB is available:

```bash
cd backend/authService
npm run dev
```

```bash
cd backend/streamingService
npm run dev
```

```bash
cd backend/adminService
npm run dev
```

```bash
cd backend/chatService
npm run dev
```

Run the frontend:

```bash
cd frontend
npm start
```

---

# Docker Compose

For local containerized development:

```bash
docker-compose up --build
```

The local frontend is normally available at:

```text
http://localhost:3000
```

S3 credentials are required for S3-backed video upload and playback.

---

# Troubleshooting

Check pod logs:

```bash
kubectl logs <pod-name> -n streamingapp
```

Describe a pod:

```bash
kubectl describe pod <pod-name> -n streamingapp
```

Describe a deployment:

```bash
kubectl describe deployment <deployment-name> -n streamingapp
```

Describe a service:

```bash
kubectl describe svc <service-name> -n streamingapp
```

Describe ingress:

```bash
kubectl describe ingress -n streamingapp
```

Check recent events:

```bash
kubectl get events -n streamingapp --sort-by=.lastTimestamp
```

---

# Security Notes

For production:

- Do not commit AWS credentials to Git.
- Use Kubernetes Secrets or AWS IAM-based authentication.
- Use HTTPS/TLS for public traffic.
- Use a proper domain name.
- Rotate JWT secrets.
- Follow least-privilege IAM permissions.
- Consider Kubernetes NetworkPolicies.
- Store production secrets in AWS Secrets Manager or another dedicated secret-management solution.

---

# Production Improvements

For a production Kubernetes cluster, I would make several improvements to the current StreamingApp setup. I would use **separate namespaces** to isolate environments and application components, apply **TLS/HTTPS** on the Ingress to secure communication, and configure **Horizontal Pod Autoscaling (HPA)** so services can automatically scale based on CPU and memory utilization. I would also use a **proper secrets-management solution** instead of storing sensitive values directly in Kubernetes Secrets, apply **resource requests and limits** to each container, and configure **PodDisruptionBudgets** to maintain availability during node maintenance. For reliability, I would use multiple worker nodes across availability zones, enable **automated backups and disaster recovery** for MongoDB, and use persistent storage with appropriate backup policies. I would strengthen **RBAC and IAM permissions** using least privilege, enable network policies to restrict unnecessary service-to-service communication, and use **HTTPS and secure headers** for the application. Finally, I would improve observability with **CloudWatch monitoring, centralized logging, alerts, dashboards, and health checks**, and use CI/CD with automated testing, image scanning, versioned deployments, and rollback capabilities to ensure safe production releases.


Recommended improvements:

- HTTPS/TLS with a proper domain
- Horizontal Pod Autoscaler (HPA)
- Centralized logging
- Prometheus/Grafana monitoring
- MongoDB backup and disaster recovery
- Network policies
- Separate staging and production namespaces
- Versioned Docker image tags instead of relying only on `latest`
- Container image vulnerability scanning
- AWS IAM roles / EKS Pod Identity instead of static AWS credentials

---

# Assignment Verification Summary

| Requirement | Status |
|---|---|
| Five Dockerized application services | Completed |
| Amazon ECR image push | Completed |
| Kubernetes Deployments | Completed |
| Kubernetes Services | Completed |
| ConfigMap | Completed |
| Kubernetes Secrets | Completed |
| MongoDB StatefulSet | Completed |
| MongoDB persistent storage | Completed |
| Health probes | Completed |
| Helm chart | Completed |
| NGINX Ingress | Completed |
| Streaming scaled to 4 replicas | Verified |
| `maxUnavailable: 0` | Verified |
| `maxSurge: 1` | Verified |
| Rolling deployment | Verified |
| Kubernetes self-healing | Verified |
| User login/JWT | Verified |
| Admin upload | Verified |
| Video playback | Verified |
| Chat REST API | Verified |
| Live Socket.IO chat | Verified |
| Jenkins CI/CD | Verified |
| Automatic EKS frontend rollout | Verified |


Required ScreenShots have been uploaded **Assignment_Snapshots**



---

# License

MIT © StreamFlix Team
