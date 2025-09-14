# IoT Platform Docker Setup

This directory contains all the necessary files to run the IoT Platform using Docker containers. The setup includes all required databases, services, and the complete platform stack.

## Quick Start

1. **Run the installation script:**
   ```bash
   ./install-docker.sh
   ```

2. **Access the platform:**
   - IoT Platform Dashboard: http://localhost
   - Grafana Dashboard: http://localhost:3000
   - Backend API: http://localhost/api

## Services Included

### Core Services
- **IoT Backend**: Flask-based REST API server
- **IoT Frontend**: React-based web dashboard
- **Nginx**: Reverse proxy and load balancer

### Databases
- **PostgreSQL**: Primary relational database for users, devices, and configuration
- **InfluxDB**: Time-series database for IoT sensor data
- **Redis**: Caching and session storage
- **MongoDB**: Document storage (optional, for complex data structures)

### Infrastructure
- **Mosquitto MQTT**: Message broker for IoT device communication
- **Grafana**: Data visualization and monitoring dashboards

## Manual Installation

If you prefer to install manually or the script doesn't work for your system:

### Prerequisites

1. **Install Docker:**
   - Ubuntu/Debian: `sudo apt-get install docker.io docker-compose-plugin`
   - CentOS/RHEL: `sudo yum install docker docker-compose`
   - macOS: Install Docker Desktop from https://docker.com
   - Windows: Install Docker Desktop from https://docker.com

2. **Install Docker Compose:**
   ```bash
   # Linux
   sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   
   # Or use the plugin version (recommended)
   # Docker Compose is included with Docker Desktop on macOS/Windows
   ```

### Setup Steps

1. **Clone or download the project files**

2. **Create environment file:**
   ```bash
   cp .env.example .env
   # Edit .env with your preferred settings
   ```

3. **Create necessary directories:**
   ```bash
   mkdir -p docker/mosquitto/{config,data,log}
   mkdir -p docker/postgres/init
   mkdir -p docker/grafana/provisioning/{dashboards,datasources}
   mkdir -p data/uploads logs
   ```

4. **Start the services:**
   ```bash
   docker compose up -d
   ```

## Configuration

### Environment Variables

The `.env` file contains all configuration options:

```bash
# Database Configuration
POSTGRES_DB=iot_platform
POSTGRES_USER=iot_user
POSTGRES_PASSWORD=your_secure_password

# InfluxDB Configuration
INFLUXDB_ADMIN_TOKEN=your_influxdb_token
INFLUXDB_ORG=iot_org
INFLUXDB_BUCKET=iot_data

# Application Configuration
SECRET_KEY=your_secret_key
JWT_SECRET_KEY=your_jwt_secret

# Security Configuration
GF_SECURITY_ADMIN_PASSWORD=grafana_admin_password
```

### Service Ports

- **80**: Nginx (main entry point)
- **3000**: Grafana dashboard
- **5000**: Backend API (internal)
- **5432**: PostgreSQL (internal)
- **8086**: InfluxDB (internal)
- **6379**: Redis (internal)
- **1883**: MQTT broker
- **9001**: MQTT WebSocket

## Management Commands

The `install-docker.sh` script provides several management commands:

```bash
# Install and start everything
./install-docker.sh install

# Start services
./install-docker.sh start

# Stop services
./install-docker.sh stop

# Restart services
./install-docker.sh restart

# View service status
./install-docker.sh status

# View logs
./install-docker.sh logs

# Update services
./install-docker.sh update

# Clean up everything (removes all data!)
./install-docker.sh clean
```

## Manual Docker Commands

If you prefer using Docker Compose directly:

```bash
# Start all services
docker compose up -d

# Stop all services
docker compose down

# View logs
docker compose logs -f

# View logs for specific service
docker compose logs -f iot_backend

# Restart a specific service
docker compose restart iot_backend

# Scale a service
docker compose up -d --scale iot_backend=2

# Update services
docker compose pull && docker compose up -d
```

## Database Access

### PostgreSQL
```bash
# Connect to PostgreSQL
docker compose exec postgres psql -U iot_user -d iot_platform

# Backup database
docker compose exec postgres pg_dump -U iot_user iot_platform > backup.sql

# Restore database
docker compose exec -T postgres psql -U iot_user -d iot_platform < backup.sql
```

