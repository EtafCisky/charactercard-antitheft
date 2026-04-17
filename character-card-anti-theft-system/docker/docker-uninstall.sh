#!/bin/bash

# SillyTavern 角色卡防盗系统 - Docker 卸载脚本 (Linux/macOS)
# 此脚本将停止并删除所有 Docker 容器、镜像、数据卷和网络

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
    echo -e "${RED}================================================${NC}"
    echo -e "${RED}  SillyTavern 角色卡防盗系统 - Docker 卸载${NC}"
    echo -e "${RED}================================================${NC}"
    echo ""
}

# 确认卸载
confirm_uninstall() {
    print_warning "此操作将删除所有容器、镜像、数据卷和网络"
    print_warning "所有数据将被永久删除，无法恢复！"
    echo ""
    read -p "是否继续卸载？(yes/no): " -r
    echo
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        print_info "卸载已取消"
        exit 0
    fi
}

# 备份提醒
backup_reminder() {
    print_warning "是否需要备份数据库？"
    read -p "备份数据库？(y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "开始备份数据库..."
        
        # 检查 .env 文件
        if [ -f .env ]; then
            source .env
            BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
            
            docker compose exec -T db sh -c "mysqladmin ping -h localhost -u root -p\$MYSQL_ROOT_PASSWORD" &> /dev/null
            if [ $? -eq 0 ]; then
                docker compose exec -T db sh -c "mysqldump -u root -p\$MYSQL_ROOT_PASSWORD \$MYSQL_DATABASE" > "$BACKUP_FILE"
                print_success "数据库已备份到: $BACKUP_FILE"
            else
                print_warning "数据库连接失败，跳过备份"
            fi
        else
            print_warning ".env 文件不存在，跳过备份"
        fi
    fi
}

# 停止服务
stop_services() {
    print_info "停止所有服务..."
    
    if docker compose ps &> /dev/null; then
        docker compose stop
        print_success "服务已停止"
    else
        print_warning "未找到运行中的服务"
    fi
}

# 删除容器
remove_containers() {
    print_info "删除所有容器..."
    
    if docker compose ps -a &> /dev/null; then
        docker compose down
        print_success "容器已删除"
    else
        print_warning "未找到容器"
    fi
}

# 删除镜像
remove_images() {
    print_info "删除所有镜像..."
    
    # 删除项目相关镜像
    IMAGES=$(docker images | grep -E "anti-theft|character-card" | awk '{print $3}')
    
    if [ -n "$IMAGES" ]; then
        echo "$IMAGES" | xargs docker rmi -f
        print_success "镜像已删除"
    else
        print_warning "未找到相关镜像"
    fi
}

# 删除数据卷
remove_volumes() {
    print_warning "是否删除数据卷（包含所有数据库数据）？"
    read -p "删除数据卷？(y/n): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "删除所有数据卷..."
        
        docker compose down -v
        
        # 删除可能残留的数据卷
        VOLUMES=$(docker volume ls | grep -E "anti-theft|character-card" | awk '{print $2}')
        
        if [ -n "$VOLUMES" ]; then
            echo "$VOLUMES" | xargs docker volume rm -f
            print_success "数据卷已删除"
        else
            print_warning "未找到相关数据卷"
        fi
    else
        print_info "保留数据卷"
    fi
}

# 删除网络
remove_networks() {
    print_info "删除网络..."
    
    NETWORKS=$(docker network ls | grep -E "anti-theft|character-card" | awk '{print $2}')
    
    if [ -n "$NETWORKS" ]; then
        echo "$NETWORKS" | xargs docker network rm
        print_success "网络已删除"
    else
        print_warning "未找到相关网络"
    fi
}

# 清理配置文件
cleanup_config() {
    print_warning "是否删除配置文件（.env）？"
    read -p "删除配置文件？(y/n): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if [ -f .env ]; then
            rm .env
            print_success "配置文件已删除"
        else
            print_warning "配置文件不存在"
        fi
    else
        print_info "保留配置文件"
    fi
}

# 显示卸载完成信息
show_completion() {
    echo ""
    echo -e "${GREEN}================================================${NC}"
    echo -e "${GREEN}  卸载完成！${NC}"
    echo -e "${GREEN}================================================${NC}"
    echo ""
    print_info "所有 Docker 资源已清理"
    
    if [ -f .env ]; then
        print_info "配置文件已保留: .env"
    fi
    
    echo ""
    print_info "如需重新安装，请运行: ./docker-install.sh"
    echo ""
}

# 主函数
main() {
    print_header
    
    # 确认卸载
    confirm_uninstall
    
    # 备份提醒
    backup_reminder
    
    # 停止服务
    stop_services
    
    # 删除容器
    remove_containers
    
    # 删除镜像
    remove_images
    
    # 删除数据卷
    remove_volumes
    
    # 删除网络
    remove_networks
    
    # 清理配置文件
    cleanup_config
    
    # 显示完成信息
    show_completion
}

# 运行主函数
main
