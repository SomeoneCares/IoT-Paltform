import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useDevices } from '@/contexts/DeviceContext'
import { useOrganizations } from '@/contexts/OrganizationContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { 
  Activity, 
  Plus, 
  Edit, 
  Trash2, 
  Thermometer, 
  Droplets, 
  Eye, 
  Lightbulb, 
  DoorOpen,
  Wifi,
  WifiOff,
  Settings
} from 'lucide-react'

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

export default function DeviceManagement() {
  const { user } = useAuth()
  const { devices, loading, addDevice, updateDevice, deleteDevice } = useDevices()
  const { getAllRooms } = useOrganizations()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingDevice, setEditingDevice] = useState(null)
  const [selectedDevice, setSelectedDevice] = useState(null)
  const [availableRooms, setAvailableRooms] = useState([])
  const [formData, setFormData] = useState({
    device_id: '',
    name: '',
    device_type: 'temperature_sensor',
    location: '',  // Legacy field
    room_id: '',   // New room association
    config: {}
  })

  const handleCreateDevice = async (e) => {
    e.preventDefault()
    const result = await addDevice(formData)
    
    if (result.success) {
      setIsCreateDialogOpen(false)
      setFormData({ device_id: '', name: '', device_type: 'temperature_sensor', location: '', room_id: '', config: {} })
    } else {
      alert(`Error: ${result.error}`)
    }
  }

  const handleUpdateDevice = async (e) => {
    e.preventDefault()
    const result = await updateDevice(editingDevice.device_id, {
      name: formData.name,
      location: formData.location,  // Legacy field
      room_id: formData.room_id,    // New room association
      status: formData.status
    })
    
    if (result.success) {
      setIsEditDialogOpen(false)
      setEditingDevice(null)
      setFormData({ device_id: '', name: '', device_type: 'temperature_sensor', location: '', room_id: '', config: {} })
    } else {
      alert(`Error: ${result.error}`)
    }
  }

  const handleDeleteDevice = async (deviceId) => {
    const result = await deleteDevice(deviceId)
    
    if (!result.success) {
      alert(`Error: ${result.error}`)
    }
  }

  const openEditDialog = (device) => {
    setEditingDevice(device)
    setFormData({
      device_id: device.device_id,
      name: device.name,
      device_type: device.device_type,
      location: device.location || '',  // Legacy field
      room_id: device.room_id || '',    // New room association
      status: device.status
    })
    setIsEditDialogOpen(true)
  }

  // Load available rooms when component mounts
  useEffect(() => {
    const loadRooms = async () => {
      try {
        const rooms = await getAllRooms()
        setAvailableRooms(rooms)
      } catch (error) {
        console.error('Error loading rooms:', error)
        setAvailableRooms([])
      }
    }
    loadRooms()
  }, [getAllRooms])

  const getRoomDisplayName = (device) => {
    if (device.room) {
      return `${device.room.name} (${device.room.location?.name || 'Unknown Location'})`
    }
    return device.location || 'Not assigned'
  }

  const getDeviceIcon = (deviceType) => {
    const IconComponent = deviceIcons[deviceType] || deviceIcons.default
    return <IconComponent className="h-4 w-4" />
  }

  const getDeviceBadge = (deviceType) => {
    const colorClass = deviceColors[deviceType] || deviceColors.default
    return <Badge className={colorClass}>{deviceType.replace('_', ' ')}</Badge>
  }

  const getStatusBadge = (status) => {
    return status === 'online' ? (
      <Badge variant="default" className="bg-green-100 text-green-800">
        <Wifi className="h-3 w-3 mr-1" />
        Online
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-red-100 text-red-800">
        <WifiOff className="h-3 w-3 mr-1" />
        Offline
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading devices...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Device Management</h1>
            <p className="text-muted-foreground">Manage your IoT devices and sensors</p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Device
          </Button>
          
          {/* Add Device Modal */}
          {isCreateDialogOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="fixed inset-0 bg-black/50" onClick={() => setIsCreateDialogOpen(false)}></div>
              <div className="relative bg-white p-6 rounded-lg shadow-lg max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Add New Device</h2>
                  <button
                    onClick={() => setIsCreateDialogOpen(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <p className="text-sm text-gray-600 mb-6">Register a new IoT device to the platform</p>
                
                <form onSubmit={handleCreateDevice}>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="device_id">Device ID</Label>
                      <Input
                        id="device_id"
                        value={formData.device_id}
                        onChange={(e) => setFormData({ ...formData, device_id: e.target.value })}
                        placeholder="e.g., sensor_001"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="name">Device Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Living Room Temperature Sensor"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="device_type">Device Type</Label>
                      <Select value={formData.device_type} onValueChange={(value) => setFormData({ ...formData, device_type: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="temperature_sensor">Temperature Sensor</SelectItem>
                          <SelectItem value="humidity_sensor">Humidity Sensor</SelectItem>
                          <SelectItem value="motion_sensor">Motion Sensor</SelectItem>
                          <SelectItem value="smart_light">Smart Light</SelectItem>
                          <SelectItem value="door_sensor">Door Sensor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="room">Room</Label>
                      <Select value={formData.room_id || "none"} onValueChange={(value) => setFormData({ ...formData, room_id: value === "none" ? "" : value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a room" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No room assigned</SelectItem>
                          {availableRooms.map((room) => (
                            <SelectItem key={room.id} value={room.id.toString()}>
                              {room.name} - {room.location?.name} ({room.organization?.name})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="location">Location (Legacy)</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="e.g., Living Room (for backward compatibility)"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2 mt-6">
                    <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Add Device</Button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* Two-column layout for devices and details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Devices Card */}
          <Card>
            <CardHeader>
              <CardTitle>Devices ({devices.length})</CardTitle>
              <CardDescription>
                Manage your connected IoT devices and sensors
              </CardDescription>
            </CardHeader>
            <CardContent>
              {devices.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="h-8 w-8 mx-auto mb-3 text-gray-400" />
                  <h3 className="text-base font-medium text-gray-900 mb-2">No devices found</h3>
                  <p className="text-sm text-gray-500 mb-3">Get started by adding your first IoT device</p>
                  <Button size="sm" onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Device
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {devices.map((device) => (
                    <div
                      key={device.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedDevice?.id === device.id
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedDevice(device)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {getDeviceIcon(device.device_type)}
                          <div>
                            <div className="font-medium text-sm">{device.name}</div>
                            <div className="text-xs text-gray-500">{device.device_id}</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(device.status)}
                          <div className="flex space-x-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                openEditDialog(device)
                              }}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="h-6 w-6 p-0"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Device</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete device "{device.name}"? 
                                    This action cannot be undone and will remove all associated data.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteDevice(device.device_id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Device Details Card */}
          <Card>
            <CardHeader>
              <CardTitle>Device Details</CardTitle>
              <CardDescription>
                {selectedDevice ? `Viewing details for ${selectedDevice.name}` : 'Select a device to view details'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedDevice ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    {getDeviceIcon(selectedDevice.device_type)}
                    <div>
                      <h3 className="font-semibold">{selectedDevice.name}</h3>
                      <p className="text-sm text-gray-500">{selectedDevice.device_id}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-medium text-gray-500">Type</Label>
                      <div className="mt-1">{getDeviceBadge(selectedDevice.device_type)}</div>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-500">Status</Label>
                      <div className="mt-1">{getStatusBadge(selectedDevice.status)}</div>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-medium text-gray-500">Room/Location</Label>
                    <p className="text-sm mt-1">{getRoomDisplayName(selectedDevice)}</p>
                  </div>

                  <div>
                    <Label className="text-xs font-medium text-gray-500">Last Seen</Label>
                    <p className="text-sm mt-1">
                      {selectedDevice.last_seen 
                        ? new Date(selectedDevice.last_seen).toLocaleString()
                        : 'Never'
                      }
                    </p>
                  </div>

                  {selectedDevice.config && Object.keys(selectedDevice.config).length > 0 && (
                    <div>
                      <Label className="text-xs font-medium text-gray-500">Configuration</Label>
                      <div className="mt-1 p-2 bg-gray-50 rounded text-xs font-mono">
                        {JSON.stringify(selectedDevice.config, null, 2)}
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditDialog(selectedDevice)}
                      className="flex-1"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="outline" className="flex-1">
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Device</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete device "{selectedDevice.name}"? 
                            This action cannot be undone and will remove all associated data.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteDevice(selectedDevice.device_id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Settings className="h-8 w-8 mx-auto mb-3 text-gray-400" />
                  <h3 className="text-base font-medium text-gray-900 mb-2">No device selected</h3>
                  <p className="text-sm text-gray-500">Click on a device from the list to view its details</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Edit Device Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Device</DialogTitle>
              <DialogDescription>
                Update device information
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateDevice}>
              <div className="space-y-4">
                <div>
                  <Label>Device ID</Label>
                  <Input value={formData.device_id} disabled />
                </div>
                <div>
                  <Label htmlFor="edit-name">Device Name</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Device Type</Label>
                  <Input value={formData.device_type.replace('_', ' ')} disabled />
                </div>
                <div>
                  <Label htmlFor="edit-room">Room</Label>
                  <Select value={formData.room_id} onValueChange={(value) => setFormData({ ...formData, room_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a room" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No room assigned</SelectItem>
                      {availableRooms.map((room) => (
                        <SelectItem key={room.id} value={room.id.toString()}>
                          {room.name} - {room.location?.name} ({room.organization?.name})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-location">Location (Legacy)</Label>
                  <Input
                    id="edit-location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Legacy location field"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-status">Status</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="online">Online</SelectItem>
                      <SelectItem value="offline">Offline</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Update Device</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
