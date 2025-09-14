import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { authenticatedApiRequest } from '../lib/api'

const BillingContext = createContext()

export const useBilling = () => {
  const context = useContext(BillingContext)
  if (!context) {
    throw new Error('useBilling must be used within a BillingProvider')
  }
  return context
}

export const BillingProvider = ({ children }) => {
  const { user, token } = useAuth()
  const [subscription, setSubscription] = useState(null)
  const [invoices, setInvoices] = useState([])
  const [usage, setUsage] = useState({})
  const [paymentMethods, setPaymentMethods] = useState([])
  const [loading, setLoading] = useState(false)

  // Sample data (in a real app, this would come from an API)
  useEffect(() => {
    const loadBillingData = () => {
      if (!user) return
      
      setLoading(true)
      try {
        // Sample subscription data
        const sampleSubscription = {
          id: 1,
          plan: 'Professional',
          status: 'active',
          current_period_start: '2024-01-01T00:00:00Z',
          current_period_end: '2024-02-01T00:00:00Z',
          cancel_at_period_end: false,
          price: 29.99,
          currency: 'USD',
          interval: 'month',
          features: [
            'Up to 100 devices',
            'Unlimited automations',
            'Advanced analytics',
            'Priority support',
            'API access'
          ]
        }

        // Sample invoices
        const sampleInvoices = [
          {
            id: 'inv_001',
            amount: 29.99,
            currency: 'USD',
            status: 'paid',
            created_at: '2024-01-01T00:00:00Z',
            due_date: '2024-01-01T00:00:00Z',
            description: 'Professional Plan - January 2024',
            invoice_url: '#'
          },
          {
            id: 'inv_002',
            amount: 29.99,
            currency: 'USD',
            status: 'paid',
            created_at: '2023-12-01T00:00:00Z',
            due_date: '2023-12-01T00:00:00Z',
            description: 'Professional Plan - December 2023',
            invoice_url: '#'
          },
          {
            id: 'inv_003',
            amount: 29.99,
            currency: 'USD',
            status: 'paid',
            created_at: '2023-11-01T00:00:00Z',
            due_date: '2023-11-01T00:00:00Z',
            description: 'Professional Plan - November 2023',
            invoice_url: '#'
          }
        ]

        // Sample usage data
        const sampleUsage = {
          devices: {
            used: 15,
            limit: 100,
            percentage: 15
          },
          automations: {
            used: 8,
            limit: -1, // -1 means unlimited
            percentage: 0
          },
          api_calls: {
            used: 1250,
            limit: 10000,
            percentage: 12.5
          },
          storage: {
            used: 2.5, // GB
            limit: 50,
            percentage: 5
          }
        }

        // Sample payment methods
        const samplePaymentMethods = [
          {
            id: 'pm_001',
            type: 'card',
            brand: 'visa',
            last4: '4242',
            exp_month: 12,
            exp_year: 2025,
                is_default: true
          }
        ]

        setSubscription(sampleSubscription)
        setInvoices(sampleInvoices)
        setUsage(sampleUsage)
        setPaymentMethods(samplePaymentMethods)
      } catch (error) {
        console.error('Error loading billing data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadBillingData()
  }, [user, token])

  const updateSubscription = async (planId) => {
    if (!token) return { success: false, error: 'Authentication required' }
    
    try {
      // In a real app, this would be:
      // const result = await authenticatedApiRequest('/billing/subscription', {
      //   method: 'PUT',
      //   body: JSON.stringify({ plan_id: planId })
      // }, token)
      
      // For demo, just update the plan
      setSubscription(prev => ({
        ...prev,
        plan: planId === 'basic' ? 'Basic' : planId === 'professional' ? 'Professional' : 'Enterprise'
      }))
      
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const cancelSubscription = async () => {
    if (!token) return { success: false, error: 'Authentication required' }
    
    try {
      // In a real app, this would be:
      // const result = await authenticatedApiRequest('/billing/subscription/cancel', {
      //   method: 'POST'
      // }, token)
      
      setSubscription(prev => ({
        ...prev,
        cancel_at_period_end: true
      }))
      
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const reactivateSubscription = async () => {
    if (!token) return { success: false, error: 'Authentication required' }
    
    try {
      // In a real app, this would be:
      // const result = await authenticatedApiRequest('/billing/subscription/reactivate', {
      //   method: 'POST'
      // }, token)
      
      setSubscription(prev => ({
        ...prev,
        cancel_at_period_end: false
      }))
      
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const addPaymentMethod = async (paymentMethodData) => {
    if (!token) return { success: false, error: 'Authentication required' }
    
    try {
      // In a real app, this would be:
      // const result = await authenticatedApiRequest('/billing/payment-methods', {
      //   method: 'POST',
      //   body: JSON.stringify(paymentMethodData)
      // }, token)
      
      const newPaymentMethod = {
        id: `pm_${Date.now()}`,
        ...paymentMethodData,
        is_default: paymentMethods.length === 0
      }
      
      setPaymentMethods(prev => [...prev, newPaymentMethod])
      return { success: true, paymentMethod: newPaymentMethod }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const removePaymentMethod = async (paymentMethodId) => {
    if (!token) return { success: false, error: 'Authentication required' }
    
    try {
      // In a real app, this would be:
      // await authenticatedApiRequest(`/billing/payment-methods/${paymentMethodId}`, {
      //   method: 'DELETE'
      // }, token)
      
      setPaymentMethods(prev => prev.filter(pm => pm.id !== paymentMethodId))
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const setDefaultPaymentMethod = async (paymentMethodId) => {
    if (!token) return { success: false, error: 'Authentication required' }
    
    try {
      // In a real app, this would be:
      // await authenticatedApiRequest(`/billing/payment-methods/${paymentMethodId}/default`, {
      //   method: 'POST'
      // }, token)
      
      setPaymentMethods(prev => prev.map(pm => ({
        ...pm,
        is_default: pm.id === paymentMethodId
      })))
      
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const downloadInvoice = async (invoiceId) => {
    if (!token) return { success: false, error: 'Authentication required' }
    
    try {
      // In a real app, this would be:
      // const result = await authenticatedApiRequest(`/billing/invoices/${invoiceId}/download`, {}, token)
      
      // For demo, just simulate download
      console.log(`Downloading invoice ${invoiceId}`)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const refreshBillingData = () => {
    // Reload billing data from the server
    if (user) {
      console.log('Refreshing billing data...')
      // In a real app, this would reload from API
    }
  }

  const value = {
    subscription,
    invoices,
    usage,
    paymentMethods,
    loading,
    updateSubscription,
    cancelSubscription,
    reactivateSubscription,
    addPaymentMethod,
    removePaymentMethod,
    setDefaultPaymentMethod,
    downloadInvoice,
    refreshBillingData
  }

  return (
    <BillingContext.Provider value={value}>
      {children}
    </BillingContext.Provider>
  )
}
