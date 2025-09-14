import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { DeviceProvider, useDevices } from '@/contexts/DeviceContext'
import { OrganizationProvider } from '@/contexts/OrganizationContext'
import { AutomationProvider, useAutomations } from '@/contexts/AutomationContext'
import { BillingProvider } from '@/contexts/BillingContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import Sidebar from '@/components/Sidebar.jsx'
import MobileSidebar from '@/components/MobileSidebar.jsx'
import Login from '@/components/Login'
import UserManagement from '@/components/UserManagement'
import DeviceManagement from '@/components/DeviceManagement'
import OrganizationManagement from '@/components/OrganizationManagement'
import MatterThreadManagement from '@/components/MatterThreadManagement'
import AutomationManagement from '@/components/AutomationManagement'
import BillingManagement from '@/components/BillingManagement'
import RBACManagement from '@/components/RBACManagement'
import Settings from '@/components/Settings'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { 
  Home, 
  Settings as SettingsIcon, 
  Activity, 
  Thermometer, 
  Droplets, 
  Eye, 
  Lightbulb, 
  DoorOpen,
  Wifi,
  WifiOff,
  Plus,
  BarChart3,
  Zap,
  Menu
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import './App.css'
import './modern-styles.css'

// API base URL
const API_BASE = 'http://localhost:5000/api'

// Device type icons mapping
const deviceIcons = {
  temperature_sensor: Thermometer,
  humidity_sensor: Droplets,
  motion_sensor: Eye,
  smart_light: Lightbulb,
  door_sensor: DoorOpen,
  default: Activity
}

// Device type colors
const deviceColors = {
  temperature_sensor: 'bg-red-100 text-red-800',
  humidity_sensor: 'bg-blue-100 text-blue-800',
  motion_sensor: 'bg-yellow-100 text-yellow-800',
  smart_light: 'bg-green-100 text-green-800',
  door_sensor: 'bg-purple-100 text-purple-800',
  default: 'bg-gray-100 text-gray-800'
}

function DeviceCard({ device, onDeviceClick }) {
  const IconComponent = deviceIcons[device.device_type] || deviceIcons.default
  const colorClass = deviceColors[device.device_type] || deviceColors.default
  
  return (
    <Card 
      className="device-card-modern cursor-pointer animate-fade-in-up interactive-hover"
      onClick={() => onDeviceClick(device)}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex items-center space-x-3">
          <div className="device-icon-container">
            <IconComponent className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold text-gradient-modern">{device.name}</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">{device.location}</p>
          </div>
        </div>
        <div className="status-indicator">
          <div className={`status-dot ${device.status}`}></div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between mb-3">
          <Badge className={`${colorClass} px-3 py-1 rounded-full font-medium`}>
            {device.device_type.replace('_', ' ')}
          </Badge>
          <div className="flex items-center space-x-2">
            {device.status === 'online' ? (
              <Wifi className="h-4 w-4 text-green-500 animate-pulse-glow" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-500" />
            )}
            <span className={`text-sm font-medium ${device.status === 'online' ? 'text-green-600' : 'text-red-600'}`}>
              {device.status}
            </span>
          </div>
        </div>
        <div className="glass-card p-3 rounded-lg">
          <p className="text-xs text-muted-foreground">
            Last seen: <span className="font-medium">{new Date(device.last_seen).toLocaleString()}</span>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

function DeviceDataChart({ deviceId, dataType }) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${API_BASE}/devices/${deviceId}/data?data_type=${dataType}&hours=24`)
        if (response.ok) {
          const deviceData = await response.json()
          const chartData = deviceData.map(item => ({
            time: new Date(item.timestamp).toLocaleTimeString(),
            value: item.value,
            timestamp: item.timestamp
          })).reverse() // Reverse to show oldest first
          setData(chartData)
        }
      } catch (error) {
        console.error('Error fetching device data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [deviceId, dataType])

  if (loading) {
    return <div className="h-64 flex items-center justify-center">Loading chart...</div>
  }

  if (data.length === 0) {
    return <div className="h-64 flex items-center justify-center">No data available</div>
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="time" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  )
}

function Dashboard({ onPageChange }) {
  const { devices, loading } = useDevices()
  const { automations } = useAutomations()
  const [selectedDevice, setSelectedDevice] = useState(null)

  useEffect(() => {
    if (devices.length > 0 && !selectedDevice) {
      setSelectedDevice(devices[0])
    }
  }, [devices, selectedDevice])

  const onlineDevices = devices.filter(d => d.status === 'online').length
  const totalDevices = devices.length
  const totalAutomations = automations.length

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          <Card className="stats-card-modern animate-fade-in-up">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3">
              <div>
                <CardTitle className="text-sm font-medium opacity-90">Total Devices</CardTitle>
                <div className="text-2xl font-bold">{totalDevices}</div>
              </div>
              <div className="flex items-center justify-center w-12 h-12 rounded-lg">
                <Activity className="h-5 w-5" />
              </div>
            </CardHeader>
          </Card>
          
          <Card className="gradient-card-success animate-fade-in-up" style={{animationDelay: '0.1s'}}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3">
              <div>
                <CardTitle className="text-sm font-medium opacity-90">Online Devices</CardTitle>
                <div className="text-2xl font-bold">{onlineDevices}</div>
              </div>
              <div className="flex items-center justify-center w-12 h-12 rounded-lg">
                <Wifi className="h-5 w-5 animate-pulse-glow" />
              </div>
            </CardHeader>
          </Card>
          
          <Card className="gradient-card-danger animate-fade-in-up" style={{animationDelay: '0.2s'}}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3">
              <div>
                <CardTitle className="text-sm font-medium opacity-90">Offline Devices</CardTitle>
                <div className="text-2xl font-bold">{totalDevices - onlineDevices}</div>
              </div>
              <div className="flex items-center justify-center w-12 h-12 rounded-lg">
                <WifiOff className="h-5 w-5" />
              </div>
            </CardHeader>
          </Card>
          
          <Card className="gradient-card-warning animate-fade-in-up" style={{animationDelay: '0.3s'}}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3">
              <div>
                <CardTitle className="text-sm font-medium opacity-90">Automation Rules</CardTitle>
                <div className="text-2xl font-bold">{totalAutomations}</div>
              </div>
              <div className="flex items-center justify-center w-12 h-12 rounded-lg">
                <Zap className="h-5 w-5" />
              </div>
            </CardHeader>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Devices List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Devices ({devices.length})</CardTitle>
                <Button size="sm" variant="outline" onClick={() => onPageChange('devices')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Device
                </Button>
              </div>
              <CardDescription>
                Manage your connected IoT devices
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {devices.map((device) => (
                <DeviceCard 
                  key={device.id} 
                  device={device} 
                  onDeviceClick={setSelectedDevice}
                />
              ))}
              {devices.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No devices found. Start the edge gateway simulator to see devices.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Device Details and Charts */}
          <Card>
            <CardHeader>
              <CardTitle>Device Details</CardTitle>
              <CardDescription>
                {selectedDevice ? `Viewing details for ${selectedDevice.name}` : 'Select a device to view details'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedDevice ? (
                <div>
                  <div className="flex items-center space-x-3 mb-4">
                    {(() => {
                      const IconComponent = deviceIcons[selectedDevice.device_type] || deviceIcons.default
                      return <IconComponent className="h-5 w-5" />
                    })()}
                    <div>
                      <h3 className="font-semibold">{selectedDevice.name}</h3>
                      <p className="text-sm text-gray-500">{selectedDevice.device_type.replace('_', ' ')} in {selectedDevice.location}</p>
                    </div>
                  </div>
                  
                  <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="overview">Overview</TabsTrigger>
                      <TabsTrigger value="data">Historical Data</TabsTrigger>
                      <TabsTrigger value="settings">Settings</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="overview" className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium">Device ID</label>
                          <p className="text-sm text-muted-foreground">{selectedDevice.device_id}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Status</label>
                          <p className={`text-sm ${selectedDevice.status === 'online' ? 'text-green-600' : 'text-red-600'}`}>
                            {selectedDevice.status}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Location</label>
                          <p className="text-sm text-muted-foreground">{selectedDevice.location}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Last Seen</label>
                          <p className="text-sm text-muted-foreground">
                            {selectedDevice.last_seen ? new Date(selectedDevice.last_seen).toLocaleString() : 'Never'}
                          </p>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="data" className="space-y-4">
                      <div className="space-y-4">
                        <h4 className="text-sm font-medium flex items-center">
                          <BarChart3 className="h-4 w-4 mr-2" />
                          24-Hour Data Trend
                        </h4>
                        {selectedDevice.device_type === 'temperature_sensor' && (
                          <DeviceDataChart 
                            deviceId={selectedDevice.device_id} 
                            dataType="temperature" 
                          />
                        )}
                        {selectedDevice.device_type === 'humidity_sensor' && (
                          <DeviceDataChart 
                            deviceId={selectedDevice.device_id} 
                            dataType="humidity" 
                          />
                        )}
                        {selectedDevice.device_type === 'smart_light' && (
                          <DeviceDataChart 
                            deviceId={selectedDevice.device_id} 
                            dataType="brightness" 
                          />
                        )}
                        {!['temperature_sensor', 'humidity_sensor', 'smart_light'].includes(selectedDevice.device_type) && (
                          <div className="h-64 flex items-center justify-center text-muted-foreground">
                            Chart not available for this device type
                          </div>
                        )}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="settings" className="space-y-4">
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium">Device Name</label>
                          <input 
                            type="text" 
                            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                            defaultValue={selectedDevice.name}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Location</label>
                          <input 
                            type="text" 
                            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                            defaultValue={selectedDevice.location}
                          />
                        </div>
                        <Button size="sm">Save Changes</Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Activity className="h-8 w-8 mx-auto mb-3 text-gray-400" />
                  <h3 className="text-base font-medium text-gray-900 mb-2">No device selected</h3>
                  <p className="text-sm text-gray-500">Click on a device from the list to view its details</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function MainApp() {
  const { user, loading } = useAuth()
  const { refreshDevices } = useDevices()
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false) // Always false - sidebar always expanded
  const [sidebarVisible, setSidebarVisible] = useState(true) // Always true - sidebar always open

  const handlePageChange = (page) => {
    setCurrentPage(page)
    // Refresh devices when returning to dashboard
    if (page === 'dashboard') {
      refreshDevices()
    }
  }

  // Removed toggleSidebar function - sidebar is always visible


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Login />
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onPageChange={handlePageChange} />
      case 'automations':
        return <AutomationManagement />
      case 'billing':
        return <BillingManagement />
      case 'devices':
        return <DeviceManagement />
      case 'organizations':
        return <OrganizationManagement />
      case 'matter-thread':
        return <MatterThreadManagement />
      case 'users':
        return <UserManagement />
      case 'rbac':
        return <RBACManagement />
      case 'settings':
        return <Settings />
      case 'profile':
        return (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <Card className="w-96">
              <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>User profile information</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Username</label>
                    <p className="text-sm text-gray-600">{user.username}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Role</label>
                    <Badge variant="outline">{user.role?.name || 'No Role'}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )
      default:
        return <Dashboard onPageChange={handlePageChange} />
    }
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar - Always visible */}
      <div className="flex transition-all duration-300 w-64">
        <Sidebar 
          currentPage={currentPage} 
          onPageChange={handlePageChange}
          isCollapsed={false}
          onToggleCollapse={() => {}} // Disabled - sidebar always expanded
        />
      </div>

      {/* Mobile Sidebar */}
      <MobileSidebar
        currentPage={currentPage}
        onPageChange={handlePageChange}
        isOpen={false}
        onClose={() => {}}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">

        {/* Page Content */}
        <div className="flex-1 overflow-auto">
          {renderPage()}
        </div>
      </div>
    </div>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <OrganizationProvider>
          <DeviceProvider>
            <AutomationProvider>
              <BillingProvider>
                <MainApp />
              </BillingProvider>
            </AutomationProvider>
          </DeviceProvider>
        </OrganizationProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App

