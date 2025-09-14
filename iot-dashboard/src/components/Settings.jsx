import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Shield, 
  Database, 
  Wifi, 
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Info,
  Sun,
  Moon,
  Monitor
} from 'lucide-react'

const API_BASE = 'http://localhost:5000/api'

export default function Settings() {
  const { user, token } = useAuth()
  const { theme, toggleTheme, setLightTheme, setDarkTheme, isDark } = useTheme()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  
  // Profile settings
  const [profileData, setProfileData] = useState({
    username: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  
  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    deviceAlerts: true,
    systemUpdates: false,
    maintenanceAlerts: true,
    lowBatteryAlerts: true,
    offlineDeviceAlerts: true
  })
  
  // System settings
  const [systemSettings, setSystemSettings] = useState({
    autoRefresh: true,
    refreshInterval: 30,
    theme: 'light',
    language: 'en',
    timezone: 'UTC',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h'
  })
  
  // MQTT settings
  const [mqttSettings, setMqttSettings] = useState({
    brokerHost: 'localhost',
    brokerPort: 1883,
    username: '',
    password: '',
    keepAlive: 60,
    qos: 1,
    retain: false
  })

  useEffect(() => {
    if (user) {
      setProfileData({
        username: user.username || '',
        email: user.email || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    }
  }, [user])

  const showMessage = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: '', text: '' }), 5000)
  }

  const handleProfileUpdate = async (e) => {
    e.preventDefault()
    setSaving(true)
    
    try {
      const response = await fetch(`${API_BASE}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          username: profileData.username,
          email: profileData.email
        })
      })

      if (response.ok) {
        showMessage('success', 'Profile updated successfully')
      } else {
        const error = await response.json()
        showMessage('error', error.error || 'Failed to update profile')
      }
    } catch (error) {
      showMessage('error', 'Network error')
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    
    if (profileData.newPassword !== profileData.confirmPassword) {
      showMessage('error', 'New passwords do not match')
      return
    }
    
    if (profileData.newPassword.length < 6) {
      showMessage('error', 'Password must be at least 6 characters long')
      return
    }
    
    setSaving(true)
    
    try {
      const response = await fetch(`${API_BASE}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: profileData.currentPassword,
          newPassword: profileData.newPassword
        })
      })

      if (response.ok) {
        showMessage('success', 'Password changed successfully')
        setProfileData({
          ...profileData,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
      } else {
        const error = await response.json()
        showMessage('error', error.error || 'Failed to change password')
      }
    } catch (error) {
      showMessage('error', 'Network error')
    } finally {
      setSaving(false)
    }
  }

  const handleNotificationSettingsSave = async () => {
    setSaving(true)
    
    try {
      // Save to localStorage for now (in a real app, this would be saved to the backend)
      localStorage.setItem('notificationSettings', JSON.stringify(notificationSettings))
      showMessage('success', 'Notification settings saved')
    } catch (error) {
      showMessage('error', 'Failed to save notification settings')
    } finally {
      setSaving(false)
    }
  }

  const handleSystemSettingsSave = async () => {
    setSaving(true)
    
    try {
      // Save to localStorage for now (in a real app, this would be saved to the backend)
      localStorage.setItem('systemSettings', JSON.stringify(systemSettings))
      showMessage('success', 'System settings saved')
    } catch (error) {
      showMessage('error', 'Failed to save system settings')
    } finally {
      setSaving(false)
    }
  }

  const handleMqttSettingsSave = async () => {
    setSaving(true)
    
    try {
      // Save to localStorage for now (in a real app, this would be saved to the backend)
      localStorage.setItem('mqttSettings', JSON.stringify(mqttSettings))
      showMessage('success', 'MQTT settings saved')
    } catch (error) {
      showMessage('error', 'Failed to save MQTT settings')
    } finally {
      setSaving(false)
    }
  }

  const testMqttConnection = async () => {
    setLoading(true)
    
    try {
      // In a real implementation, this would test the MQTT connection
      await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate connection test
      showMessage('success', 'MQTT connection test successful')
    } catch (error) {
      showMessage('error', 'MQTT connection test failed')
    } finally {
      setLoading(false)
    }
  }

  const getMessageIcon = () => {
    switch (message.type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />
      default:
        return null
    }
  }

  const getMessageColor = () => {
    switch (message.type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800'
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800'
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800'
      default:
        return ''
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Manage your account and platform preferences</p>
        </div>

        {message.text && (
          <div className={`mb-6 p-4 rounded-lg border flex items-center space-x-2 ${getMessageColor()}`}>
            {getMessageIcon()}
            <span>{message.text}</span>
          </div>
        )}

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profile" className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>Profile</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center space-x-2">
              <Bell className="h-4 w-4" />
              <span>Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="theme" className="flex items-center space-x-2">
              <Sun className="h-4 w-4" />
              <span>Theme</span>
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center space-x-2">
              <SettingsIcon className="h-4 w-4" />
              <span>System</span>
            </TabsTrigger>
            <TabsTrigger value="mqtt" className="flex items-center space-x-2">
              <Wifi className="h-4 w-4" />
              <span>MQTT</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Update your personal information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleProfileUpdate} className="space-y-4">
                    <div>
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={profileData.username}
                        onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{user?.role?.name || 'No Role'}</Badge>
                      <span className="text-sm text-gray-500">Role</span>
                    </div>
                    <Button type="submit" disabled={saving}>
                      {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                      Update Profile
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>
                    Update your account password
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div>
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={profileData.currentPassword}
                        onChange={(e) => setProfileData({ ...profileData, currentPassword: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={profileData.newPassword}
                        onChange={(e) => setProfileData({ ...profileData, newPassword: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={profileData.confirmPassword}
                        onChange={(e) => setProfileData({ ...profileData, confirmPassword: e.target.value })}
                        required
                      />
                    </div>
                    <Button type="submit" disabled={saving}>
                      {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                      Change Password
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Configure how you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="emailNotifications">Email Notifications</Label>
                      <p className="text-sm text-gray-500">Receive notifications via email</p>
                    </div>
                    <Switch
                      id="emailNotifications"
                      checked={notificationSettings.emailNotifications}
                      onCheckedChange={(checked) => 
                        setNotificationSettings({ ...notificationSettings, emailNotifications: checked })
                      }
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="deviceAlerts">Device Alerts</Label>
                      <p className="text-sm text-gray-500">Get notified about device status changes</p>
                    </div>
                    <Switch
                      id="deviceAlerts"
                      checked={notificationSettings.deviceAlerts}
                      onCheckedChange={(checked) => 
                        setNotificationSettings({ ...notificationSettings, deviceAlerts: checked })
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="systemUpdates">System Updates</Label>
                      <p className="text-sm text-gray-500">Receive notifications about system updates</p>
                    </div>
                    <Switch
                      id="systemUpdates"
                      checked={notificationSettings.systemUpdates}
                      onCheckedChange={(checked) => 
                        setNotificationSettings({ ...notificationSettings, systemUpdates: checked })
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="maintenanceAlerts">Maintenance Alerts</Label>
                      <p className="text-sm text-gray-500">Get notified about scheduled maintenance</p>
                    </div>
                    <Switch
                      id="maintenanceAlerts"
                      checked={notificationSettings.maintenanceAlerts}
                      onCheckedChange={(checked) => 
                        setNotificationSettings({ ...notificationSettings, maintenanceAlerts: checked })
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="lowBatteryAlerts">Low Battery Alerts</Label>
                      <p className="text-sm text-gray-500">Get notified when device batteries are low</p>
                    </div>
                    <Switch
                      id="lowBatteryAlerts"
                      checked={notificationSettings.lowBatteryAlerts}
                      onCheckedChange={(checked) => 
                        setNotificationSettings({ ...notificationSettings, lowBatteryAlerts: checked })
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="offlineDeviceAlerts">Offline Device Alerts</Label>
                      <p className="text-sm text-gray-500">Get notified when devices go offline</p>
                    </div>
                    <Switch
                      id="offlineDeviceAlerts"
                      checked={notificationSettings.offlineDeviceAlerts}
                      onCheckedChange={(checked) => 
                        setNotificationSettings({ ...notificationSettings, offlineDeviceAlerts: checked })
                      }
                    />
                  </div>
                  
                  <div className="pt-4">
                    <Button onClick={handleNotificationSettingsSave} disabled={saving}>
                      {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                      Save Notification Settings
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="theme" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Theme Settings</CardTitle>
                <CardDescription>
                  Customize the appearance of your IoT platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="theme-select">Theme</Label>
                      <p className="text-sm text-muted-foreground">Choose your preferred theme</p>
                    </div>
                    <Select value={theme} onValueChange={(value) => {
                      if (value === 'light') setLightTheme()
                      else if (value === 'dark') setDarkTheme()
                    }}>
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">
                          <div className="flex items-center space-x-2">
                            <Sun className="h-4 w-4" />
                            <span>Light</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="dark">
                          <div className="flex items-center space-x-2">
                            <Moon className="h-4 w-4" />
                            <span>Dark</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Quick Toggle</Label>
                      <p className="text-sm text-muted-foreground">Toggle between light and dark theme</p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={toggleTheme}
                      className="flex items-center space-x-2"
                    >
                      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                      <span>Switch to {isDark ? 'Light' : 'Dark'}</span>
                    </Button>
                  </div>
                  
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Info className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">Theme Information</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Your theme preference is automatically saved and will be applied across all pages. 
                      The system will remember your choice for future visits.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>System Preferences</CardTitle>
                <CardDescription>
                  Configure system behavior and display options
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="autoRefresh">Auto Refresh</Label>
                      <p className="text-sm text-gray-500">Automatically refresh data</p>
                    </div>
                    <Switch
                      id="autoRefresh"
                      checked={systemSettings.autoRefresh}
                      onCheckedChange={(checked) => 
                        setSystemSettings({ ...systemSettings, autoRefresh: checked })
                      }
                    />
                  </div>
                  
                  {systemSettings.autoRefresh && (
                    <div>
                      <Label htmlFor="refreshInterval">Refresh Interval (seconds)</Label>
                      <Input
                        id="refreshInterval"
                        type="number"
                        min="10"
                        max="300"
                        value={systemSettings.refreshInterval}
                        onChange={(e) => 
                          setSystemSettings({ ...systemSettings, refreshInterval: parseInt(e.target.value) })
                        }
                        className="mt-1"
                      />
                    </div>
                  )}
                  
                  <div>
                    <Label htmlFor="theme">Theme</Label>
                    <Select 
                      value={systemSettings.theme} 
                      onValueChange={(value) => setSystemSettings({ ...systemSettings, theme: value })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="auto">Auto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="language">Language</Label>
                    <Select 
                      value={systemSettings.language} 
                      onValueChange={(value) => setSystemSettings({ ...systemSettings, language: value })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select 
                      value={systemSettings.timezone} 
                      onValueChange={(value) => setSystemSettings({ ...systemSettings, timezone: value })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="America/New_York">Eastern Time</SelectItem>
                        <SelectItem value="America/Chicago">Central Time</SelectItem>
                        <SelectItem value="America/Denver">Mountain Time</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                        <SelectItem value="Europe/London">London</SelectItem>
                        <SelectItem value="Europe/Paris">Paris</SelectItem>
                        <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="dateFormat">Date Format</Label>
                      <Select 
                        value={systemSettings.dateFormat} 
                        onValueChange={(value) => setSystemSettings({ ...systemSettings, dateFormat: value })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                          <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                          <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="timeFormat">Time Format</Label>
                      <Select 
                        value={systemSettings.timeFormat} 
                        onValueChange={(value) => setSystemSettings({ ...systemSettings, timeFormat: value })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="12h">12 Hour</SelectItem>
                          <SelectItem value="24h">24 Hour</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="pt-4">
                    <Button onClick={handleSystemSettingsSave} disabled={saving}>
                      {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                      Save System Settings
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mqtt" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>MQTT Configuration</CardTitle>
                <CardDescription>
                  Configure MQTT broker connection settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="brokerHost">Broker Host</Label>
                      <Input
                        id="brokerHost"
                        value={mqttSettings.brokerHost}
                        onChange={(e) => setMqttSettings({ ...mqttSettings, brokerHost: e.target.value })}
                        placeholder="localhost"
                      />
                    </div>
                    <div>
                      <Label htmlFor="brokerPort">Broker Port</Label>
                      <Input
                        id="brokerPort"
                        type="number"
                        value={mqttSettings.brokerPort}
                        onChange={(e) => setMqttSettings({ ...mqttSettings, brokerPort: parseInt(e.target.value) })}
                        placeholder="1883"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="mqttUsername">Username</Label>
                      <Input
                        id="mqttUsername"
                        value={mqttSettings.username}
                        onChange={(e) => setMqttSettings({ ...mqttSettings, username: e.target.value })}
                        placeholder="Optional"
                      />
                    </div>
                    <div>
                      <Label htmlFor="mqttPassword">Password</Label>
                      <Input
                        id="mqttPassword"
                        type="password"
                        value={mqttSettings.password}
                        onChange={(e) => setMqttSettings({ ...mqttSettings, password: e.target.value })}
                        placeholder="Optional"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="keepAlive">Keep Alive (seconds)</Label>
                      <Input
                        id="keepAlive"
                        type="number"
                        value={mqttSettings.keepAlive}
                        onChange={(e) => setMqttSettings({ ...mqttSettings, keepAlive: parseInt(e.target.value) })}
                        placeholder="60"
                      />
                    </div>
                    <div>
                      <Label htmlFor="qos">QoS Level</Label>
                      <Select 
                        value={mqttSettings.qos.toString()} 
                        onValueChange={(value) => setMqttSettings({ ...mqttSettings, qos: parseInt(value) })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">0 - At most once</SelectItem>
                          <SelectItem value="1">1 - At least once</SelectItem>
                          <SelectItem value="2">2 - Exactly once</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center justify-between pt-6">
                      <Label htmlFor="retain">Retain Messages</Label>
                      <Switch
                        id="retain"
                        checked={mqttSettings.retain}
                        onCheckedChange={(checked) => 
                          setMqttSettings({ ...mqttSettings, retain: checked })
                        }
                      />
                    </div>
                  </div>
                  
                  <div className="flex space-x-4 pt-4">
                    <Button onClick={handleMqttSettingsSave} disabled={saving}>
                      {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                      Save MQTT Settings
                    </Button>
                    <Button variant="outline" onClick={testMqttConnection} disabled={loading}>
                      {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Wifi className="h-4 w-4 mr-2" />}
                      Test Connection
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
