/**
 * Reusable Data Table Component with robust error handling
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { LoadingSpinner, LoadingCard } from './LoadingSpinner';
import { Search, RefreshCw, AlertCircle } from 'lucide-react';

export function DataTable({ 
  data = [], 
  columns = [], 
  loading = false, 
  error = null, 
  onRefresh = null,
  searchable = false,
  title,
  description,
  emptyMessage = "No data available",
  className = ""
}) {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter data based on search term
  const filteredData = searchable && searchTerm
    ? data.filter(item => 
        Object.values(item).some(value => 
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    : data;

  if (loading) {
    return (
      <Card className={className}>
        {(title || description) && (
          <CardHeader>
            {title && <CardTitle>{title}</CardTitle>}
            {description && <CardDescription>{description}</CardDescription>}
          </CardHeader>
        )}
        <CardContent>
          <LoadingCard title="Loading data..." />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        {(title || description) && (
          <CardHeader>
            {title && <CardTitle>{title}</CardTitle>}
            {description && <CardDescription>{description}</CardDescription>}
          </CardHeader>
        )}
        <CardContent>
          <div className="flex items-center justify-center min-h-[200px] p-8">
            <div className="text-center space-y-4">
              <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
              <div>
                <h3 className="text-lg font-medium text-destructive">Error Loading Data</h3>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
              {onRefresh && (
                <Button onClick={onRefresh} variant="outline">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      {(title || description || searchable || onRefresh) && (
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              {title && <CardTitle>{title}</CardTitle>}
              {description && <CardDescription>{description}</CardDescription>}
            </div>
            <div className="flex items-center gap-2">
              {searchable && (
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 w-[200px]"
                  />
                </div>
              )}
              {onRefresh && (
                <Button onClick={onRefresh} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      )}
      <CardContent>
        {filteredData.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">{emptyMessage}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  {columns.map((column, index) => (
                    <th key={index} className="text-left p-2 font-medium">
                      {column.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item, rowIndex) => (
                  <tr key={rowIndex} className="border-b hover:bg-muted/50">
                    {columns.map((column, colIndex) => (
                      <td key={colIndex} className="p-2">
                        {column.render 
                          ? column.render(item[column.key], item, rowIndex)
                          : item[column.key]
                        }
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
