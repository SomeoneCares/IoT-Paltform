# IoT Platform with Docker

A comprehensive IoT platform built with Flask backend, React frontend, and Docker containerization. This platform provides device management, organization hierarchy, Matter/Thread protocol support, and real-time monitoring capabilities.

## 🚀 Features

### Core Functionality
- **Device Management**: CRUD operations for IoT devices with real-time status monitoring
- **Organization Management**: Hierarchical structure with Organizations → Locations → Rooms
- **User Management**: Role-based access control (Admin, User, Guest)
- **Real-time Monitoring**: Live device data visualization and analytics
- **Automation Engine**: Rule-based automation for device interactions

### Advanced Features
- **Matter Protocol Support**: Device commissioning and management for Matter-certified devices
- **Thread Network Management**: Mesh network configuration and device connectivity
- **Dark/Light Theme**: User preference theme switching
- **Responsive Design**: Mobile-first design with collapsible sidebar navigation
- **Real-time Updates**: WebSocket connections for live data streaming

### Technology Stack
- **Backend**: Flask (Python) with SQLAlchemy ORM
- **Frontend**: React with Vite, Tailwind CSS, Shadcn UI components
- **Database**: PostgreSQL with Redis for caching
- **Message Broker**: Mosquitto MQTT
- **Time Series**: InfluxDB for device data storage
- **Monitoring**: Grafana for visualization
- **Containerization**: Docker & Docker Compose

## 📋 Prerequisites

- Docker and Docker Compose
- Git
- Modern web browser

## 🛠️ Installation

### 1. Clone the Repository
```bash
git clone <your-github-repo-url>
cd iot_platform_with_docker_Ver_2
```

### 2. Start the Platform
```bash
cd iot_platform
docker compose up -d
```

### 3. Access the Platform
- **Main Dashboard**: http://localhost
- **Grafana Monitoring**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **InfluxDB**: http://localhost:8086

## 🏗️ Architecture

### System Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   IoT Devices   │    │  Edge Gateway   │    │  Cloud Platform │
│                 │    │                 │    │                 │
│ • Sensors       │◄──►│ • Data Processing│◄──►│ • Device Mgmt   │
│ • Actuators     │    │ • Protocol Bridge│    │ • Analytics     │
│ • Smart Devices │    │ • Local Storage │    │ • Automation    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Service Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    Docker Compose Stack                     │
├─────────────────────────────────────────────────────────────┤
│  Frontend (React)  │  Backend (Flask)  │  Databases        │
│  - Nginx           │  - Python API     │  - PostgreSQL     │
│  - Port 80/443     │  - Port 5000      │  - InfluxDB       │
│                    │                   │  - Redis          │
│                    │                   │  - MongoDB        │
├─────────────────────────────────────────────────────────────┤
│  Message Broker    │  Monitoring       │  Additional       │
│  - Mosquitto MQTT  │  - Grafana        │  - Edge Simulator │
│  - Port 1883/9001  │  - Port 3000      │  - Port 8080      │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Project Structure

```
iot_platform_with_docker_Ver_2/
├── iot_platform/                 # Backend Flask application
│   ├── src/
│   │   ├── models/              # Database models
│   │   │   ├── user.py          # User and session models
│   │   │   ├── device.py        # Device, data, and automation models
│   │   │   └── organization.py  # Organization hierarchy models
│   │   ├── routes/              # API endpoints
│   │   │   ├── auth.py          # Authentication routes
│   │   │   ├── user.py          # User management routes
│   │   │   ├── device.py        # Device management routes
│   │   │   ├── organization.py  # Organization management routes
│   │   │   └── matter_thread.py # Matter/Thread protocol routes
│   │   ├── services/            # Business logic services
│   │   │   ├── mqtt_service.py  # MQTT communication
│   │   │   ├── automation_engine.py # Automation rules
│   │   │   └── analytics_service.py # Data analytics
│   │   └── main.py              # Flask application entry point
│   ├── docker/                  # Docker configuration files
│   │   ├── grafana/            # Grafana configuration
│   │   ├── mongodb/            # MongoDB initialization
│   │   ├── mosquitto/          # MQTT broker configuration
│   │   ├── nginx/              # Nginx reverse proxy config
│   │   └── postgres/           # PostgreSQL initialization
│   ├── docker-compose.yml      # Service orchestration
│   ├── Dockerfile.backend      # Backend container definition
│   └── requirements.txt        # Python dependencies
├── iot-dashboard/              # Frontend React application
│   ├── src/
│   │   ├── components/         # React components
│   │   │   ├── ui/             # Shadcn UI components
│   │   │   ├── Login.jsx       # Authentication component
│   │   │   ├── Sidebar.jsx     # Navigation sidebar
│   │   │   ├── DeviceManagement.jsx # Device management
│   │   │   ├── OrganizationManagement.jsx # Organization management
│   │   │   ├── MatterThreadManagement.jsx # Matter/Thread management
│   │   │   ├── Settings.jsx    # Settings and preferences
│   │   │   └── UserManagement.jsx # User administration
│   │   ├── contexts/           # React contexts
│   │   │   ├── AuthContext.jsx # Authentication state
│   │   │   ├── DeviceContext.jsx # Device state management
│   │   │   ├── OrganizationContext.jsx # Organization state
│   │   │   └── ThemeContext.jsx # Theme management
│   │   ├── App.jsx             # Main application component
│   │   └── main.jsx            # Application entry point
│   ├── Dockerfile              # Frontend container definition
│   ├── package.json            # Node.js dependencies
│   └── vite.config.js          # Vite build configuration
├── .gitignore                  # Git ignore rules
└── README.md                   # Project documentation
```

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the `iot_platform` directory:

