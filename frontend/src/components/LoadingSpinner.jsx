/**
 * Reusable Loading Spinner Component
 */

import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

export function LoadingSpinner({ className, size = 'default', ...props }) {
  return (
    <Loader2 
      className={cn(
        "animate-spin",
        size === 'sm' && "h-4 w-4",
        size === 'default' && "h-6 w-6", 
        size === 'lg' && "h-8 w-8",
        className
      )} 
      {...props} 
    />
  );
}

export function LoadingCard({ title = "Loading...", description }) {
  return (
    <div className="flex items-center justify-center min-h-[200px] p-8">
      <div className="text-center space-y-4">
        <LoadingSpinner size="lg" className="mx-auto text-muted-foreground" />
        <div>
          <h3 className="text-lg font-medium">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export function LoadingPage({ title = "Loading...", description }) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center space-y-4">
        <LoadingSpinner size="lg" className="mx-auto text-muted-foreground" />
        <div>
          <h2 className="text-xl font-semibold">{title}</h2>
          {description && (
            <p className="text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
}
