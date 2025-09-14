import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Building2, 
  Plus, 
  Edit, 
  Trash2, 
  MapPin, 
  Users, 
  Settings,
  Eye,
  EyeOff
} from 'lucide-react'

const API_BASE = 'http://localhost:5000/api'

export default function OrganizationManagement() {
  const { user, token } = useAuth()
  const [organizations, setOrganizations] = useState([])
  const [locations, setLocations] = useState([])
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('organizations')
  const [selectedOrg, setSelectedOrg] = useState(null)
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [selectedRoom, setSelectedRoom] = useState(null)
  
  // Dialog states
  const [isCreateOrgDialogOpen, setIsCreateOrgDialogOpen] = useState(false)
  const [isEditOrgDialogOpen, setIsEditOrgDialogOpen] = useState(false)
  const [isCreateLocationDialogOpen, setIsCreateLocationDialogOpen] = useState(false)
  const [isEditLocationDialogOpen, setIsEditLocationDialogOpen] = useState(false)
  const [isCreateRoomDialogOpen, setIsCreateRoomDialogOpen] = useState(false)
  const [isEditRoomDialogOpen, setIsEditRoomDialogOpen] = useState(false)
  
  // Form data
  const [orgFormData, setOrgFormData] = useState({
    name: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    website: ''
  })
  
  const [locationFormData, setLocationFormData] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postal_code: '',
    latitude: '',
    longitude: ''
  })
  
  const [roomFormData, setRoomFormData] = useState({
    name: '',
    description: '',
    room_type: '',
    floor: '',
    area_sqft: ''
  })

  useEffect(() => {
    fetchOrganizations()
  }, [])

  const fetchOrganizations = async () => {
    try {
      const response = await fetch(`${API_BASE}/organizations`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setOrganizations(data)
      }
    } catch (error) {
      console.error('Error fetching organizations:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchLocations = async (orgId) => {
    try {
      const response = await fetch(`${API_BASE}/organizations/${orgId}/locations`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setLocations(data)
      }
    } catch (error) {
      console.error('Error fetching locations:', error)
    }
  }

  const fetchRooms = async (locationId) => {
    try {
      const response = await fetch(`${API_BASE}/locations/${locationId}/rooms`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setRooms(data)
      }
    } catch (error) {
      console.error('Error fetching rooms:', error)
    }
  }

  // Organization handlers
  const handleCreateOrganization = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch(`${API_BASE}/organizations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(orgFormData)
      })

      if (response.ok) {
        await fetchOrganizations()
        setIsCreateOrgDialogOpen(false)
        setOrgFormData({ name: '', description: '', address: '', phone: '', email: '', website: '' })
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      alert('Network error')
    }
  }

  const handleUpdateOrganization = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch(`${API_BASE}/organizations/${selectedOrg.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(orgFormData)
      })

      if (response.ok) {
        await fetchOrganizations()
        setIsEditOrgDialogOpen(false)
        setSelectedOrg(null)
        setOrgFormData({ name: '', description: '', address: '', phone: '', email: '', website: '' })
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      alert('Network error')
    }
  }

  const handleDeleteOrganization = async (orgId) => {
    try {
      const response = await fetch(`${API_BASE}/organizations/${orgId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        await fetchOrganizations()
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      alert('Network error')
    }
  }

  // Location handlers
  const handleCreateLocation = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch(`${API_BASE}/organizations/${selectedOrg.id}/locations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(locationFormData)
      })

      if (response.ok) {
        await fetchLocations(selectedOrg.id)
        setIsCreateLocationDialogOpen(false)
        setLocationFormData({ name: '', description: '', address: '', city: '', state: '', country: '', postal_code: '', latitude: '', longitude: '' })
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      alert('Network error')
    }
  }

  const handleUpdateLocation = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch(`${API_BASE}/locations/${selectedLocation.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(locationFormData)
      })

      if (response.ok) {
        await fetchLocations(selectedOrg.id)
        setIsEditLocationDialogOpen(false)
        setSelectedLocation(null)
        setLocationFormData({ name: '', description: '', address: '', city: '', state: '', country: '', postal_code: '', latitude: '', longitude: '' })
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      alert('Network error')
    }
  }

  const handleDeleteLocation = async (locationId) => {
    try {
      const response = await fetch(`${API_BASE}/locations/${locationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        await fetchLocations(selectedOrg.id)
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      alert('Network error')
    }
  }

  // Room handlers
  const handleCreateRoom = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch(`${API_BASE}/locations/${selectedLocation.id}/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(roomFormData)
      })

      if (response.ok) {
        await fetchRooms(selectedLocation.id)
        setIsCreateRoomDialogOpen(false)
        setRoomFormData({ name: '', description: '', room_type: '', floor: '', area_sqft: '' })
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      alert('Network error')
    }
  }

  const handleUpdateRoom = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch(`${API_BASE}/rooms/${selectedRoom.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(roomFormData)
      })

      if (response.ok) {
        await fetchRooms(selectedLocation.id)
        setIsEditRoomDialogOpen(false)
        setSelectedRoom(null)
        setRoomFormData({ name: '', description: '', room_type: '', floor: '', area_sqft: '' })
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      alert('Network error')
    }
  }

  const handleDeleteRoom = async (roomId) => {
    try {
      const response = await fetch(`${API_BASE}/rooms/${roomId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        await fetchRooms(selectedLocation.id)
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      alert('Network error')
    }
  }

  // Dialog openers
  const openEditOrgDialog = (org) => {
    setSelectedOrg(org)
    setOrgFormData({
      name: org.name,
      description: org.description || '',
      address: org.address || '',
      phone: org.phone || '',
      email: org.email || '',
      website: org.website || ''
    })
    setIsEditOrgDialogOpen(true)
  }

  const openEditLocationDialog = (location) => {
    setSelectedLocation(location)
    setLocationFormData({
      name: location.name,
      description: location.description || '',
      address: location.address || '',
      city: location.city || '',
      state: location.state || '',
      country: location.country || '',
      postal_code: location.postal_code || '',
      latitude: location.latitude || '',
      longitude: location.longitude || ''
    })
    setIsEditLocationDialogOpen(true)
  }

  const openEditRoomDialog = (room) => {
    setSelectedRoom(room)
    setRoomFormData({
      name: room.name,
      description: room.description || '',
      room_type: room.room_type || '',
      floor: room.floor || '',
      area_sqft: room.area_sqft || ''
    })
    setIsEditRoomDialogOpen(true)
  }

  const selectOrganization = (org) => {
    setSelectedOrg(org)
    setActiveTab('locations')
    fetchLocations(org.id)
  }

  const selectLocation = (location) => {
    setSelectedLocation(location)
    setActiveTab('rooms')
    fetchRooms(location.id)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Building2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading organizations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Organization Management</h1>
            <p className="text-gray-600">Manage organizations, locations, and rooms</p>
          </div>
          <Dialog open={isCreateOrgDialogOpen} onOpenChange={setIsCreateOrgDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Organization
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Organization</DialogTitle>
                <DialogDescription>
                  Set up a new organization to manage locations and rooms
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateOrganization}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="org-name">Organization Name</Label>
                    <Input
                      id="org-name"
                      value={orgFormData.name}
                      onChange={(e) => setOrgFormData({ ...orgFormData, name: e.target.value })}
                      placeholder="e.g., Acme Corporation"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="org-description">Description</Label>
                    <Textarea
                      id="org-description"
                      value={orgFormData.description}
                      onChange={(e) => setOrgFormData({ ...orgFormData, description: e.target.value })}
                      placeholder="Brief description of the organization"
                    />
                  </div>
                  <div>
                    <Label htmlFor="org-phone">Phone</Label>
                    <Input
                      id="org-phone"
                      value={orgFormData.phone}
                      onChange={(e) => setOrgFormData({ ...orgFormData, phone: e.target.value })}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  <div>
                    <Label htmlFor="org-email">Email</Label>
                    <Input
                      id="org-email"
                      type="email"
                      value={orgFormData.email}
                      onChange={(e) => setOrgFormData({ ...orgFormData, email: e.target.value })}
                      placeholder="contact@organization.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="org-website">Website</Label>
                    <Input
                      id="org-website"
                      value={orgFormData.website}
                      onChange={(e) => setOrgFormData({ ...orgFormData, website: e.target.value })}
                      placeholder="https://www.organization.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="org-address">Address</Label>
                    <Input
                      id="org-address"
                      value={orgFormData.address}
                      onChange={(e) => setOrgFormData({ ...orgFormData, address: e.target.value })}
                      placeholder="123 Main St, City, State"
                    />
                  </div>
                </div>
                <DialogFooter className="mt-6">
                  <Button type="button" variant="outline" onClick={() => setIsCreateOrgDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Organization</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="organizations">Organizations</TabsTrigger>
            <TabsTrigger value="locations" disabled={!selectedOrg}>Locations</TabsTrigger>
            <TabsTrigger value="rooms" disabled={!selectedLocation}>Rooms</TabsTrigger>
          </TabsList>

          <TabsContent value="organizations" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Organizations ({organizations.length})</CardTitle>
                <CardDescription>
                  Manage your organizations and their settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                {organizations.length === 0 ? (
                  <div className="text-center py-12">
                    <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No organizations found</h3>
                    <p className="text-gray-500 mb-4">Create your first organization to get started</p>
                    <Button onClick={() => setIsCreateOrgDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Organization
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Organization</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Locations</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {organizations.map((org) => (
                        <TableRow key={org.id} className="cursor-pointer hover:bg-gray-50" onClick={() => selectOrganization(org)}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{org.name}</div>
                              <div className="text-sm text-gray-500">{org.description}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {org.email && <div>{org.email}</div>}
                              {org.phone && <div>{org.phone}</div>}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{org.locations_count} locations</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={org.is_active ? "default" : "secondary"}>
                              {org.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  openEditOrgDialog(org)
                                }}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Organization</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete "{org.name}"? 
                                      This action cannot be undone and will remove all associated locations and rooms.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteOrganization(org.id)}
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

          <TabsContent value="locations" className="mt-6">
            {selectedOrg && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Locations in {selectedOrg.name}</CardTitle>
                      <CardDescription>
                        Manage locations within this organization
                      </CardDescription>
                    </div>
                    <Dialog open={isCreateLocationDialogOpen} onOpenChange={setIsCreateLocationDialogOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Location
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Add New Location</DialogTitle>
                          <DialogDescription>
                            Create a new location within {selectedOrg.name}
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreateLocation}>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                              <Label htmlFor="location-name">Location Name</Label>
                              <Input
                                id="location-name"
                                value={locationFormData.name}
                                onChange={(e) => setLocationFormData({ ...locationFormData, name: e.target.value })}
                                placeholder="e.g., Main Office"
                                required
                              />
                            </div>
                            <div className="col-span-2">
                              <Label htmlFor="location-description">Description</Label>
                              <Textarea
                                id="location-description"
                                value={locationFormData.description}
                                onChange={(e) => setLocationFormData({ ...locationFormData, description: e.target.value })}
                                placeholder="Brief description of the location"
                              />
                            </div>
                            <div className="col-span-2">
                              <Label htmlFor="location-address">Address</Label>
                              <Input
                                id="location-address"
                                value={locationFormData.address}
                                onChange={(e) => setLocationFormData({ ...locationFormData, address: e.target.value })}
                                placeholder="123 Main Street"
                              />
                            </div>
                            <div>
                              <Label htmlFor="location-city">City</Label>
                              <Input
                                id="location-city"
                                value={locationFormData.city}
                                onChange={(e) => setLocationFormData({ ...locationFormData, city: e.target.value })}
                                placeholder="New York"
                              />
                            </div>
                            <div>
                              <Label htmlFor="location-state">State</Label>
                              <Input
                                id="location-state"
                                value={locationFormData.state}
                                onChange={(e) => setLocationFormData({ ...locationFormData, state: e.target.value })}
                                placeholder="NY"
                              />
                            </div>
                            <div>
                              <Label htmlFor="location-country">Country</Label>
                              <Input
                                id="location-country"
                                value={locationFormData.country}
                                onChange={(e) => setLocationFormData({ ...locationFormData, country: e.target.value })}
                                placeholder="USA"
                              />
                            </div>
                            <div>
                              <Label htmlFor="location-postal">Postal Code</Label>
                              <Input
                                id="location-postal"
                                value={locationFormData.postal_code}
                                onChange={(e) => setLocationFormData({ ...locationFormData, postal_code: e.target.value })}
                                placeholder="10001"
                              />
                            </div>
                            <div>
                              <Label htmlFor="location-lat">Latitude</Label>
                              <Input
                                id="location-lat"
                                type="number"
                                step="any"
                                value={locationFormData.latitude}
                                onChange={(e) => setLocationFormData({ ...locationFormData, latitude: e.target.value })}
                                placeholder="40.7128"
                              />
                            </div>
                            <div>
                              <Label htmlFor="location-lng">Longitude</Label>
                              <Input
                                id="location-lng"
                                type="number"
                                step="any"
                                value={locationFormData.longitude}
                                onChange={(e) => setLocationFormData({ ...locationFormData, longitude: e.target.value })}
                                placeholder="-74.0060"
                              />
                            </div>
                          </div>
                          <DialogFooter className="mt-6">
                            <Button type="button" variant="outline" onClick={() => setIsCreateLocationDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button type="submit">Add Location</Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {locations.length === 0 ? (
                    <div className="text-center py-12">
                      <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No locations found</h3>
                      <p className="text-gray-500 mb-4">Add your first location to this organization</p>
                      <Button onClick={() => setIsCreateLocationDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Your First Location
                      </Button>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Location</TableHead>
                          <TableHead>Address</TableHead>
                          <TableHead>Rooms</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {locations.map((location) => (
                          <TableRow key={location.id} className="cursor-pointer hover:bg-gray-50" onClick={() => selectLocation(location)}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{location.name}</div>
                                <div className="text-sm text-gray-500">{location.description}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {location.address && <div>{location.address}</div>}
                                {location.city && location.state && (
                                  <div>{location.city}, {location.state}</div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{location.rooms_count} rooms</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={location.is_active ? "default" : "secondary"}>
                                {location.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    openEditLocationDialog(location)
                                  }}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Location</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete "{location.name}"? 
                                        This action cannot be undone and will remove all associated rooms.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDeleteLocation(location.id)}
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
            )}
          </TabsContent>

          <TabsContent value="rooms" className="mt-6">
            {selectedLocation && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Rooms in {selectedLocation.name}</CardTitle>
                      <CardDescription>
                        Manage rooms within this location
                      </CardDescription>
                    </div>
                    <Dialog open={isCreateRoomDialogOpen} onOpenChange={setIsCreateRoomDialogOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Room
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add New Room</DialogTitle>
                          <DialogDescription>
                            Create a new room within {selectedLocation.name}
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreateRoom}>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="room-name">Room Name</Label>
                              <Input
                                id="room-name"
                                value={roomFormData.name}
                                onChange={(e) => setRoomFormData({ ...roomFormData, name: e.target.value })}
                                placeholder="e.g., Conference Room A"
                                required
                              />
                            </div>
                            <div>
                              <Label htmlFor="room-description">Description</Label>
                              <Textarea
                                id="room-description"
                                value={roomFormData.description}
                                onChange={(e) => setRoomFormData({ ...roomFormData, description: e.target.value })}
                                placeholder="Brief description of the room"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="room-type">Room Type</Label>
                                <Input
                                  id="room-type"
                                  value={roomFormData.room_type}
                                  onChange={(e) => setRoomFormData({ ...roomFormData, room_type: e.target.value })}
                                  placeholder="e.g., Conference Room"
                                />
                              </div>
                              <div>
                                <Label htmlFor="room-floor">Floor</Label>
                                <Input
                                  id="room-floor"
                                  value={roomFormData.floor}
                                  onChange={(e) => setRoomFormData({ ...roomFormData, floor: e.target.value })}
                                  placeholder="e.g., 2nd Floor"
                                />
                              </div>
                            </div>
                            <div>
                              <Label htmlFor="room-area">Area (sq ft)</Label>
                              <Input
                                id="room-area"
                                type="number"
                                value={roomFormData.area_sqft}
                                onChange={(e) => setRoomFormData({ ...roomFormData, area_sqft: e.target.value })}
                                placeholder="e.g., 500"
                              />
                            </div>
                          </div>
                          <DialogFooter className="mt-6">
                            <Button type="button" variant="outline" onClick={() => setIsCreateRoomDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button type="submit">Add Room</Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {rooms.length === 0 ? (
                    <div className="text-center py-12">
                      <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No rooms found</h3>
                      <p className="text-gray-500 mb-4">Add your first room to this location</p>
                      <Button onClick={() => setIsCreateRoomDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Your First Room
                      </Button>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Room</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Floor</TableHead>
                          <TableHead>Area</TableHead>
                          <TableHead>Devices</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rooms.map((room) => (
                          <TableRow key={room.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{room.name}</div>
                                <div className="text-sm text-gray-500">{room.description}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{room.room_type || 'N/A'}</Badge>
                            </TableCell>
                            <TableCell>{room.floor || 'N/A'}</TableCell>
                            <TableCell>{room.area_sqft ? `${room.area_sqft} sq ft` : 'N/A'}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{room.devices_count} devices</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openEditRoomDialog(room)}
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
                                      <AlertDialogTitle>Delete Room</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete "{room.name}"? 
                                        This action cannot be undone and will remove all associated devices.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDeleteRoom(room.id)}
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
            )}
          </TabsContent>
        </Tabs>

        {/* Edit Organization Dialog */}
        <Dialog open={isEditOrgDialogOpen} onOpenChange={setIsEditOrgDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Organization</DialogTitle>
              <DialogDescription>
                Update organization information
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateOrganization}>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="edit-org-name">Organization Name</Label>
                  <Input
                    id="edit-org-name"
                    value={orgFormData.name}
                    onChange={(e) => setOrgFormData({ ...orgFormData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="edit-org-description">Description</Label>
                  <Textarea
                    id="edit-org-description"
                    value={orgFormData.description}
                    onChange={(e) => setOrgFormData({ ...orgFormData, description: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-org-phone">Phone</Label>
                  <Input
                    id="edit-org-phone"
                    value={orgFormData.phone}
                    onChange={(e) => setOrgFormData({ ...orgFormData, phone: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-org-email">Email</Label>
                  <Input
                    id="edit-org-email"
                    type="email"
                    value={orgFormData.email}
                    onChange={(e) => setOrgFormData({ ...orgFormData, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-org-website">Website</Label>
                  <Input
                    id="edit-org-website"
                    value={orgFormData.website}
                    onChange={(e) => setOrgFormData({ ...orgFormData, website: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-org-address">Address</Label>
                  <Input
                    id="edit-org-address"
                    value={orgFormData.address}
                    onChange={(e) => setOrgFormData({ ...orgFormData, address: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setIsEditOrgDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Update Organization</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Location Dialog */}
        <Dialog open={isEditLocationDialogOpen} onOpenChange={setIsEditLocationDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Location</DialogTitle>
              <DialogDescription>
                Update location information
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateLocation}>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="edit-location-name">Location Name</Label>
                  <Input
                    id="edit-location-name"
                    value={locationFormData.name}
                    onChange={(e) => setLocationFormData({ ...locationFormData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="edit-location-description">Description</Label>
                  <Textarea
                    id="edit-location-description"
                    value={locationFormData.description}
                    onChange={(e) => setLocationFormData({ ...locationFormData, description: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="edit-location-address">Address</Label>
                  <Input
                    id="edit-location-address"
                    value={locationFormData.address}
                    onChange={(e) => setLocationFormData({ ...locationFormData, address: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-location-city">City</Label>
                  <Input
                    id="edit-location-city"
                    value={locationFormData.city}
                    onChange={(e) => setLocationFormData({ ...locationFormData, city: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-location-state">State</Label>
                  <Input
                    id="edit-location-state"
                    value={locationFormData.state}
                    onChange={(e) => setLocationFormData({ ...locationFormData, state: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-location-country">Country</Label>
                  <Input
                    id="edit-location-country"
                    value={locationFormData.country}
                    onChange={(e) => setLocationFormData({ ...locationFormData, country: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-location-postal">Postal Code</Label>
                  <Input
                    id="edit-location-postal"
                    value={locationFormData.postal_code}
                    onChange={(e) => setLocationFormData({ ...locationFormData, postal_code: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-location-lat">Latitude</Label>
                  <Input
                    id="edit-location-lat"
                    type="number"
                    step="any"
                    value={locationFormData.latitude}
                    onChange={(e) => setLocationFormData({ ...locationFormData, latitude: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-location-lng">Longitude</Label>
                  <Input
                    id="edit-location-lng"
                    type="number"
                    step="any"
                    value={locationFormData.longitude}
                    onChange={(e) => setLocationFormData({ ...locationFormData, longitude: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setIsEditLocationDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Update Location</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Room Dialog */}
        <Dialog open={isEditRoomDialogOpen} onOpenChange={setIsEditRoomDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Room</DialogTitle>
              <DialogDescription>
                Update room information
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateRoom}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-room-name">Room Name</Label>
                  <Input
                    id="edit-room-name"
                    value={roomFormData.name}
                    onChange={(e) => setRoomFormData({ ...roomFormData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-room-description">Description</Label>
                  <Textarea
                    id="edit-room-description"
                    value={roomFormData.description}
                    onChange={(e) => setRoomFormData({ ...roomFormData, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-room-type">Room Type</Label>
                    <Input
                      id="edit-room-type"
                      value={roomFormData.room_type}
                      onChange={(e) => setRoomFormData({ ...roomFormData, room_type: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-room-floor">Floor</Label>
                    <Input
                      id="edit-room-floor"
                      value={roomFormData.floor}
                      onChange={(e) => setRoomFormData({ ...roomFormData, floor: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit-room-area">Area (sq ft)</Label>
                  <Input
                    id="edit-room-area"
                    type="number"
                    value={roomFormData.area_sqft}
                    onChange={(e) => setRoomFormData({ ...roomFormData, area_sqft: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setIsEditRoomDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Update Room</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
