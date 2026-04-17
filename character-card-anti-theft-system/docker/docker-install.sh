#!/bin/bash

# SillyTavern 角色卡防盗系统 - Docker 一键安装脚本 (Linux/macOS)
# 此脚本将自动安装 Docker、配置环境变量并启动所有服务

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 打印标题
print_header() {
    echo ""
    echo -e "${BLUE}================================================${NC}"
    echo -e "${BLUE}  SillyTavern 角色卡防盗系统 - Docker 安装${NC}"
    echo -e "${BLUE}================================================${NC}"
    echo ""
}

# 检查是否为 root 用户
check_root() {
    if [ "$EUID" -eq 0 ]; then
        print_warning "检测到以 root 用户运行，建议使用普通用户运行此脚本"
        read -p "是否继续？(y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

# 检测操作系统
detect_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        OS="linux"
        if [ -f /etc/os-release ]; then
            . /etc/os-release
            DISTRO=$ID
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
        DISTRO="macos"
    else
        print_error "不支持的操作系统: $OSTYPE"
        exit 1
    fi
    print_info "检测到操作系统: $OS ($DISTRO)"
}

# 检查 Docker 是否已安装
check_docker() {
    if command -v docker &> /dev/null; then
        DOCKER_VERSION=$(docker --version | cut -d ' ' -f3 | cut -d ',' -f1)
        print_success "Docker 已安装 (版本: $DOCKER_VERSION)"
        return 0
    else
        print_warning "Docker 未安装"
        return 1
    fi
}

# 检查 Docker Compose 是否已安装
check_docker_compose() {
    if docker compose version &> /dev/null; then
        COMPOSE_VERSION=$(docker compose version | cut -d ' ' -f4)
        print_success "Docker Compose 已安装 (版本: $COMPOSE_VERSION)"
        return 0
    elif command -v docker-compose &> /dev/null; then
        COMPOSE_VERSION=$(docker-compose --version | cut -d ' ' -f4 | cut -d ',' -f1)
        print_success "Docker Compose 已安装 (版本: $COMPOSE_VERSION)"
        return 0
    else
        print_warning "Docker Compose 未安装"
        return 1
    fi
}

# 安装 Docker (Linux)
install_docker_linux() {
    print_info "开始安装 Docker..."
    
    case $DISTRO in
        ubuntu|debian)
            sudo apt-get update
            sudo apt-get install -y ca-certificates curl gnupg
            sudo install -m 0755 -d /etc/apt/keyrings
            curl -fsSL https://download.docker.com/linux/$DISTRO/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
            sudo chmod a+r /etc/apt/keyrings/docker.gpg
            echo \
              "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/$DISTRO \
              $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
              sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
            sudo apt-get update
            sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
            ;;
        centos|rhel|fedora)
            sudo yum install -y yum-utils
            sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
            sudo yum install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
            sudo systemctl start docker
            sudo systemctl enable docker
            ;;
        *)
            print_error "不支持的 Linux 发行版: $DISTRO"
            print_info "请手动安装 Docker: https://docs.docker.com/engine/install/"
            exit 1
            ;;
    esac
    
    # 将当前用户添加到 docker 组
    if [ "$EUID" -ne 0 ]; then
        sudo usermod -aG docker $USER
        print_warning "已将用户 $USER 添加到 docker 组"
        print_warning "请注销并重新登录，或运行: newgrp docker"
    fi
    
    print_success "Docker 安装完成"
}

# 安装 Docker (macOS)
install_docker_macos() {
    print_info "macOS 系统需要安装 Docker Desktop"
    print_info "请访问: https://www.docker.com/products/docker-desktop"
    print_info "下载并安装 Docker Desktop for Mac"
    echo ""
    read -p "安装完成后按 Enter 继续..." -r
    
    if ! check_docker; then
        print_error "Docker 安装失败或未启动"
        exit 1
    fi
}

# 生成随机密码
generate_password() {
    local length=${1:-32}
    openssl rand -base64 $length | tr -d "=+/" | cut -c1-$length
}

# 生成 JWT Secret
generate_jwt_secret() {
    openssl rand -hex 64
}

