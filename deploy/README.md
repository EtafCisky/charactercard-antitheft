# 部署配置目录

此目录用于存放部署相关的配置文件和脚本。

## 内容说明

此目录可以包含：

- **Docker Compose 配置**：用于容器化部署
- **Kubernetes 配置**：用于 K8s 集群部署
- **Nginx 配置**：反向代理配置示例
- **部署脚本**：自动化部署脚本

## 部署方式

项目支持多种部署方式：

### 1. Docker 部署

```bash
docker build -t anti-theft-server .
docker run -p 3000:3000 --env-file .env anti-theft-server
```

### 2. 传统部署

```bash
npm install --production
npm start
```

### 3. PM2 部署

```bash
npm install -g pm2
pm2 start src/server.js --name anti-theft-server
```

详细部署说明请参考 [DEPLOYMENT.md](../docs/DEPLOYMENT.md)