### InfluxDB
```bash
# Access InfluxDB CLI
docker compose exec influxdb influx

# Backup InfluxDB
docker compose exec influxdb influx backup /tmp/backup
docker compose cp influxdb:/tmp/backup ./influxdb_backup
```

### Redis
```bash
# Access Redis CLI
docker compose exec redis redis-cli

# Backup Redis
docker compose exec redis redis-cli BGSAVE
```

## Monitoring and Logs

### View Service Status
```bash
docker compose ps
```

### View Resource Usage
```bash
docker stats
```

### View Logs
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f iot_backend

# Last 100 lines
docker compose logs --tail=100 iot_backend
```

### Health Checks
```bash
# Check if services are healthy
curl http://localhost/health
curl http://localhost/api/health
```

## Troubleshooting

### Common Issues

1. **Port conflicts:**
   - Change ports in `docker-compose.yml` if they're already in use
   - Check with: `netstat -tulpn | grep :80`

2. **Permission issues:**
   - Ensure Docker daemon is running: `sudo systemctl start docker`
   - Add user to docker group: `sudo usermod -aG docker $USER`
   - Log out and back in for group changes to take effect

3. **Memory issues:**
   - Increase Docker memory limit in Docker Desktop settings
   - Monitor usage: `docker stats`

4. **Database connection issues:**
   - Check if containers are running: `docker compose ps`
   - Verify network connectivity: `docker compose exec iot_backend ping postgres`

5. **MQTT connection issues:**
   - Check Mosquitto logs: `docker compose logs mosquitto`
   - Test connection: `mosquitto_pub -h localhost -t test -m "hello"`

### Reset Everything
```bash
# Stop and remove everything
docker compose down -v --remove-orphans

# Remove all Docker data (careful!)
docker system prune -a --volumes

# Restart from scratch
./install-docker.sh install
```

## Security Considerations

### Production Deployment

1. **Change default passwords:**
   - Update all passwords in `.env` file
   - Use strong, randomly generated passwords

2. **Enable HTTPS:**
   - Add SSL certificates to `docker/nginx/ssl/`
   - Update nginx configuration for HTTPS

3. **Network security:**
   - Use Docker secrets for sensitive data
   - Implement proper firewall rules
   - Consider using Docker Swarm or Kubernetes for production

4. **Database security:**
   - Enable authentication for all databases
   - Use encrypted connections
   - Regular security updates

### Environment-Specific Configurations

Create different environment files:
- `.env.development`
- `.env.staging`
- `.env.production`

Use with: `docker compose --env-file .env.production up -d`

## Backup and Recovery

### Automated Backups
```bash
# Create backup script
cat > backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups/$DATE"
mkdir -p "$BACKUP_DIR"

# Backup PostgreSQL
docker compose exec postgres pg_dump -U iot_user iot_platform > "$BACKUP_DIR/postgres.sql"

# Backup InfluxDB
docker compose exec influxdb influx backup "$BACKUP_DIR/influxdb"

# Backup configuration
cp -r docker "$BACKUP_DIR/"
cp .env "$BACKUP_DIR/"

echo "Backup completed: $BACKUP_DIR"
EOF

chmod +x backup.sh
```

### Recovery
```bash
# Restore PostgreSQL
docker compose exec -T postgres psql -U iot_user -d iot_platform < backups/20231201_120000/postgres.sql

# Restore InfluxDB
docker compose exec influxdb influx restore backups/20231201_120000/influxdb
```

## Performance Tuning

### Resource Limits
Add to `docker-compose.yml`:
```yaml
services:
  postgres:
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '0.5'
```

### Database Optimization
- Tune PostgreSQL settings in `docker/postgres/postgresql.conf`
- Configure InfluxDB retention policies
- Set up Redis memory limits

## Development

### Development Mode
```bash
# Use development compose file
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Mount source code for live reloading
# (requires docker-compose.dev.yml with volume mounts)
```

### Debugging
```bash
# Access container shell
docker compose exec iot_backend bash

# Debug with Python
docker compose exec iot_backend python -c "import src.main; print('OK')"
```

## Support

For issues and questions:
1. Check the logs: `docker compose logs -f`
2. Verify service status: `docker compose ps`
3. Check resource usage: `docker stats`
4. Review this documentation
5. Check the main project README.md

## License

This Docker setup is part of the IoT Platform project. See the main project license for details.