# 交互式配置收集
collect_configuration() {
    print_info "开始配置收集..."
    echo ""
    
    # 数据库 root 密码
    read -p "请输入 MySQL root 密码 (留空自动生成): " DB_ROOT_PASSWORD
    if [ -z "$DB_ROOT_PASSWORD" ]; then
        DB_ROOT_PASSWORD=$(generate_password 24)
        print_info "已自动生成 MySQL root 密码"
    fi
    
    # 数据库用户密码
    read -p "请输入数据库用户密码 (留空自动生成): " DB_PASSWORD
    if [ -z "$DB_PASSWORD" ]; then
        DB_PASSWORD=$(generate_password 24)
        print_info "已自动生成数据库用户密码"
    fi
    
    # JWT Secret
    read -p "请输入 JWT Secret (留空自动生成): " JWT_SECRET
    if [ -z "$JWT_SECRET" ]; then
        JWT_SECRET=$(generate_jwt_secret)
        print_info "已自动生成 JWT Secret"
    fi
    
    # API 基础 URL
    read -p "请输入 API 基础 URL (默认: http://localhost:3000): " API_BASE_URL
    API_BASE_URL=${API_BASE_URL:-http://localhost:3000}
    
    # CORS 来源
    read -p "请输入 CORS 允许的来源 (默认: http://localhost,http://localhost:80): " CORS_ORIGINS
    CORS_ORIGINS=${CORS_ORIGINS:-http://localhost,http://localhost:80,http://127.0.0.1}
    
    # 数据库配置
    DB_NAME="character_card_anti_theft"
    DB_USER="anti_theft_user"
    
    print_success "配置收集完成"
}

# 生成 .env 文件
generate_env_file() {
    print_info "生成 .env 文件..."
    
    cat > .env << EOF
# Docker Compose 环境变量配置
# 由 docker-install.sh 自动生成于 $(date)

# 数据库配置
DB_ROOT_PASSWORD=$DB_ROOT_PASSWORD
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD

# JWT 配置
JWT_SECRET=$JWT_SECRET

# API 基础 URL
API_BASE_URL=$API_BASE_URL

# CORS 允许的来源
CORS_ORIGINS=$CORS_ORIGINS
EOF
    
    chmod 600 .env
    print_success ".env 文件已生成"
}

# 启动 Docker Compose
start_docker_compose() {
    print_info "启动 Docker Compose 服务..."
    
    docker compose up -d
    
    print_success "Docker Compose 服务已启动"
}

# 等待服务就绪
wait_for_services() {
    print_info "等待服务启动..."
    
    local max_attempts=60
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if docker compose ps | grep -q "healthy"; then
            print_success "服务已就绪"
            return 0
        fi
        attempt=$((attempt + 1))
        echo -n "."
        sleep 2
    done
    
    print_warning "服务启动超时，请检查日志"
    return 1
}

# 健康检查
health_check() {
    print_info "执行健康检查..."
    
    # 检查数据库
    if docker compose exec -T db mysqladmin ping -h localhost -u root -p$DB_ROOT_PASSWORD &> /dev/null; then
        print_success "✓ 数据库连接正常"
    else
        print_error "✗ 数据库连接失败"
        return 1
    fi
    
    # 检查 API 服务
    sleep 5
    if curl -f http://localhost:3000/health &> /dev/null; then
        print_success "✓ API 服务正常"
    else
        print_error "✗ API 服务异常"
        return 1
    fi
    
    # 检查 Web 服务
    if curl -f http://localhost/ &> /dev/null; then
        print_success "✓ Web 服务正常"
    else
        print_error "✗ Web 服务异常"
        return 1
    fi
    
    print_success "所有服务健康检查通过"
    return 0
}

# 显示访问信息
show_access_info() {
    echo ""
    echo -e "${GREEN}================================================${NC}"
    echo -e "${GREEN}  安装完成！${NC}"
    echo -e "${GREEN}================================================${NC}"
    echo ""
    echo -e "${BLUE}访问信息：${NC}"
    echo -e "  Web 管理界面: ${GREEN}http://localhost${NC}"
    echo -e "  API 服务器:   ${GREEN}http://localhost:3000${NC}"
    echo ""
    echo -e "${BLUE}数据库信息：${NC}"
    echo -e "  主机: localhost:3306"
    echo -e "  数据库: $DB_NAME"
    echo -e "  用户: $DB_USER"
    echo -e "  密码: $DB_PASSWORD"
    echo ""
    echo -e "${BLUE}常用命令：${NC}"
    echo -e "  查看服务状态: ${YELLOW}docker compose ps${NC}"
    echo -e "  查看日志:     ${YELLOW}docker compose logs -f${NC}"
    echo -e "  停止服务:     ${YELLOW}docker compose stop${NC}"
    echo -e "  启动服务:     ${YELLOW}docker compose start${NC}"
    echo -e "  重启服务:     ${YELLOW}docker compose restart${NC}"
    echo -e "  卸载服务:     ${YELLOW}./docker-uninstall.sh${NC}"
    echo ""
    echo -e "${YELLOW}重要提示：${NC}"
    echo -e "  - 请妥善保管 .env 文件中的密码信息"
    echo -e "  - 生产环境请修改默认密码并启用 HTTPS"
    echo ""
}

# 主函数
main() {
    print_header
    
    # 检查 root
    check_root
    
    # 检测操作系统
    detect_os
    
    # 检查并安装 Docker
    if ! check_docker; then
        read -p "是否安装 Docker？(y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            if [ "$OS" == "linux" ]; then
                install_docker_linux
            elif [ "$OS" == "macos" ]; then
                install_docker_macos
            fi
        else
            print_error "Docker 是必需的，安装已取消"
            exit 1
        fi
    fi
    
    # 检查 Docker Compose
    if ! check_docker_compose; then
        print_error "Docker Compose 未安装，请先安装 Docker Compose"
        exit 1
    fi
    
    # 收集配置
    collect_configuration
    
    # 生成 .env 文件
    generate_env_file
    
    # 启动服务
    start_docker_compose
    
    # 等待服务就绪
    wait_for_services
    
    # 健康检查
    if health_check; then
        show_access_info
    else
        print_error "健康检查失败，请查看日志: docker compose logs"
        exit 1
    fi
}

# 运行主函数
main
