import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useBilling } from '@/contexts/BillingContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  CreditCard, 
  Download, 
  Plus, 
  Trash2, 
  Check,
  X,
  AlertTriangle,
  Calendar,
  DollarSign,
  Users,
  Zap,
  Database,
  Activity,
  Crown,
  Star
} from 'lucide-react'

// Subscription plans
const subscriptionPlans = [
  {
    id: 'basic',
    name: 'Basic',
    price: 9.99,
    interval: 'month',
    description: 'Perfect for small projects',
    features: [
      'Up to 10 devices',
      'Basic automations',
      'Email support',
      'Basic analytics'
    ],
    popular: false
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 29.99,
    interval: 'month',
    description: 'Best for growing businesses',
    features: [
      'Up to 100 devices',
      'Unlimited automations',
      'Advanced analytics',
      'Priority support',
      'API access'
    ],
    popular: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 99.99,
    interval: 'month',
    description: 'For large-scale deployments',
    features: [
      'Unlimited devices',
      'Unlimited automations',
      'Advanced analytics',
      '24/7 phone support',
      'Full API access',
      'Custom integrations',
      'SLA guarantee'
    ],
    popular: false
  }
]

export default function BillingManagement() {
  const { user } = useAuth()
  const { 
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
    downloadInvoice
  } = useBilling()
  
  const [isUpgradeDialogOpen, setIsUpgradeDialogOpen] = useState(false)
  const [isPaymentMethodDialogOpen, setIsPaymentMethodDialogOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState('')
  const [newPaymentMethod, setNewPaymentMethod] = useState({
    card_number: '',
    exp_month: '',
    exp_year: '',
    cvc: '',
    name: ''
  })

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { variant: 'default', className: 'bg-green-100 text-green-800', icon: Check },
      canceled: { variant: 'secondary', className: 'bg-red-100 text-red-800', icon: X },
      past_due: { variant: 'destructive', className: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle },
      paid: { variant: 'default', className: 'bg-green-100 text-green-800', icon: Check },
      pending: { variant: 'secondary', className: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle }
    }
    
    const config = statusConfig[status] || statusConfig.pending
    const IconComponent = config.icon
    
    return (
      <Badge className={config.className}>
        <IconComponent className="h-3 w-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const handlePlanUpgrade = async () => {
    if (!selectedPlan) return
    
    const result = await updateSubscription(selectedPlan)
    if (result.success) {
      setIsUpgradeDialogOpen(false)
      setSelectedPlan('')
    } else {
      alert(`Error: ${result.error}`)
    }
  }

  const handleCancelSubscription = async () => {
    const result = await cancelSubscription()
    if (!result.success) {
      alert(`Error: ${result.error}`)
    }
  }

  const handleReactivateSubscription = async () => {
    const result = await reactivateSubscription()
    if (!result.success) {
      alert(`Error: ${result.error}`)
    }
  }

  const handleAddPaymentMethod = async (e) => {
    e.preventDefault()
    const result = await addPaymentMethod(newPaymentMethod)
    if (result.success) {
      setIsPaymentMethodDialogOpen(false)
      setNewPaymentMethod({
        card_number: '',
        exp_month: '',
        exp_year: '',
        cvc: '',
        name: ''
      })
    } else {
      alert(`Error: ${result.error}`)
    }
  }

  const handleRemovePaymentMethod = async (paymentMethodId) => {
    const result = await removePaymentMethod(paymentMethodId)
    if (!result.success) {
      alert(`Error: ${result.error}`)
    }
  }

  const handleSetDefaultPaymentMethod = async (paymentMethodId) => {
    const result = await setDefaultPaymentMethod(paymentMethodId)
    if (!result.success) {
      alert(`Error: ${result.error}`)
    }
  }

  const handleDownloadInvoice = async (invoiceId) => {
    const result = await downloadInvoice(invoiceId)
    if (!result.success) {
      alert(`Error: ${result.error}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <CreditCard className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading billing information...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Billing & Subscription</h1>
            <p className="text-muted-foreground">Manage your subscription, payment methods, and billing history</p>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="plans">Plans</TabsTrigger>
            <TabsTrigger value="usage">Usage</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Current Subscription */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Crown className="h-5 w-5 mr-2" />
                    Current Subscription
                  </CardTitle>
                  <CardDescription>
                    Your active subscription details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {subscription ? (
                    <>
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold">{subscription.plan}</h3>
                          <p className="text-sm text-gray-500">
                            {formatCurrency(subscription.price)}/{subscription.interval}
                          </p>
                        </div>
                        {getStatusBadge(subscription.status)}
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Current period:</span>
                          <span>{formatDate(subscription.current_period_start)} - {formatDate(subscription.current_period_end)}</span>
                        </div>
                        {subscription.cancel_at_period_end && (
                          <div className="flex items-center space-x-2 text-yellow-600">
                            <AlertTriangle className="h-4 w-4" />
                            <span className="text-sm">Subscription will cancel at period end</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-medium">Features included:</h4>
                        <ul className="space-y-1">
                          {subscription.features.map((feature, index) => (
                            <li key={index} className="flex items-center space-x-2 text-sm">
                              <Check className="h-3 w-3 text-green-500" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="flex space-x-2">
                        {subscription.cancel_at_period_end ? (
                          <Button onClick={handleReactivateSubscription} size="sm">
                            Reactivate Subscription
                          </Button>
                        ) : (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                Cancel Subscription
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Cancel Subscription</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to cancel your subscription? You'll continue to have access until the end of your current billing period.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={handleCancelSubscription}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Cancel Subscription
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                        <Button onClick={() => setIsUpgradeDialogOpen(true)} size="sm">
                          Change Plan
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <CreditCard className="h-8 w-8 mx-auto mb-3 text-gray-400" />
                      <h3 className="text-base font-medium text-gray-900 mb-2">No active subscription</h3>
                      <p className="text-sm text-gray-500 mb-3">Choose a plan to get started</p>
                      <Button onClick={() => setIsUpgradeDialogOpen(true)}>
                        View Plans
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Payment Methods */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CreditCard className="h-5 w-5 mr-2" />
                    Payment Methods
                  </CardTitle>
                  <CardDescription>
                    Manage your payment methods
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {paymentMethods.map((method) => (
                      <div key={method.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <CreditCard className="h-4 w-4" />
                          <div>
                            <div className="font-medium">
                              {method.brand.toUpperCase()} •••• {method.last4}
                            </div>
                            <div className="text-sm text-gray-500">
                              Expires {method.exp_month}/{method.exp_year}
                            </div>
                          </div>
                          {method.is_default && (
                            <Badge variant="outline" className="text-xs">Default</Badge>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          {!method.is_default && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSetDefaultPaymentMethod(method.id)}
                            >
                              Set Default
                            </Button>
                          )}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="outline">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remove Payment Method</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to remove this payment method? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleRemovePaymentMethod(method.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Remove
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setIsPaymentMethodDialogOpen(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Payment Method
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Plans Tab */}
          <TabsContent value="plans" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {subscriptionPlans.map((plan) => (
                <Card key={plan.id} className={`relative ${plan.popular ? 'ring-2 ring-blue-500' : ''}`}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-blue-500 text-white">
                        <Star className="h-3 w-3 mr-1" />
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="text-center">{plan.name}</CardTitle>
                    <CardDescription className="text-center">{plan.description}</CardDescription>
                    <div className="text-center">
                      <span className="text-3xl font-bold">{formatCurrency(plan.price)}</span>
                      <span className="text-gray-500">/{plan.interval}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 mb-6">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center space-x-2">
                          <Check className="h-4 w-4 text-green-500" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button 
                      className="w-full" 
                      variant={plan.popular ? 'default' : 'outline'}
                      onClick={() => {
                        setSelectedPlan(plan.id)
                        setIsUpgradeDialogOpen(true)
                      }}
                    >
                      {subscription?.plan === plan.name ? 'Current Plan' : 'Choose Plan'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Usage Tab */}
          <TabsContent value="usage" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Usage Overview</CardTitle>
                <CardDescription>
                  Monitor your current usage against plan limits
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Activity className="h-4 w-4" />
                      <span className="font-medium">Devices</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{usage.devices?.used || 0} used</span>
                        <span>{usage.devices?.limit === -1 ? 'Unlimited' : usage.devices?.limit || 0} limit</span>
                      </div>
                      <Progress value={usage.devices?.percentage || 0} className="h-2" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Zap className="h-4 w-4" />
                      <span className="font-medium">Automations</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{usage.automations?.used || 0} used</span>
                        <span>{usage.automations?.limit === -1 ? 'Unlimited' : usage.automations?.limit || 0} limit</span>
                      </div>
                      <Progress value={usage.automations?.percentage || 0} className="h-2" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Activity className="h-4 w-4" />
                      <span className="font-medium">API Calls</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{usage.api_calls?.used || 0} used</span>
                        <span>{usage.api_calls?.limit === -1 ? 'Unlimited' : usage.api_calls?.limit || 0} limit</span>
                      </div>
                      <Progress value={usage.api_calls?.percentage || 0} className="h-2" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Database className="h-4 w-4" />
                      <span className="font-medium">Storage</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{usage.storage?.used || 0} GB used</span>
                        <span>{usage.storage?.limit === -1 ? 'Unlimited' : usage.storage?.limit || 0} GB limit</span>
                      </div>
                      <Progress value={usage.storage?.percentage || 0} className="h-2" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Invoices Tab */}
          <TabsContent value="invoices" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Billing History</CardTitle>
                <CardDescription>
                  View and download your invoices
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {invoices.map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div>
                          <div className="font-medium">{invoice.description}</div>
                          <div className="text-sm text-gray-500">
                            {formatDate(invoice.created_at)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatCurrency(invoice.amount, invoice.currency)}</div>
                          {getStatusBadge(invoice.status)}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadInvoice(invoice.id)}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Upgrade Plan Dialog */}
        <Dialog open={isUpgradeDialogOpen} onOpenChange={setIsUpgradeDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change Subscription Plan</DialogTitle>
              <DialogDescription>
                Select a new plan for your subscription
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {subscriptionPlans.map((plan) => (
                <div
                  key={plan.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedPlan === plan.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedPlan(plan.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{plan.name}</h3>
                      <p className="text-sm text-gray-500">{plan.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(plan.price)}/{plan.interval}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsUpgradeDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handlePlanUpgrade} disabled={!selectedPlan}>
                Change Plan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Payment Method Dialog */}
        <Dialog open={isPaymentMethodDialogOpen} onOpenChange={setIsPaymentMethodDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Payment Method</DialogTitle>
              <DialogDescription>
                Add a new payment method to your account
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddPaymentMethod}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="card_number">Card Number</Label>
                  <Input
                    id="card_number"
                    value={newPaymentMethod.card_number}
                    onChange={(e) => setNewPaymentMethod({ ...newPaymentMethod, card_number: e.target.value })}
                    placeholder="1234 5678 9012 3456"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="exp_month">Expiry Month</Label>
                    <Input
                      id="exp_month"
                      value={newPaymentMethod.exp_month}
                      onChange={(e) => setNewPaymentMethod({ ...newPaymentMethod, exp_month: e.target.value })}
                      placeholder="MM"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="exp_year">Expiry Year</Label>
                    <Input
                      id="exp_year"
                      value={newPaymentMethod.exp_year}
                      onChange={(e) => setNewPaymentMethod({ ...newPaymentMethod, exp_year: e.target.value })}
                      placeholder="YYYY"
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="cvc">CVC</Label>
                  <Input
                    id="cvc"
                    value={newPaymentMethod.cvc}
                    onChange={(e) => setNewPaymentMethod({ ...newPaymentMethod, cvc: e.target.value })}
                    placeholder="123"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="name">Cardholder Name</Label>
                  <Input
                    id="name"
                    value={newPaymentMethod.name}
                    onChange={(e) => setNewPaymentMethod({ ...newPaymentMethod, name: e.target.value })}
                    placeholder="John Doe"
                    required
                  />
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setIsPaymentMethodDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add Payment Method</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
