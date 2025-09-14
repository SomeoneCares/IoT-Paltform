import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useDevices } from '@/contexts/DeviceContext'
import { useAutomations } from '@/contexts/AutomationContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { 
  Zap, 
  Plus, 
  Edit, 
  Trash2, 
  Play,
  Pause,
  Settings,
  Clock,
  Target,
  Activity,
  Thermometer,
  Droplets,
  Eye,
  Lightbulb,
  DoorOpen
} from 'lucide-react'

// Device type icons mapping
const deviceIcons = {
  temperature_sensor: Thermometer,
  humidity_sensor: Droplets,
  motion_sensor: Eye,
  smart_light: Lightbulb,
  door_sensor: DoorOpen,
  default: Activity
}

// Condition operators
const conditionOperators = [
  { value: 'equals', label: 'Equals' },
  { value: 'greater_than', label: 'Greater than' },
  { value: 'less_than', label: 'Less than' },
  { value: 'not_equals', label: 'Not equals' },
  { value: 'contains', label: 'Contains' }
]

// Action types
const actionTypes = [
  { value: 'send_notification', label: 'Send Notification' },
  { value: 'control_device', label: 'Control Device' },
  { value: 'set_scene', label: 'Set Scene' },
  { value: 'log_event', label: 'Log Event' }
]

