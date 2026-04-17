# 配置文件目录

此目录用于存放应用程序的配置文件。

## 说明

配置文件通过环境变量进行管理，请参考项目根目录的 `.env.example` 文件。

## 配置文件类型

- **数据库配置**：通过环境变量 `DB_*` 配置
- **服务器配置**：通过环境变量 `PORT`、`NODE_ENV` 等配置
- **JWT 配置**：通过环境变量 `JWT_SECRET` 配置

## 使用方法

1. 复制 `.env.example` 为 `.env`
2. 根据实际情况修改环境变量
3. 重启服务器使配置生效

详细配置说明请参考 [ENVIRONMENT_VARIABLES.md](../docs/ENVIRONMENT_VARIABLES.md)
