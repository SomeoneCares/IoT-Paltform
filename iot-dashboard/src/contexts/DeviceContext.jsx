import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { authenticatedApiRequest } from '../lib/api'

const DeviceContext = createContext()

export const useDevices = () => {
  const context = useContext(DeviceContext)
  if (!context) {
    throw new Error('useDevices must be used within a DeviceProvider')
  }
  return context
}

export const DeviceProvider = ({ children }) => {
  const { user, token } = useAuth()
  const [devices, setDevices] = useState([])
  const [loading, setLoading] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(Date.now())

  const fetchDevices = async () => {
    if (!user || !token) return
    
    setLoading(true)
    try {
      const devicesData = await authenticatedApiRequest('/devices', {}, token)
      setDevices(devicesData)
      setLastRefresh(Date.now())
    } catch (error) {
      console.error('Error fetching devices:', error)
    } finally {
      setLoading(false)
    }
  }

  const addDevice = async (deviceData) => {
    if (!token) return { success: false, error: 'Authentication required' }
    
    try {
      const newDevice = await authenticatedApiRequest('/devices', {
        method: 'POST',
        body: JSON.stringify(deviceData)
      }, token)
      
      setDevices(prev => [...prev, newDevice])
      setLastRefresh(Date.now())
      return { success: true, device: newDevice }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const updateDevice = async (deviceId, updateData) => {
    if (!token) return { success: false, error: 'Authentication required' }
    
    try {
      const updatedDevice = await authenticatedApiRequest(`/devices/${deviceId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData)
      }, token)
      
      setDevices(prev => prev.map(device => 
        device.device_id === deviceId ? updatedDevice : device
      ))
      setLastRefresh(Date.now())
      return { success: true, device: updatedDevice }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const deleteDevice = async (deviceId) => {
    if (!token) return { success: false, error: 'Authentication required' }
    
    try {
      await authenticatedApiRequest(`/devices/${deviceId}`, {
        method: 'DELETE'
      }, token)
      
      setDevices(prev => prev.filter(device => device.device_id !== deviceId))
      setLastRefresh(Date.now())
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const refreshDevices = () => {
    fetchDevices()
  }

  // Auto-fetch devices when user changes
  useEffect(() => {
    if (user) {
      fetchDevices()
    } else {
      setDevices([])
    }
  }, [user])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!user) return

    const interval = setInterval(() => {
      fetchDevices()
    }, 30000)

    return () => clearInterval(interval)
  }, [user])

  const value = {
    devices,
    loading,
    lastRefresh,
    fetchDevices,
    addDevice,
    updateDevice,
    deleteDevice,
    refreshDevices
  }

  return (
    <DeviceContext.Provider value={value}>
      {children}
    </DeviceContext.Provider>
  )
}
