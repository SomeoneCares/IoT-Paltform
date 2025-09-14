import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'

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

  const API_BASE = 'http://localhost:5000/api'

  const fetchDevices = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE}/devices?user_id=${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const devicesData = await response.json()
        setDevices(devicesData)
        setLastRefresh(Date.now())
      }
    } catch (error) {
      console.error('Error fetching devices:', error)
    } finally {
      setLoading(false)
    }
  }

  const addDevice = async (deviceData) => {
    try {
      const response = await fetch(`${API_BASE}/devices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...deviceData,
          user_id: user.id
        })
      })

      if (response.ok) {
        const newDevice = await response.json()
        setDevices(prev => [...prev, newDevice])
        setLastRefresh(Date.now())
        return { success: true, device: newDevice }
      } else {
        const error = await response.json()
        return { success: false, error: error.error }
      }
    } catch (error) {
      return { success: false, error: 'Network error' }
    }
  }

  const updateDevice = async (deviceId, updateData) => {
    try {
      const response = await fetch(`${API_BASE}/devices/${deviceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      })

      if (response.ok) {
        const updatedDevice = await response.json()
        setDevices(prev => prev.map(device => 
          device.device_id === deviceId ? updatedDevice : device
        ))
        setLastRefresh(Date.now())
        return { success: true, device: updatedDevice }
      } else {
        const error = await response.json()
        return { success: false, error: error.error }
      }
    } catch (error) {
      return { success: false, error: 'Network error' }
    }
  }

  const deleteDevice = async (deviceId) => {
    try {
      const response = await fetch(`${API_BASE}/devices/${deviceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        setDevices(prev => prev.filter(device => device.device_id !== deviceId))
        setLastRefresh(Date.now())
        return { success: true }
      } else {
        const error = await response.json()
        return { success: false, error: error.error }
      }
    } catch (error) {
      return { success: false, error: 'Network error' }
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
