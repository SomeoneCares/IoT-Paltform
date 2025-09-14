import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import '../modern-styles.css'
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { 
  Home, 
  Settings, 
  Users, 
  Activity, 
  LogOut, 
  User,
  Building2,
  Network,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  ChevronLeft,
  ChevronRight as ChevronRightIcon
} from 'lucide-react'

export default function Sidebar({ currentPage, onPageChange, isCollapsed, onToggleCollapse }) {
  const { user, logout, hasPermission } = useAuth()
  const [expandedItems, setExpandedItems] = useState(['dashboard', 'management'])

  const toggleExpanded = (itemId) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      path: '/',
      type: 'single'
    },
    {
      id: 'management',
      label: 'Management',
      icon: Settings,
      type: 'group',
      children: [
        {
          id: 'devices',
          label: 'Devices',
          icon: Activity,
          path: '/devices',
          type: 'single'
        },
        {
          id: 'organizations',
          label: 'Organizations',
          icon: Building2,
          path: '/organizations',
          type: 'single'
        },
        {
          id: 'matter-thread',
          label: 'Matter & Thread',
          icon: Network,
          path: '/matter-thread',
          type: 'single'
        },
        ...(hasPermission('manage_users') ? [{
          id: 'users',
          label: 'User Management',
          icon: Users,
          path: '/users',
          type: 'single'
        }] : [])
      ]
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      path: '/settings',
      type: 'single'
    }
  ]

  const handleLogout = () => {
    logout()
  }

  const renderNavItem = (item, level = 0) => {
    const isActive = currentPage === item.id
    const isExpanded = expandedItems.includes(item.id)
    const hasChildren = item.children && item.children.length > 0

    if (item.type === 'group') {
      return (
        <Collapsible
          key={item.id}
          open={isExpanded}
          onOpenChange={() => toggleExpanded(item.id)}
        >
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className={`w-full justify-start h-10 px-3 ${
                isCollapsed ? 'px-2' : 'px-3'
              } ${level > 0 ? 'ml-4' : ''}`}
            >
              <item.icon className={`h-4 w-4 ${isCollapsed ? 'mx-auto' : 'mr-3'}`} />
              {!isCollapsed && (
                <>
                  <span className="flex-1 text-left">{item.label}</span>
                  {hasChildren && (
                    isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
                  )}
                </>
              )}
            </Button>
          </CollapsibleTrigger>
          {hasChildren && !isCollapsed && (
            <CollapsibleContent className="space-y-1">
              {item.children.map(child => renderNavItem(child, level + 1))}
            </CollapsibleContent>
          )}
        </Collapsible>
      )
    }

    const button = (
      <Button
        key={item.id}
        variant={isActive ? "secondary" : "ghost"}
        className={`sidebar-item-modern w-full justify-start h-10 px-3 ${
          isCollapsed ? 'px-2' : 'px-3'
        } ${level > 0 ? 'ml-4' : ''} ${
          isActive ? 'active' : ''
        } interactive-hover`}
        onClick={() => onPageChange(item.id)}
      >
        <item.icon className={`h-4 w-4 ${isCollapsed ? 'mx-auto' : 'mr-3'}`} />
        {!isCollapsed && <span className="flex-1 text-left font-medium">{item.label}</span>}
      </Button>
    )

    if (isCollapsed) {
      return (
        <Tooltip key={item.id}>
          <TooltipTrigger asChild>
            {button}
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>{item.label}</p>
          </TooltipContent>
        </Tooltip>
      )
    }

    return button
  }

  return (
    <TooltipProvider>
      <div className={`sidebar-modern flex flex-col h-full transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        {!isCollapsed && (
          <div className="flex items-center space-x-3 animate-slide-in-left">
            <div className="device-icon-container">
              <Activity className="h-5 w-5" />
            </div>
            <span className="font-bold text-xl text-gradient-modern">IoT Platform</span>
          </div>
        )}
        {isCollapsed && (
          <div className="device-icon-container mx-auto animate-scale-in-bounce">
            <Activity className="h-5 w-5" />
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className="btn-modern h-8 w-8 p-0"
        >
          {isCollapsed ? (
            <ChevronRightIcon className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-2 py-4">
        <nav className="space-y-1">
          {navigationItems.map(item => renderNavItem(item))}
        </nav>
      </ScrollArea>

      {/* User Section */}
      <div className="p-4 border-t">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className={`w-full justify-start h-10 px-3 ${
                isCollapsed ? 'px-2' : 'px-3'
              }`}
            >
              <User className={`h-4 w-4 ${isCollapsed ? 'mx-auto' : 'mr-3'}`} />
              {!isCollapsed && (
                <>
                  <span className="flex-1 text-left truncate">{user?.username}</span>
                  <ChevronDown className="h-4 w-4" />
                </>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onPageChange('profile')}>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onPageChange('settings')}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      </div>
    </TooltipProvider>
  )
}
