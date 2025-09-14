import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useDevices } from '@/contexts/DeviceContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Wifi, 
  Plus, 
  Edit, 
  Trash2, 
  Settings,
  Shield,
  Network,
  Activity,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  RefreshCw
} from 'lucide-react'

const API_BASE = 'http://localhost:5000/api'

export default function MatterThreadManagement() {
  const { user, token } = useAuth()
  const { devices, refreshDevices } = useDevices()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('thread')
  
  // Thread Network State
  const [threadNetworks, setThreadNetworks] = useState([])
  const [isCreateNetworkDialogOpen, setIsCreateNetworkDialogOpen] = useState(false)
  const [isEditNetworkDialogOpen, setIsEditNetworkDialogOpen] = useState(false)
  const [editingNetwork, setEditingNetwork] = useState(null)
  const [networkFormData, setNetworkFormData] = useState({
    name: '',
    network_name: '',
    channel: 15,
    mesh_local_prefix: ''
  })
  
  // Matter Device State
  const [matterDevices, setMatterDevices] = useState([])
  const [isCommissionDialogOpen, setIsCommissionDialogOpen] = useState(false)
  const [commissioningDevice, setCommissioningDevice] = useState(null)
  const [commissionFormData, setCommissionFormData] = useState({
    vendor_id: '',
    product_id: '',
    device_type_id: '',
    fabric_id: '',
    node_id: '',
    certificate: ''
  })
  
  // Device Management State
  const [isJoinNetworkDialogOpen, setIsJoinNetworkDialogOpen] = useState(false)
  const [joiningDevice, setJoiningDevice] = useState(null)
  const [joinFormData, setJoinFormData] = useState({
    network_id: '',
    border_router: false,
    router_role: 'child',
    parent_address: ''
  })
  
  // Reference Data
  const [matterDeviceTypes, setMatterDeviceTypes] = useState({})
  const [matterVendors, setMatterVendors] = useState({})

  useEffect(() => {
    fetchThreadNetworks()
    fetchMatterDevices()
    fetchMatterDeviceTypes()
    fetchMatterVendors()
  }, [])

  const fetchThreadNetworks = async () => {
    try {
      const response = await fetch(`${API_BASE}/thread/networks`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setThreadNetworks(data)
      }
    } catch (error) {
      console.error('Error fetching Thread networks:', error)
    }
  }

  const fetchMatterDevices = async () => {
    try {
      const response = await fetch(`${API_BASE}/matter/devices`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setMatterDevices(data)
      }
    } catch (error) {
      console.error('Error fetching Matter devices:', error)
    }
  }

  const fetchMatterDeviceTypes = async () => {
    try {
      const response = await fetch(`${API_BASE}/matter/device-types`)
      if (response.ok) {
        const data = await response.json()
        setMatterDeviceTypes(data)
      }
    } catch (error) {
      console.error('Error fetching Matter device types:', error)
    }
  }

  const fetchMatterVendors = async () => {
    try {
      const response = await fetch(`${API_BASE}/matter/vendors`)
      if (response.ok) {
        const data = await response.json()
        setMatterVendors(data)
      }
    } catch (error) {
      console.error('Error fetching Matter vendors:', error)
    }
  }

  // Thread Network Management
  const handleCreateThreadNetwork = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const response = await fetch(`${API_BASE}/thread/networks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(networkFormData)
      })

      if (response.ok) {
        await fetchThreadNetworks()
        setIsCreateNetworkDialogOpen(false)
        setNetworkFormData({ name: '', network_name: '', channel: 15, mesh_local_prefix: '' })
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      alert('Network error')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateThreadNetwork = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const response = await fetch(`${API_BASE}/thread/networks/${editingNetwork.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(networkFormData)
      })

      if (response.ok) {
        await fetchThreadNetworks()
        setIsEditNetworkDialogOpen(false)
        setEditingNetwork(null)
        setNetworkFormData({ name: '', network_name: '', channel: 15, mesh_local_prefix: '' })
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      alert('Network error')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteThreadNetwork = async (networkId) => {
    setLoading(true)
    
    try {
      const response = await fetch(`${API_BASE}/thread/networks/${networkId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        await fetchThreadNetworks()
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      alert('Network error')
    } finally {
      setLoading(false)
    }
  }

  // Matter Device Commissioning
  const handleCommissionDevice = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const response = await fetch(`${API_BASE}/matter/devices/${commissioningDevice.device_id}/commission`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(commissionFormData)
      })

      if (response.ok) {
        await fetchMatterDevices()
        await refreshDevices()
        setIsCommissionDialogOpen(false)
        setCommissioningDevice(null)
        setCommissionFormData({ vendor_id: '', product_id: '', device_type_id: '', fabric_id: '', node_id: '', certificate: '' })
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      alert('Network error')
    } finally {
      setLoading(false)
    }
  }

  const handleDecommissionDevice = async (deviceId) => {
    setLoading(true)
    
    try {
      const response = await fetch(`${API_BASE}/matter/devices/${deviceId}/decommission`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        await fetchMatterDevices()
        await refreshDevices()
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      alert('Network error')
    } finally {
      setLoading(false)
    }
  }

  // Thread Device Management
  const handleJoinThreadNetwork = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const response = await fetch(`${API_BASE}/thread/devices/${joiningDevice.device_id}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(joinFormData)
      })

      if (response.ok) {
        await refreshDevices()
        setIsJoinNetworkDialogOpen(false)
        setJoiningDevice(null)
        setJoinFormData({ network_id: '', border_router: false, router_role: 'child', parent_address: '' })
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      alert('Network error')
    } finally {
      setLoading(false)
    }
  }

  const handleLeaveThreadNetwork = async (deviceId) => {
    setLoading(true)
    
    try {
      const response = await fetch(`${API_BASE}/thread/devices/${deviceId}/leave`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        await refreshDevices()
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      alert('Network error')
    } finally {
      setLoading(false)
    }
  }

  // Dialog openers
  const openEditNetworkDialog = (network) => {
    setEditingNetwork(network)
    setNetworkFormData({
      name: network.name,
      network_name: network.network_name,
      channel: network.channel,
      mesh_local_prefix: network.mesh_local_prefix || ''
    })
    setIsEditNetworkDialogOpen(true)
  }

  const openCommissionDialog = (device) => {
    setCommissioningDevice(device)
    setIsCommissionDialogOpen(true)
  }

  const openJoinNetworkDialog = (device) => {
    setJoiningDevice(device)
    setIsJoinNetworkDialogOpen(true)
  }

  const getMatterStatusBadge = (device) => {
    if (device.matter_commissioned) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Commissioned
        </Badge>
      )
    } else {
      return (
        <Badge variant="secondary" className="bg-gray-100 text-gray-800">
          <XCircle className="h-3 w-3 mr-1" />
          Not Commissioned
        </Badge>
      )
    }
  }

  const getThreadStatusBadge = (device) => {
    if (device.thread_enabled) {
      return (
        <Badge variant="default" className="bg-blue-100 text-blue-800">
          <Network className="h-3 w-3 mr-1" />
          {device.thread_router_role || 'Connected'}
        </Badge>
      )
    } else {
      return (
        <Badge variant="secondary" className="bg-gray-100 text-gray-800">
          <XCircle className="h-3 w-3 mr-1" />
          Not Connected
        </Badge>
      )
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Matter & Thread Management</h1>
          <p className="text-muted-foreground">Manage Matter device commissioning and Thread network configuration</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="thread" className="flex items-center space-x-2">
              <Network className="h-4 w-4" />
              <span>Thread Networks</span>
            </TabsTrigger>
            <TabsTrigger value="matter" className="flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>Matter Devices</span>
            </TabsTrigger>
            <TabsTrigger value="devices" className="flex items-center space-x-2">
              <Activity className="h-4 w-4" />
              <span>Device Management</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="thread" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Thread Networks</CardTitle>
                    <CardDescription>
                      Manage Thread mesh networks for your IoT devices
                    </CardDescription>
                  </div>
                  <Dialog open={isCreateNetworkDialogOpen} onOpenChange={setIsCreateNetworkDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Network
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create Thread Network</DialogTitle>
                        <DialogDescription>
                          Set up a new Thread mesh network
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleCreateThreadNetwork}>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="network-name">Network Name</Label>
                            <Input
                              id="network-name"
                              value={networkFormData.name}
                              onChange={(e) => setNetworkFormData({ ...networkFormData, name: e.target.value })}
                              placeholder="e.g., Home Network"
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="thread-name">Thread Network Name</Label>
                            <Input
                              id="thread-name"
                              value={networkFormData.network_name}
                              onChange={(e) => setNetworkFormData({ ...networkFormData, network_name: e.target.value })}
                              placeholder="e.g., ThreadHome"
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="channel">Channel</Label>
                            <Select 
                              value={networkFormData.channel.toString()} 
                              onValueChange={(value) => setNetworkFormData({ ...networkFormData, channel: parseInt(value) })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Array.from({length: 16}, (_, i) => i + 11).map(channel => (
                                  <SelectItem key={channel} value={channel.toString()}>
                                    Channel {channel}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="mesh-prefix">Mesh Local Prefix (Optional)</Label>
                            <Input
                              id="mesh-prefix"
                              value={networkFormData.mesh_local_prefix}
                              onChange={(e) => setNetworkFormData({ ...networkFormData, mesh_local_prefix: e.target.value })}
                              placeholder="e.g., fd00:db8::/64"
                            />
                          </div>
                        </div>
                        <DialogFooter className="mt-6">
                          <Button type="button" variant="outline" onClick={() => setIsCreateNetworkDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button type="submit" disabled={loading}>
                            {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                            Create Network
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {threadNetworks.length === 0 ? (
                  <div className="text-center py-12">
                    <Network className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Thread networks found</h3>
                    <p className="text-gray-500 mb-4">Create your first Thread network to get started</p>
                    <Button onClick={() => setIsCreateNetworkDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Network
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Network</TableHead>
                        <TableHead>Thread Name</TableHead>
                        <TableHead>Channel</TableHead>
                        <TableHead>Extended PAN ID</TableHead>
                        <TableHead>Devices</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {threadNetworks.map((network) => (
                        <TableRow key={network.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{network.name}</div>
                              <div className="text-sm text-gray-500">ID: {network.id}</div>
                            </div>
                          </TableCell>
                          <TableCell>{network.network_name}</TableCell>
                          <TableCell>Channel {network.channel}</TableCell>
                          <TableCell>
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {network.extended_pan_id}
                            </code>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{network.devices_count} devices</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={network.is_active ? "default" : "secondary"}>
                              {network.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEditNetworkDialog(network)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="outline">
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Thread Network</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete "{network.name}"? 
                                      This action cannot be undone and will disconnect all devices from this network.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteThreadNetwork(network.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="matter" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Matter Devices</CardTitle>
                <CardDescription>
                  Manage Matter-commissioned devices and their certificates
                </CardDescription>
              </CardHeader>
              <CardContent>
                {matterDevices.length === 0 ? (
                  <div className="text-center py-12">
                    <Shield className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Matter devices found</h3>
                    <p className="text-gray-500 mb-4">Commission devices to enable Matter protocol support</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Device</TableHead>
                        <TableHead>Vendor</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Device Type</TableHead>
                        <TableHead>Fabric ID</TableHead>
                        <TableHead>Commissioned</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {matterDevices.map((device) => (
                        <TableRow key={device.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{device.name}</div>
                              <div className="text-sm text-gray-500">{device.device_id}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {device.matter_vendor_id}
                            </code>
                          </TableCell>
                          <TableCell>
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {device.matter_product_id}
                            </code>
                          </TableCell>
                          <TableCell>
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {device.matter_device_type_id}
                            </code>
                          </TableCell>
                          <TableCell>
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {device.matter_fabric_id}
                            </code>
                          </TableCell>
                          <TableCell>
                            {getMatterStatusBadge(device)}
                          </TableCell>
                          <TableCell>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="outline">
                                  <XCircle className="h-3 w-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Decommission Matter Device</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to decommission "{device.name}"? 
                                    This will remove all Matter protocol configuration from the device.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDecommissionDevice(device.device_id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Decommission
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="devices" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Device Management</CardTitle>
                <CardDescription>
                  Manage Matter commissioning and Thread network connections for your devices
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Device</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Matter Status</TableHead>
                      <TableHead>Thread Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {devices.map((device) => (
                      <TableRow key={device.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{device.name}</div>
                            <div className="text-sm text-gray-500">{device.device_id}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{device.device_type.replace('_', ' ')}</Badge>
                        </TableCell>
                        <TableCell>{getMatterStatusBadge(device)}</TableCell>
                        <TableCell>{getThreadStatusBadge(device)}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            {!device.matter_commissioned && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openCommissionDialog(device)}
                              >
                                <Shield className="h-3 w-3 mr-1" />
                                Commission
                              </Button>
                            )}
                            {!device.thread_enabled && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openJoinNetworkDialog(device)}
                              >
                                <Network className="h-3 w-3 mr-1" />
                                Join Thread
                              </Button>
                            )}
                            {device.thread_enabled && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleLeaveThreadNetwork(device.device_id)}
                              >
                                <XCircle className="h-3 w-3 mr-1" />
                                Leave Thread
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Thread Network Dialog */}
        <Dialog open={isEditNetworkDialogOpen} onOpenChange={setIsEditNetworkDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Thread Network</DialogTitle>
              <DialogDescription>
                Update Thread network configuration
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateThreadNetwork}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-network-name">Network Name</Label>
                  <Input
                    id="edit-network-name"
                    value={networkFormData.name}
                    onChange={(e) => setNetworkFormData({ ...networkFormData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-thread-name">Thread Network Name</Label>
                  <Input
                    id="edit-thread-name"
                    value={networkFormData.network_name}
                    onChange={(e) => setNetworkFormData({ ...networkFormData, network_name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-channel">Channel</Label>
                  <Select 
                    value={networkFormData.channel.toString()} 
                    onValueChange={(value) => setNetworkFormData({ ...networkFormData, channel: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({length: 16}, (_, i) => i + 11).map(channel => (
                        <SelectItem key={channel} value={channel.toString()}>
                          Channel {channel}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-mesh-prefix">Mesh Local Prefix</Label>
                  <Input
                    id="edit-mesh-prefix"
                    value={networkFormData.mesh_local_prefix}
                    onChange={(e) => setNetworkFormData({ ...networkFormData, mesh_local_prefix: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setIsEditNetworkDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Edit className="h-4 w-4 mr-2" />}
                  Update Network
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Commission Matter Device Dialog */}
        <Dialog open={isCommissionDialogOpen} onOpenChange={setIsCommissionDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Commission Matter Device</DialogTitle>
              <DialogDescription>
                Configure Matter protocol for {commissioningDevice?.name}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCommissionDevice}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="vendor-id">Vendor ID</Label>
                  <Select 
                    value={commissionFormData.vendor_id} 
                    onValueChange={(value) => setCommissionFormData({ ...commissionFormData, vendor_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(matterVendors).map(([key, vendor]) => (
                        <SelectItem key={key} value={vendor.id}>
                          {vendor.name} ({vendor.id})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="product-id">Product ID</Label>
                  <Input
                    id="product-id"
                    value={commissionFormData.product_id}
                    onChange={(e) => setCommissionFormData({ ...commissionFormData, product_id: e.target.value })}
                    placeholder="e.g., 0x0001"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="device-type-id">Device Type ID</Label>
                  <Select 
                    value={commissionFormData.device_type_id} 
                    onValueChange={(value) => setCommissionFormData({ ...commissionFormData, device_type_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select device type" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(matterDeviceTypes).map(([key, deviceType]) => (
                        <SelectItem key={key} value={deviceType.id}>
                          {deviceType.name} ({deviceType.id})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="fabric-id">Fabric ID</Label>
                  <Input
                    id="fabric-id"
                    value={commissionFormData.fabric_id}
                    onChange={(e) => setCommissionFormData({ ...commissionFormData, fabric_id: e.target.value })}
                    placeholder="e.g., 0x0000000000000001"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="node-id">Node ID</Label>
                  <Input
                    id="node-id"
                    value={commissionFormData.node_id}
                    onChange={(e) => setCommissionFormData({ ...commissionFormData, node_id: e.target.value })}
                    placeholder="e.g., 0x0000000000000001"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="certificate">Certificate (Optional)</Label>
                  <Input
                    id="certificate"
                    value={commissionFormData.certificate}
                    onChange={(e) => setCommissionFormData({ ...commissionFormData, certificate: e.target.value })}
                    placeholder="Device certificate"
                  />
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setIsCommissionDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Shield className="h-4 w-4 mr-2" />}
                  Commission Device
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Join Thread Network Dialog */}
        <Dialog open={isJoinNetworkDialogOpen} onOpenChange={setIsJoinNetworkDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Join Thread Network</DialogTitle>
              <DialogDescription>
                Connect {joiningDevice?.name} to a Thread network
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleJoinThreadNetwork}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="select-network">Thread Network</Label>
                  <Select 
                    value={joinFormData.network_id} 
                    onValueChange={(value) => setJoinFormData({ ...joinFormData, network_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select network" />
                    </SelectTrigger>
                    <SelectContent>
                      {threadNetworks.map((network) => (
                        <SelectItem key={network.id} value={network.id.toString()}>
                          {network.name} (Channel {network.channel})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="router-role">Router Role</Label>
                  <Select 
                    value={joinFormData.router_role} 
                    onValueChange={(value) => setJoinFormData({ ...joinFormData, router_role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="child">Child</SelectItem>
                      <SelectItem value="router">Router</SelectItem>
                      <SelectItem value="leader">Leader</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="parent-address">Parent Address (Optional)</Label>
                  <Input
                    id="parent-address"
                    value={joinFormData.parent_address}
                    onChange={(e) => setJoinFormData({ ...joinFormData, parent_address: e.target.value })}
                    placeholder="e.g., fd00:db8::1"
                  />
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setIsJoinNetworkDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Network className="h-4 w-4 mr-2" />}
                  Join Network
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