```env
# Database Configuration
POSTGRES_DB=iot_platform
POSTGRES_USER=iot_user
POSTGRES_PASSWORD=your_password

# Redis Configuration
REDIS_PASSWORD=your_redis_password

# MQTT Configuration
MQTT_BROKER_HOST=mosquitto
MQTT_BROKER_PORT=1883

# Application Configuration
FLASK_SECRET_KEY=your_secret_key
JWT_SECRET_KEY=your_jwt_secret
```

### Docker Services
The platform includes the following services:

- **iot_frontend**: React application with Nginx
- **iot_backend**: Flask API server
- **iot_postgres**: PostgreSQL database
- **iot_redis**: Redis cache
- **iot_mosquitto**: MQTT message broker
- **iot_influxdb**: Time series database
- **iot_mongodb**: Document database
- **iot_grafana**: Monitoring dashboard
- **iot_nginx**: Reverse proxy

## 🚀 Usage

### 1. Device Management
- Navigate to "Devices" in the sidebar
- Add new devices with device ID, name, type, and room assignment
- Monitor device status and last seen timestamps
- Edit or delete existing devices

### 2. Organization Management
- Go to "Organizations" to manage your organizational structure
- Create organizations with multiple locations
- Add rooms to locations for device organization
- Assign devices to specific rooms

### 3. Matter & Thread Management
- Access "Matter & Thread" for protocol-specific management
- Create Thread mesh networks
- Commission Matter devices
- Monitor network topology and device connectivity

### 4. User Management
- Admin users can access "User Management"
- Create new user accounts
- Assign roles (Admin, User, Guest)
- Manage user permissions

### 5. Settings
- Configure theme preferences (Light/Dark)
- Set notification preferences
- Manage system settings
- Configure MQTT connections

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/register` - User registration

### Device Management
- `GET /api/devices` - List all devices
- `POST /api/devices` - Create new device
- `PUT /api/devices/{id}` - Update device
- `DELETE /api/devices/{id}` - Delete device

### Organization Management
- `GET /api/organizations` - List organizations
- `POST /api/organizations` - Create organization
- `GET /api/organizations/{id}/locations` - List locations
- `POST /api/organizations/{id}/locations` - Create location
- `GET /api/locations/{id}/rooms` - List rooms
- `POST /api/locations/{id}/rooms` - Create room

### Matter & Thread
- `GET /api/thread/networks` - List Thread networks
- `POST /api/thread/networks` - Create Thread network
- `POST /api/matter/devices/{id}/commission` - Commission Matter device
- `GET /api/matter/device-types` - List Matter device types

## 🧪 Testing

### Run Tests
```bash
cd iot_platform
python -m pytest tests/
```

### Test Coverage
```bash
python -m pytest --cov=src tests/
```

## 📊 Monitoring

### Grafana Dashboards
Access Grafana at http://localhost:3000 (admin/admin) to view:
- Device status monitoring
- System performance metrics
- Data flow visualization
- Alert configurations

### Health Checks
- Backend API: http://localhost:5000/api/health
- Frontend: http://localhost
- Database: Check Docker container status

## 🔒 Security

### Authentication
- JWT-based authentication
- Role-based access control
- Session management
- Password hashing with bcrypt

### Network Security
- MQTT broker authentication
- Database connection encryption
- API rate limiting
- CORS configuration

## 🚀 Deployment

### Production Deployment
1. Update environment variables for production
2. Configure SSL certificates
3. Set up reverse proxy
4. Configure monitoring and logging
5. Set up backup strategies

### Docker Production
```bash
docker compose -f docker-compose.prod.yml up -d
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation
- Review the API endpoints
- Check Docker container logs

## 🔄 Version History

- **v2.0.0**: Complete rewrite with React frontend, Matter/Thread support, and enhanced UI
- **v1.0.0**: Initial Flask-based IoT platform

## 🎯 Roadmap

- [ ] Mobile application
- [ ] Advanced analytics and ML
- [ ] Multi-tenant support
- [ ] Cloud deployment options
- [ ] Additional protocol support
- [ ] Enhanced automation engine
- [ ] Real-time collaboration features

---

**Built with ❤️ for the IoT community**