export default function AutomationManagement() {
  const { user } = useAuth()
  const { devices } = useDevices()
  const { automations, addAutomation, updateAutomation, deleteAutomation, toggleAutomation } = useAutomations()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingAutomation, setEditingAutomation] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    enabled: true,
    trigger: {
      type: 'device_value',
      device_id: '',
      condition: 'equals',
      value: ''
    },
    actions: [{
      type: 'send_notification',
      device_id: '',
      value: '',
      message: ''
    }]
  })

  const handleCreateAutomation = async (e) => {
    e.preventDefault()
    const result = await addAutomation(formData)
    
    if (result.success) {
      setIsCreateDialogOpen(false)
      setFormData({
        name: '',
        description: '',
        enabled: true,
        trigger: {
          type: 'device_value',
          device_id: '',
          condition: 'equals',
          value: ''
        },
        actions: [{
          type: 'send_notification',
          device_id: '',
          value: '',
          message: ''
        }]
      })
    } else {
      alert(`Error: ${result.error}`)
    }
  }

  const handleUpdateAutomation = async (e) => {
    e.preventDefault()
    const result = await updateAutomation(editingAutomation.id, formData)
    
    if (result.success) {
      setIsEditDialogOpen(false)
      setEditingAutomation(null)
    } else {
      alert(`Error: ${result.error}`)
    }
  }

  const handleDeleteAutomation = async (automationId) => {
    const result = await deleteAutomation(automationId)
    
    if (!result.success) {
      alert(`Error: ${result.error}`)
    }
  }

  const handleToggleAutomation = async (automationId) => {
    const result = await toggleAutomation(automationId)
    
    if (!result.success) {
      alert(`Error: ${result.error}`)
    }
  }

  const openEditDialog = (automation) => {
    setEditingAutomation(automation)
    setFormData(automation)
    setIsEditDialogOpen(true)
  }

  const getDeviceIcon = (deviceType) => {
    const IconComponent = deviceIcons[deviceType] || deviceIcons.default
    return <IconComponent className="h-4 w-4" />
  }

  const getDeviceName = (deviceId) => {
    const device = devices.find(d => d.device_id === deviceId)
    return device ? device.name : deviceId
  }

  const getDeviceType = (deviceId) => {
    const device = devices.find(d => d.device_id === deviceId)
    return device ? device.device_type : 'unknown'
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Automation Management</h1>
            <p className="text-muted-foreground">Create and manage automation rules for your IoT devices</p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Automation
          </Button>
        </div>

        {/* Two-column layout for automations and details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Automations List */}
          <Card>
            <CardHeader>
              <CardTitle>Automations ({automations.length})</CardTitle>
              <CardDescription>
                Manage your automation rules and triggers
              </CardDescription>
            </CardHeader>
            <CardContent>
              {automations.length === 0 ? (
                <div className="text-center py-8">
                  <Zap className="h-8 w-8 mx-auto mb-3 text-gray-400" />
                  <h3 className="text-base font-medium text-gray-900 mb-2">No automations found</h3>
                  <p className="text-sm text-gray-500 mb-3">Create your first automation rule</p>
                  <Button size="sm" onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Automation
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {automations.map((automation) => (
                    <div
                      key={automation.id}
                      className="p-4 rounded-lg border bg-white border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <Zap className="h-4 w-4 text-blue-500" />
                          <div>
                            <h3 className="font-medium text-sm">{automation.name}</h3>
                            <p className="text-xs text-gray-500">{automation.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={automation.enabled}
                            onCheckedChange={() => handleToggleAutomation(automation.id)}
                            size="sm"
                          />
                          <div className="flex space-x-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={() => openEditDialog(automation)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Automation</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete automation "{automation.name}"? 
                                    This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteAutomation(automation.id)}
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
                      
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Target className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-600">
                            When {getDeviceName(automation.trigger.device_id)} {automation.trigger.condition} {automation.trigger.value}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Activity className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-600">
                            {automation.actions.map(action => action.type.replace('_', ' ')).join(', ')}
                          </span>
                        </div>
                        {automation.last_triggered && (
                          <div className="flex items-center space-x-2">
                            <Clock className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-600">
                              Last triggered: {new Date(automation.last_triggered).toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Automation Builder */}
          <Card>
            <CardHeader>
              <CardTitle>Automation Builder</CardTitle>
              <CardDescription>
                Create new automation rules with triggers and actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium mb-3">Quick Start Templates</h3>
                  <div className="grid grid-cols-1 gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="justify-start"
                      onClick={() => {
                        setFormData({
                          name: 'Temperature Alert',
                          description: 'Send notification when temperature exceeds threshold',
                          enabled: true,
                          trigger: {
                            type: 'device_value',
                            device_id: '',
                            condition: 'greater_than',
                            value: '25'
                          },
                          actions: [{
                            type: 'send_notification',
                            message: 'Temperature is too high!'
                          }]
                        })
                        setIsCreateDialogOpen(true)
                      }}
                    >
                      <Thermometer className="h-4 w-4 mr-2" />
                      Temperature Alert
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="justify-start"
                      onClick={() => {
                        setFormData({
                          name: 'Motion Light',
                          description: 'Turn on light when motion is detected',
                          enabled: true,
                          trigger: {
                            type: 'device_value',
                            device_id: '',
                            condition: 'equals',
                            value: 'motion_detected'
                          },
                          actions: [{
                            type: 'control_device',
                            device_id: '',
                            value: 'on'
                          }]
                        })
                        setIsCreateDialogOpen(true)
                      }}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Motion Light
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="justify-start"
                      onClick={() => {
                        setFormData({
                          name: 'Humidity Control',
                          description: 'Control device based on humidity levels',
                          enabled: true,
                          trigger: {
                            type: 'device_value',
                            device_id: '',
                            condition: 'greater_than',
                            value: '60'
                          },
                          actions: [{
                            type: 'control_device',
                            device_id: '',
                            value: 'on'
                          }]
                        })
                        setIsCreateDialogOpen(true)
                      }}
                    >
                      <Droplets className="h-4 w-4 mr-2" />
                      Humidity Control
                    </Button>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-3">Recent Activity</h3>
                  <div className="space-y-2">
                    {automations.filter(a => a.last_triggered).slice(0, 3).map((automation) => (
                      <div key={automation.id} className="flex items-center space-x-2 text-xs text-gray-600">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>{automation.name} triggered</span>
                        <span className="text-gray-400">
                          {new Date(automation.last_triggered).toLocaleString()}
                        </span>
                      </div>
                    ))}
                    {automations.filter(a => a.last_triggered).length === 0 && (
                      <p className="text-xs text-gray-500">No recent activity</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Create Automation Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Automation</DialogTitle>
              <DialogDescription>
                Set up triggers and actions for your automation rule
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateAutomation}>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Automation Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Temperature Alert"
                      required
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enabled"
                      checked={formData.enabled}
                      onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
                    />
                    <Label htmlFor="enabled">Enabled</Label>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe what this automation does"
                  />
                </div>

                <div>
                  <Label className="text-base font-medium">Trigger</Label>
                  <div className="grid grid-cols-3 gap-4 mt-2">
                    <div>
                      <Label htmlFor="trigger-device">Device</Label>
                      <Select 
                        value={formData.trigger.device_id} 
                        onValueChange={(value) => setFormData({ 
                          ...formData, 
                          trigger: { ...formData.trigger, device_id: value }
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select device" />
                        </SelectTrigger>
                        <SelectContent>
                          {devices.map((device) => (
                            <SelectItem key={device.device_id} value={device.device_id}>
                              <div className="flex items-center space-x-2">
                                {getDeviceIcon(device.device_type)}
                                <span>{device.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="trigger-condition">Condition</Label>
                      <Select 
                        value={formData.trigger.condition} 
                        onValueChange={(value) => setFormData({ 
                          ...formData, 
                          trigger: { ...formData.trigger, condition: value }
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {conditionOperators.map((op) => (
                            <SelectItem key={op.value} value={op.value}>
                              {op.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="trigger-value">Value</Label>
                      <Input
                        id="trigger-value"
                        value={formData.trigger.value}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          trigger: { ...formData.trigger, value: e.target.value }
                        })}
                        placeholder="e.g., 25"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-base font-medium">Actions</Label>
                  <div className="space-y-3 mt-2">
                    {formData.actions.map((action, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Action Type</Label>
                            <Select 
                              value={action.type} 
                              onValueChange={(value) => {
                                const newActions = [...formData.actions]
                                newActions[index] = { ...action, type: value }
                                setFormData({ ...formData, actions: newActions })
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {actionTypes.map((type) => (
                                  <SelectItem key={type.value} value={type.value}>
                                    {type.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          {action.type === 'control_device' && (
                            <div>
                              <Label>Target Device</Label>
                              <Select 
                                value={action.device_id} 
                                onValueChange={(value) => {
                                  const newActions = [...formData.actions]
                                  newActions[index] = { ...action, device_id: value }
                                  setFormData({ ...formData, actions: newActions })
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select device" />
                                </SelectTrigger>
                                <SelectContent>
                                  {devices.map((device) => (
                                    <SelectItem key={device.device_id} value={device.device_id}>
                                      <div className="flex items-center space-x-2">
                                        {getDeviceIcon(device.device_type)}
                                        <span>{device.name}</span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </div>
                        {action.type === 'send_notification' && (
                          <div className="mt-3">
                            <Label>Message</Label>
                            <Input
                              value={action.message || ''}
                              onChange={(e) => {
                                const newActions = [...formData.actions]
                                newActions[index] = { ...action, message: e.target.value }
                                setFormData({ ...formData, actions: newActions })
                              }}
                              placeholder="Notification message"
                            />
                          </div>
                        )}
                        {action.type === 'control_device' && (
                          <div className="mt-3">
                            <Label>Value</Label>
                            <Input
                              value={action.value || ''}
                              onChange={(e) => {
                                const newActions = [...formData.actions]
                                newActions[index] = { ...action, value: e.target.value }
                                setFormData({ ...formData, actions: newActions })
                              }}
                              placeholder="e.g., on, off, 50"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setFormData({
                        ...formData,
                        actions: [...formData.actions, {
                          type: 'send_notification',
                          device_id: '',
                          value: '',
                          message: ''
                        }]
                      })}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Action
                    </Button>
                  </div>
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Automation</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Automation Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Automation</DialogTitle>
              <DialogDescription>
                Update your automation rule
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateAutomation}>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-name">Automation Name</Label>
                    <Input
                      id="edit-name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="edit-enabled"
                      checked={formData.enabled}
                      onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
                    />
                    <Label htmlFor="edit-enabled">Enabled</Label>
                  </div>
                </div>

                <div>
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Update Automation</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
