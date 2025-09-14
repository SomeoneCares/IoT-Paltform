#!/bin/bash

# IoT Platform Docker Installation Script
# This script installs Docker, Docker Compose, and sets up the IoT platform

set -e

echo "🚀 IoT Platform Docker Installation Script"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
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

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root"
   exit 1
fi

# Detect OS
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
    if [ -f /etc/debian_version ]; then
        DISTRO="debian"
    elif [ -f /etc/redhat-release ]; then
        DISTRO="redhat"
    else
        DISTRO="unknown"
    fi
elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macos"
else
    print_error "Unsupported operating system: $OSTYPE"
    exit 1
fi

print_status "Detected OS: $OS ($DISTRO)"

# Function to install Docker on Linux
install_docker_linux() {
    print_status "Installing Docker on Linux..."
    
    # Update package index
    sudo apt-get update
    
    # Install prerequisites
    sudo apt-get install -y \
        ca-certificates \
        curl \
        gnupg \
        lsb-release
    
    # Add Docker's official GPG key
    sudo mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    
    # Set up the repository
    echo \
        "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
        $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Update package index again
    sudo apt-get update
    
    # Install Docker Engine
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    
    # Add current user to docker group
    sudo usermod -aG docker $USER
    
    print_success "Docker installed successfully"
}

# Function to install Docker on macOS
install_docker_macos() {
    print_status "Installing Docker on macOS..."
    
    # Check if Homebrew is installed
    if ! command -v brew &> /dev/null; then
        print_error "Homebrew is required but not installed. Please install Homebrew first:"
        print_error "https://brew.sh/"
        exit 1
    fi
    
    # Install Docker Desktop
    brew install --cask docker
    
    print_success "Docker Desktop installed successfully"
    print_warning "Please start Docker Desktop manually before continuing"
}

# Function to check if Docker is installed
check_docker() {
    if command -v docker &> /dev/null; then
        print_success "Docker is already installed"
        docker --version
        return 0
    else
        return 1
    fi
}

# Function to check if Docker Compose is installed
check_docker_compose() {
    if docker compose version &> /dev/null; then
        print_success "Docker Compose is already installed"
        docker compose version
        return 0
    else
        return 1
    fi
}

# Function to create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    
    mkdir -p docker/mosquitto/{config,data,log}
    mkdir -p docker/postgres/init
    mkdir -p docker/mongodb/init
    mkdir -p docker/grafana/provisioning/{dashboards,datasources}
    mkdir -p docker/nginx
    mkdir -p data/uploads
    mkdir -p logs
    
    # Set proper permissions
    chmod 755 docker/mosquitto/data
    chmod 755 docker/mosquitto/log
    
    print_success "Directories created successfully"
}

# Function to generate environment file
generate_env_file() {
    print_status "Generating environment configuration..."
    
    cat > .env << EOF
# IoT Platform Environment Configuration

# Database Configuration
POSTGRES_DB=iot_platform
POSTGRES_USER=iot_user
POSTGRES_PASSWORD=$(openssl rand -base64 32)
DATABASE_URL=postgresql://iot_user:\${POSTGRES_PASSWORD}@postgres:5432/iot_platform

# InfluxDB Configuration
INFLUXDB_ADMIN_TOKEN=$(openssl rand -base64 32)
INFLUXDB_ORG=iot_org
INFLUXDB_BUCKET=iot_data
INFLUXDB_URL=http://influxdb:8086

# Redis Configuration
REDIS_URL=redis://redis:6379

# MQTT Configuration
MQTT_BROKER_HOST=mosquitto
MQTT_BROKER_PORT=1883

# Application Configuration
SECRET_KEY=$(openssl rand -base64 32)
FLASK_ENV=production
DEBUG=false

# Security Configuration
JWT_SECRET_KEY=$(openssl rand -base64 32)
JWT_ACCESS_TOKEN_EXPIRES=3600

# Grafana Configuration
GF_SECURITY_ADMIN_PASSWORD=$(openssl rand -base64 16)

# Network Configuration
NGINX_PORT=80
BACKEND_PORT=5000
FRONTEND_PORT=3001
GRAFANA_PORT=3000
EOF

    print_success "Environment file generated: .env"
    print_warning "Please review and modify .env file as needed"
}

