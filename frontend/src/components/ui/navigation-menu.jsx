import * as React from 'react'
import * as NavigationMenuPrimitive from '@radix-ui/react-navigation-menu'
import { cn } from '../../lib/utils'

const NavigationMenu = React.forwardRef(({ className, children, ...props }, ref) => (
  <NavigationMenuPrimitive.Root ref={ref} className={cn('relative z-10 flex flex-1 items-center', className)} {...props}>
    {children}
  </NavigationMenuPrimitive.Root>
))
NavigationMenu.displayName = NavigationMenuPrimitive.Root.displayName

const NavigationMenuList = React.forwardRef(({ className, ...props }, ref) => (
  <NavigationMenuPrimitive.List ref={ref} className={cn('group flex flex-1 list-none items-center justify-start gap-1', className)} {...props} />
))
NavigationMenuList.displayName = NavigationMenuPrimitive.List.displayName

const NavigationMenuItem = NavigationMenuPrimitive.Item

const NavigationMenuLink = React.forwardRef(({ className, ...props }, ref) => (
  <NavigationMenuPrimitive.Link
    ref={ref}
    className={cn('inline-flex h-9 items-center rounded-md px-3 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent transition-colors', className)}
    {...props}
  />
))
NavigationMenuLink.displayName = NavigationMenuPrimitive.Link.displayName

export { NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuLink }


