import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { authenticatedApiRequest } from '../lib/api'

const API_BASE = 'http://localhost:5000/api'

const OrganizationContext = createContext()

export const useOrganizations = () => {
  const context = useContext(OrganizationContext)
  if (!context) {
    throw new Error('useOrganizations must be used within an OrganizationProvider')
  }
  return context
}

export const OrganizationProvider = ({ children }) => {
  const { user, token } = useAuth()
  const [organizations, setOrganizations] = useState([])
  const [locations, setLocations] = useState([])
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchOrganizations = async () => {
    if (!user || !token) return
    
    setLoading(true)
    try {
      const data = await authenticatedApiRequest('/organizations', {}, token)
      setOrganizations(data)
    } catch (error) {
      console.error('Error fetching organizations:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchLocations = async (orgId) => {
    if (!user || !orgId) return
    
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
    if (!user || !locationId) return
    
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

  const getAllRooms = async () => {
    if (!user) return []
    
    try {
      const allRooms = []
      
      // Fetch all organizations
      const orgsResponse = await fetch(`${API_BASE}/organizations`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (orgsResponse.ok) {
        const orgs = await orgsResponse.json()
        
        // For each organization, fetch locations and rooms
        for (const org of orgs) {
          const locationsResponse = await fetch(`${API_BASE}/organizations/${org.id}/locations`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          
          if (locationsResponse.ok) {
            const locations = await locationsResponse.json()
            
            for (const location of locations) {
              const roomsResponse = await fetch(`${API_BASE}/locations/${location.id}/rooms`, {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              })
              
              if (roomsResponse.ok) {
                const locationRooms = await roomsResponse.json()
                // Add organization and location info to each room
                const enrichedRooms = locationRooms.map(room => ({
                  ...room,
                  organization: org,
                  location: location
                }))
                allRooms.push(...enrichedRooms)
              }
            }
          }
        }
      }
      
      return allRooms
    } catch (error) {
      console.error('Error fetching all rooms:', error)
      return []
    }
  }

  // Auto-fetch organizations when user changes
  useEffect(() => {
    if (user) {
      fetchOrganizations()
    } else {
      setOrganizations([])
      setLocations([])
      setRooms([])
    }
  }, [user])

  const value = {
    organizations,
    locations,
    rooms,
    loading,
    fetchOrganizations,
    fetchLocations,
    fetchRooms,
    getAllRooms
  }

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  )
}
