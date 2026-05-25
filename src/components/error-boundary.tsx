'use client'

import React, { Component, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, RotateCcw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex items-center justify-center min-h-[400px] p-6">
          <Card className="w-full max-w-md border-red-200/50 bg-red-50/30">
            <CardHeader className="text-center">
              <div className="mx-auto mb-3 size-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="size-6 text-red-600" />
              </div>
              <CardTitle className="text-lg text-slate-900">Something went wrong</CardTitle>
              <CardDescription className="text-sm text-slate-500">
                An unexpected error occurred. This has been logged for review.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <pre className="text-xs text-red-600 bg-red-100/50 rounded-lg p-3 overflow-auto max-h-32">
                  {this.state.error.message}
                </pre>
              )}
              <Button
                onClick={this.handleReset}
                className="w-full"
                variant="outline"
              >
                <RotateCcw className="size-4 mr-2" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}
