import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { authenticatedApiRequest } from '../lib/api'

const AutomationContext = createContext()

export const useAutomations = () => {
  const context = useContext(AutomationContext)
  if (!context) {
    throw new Error('useAutomations must be used within an AutomationProvider')
  }
  return context
}

export const AutomationProvider = ({ children }) => {
  const { user, token } = useAuth()
  const [automations, setAutomations] = useState([])
  const [loading, setLoading] = useState(false)

  // Sample automations data (in a real app, this would come from an API)
  useEffect(() => {
    const loadAutomations = () => {
      if (!user) return
      
      setLoading(true)
      try {
        // For now, use sample data. In a real app, this would be:
        // const data = await authenticatedApiRequest('/automations', {}, token)
        
        const sampleAutomations = [
          {
            id: 1,
            name: 'Temperature Alert',
            description: 'Send notification when temperature exceeds 25°C',
            enabled: true,
            trigger: {
              type: 'device_value',
              device_id: 'temp_sensor_001',
              condition: 'greater_than',
              value: '25'
            },
            actions: [{
              type: 'send_notification',
              message: 'Temperature is too high!'
            }],
            created_at: new Date().toISOString(),
            last_triggered: null
          },
          {
            id: 2,
            name: 'Motion Light',
            description: 'Turn on light when motion is detected',
            enabled: false,
            trigger: {
              type: 'device_value',
              device_id: 'motion_sensor_001',
              condition: 'equals',
              value: 'motion_detected'
            },
            actions: [{
              type: 'control_device',
              device_id: 'smart_light_001',
              value: 'on'
            }],
            created_at: new Date().toISOString(),
            last_triggered: new Date().toISOString()
          },
          {
            id: 3,
            name: 'Humidity Control',
            description: 'Control device based on humidity levels',
            enabled: true,
            trigger: {
              type: 'device_value',
              device_id: 'humidity_sensor_001',
              condition: 'greater_than',
              value: '60'
            },
            actions: [{
              type: 'control_device',
              device_id: 'dehumidifier_001',
              value: 'on'
            }],
            created_at: new Date().toISOString(),
            last_triggered: null
          }
        ]
        
        setAutomations(sampleAutomations)
      } catch (error) {
        console.error('Error loading automations:', error)
        setAutomations([])
      } finally {
        setLoading(false)
      }
    }

    loadAutomations()
  }, [user, token])

  const addAutomation = async (automationData) => {
    if (!token) return { success: false, error: 'Authentication required' }
    
    try {
      // In a real app, this would be:
      // const newAutomation = await authenticatedApiRequest('/automations', {
      //   method: 'POST',
      //   body: JSON.stringify(automationData)
      // }, token)
      
      const newAutomation = {
        id: Date.now(),
        ...automationData,
        created_at: new Date().toISOString(),
        last_triggered: null
      }
      
      setAutomations(prev => [...prev, newAutomation])
      return { success: true, automation: newAutomation }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const updateAutomation = async (automationId, updateData) => {
    if (!token) return { success: false, error: 'Authentication required' }
    
    try {
      // In a real app, this would be:
      // const updatedAutomation = await authenticatedApiRequest(`/automations/${automationId}`, {
      //   method: 'PUT',
      //   body: JSON.stringify(updateData)
      // }, token)
      
      setAutomations(prev => prev.map(automation => 
        automation.id === automationId 
          ? { ...automation, ...updateData }
          : automation
      ))
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const deleteAutomation = async (automationId) => {
    if (!token) return { success: false, error: 'Authentication required' }
    
    try {
      // In a real app, this would be:
      // await authenticatedApiRequest(`/automations/${automationId}`, {
      //   method: 'DELETE'
      // }, token)
      
      setAutomations(prev => prev.filter(automation => automation.id !== automationId))
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const toggleAutomation = async (automationId) => {
    if (!token) return { success: false, error: 'Authentication required' }
    
    try {
      const automation = automations.find(a => a.id === automationId)
      if (!automation) return { success: false, error: 'Automation not found' }
      
      return await updateAutomation(automationId, { enabled: !automation.enabled })
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const refreshAutomations = () => {
    // Reload automations from the server
    if (user) {
      // In a real app, this would reload from API
      console.log('Refreshing automations...')
    }
  }

  const value = {
    automations,
    loading,
    addAutomation,
    updateAutomation,
    deleteAutomation,
    toggleAutomation,
    refreshAutomations
  }

  return (
    <AutomationContext.Provider value={value}>
      {children}
    </AutomationContext.Provider>
  )
}