# Function to start the platform
start_platform() {
    print_status "Starting IoT Platform..."
    
    # Pull latest images
    docker compose pull
    
    # Build custom images
    docker compose build
    
    # Start services
    docker compose up -d
    
    print_success "IoT Platform started successfully!"
    
    echo ""
    echo "🎉 Installation Complete!"
    echo "======================="
    echo ""
    echo "Services are now running:"
    echo "• IoT Platform Dashboard: http://localhost"
    echo "• Grafana Dashboard: http://localhost:3000"
    echo "• Backend API: http://localhost/api"
    echo "• MQTT Broker: localhost:1883"
    echo ""
    echo "Default credentials:"
    echo "• Platform Admin: admin / admin123"
    echo "• Platform Demo: demo / demo123"
    echo "• Grafana Admin: admin / (check .env file for password)"
    echo ""
    echo "To view logs: docker compose logs -f"
    echo "To stop services: docker compose down"
    echo "To restart services: docker compose restart"
}

# Function to show status
show_status() {
    print_status "Checking service status..."
    docker compose ps
    
    echo ""
    print_status "Service URLs:"
    echo "• IoT Platform: http://localhost"
    echo "• Grafana: http://localhost:3000"
    echo "• API Health: http://localhost/api/health"
}

# Main installation process
main() {
    echo ""
    print_status "Starting installation process..."
    
    # Check if Docker is installed
    if ! check_docker; then
        if [[ "$OS" == "linux" ]]; then
            install_docker_linux
        elif [[ "$OS" == "macos" ]]; then
            install_docker_macos
        fi
    fi
    
    # Check if Docker Compose is installed
    if ! check_docker_compose; then
        print_error "Docker Compose is not available"
        exit 1
    fi
    
    # Create directories
    create_directories
    
    # Generate environment file
    generate_env_file
    
    # Start the platform
    start_platform
    
    # Show final status
    show_status
    
    echo ""
    print_success "IoT Platform installation completed successfully!"
    print_warning "If you're on Linux, you may need to log out and back in for Docker group changes to take effect"
}

# Handle command line arguments
case "${1:-install}" in
    "install")
        main
        ;;
    "start")
        print_status "Starting IoT Platform..."
        docker compose up -d
        show_status
        ;;
    "stop")
        print_status "Stopping IoT Platform..."
        docker compose down
        ;;
    "restart")
        print_status "Restarting IoT Platform..."
        docker compose restart
        show_status
        ;;
    "status")
        show_status
        ;;
    "logs")
        docker compose logs -f
        ;;
    "update")
        print_status "Updating IoT Platform..."
        docker compose pull
        docker compose build
        docker compose up -d
        show_status
        ;;
    "clean")
        print_warning "This will remove all containers, volumes, and data!"
        read -p "Are you sure? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            docker compose down -v --remove-orphans
            docker system prune -f
            print_success "Cleanup completed"
        fi
        ;;
    "help"|"-h"|"--help")
        echo "IoT Platform Docker Management Script"
        echo ""
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  install   Install and start the IoT Platform (default)"
        echo "  start     Start the IoT Platform services"
        echo "  stop      Stop the IoT Platform services"
        echo "  restart   Restart the IoT Platform services"
        echo "  status    Show service status"
        echo "  logs      Show service logs"
        echo "  update    Update and restart services"
        echo "  clean     Remove all containers and data"
        echo "  help      Show this help message"
        ;;
    *)
        print_error "Unknown command: $1"
        print_status "Use '$0 help' for usage information"
        exit 1
        ;;
esac

