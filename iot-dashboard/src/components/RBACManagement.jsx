import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { useAuth } from '@/contexts/AuthContext'
import { authenticatedApiRequest } from '@/lib/api'
import { Shield, Users, Key, UserCheck, Settings, Trash2, Edit, Plus } from 'lucide-react'

const RBACManagement = () => {
  const { token } = useAuth()
  const [roles, setRoles] = useState([])
  const [permissions, setPermissions] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('roles')

  // Role management state
  const [newRole, setNewRole] = useState({ name: '', description: '', permissions: [] })
  const [editingRole, setEditingRole] = useState(null)
  const [roleDialogOpen, setRoleDialogOpen] = useState(false)

  // User role assignment state
  const [selectedUser, setSelectedUser] = useState(null)
  const [userRoleDialogOpen, setUserRoleDialogOpen] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [rolesRes, permissionsRes, usersRes] = await Promise.all([
        authenticatedApiRequest('/rbac/roles', {}, token),
        authenticatedApiRequest('/rbac/permissions', {}, token),
        authenticatedApiRequest('/users', {}, token)
      ])
      
      setRoles(rolesRes.roles || [])
      setPermissions(permissionsRes.permissions || [])
      setUsers(usersRes.users || [])
    } catch (error) {
      console.error('Error fetching RBAC data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRole = async () => {
    try {
      const response = await authenticatedApiRequest('/rbac/roles', {
        method: 'POST',
        body: JSON.stringify(newRole)
      }, token)
      
      setRoles([...roles, response.role])
      setNewRole({ name: '', description: '', permissions: [] })
      setRoleDialogOpen(false)
    } catch (error) {
      console.error('Error creating role:', error)
    }
  }

  const handleUpdateRole = async () => {
    try {
      const response = await authenticatedApiRequest(`/rbac/roles/${editingRole.id}`, {
        method: 'PUT',
        body: JSON.stringify(editingRole)
      }, token)
      
      setRoles(roles.map(role => role.id === editingRole.id ? response.role : role))
      setEditingRole(null)
      setRoleDialogOpen(false)
    } catch (error) {
      console.error('Error updating role:', error)
    }
  }

  const handleDeleteRole = async (roleId) => {
    try {
      await authenticatedApiRequest(`/rbac/roles/${roleId}`, {
        method: 'DELETE'
      }, token)
      
      setRoles(roles.filter(role => role.id !== roleId))
    } catch (error) {
      console.error('Error deleting role:', error)
    }
  }

  const handleAssignRole = async () => {
    try {
      await authenticatedApiRequest(`/rbac/users/${selectedUser.id}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role_id: selectedUser.role_id })
      }, token)
      
      setUsers(users.map(user => 
        user.id === selectedUser.id ? { ...user, role_id: selectedUser.role_id } : user
      ))
      setUserRoleDialogOpen(false)
      setSelectedUser(null)
    } catch (error) {
      console.error('Error assigning role:', error)
    }
  }

  const togglePermission = (permissionId) => {
    if (editingRole) {
      const updatedPermissions = editingRole.permissions.includes(permissionId)
        ? editingRole.permissions.filter(id => id !== permissionId)
        : [...editingRole.permissions, permissionId]
      setEditingRole({ ...editingRole, permissions: updatedPermissions })
    } else {
      const updatedPermissions = newRole.permissions.includes(permissionId)
        ? newRole.permissions.filter(id => id !== permissionId)
        : [...newRole.permissions, permissionId]
      setNewRole({ ...newRole, permissions: updatedPermissions })
    }
  }

  const getPermissionName = (permissionId) => {
    const permission = permissions.find(p => p.id === permissionId)
    return permission ? `${permission.resource}:${permission.action}` : 'Unknown'
  }

  const getRoleName = (roleId) => {
    const role = roles.find(r => r.id === roleId)
    return role ? role.name : 'No Role'
  }

  const groupedPermissions = permissions.reduce((acc, permission) => {
    if (!acc[permission.resource]) {
      acc[permission.resource] = []
    }
    acc[permission.resource].push(permission)
    return acc
  }, {})

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading RBAC data...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Role-Based Access Control</h1>
          <p className="text-muted-foreground">Manage roles, permissions, and user access</p>
        </div>
        <div className="flex items-center space-x-2">
          <Shield className="h-6 w-6" />
          <span className="text-sm text-muted-foreground">RBAC System</span>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="permissions">All Permissions</TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Roles & Permissions</h2>
            <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { setEditingRole(null); setNewRole({ name: '', description: '', permissions: [] }) }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Role
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingRole ? 'Edit Role' : 'Create New Role'}</DialogTitle>
                  <DialogDescription>
                    {editingRole ? 'Update role details and permissions' : 'Create a new role with specific permissions'}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="role-name">Role Name</Label>
                    <Input
                      id="role-name"
                      value={editingRole?.name || newRole.name}
                      onChange={(e) => {
                        if (editingRole) {
                          setEditingRole({ ...editingRole, name: e.target.value })
                        } else {
                          setNewRole({ ...newRole, name: e.target.value })
                        }
                      }}
                      placeholder="Enter role name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role-description">Description</Label>
                    <Input
                      id="role-description"
                      value={editingRole?.description || newRole.description}
                      onChange={(e) => {
                        if (editingRole) {
                          setEditingRole({ ...editingRole, description: e.target.value })
                        } else {
                          setNewRole({ ...newRole, description: e.target.value })
                        }
                      }}
                      placeholder="Enter role description"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Permissions</Label>
                    <div className="max-h-60 overflow-y-auto space-y-2">
                      {Object.entries(groupedPermissions).map(([resource, resourcePermissions]) => (
                        <div key={resource} className="space-y-1">
                          <h4 className="font-medium text-sm text-muted-foreground">{resource.toUpperCase()}</h4>
                          <div className="grid grid-cols-2 gap-2">
                            {resourcePermissions.map((permission) => (
                              <div key={permission.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`perm-${permission.id}`}
                                  checked={(editingRole?.permissions || newRole.permissions).includes(permission.id)}
                                  onCheckedChange={() => togglePermission(permission.id)}
                                />
                                <Label htmlFor={`perm-${permission.id}`} className="text-sm">
                                  {permission.action}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={editingRole ? handleUpdateRole : handleCreateRole}>
                    {editingRole ? 'Update Role' : 'Create Role'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {roles.map((role) => (
              <Card key={role.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <Shield className="h-5 w-5" />
                        <span>{role.name}</span>
                        {role.is_system && <Badge variant="secondary">System</Badge>}
                      </CardTitle>
                      <CardDescription>{role.description}</CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingRole(role)
                          setRoleDialogOpen(true)
                        }}
                        disabled={role.is_system}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" disabled={role.is_system}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Role</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete the role "{role.name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteRole(role.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <h4 className="font-medium">Permissions:</h4>
                    <div className="flex flex-wrap gap-1">
                      {role.permissions.map((permission) => (
                        <Badge key={permission.id} variant="outline">
                          {permission.resource}:{permission.action}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <h2 className="text-2xl font-semibold">User Role Assignment</h2>
          <div className="grid gap-4">
            {users.map((user) => (
              <Card key={user.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <Users className="h-5 w-5" />
                        <span>{user.username}</span>
                        {user.is_superuser && <Badge variant="destructive">Superuser</Badge>}
                      </CardTitle>
                      <CardDescription>{user.email}</CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{getRoleName(user.role_id)}</Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(user)
                          setUserRoleDialogOpen(true)
                        }}
                      >
                        <UserCheck className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>

          <Dialog open={userRoleDialogOpen} onOpenChange={setUserRoleDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign Role to User</DialogTitle>
                <DialogDescription>
                  Select a role for {selectedUser?.username}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select
                    value={selectedUser?.role_id?.toString() || ''}
                    onValueChange={(value) => setSelectedUser({ ...selectedUser, role_id: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No Role</SelectItem>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id.toString()}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setUserRoleDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAssignRole}>
                  Assign Role
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <h2 className="text-2xl font-semibold">All Permissions</h2>
          <div className="space-y-4">
            {Object.entries(groupedPermissions).map(([resource, resourcePermissions]) => (
              <Card key={resource}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Key className="h-5 w-5" />
                    <span>{resource.toUpperCase()}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {resourcePermissions.map((permission) => (
                      <Badge key={permission.id} variant="outline" className="justify-start">
                        {permission.action}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default RBACManagement
