# ServiceHub

ServiceHub is a full-stack web application, built as an npm workspaces monorepo. This repository also contains everything needed to run it in containers: Dockerfiles, Kubernetes manifests and a GitHub Actions CI/CD pipeline.

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | Static build served by Nginx |
| Backend | Node.js / TypeScript REST API (NestJS), Sequelize ORM |
| Database | MySQL 8.4 |
| Cache / job queues | Redis 7 (BullMQ) |
| Containers | Docker (multi-stage frontend image, non-root backend image) |
| Orchestration | Kubernetes (StatefulSet, Deployments, Services, Ingress) |
| CI/CD | GitHub Actions, images pushed to Docker Hub |

## Architecture

```
                 servicehub.local
                        |
                  [ Ingress (nginx) ]
                  /                 \
            /api                      /
              |                       |
        [ backend :3000 ]       [ frontend :80 ]
          |          |
   [ mysql :3306 ] [ redis :6379 ]
   (StatefulSet + PVC)
```

Everything runs in a dedicated Kubernetes namespace called `servicehub`. Only the Ingress is reachable from outside; all Services are `ClusterIP`.

## Repository structure

```
.
├── docker/                  # backend.Dockerfile, frontend.Dockerfile, frontend.nginx.conf
├── k8s/                     # Kubernetes manifests, numbered in apply order
│   ├── 00-namespace.yaml
│   ├── 10-13  MySQL         # ConfigMap, Secret, StatefulSet, headless Service
│   ├── 20-22  Redis         # Secret, Deployment, Service
│   ├── 30-33  Backend       # ConfigMap, Secret, Deployment, Service
│   ├── 40-41  Frontend      # Deployment, Service
│   └── 50-ingress.yaml
├── packages/
│   ├── backend/
│   ├── frontend/
│   └── models/              # Sequelize models and migrations
└── .github/workflows/ci-cd.yml
```

## Docker images

Both images are built from the repository root (the project is a monorepo):

```bash
docker build -f docker/backend.Dockerfile  -t servicehub-backend  .
docker build -f docker/frontend.Dockerfile -t servicehub-frontend .
```

- **Frontend:** multi-stage build. The first stage (`node:22-alpine`) builds the production bundle, the second (`nginx:alpine`) serves the static files and proxies `/api/` to the backend.
- **Backend:** `node:22-alpine`, runs as the unprivileged `node` user with `NODE_ENV=production`.

## Deploying to Kubernetes

### Prerequisites

- Docker
- `kubectl`
- A local cluster (kind or Minikube) with the [ingress-nginx](https://kubernetes.github.io/ingress-nginx/deploy/) controller installed

### Steps

1. **Apply the manifests** (the numeric prefixes give the correct order):

   ```bash
   kubectl apply -f k8s/
   kubectl get pods -n servicehub -w
   ```

   Wait until `mysql-0`, `redis`, `backend` and `frontend` are all `1/1 Running`.

2. **Create the database tables.** MySQL starts with an empty `servicehub` database, so run the Sequelize migrations once, inside the backend pod:

   ```bash
   kubectl exec -it deployment/backend -n servicehub -- sh
   cd /app/packages/models
   npx sequelize-cli db:migrate --env development
   exit
   ```

3. **Add the host name** to your hosts file, pointing to the Ingress IP (see `kubectl get ingress -n servicehub`; with kind and a port mapping this is usually `127.0.0.1`):

   ```
   <INGRESS-IP>  servicehub.local
   ```

   - Linux/macOS: `/etc/hosts`
   - Windows: `C:\Windows\System32\drivers\etc\hosts`

4. **Open** <http://servicehub.local>.

### Routing

| Path | Target |
|------|--------|
| `/api/*` | `backend` Service (port 3000) |
| `/*` | `frontend` Service (port 80) |

## Configuration

Non-sensitive settings live in ConfigMaps (`10-mysql-configmap.yaml`, `30-backend-configmap.yaml`); credentials live in Secrets (`11`, `20`, `31`).

> **Note:** the Secrets in this repository contain **demo placeholder values** (`changeme-...`) for local use only. Kubernetes Secrets are base64-encoded, not encrypted. In a real deployment they would come from Sealed Secrets, SOPS or a cloud secret manager and would never be committed to git.

Values that must match across files:

- `DB_USERNAME` / `DB_PASSWORD` (`31-backend-secret.yaml`) must equal `MYSQL_USER` / `MYSQL_PASSWORD` (`11-mysql-secret.yaml`).
- `REDIS_PASSWORD` in `31-backend-secret.yaml` must equal the one in `20-redis-secret.yaml`.

## CI/CD

The pipeline is defined in `.github/workflows/ci-cd.yml` and runs on every push and pull request to `master`. It has two jobs, one per image:

- `build-and-push-backend`
- `build-and-push-frontend`

On pull requests the images are only built (to verify the Dockerfiles); on pushes to `master` they are also pushed to Docker Hub, tagged `:latest` and with the commit SHA. Build layers are cached with the GitHub Actions cache.

Required repository secrets (**Settings → Secrets and variables → Actions**):

| Secret | Description |
|--------|-------------|
| `DOCKERHUB_USERNAME` | Docker Hub username |
| `DOCKERHUB_TOKEN` | Docker Hub access token |

To deploy a specific version, update the image tag on the deployments:

```bash
kubectl -n servicehub set image deployment/backend  backend=<username>/servicehub-backend:<commit-sha>
kubectl -n servicehub set image deployment/frontend frontend=<username>/servicehub-frontend:<commit-sha>
```

If you fork this repository, replace the Docker Hub username in `k8s/32-backend-deployment.yaml` and `k8s/40-frontend-deployment.yaml`.


## Cleanup

```bash
kubectl delete namespace servicehub
```
