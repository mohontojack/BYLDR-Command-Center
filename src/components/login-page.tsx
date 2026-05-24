'use client'

import React, { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { loginUser, ApiError } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

import {
  Rocket,
  Eye,
  EyeOff,
  Loader2,
  Zap,
  Users,
  Target,
  ArrowRight,
  Shield,
  BarChart3,
} from 'lucide-react'

export function LoginPage() {
  const { login } = useAppStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email.trim()) {
      setError('Email is required')
      return
    }
    if (!password.trim()) {
      setError('Password is required')
      return
    }

    setLoading(true)
    try {
      const { user } = await loginUser(email.trim().toLowerCase(), password)
      login(user)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleQuickLogin = async (quickEmail: string, quickPassword: string) => {
    setEmail(quickEmail)
    setPassword(quickPassword)
    setError('')
    setLoading(true)
    try {
      const { user } = await loginUser(quickEmail, quickPassword)
      login(user)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Something went wrong.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <Rocket className="size-12 text-primary animate-pulse" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* ─── LEFT: Branding / Hero Panel ─── */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950">
        {/* Decorative grid */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }} />

        {/* Decorative glowing orbs */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -bottom-48 -right-48 w-[500px] h-[500px] rounded-full bg-teal-500/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/3 w-64 h-64 rounded-full bg-purple-500/5 blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Rocket className="size-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">BYLDR</h1>
              <p className="text-emerald-400 text-xs font-medium tracking-wider uppercase">Command Center</p>
            </div>
          </div>

          {/* Hero Content */}
          <div className="flex-1 flex flex-col justify-center max-w-lg">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 w-fit mb-6">
              <Zap className="size-3.5 text-emerald-400" />
              <span className="text-emerald-300 text-xs font-medium">14-Day Funnel System</span>
            </div>

            <h2 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-4">
              Your Agency's
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400">
                Operational Hub
              </span>
            </h2>

            <p className="text-slate-400 text-lg leading-relaxed mb-10">
              Centralize lead management, automate funnel execution, and track every task — all from one command center built for VSUAL Digital Media.
            </p>

            {/* Feature pills */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Target, label: 'Funnel Tracking', desc: '6-stage pipeline' },
                { icon: Zap, label: 'Smart Automation', desc: 'Trigger-based workflows' },
                { icon: Users, label: 'Team Coordination', desc: 'Role-based assignments' },
                { icon: BarChart3, label: 'Real-time Dashboard', desc: 'Live KPI metrics' },
              ].map(({ icon: Icon, label, desc }) => (
                <div
                  key={label}
                  className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-colors"
                >
                  <div className="size-9 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="size-4 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{label}</p>
                    <p className="text-xs text-slate-500">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <Shield className="size-4" />
            <span>Powered by VSUAL Digital Media</span>
          </div>
        </div>
      </div>

      {/* ─── RIGHT: Login Form ─── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex flex-col items-center gap-4 mb-4">
            <div className="size-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Rocket className="size-7 text-white" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold tracking-tight">BYLDR</h1>
              <p className="text-muted-foreground text-sm">Command Center</p>
            </div>
          </div>

          {/* Login Card */}
          <Card className="border-slate-200/60 shadow-xl shadow-slate-900/5">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-2xl font-bold tracking-tight">Welcome back</CardTitle>
              <CardDescription className="text-slate-500">
                Sign in to access your command center
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@vsual.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      setError('')
                    }}
                    className="h-11 bg-background"
                    autoComplete="email"
                    autoFocus
                  />
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-sm font-medium">
                      Password
                    </Label>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value)
                        setError('')
                      }}
                      className="h-11 bg-background pr-10"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                    <Shield className="size-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Submit */}
                <Button
                  type="submit"
                  className="w-full h-11 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-medium shadow-lg shadow-emerald-500/20 transition-all duration-200"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="size-4 animate-spin mr-2" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign in
                      <ArrowRight className="size-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>

              <Separator className="my-4" />

              {/* Quick Access */}
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 text-center">
                  Quick Access (Demo Accounts)
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('sal@vsual.com', 'sal2024')}
                    className="flex flex-col items-center gap-2 p-3 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all cursor-pointer group"
                  >
                    <div className="size-10 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                      S
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium">Sal</p>
                      <p className="text-[11px] text-muted-foreground">CSO</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('geo@vsual.com', 'geo2024')}
                    className="flex flex-col items-center gap-2 p-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all cursor-pointer group"
                  >
                    <div className="size-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                      G
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium">Geo</p>
                      <p className="text-[11px] text-muted-foreground">Tech Lead</p>
                    </div>
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bottom info */}
          <div className="text-center space-y-1">
            <p className="text-xs text-muted-foreground">
              Built for VSUAL Digital Media
            </p>
            <p className="text-xs text-muted-foreground/60">
              NXL BYLDR &middot; CA BYLDRS &middot; BYLDRS GUARDIAN
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
