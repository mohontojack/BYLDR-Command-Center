'use client'

import React, { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { loginUser, ApiError } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'

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
  Lock,
} from 'lucide-react'

/* ──────────────────────────────────────────────────────────
   Feature data for the left panel cards
   ────────────────────────────────────────────────────────── */
const features = [
  { icon: Target, label: 'Funnel Tracking', desc: '6-stage pipeline' },
  { icon: Zap, label: 'Smart Automation', desc: 'Trigger-based workflows' },
  { icon: Users, label: 'Team Coordination', desc: 'Role-based assignments' },
  { icon: BarChart3, label: 'Real-time Dashboard', desc: 'Live KPI metrics' },
]

/* ──────────────────────────────────────────────────────────
   CSS keyframe animations injected once at module level
   ────────────────────────────────────────────────────────── */
const animationStyles = `
  @keyframes bldr-fade-in {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes bldr-slide-up {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes bldr-orb-float-1 {
    0%, 100% { transform: translate(0, 0) scale(1); }
    25%      { transform: translate(30px, -20px) scale(1.05); }
    50%      { transform: translate(-15px, 15px) scale(0.95); }
    75%      { transform: translate(20px, 25px) scale(1.02); }
  }
  @keyframes bldr-orb-float-2 {
    0%, 100% { transform: translate(0, 0) scale(1); }
    25%      { transform: translate(-25px, 30px) scale(1.08); }
    50%      { transform: translate(20px, -10px) scale(0.93); }
    75%      { transform: translate(-10px, -20px) scale(1.04); }
  }
  @keyframes bldr-orb-float-3 {
    0%, 100% { transform: translate(0, 0) scale(1); }
    33%      { transform: translate(15px, 20px) scale(1.06); }
    66%      { transform: translate(-20px, -15px) scale(0.96); }
  }
  @keyframes bldr-orb-pulse {
    0%, 100% { opacity: 0.12; }
    50%      { opacity: 0.22; }
  }
  @keyframes bldr-shimmer {
    0%   { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
`

/* ──────────────────────────────────────────────────────────
   Demo quick-access accounts
   ────────────────────────────────────────────────────────── */
const demoAccounts = [
  {
    name: 'Sal',
    role: 'CSO',
    email: 'sal@vsual.com',
    password: 'sal2024',
    gradient: 'from-emerald-500 to-emerald-600',
    hoverBorder: 'hover:border-emerald-300',
    hoverBg: 'hover:bg-emerald-50/50',
  },
  {
    name: 'Geo',
    role: 'Tech Lead',
    email: 'geo@vsual.com',
    password: 'geo2024',
    gradient: 'from-blue-500 to-blue-600',
    hoverBorder: 'hover:border-blue-300',
    hoverBg: 'hover:bg-blue-50/50',
  },
]

/* ══════════════════════════════════════════════════════════
   LOGIN PAGE COMPONENT
   ══════════════════════════════════════════════════════════ */
export function LoginPage() {
  const { login } = useAppStore()

  /* ── state ── */
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  /* ── handlers ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email.trim()) {
      setError('Email is required')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address')
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

  /* ── hydration gate ── */
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950">
        <style>{animationStyles}</style>
        <Rocket className="size-12 text-emerald-400" style={{ animation: 'bldr-orb-pulse 2s ease-in-out infinite' }} />
      </div>
    )
  }

  return (
    <>
      <style>{animationStyles}</style>

      <div
        className="min-h-screen flex bg-background"
        style={{ animation: 'bldr-fade-in 0.6s ease-out both' }}
      >
        {/* ═══════════════════════════════════════════════════
            LEFT PANEL — Branding / Hero
            ═══════════════════════════════════════════════════ */}
        <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950">

          {/* ── Grid overlay ── */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
              backgroundSize: '48px 48px',
            }}
          />

          {/* ── Dot pattern ── */}
          <div
            className="absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage: 'radial-gradient(circle, white 1.2px, transparent 1.2px)',
              backgroundSize: '32px 32px',
            }}
          />

          {/* ── Animated gradient orbs ── */}
          <div
            className="absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full bg-emerald-500/15 blur-[100px]"
            style={{
              animation: 'bldr-orb-float-1 18s ease-in-out infinite, bldr-orb-pulse 6s ease-in-out infinite',
            }}
          />
          <div
            className="absolute -bottom-52 -right-52 w-[600px] h-[600px] rounded-full bg-teal-500/15 blur-[120px]"
            style={{
              animation: 'bldr-orb-float-2 22s ease-in-out infinite, bldr-orb-pulse 8s ease-in-out infinite 1s',
            }}
          />
          <div
            className="absolute top-1/3 left-1/2 w-80 h-80 rounded-full bg-cyan-500/10 blur-[90px]"
            style={{
              animation: 'bldr-orb-float-3 15s ease-in-out infinite, bldr-orb-pulse 7s ease-in-out infinite 2s',
            }}
          />
          <div
            className="absolute bottom-1/4 left-1/4 w-64 h-64 rounded-full bg-purple-500/8 blur-[80px]"
            style={{
              animation: 'bldr-orb-float-1 20s ease-in-out infinite reverse',
            }}
          />

          {/* ── Content ── */}
          <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full">

            {/* Logo row */}
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25 transition-transform duration-300 hover:scale-105">
                <Rocket className="size-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">BYLDR</h1>
                <p className="text-emerald-400 text-xs font-semibold tracking-widest uppercase">
                  Command Center
                </p>
              </div>
            </div>

            {/* Hero section */}
            <div className="flex-1 flex flex-col justify-center max-w-lg">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 w-fit mb-8 backdrop-blur-sm">
                <Zap className="size-3.5 text-emerald-400" />
                <span className="text-emerald-300 text-xs font-semibold tracking-wide">
                  14-Day Funnel System
                </span>
              </div>

              {/* Headline */}
              <h2 className="text-4xl xl:text-5xl font-bold text-white leading-[1.15] mb-5">
                Your Agency&apos;s
                <br />
                <span
                  className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400"
                  style={{
                    backgroundImage:
                      'linear-gradient(90deg, #34d399, #2dd4bf, #22d3ee, #34d399)',
                    backgroundSize: '200% auto',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    animation: 'bldr-shimmer 4s linear infinite',
                  }}
                >
                  Operational Hub
                </span>
              </h2>

              {/* Subheadline */}
              <p className="text-slate-400 text-lg leading-relaxed mb-10 max-w-md">
                Centralize lead management, automate funnel execution, and track every task — all from one command center built for VSUAL Digital Media.
              </p>

              {/* Feature cards grid */}
              <div className="grid grid-cols-2 gap-3">
                {features.map(({ icon: Icon, label, desc }, i) => (
                  <div
                    key={label}
                    className="group flex items-start gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm transition-all duration-300 hover:bg-white/[0.07] hover:border-white/[0.12] hover:-translate-y-0.5 cursor-default"
                    style={{
                      animation: `bldr-slide-up 0.5s ease-out ${0.3 + i * 0.1}s both`,
                    }}
                  >
                    <div className="size-9 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5 transition-colors duration-300 group-hover:bg-emerald-500/20">
                      <Icon className="size-4 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white mb-0.5">{label}</p>
                      <p className="text-xs text-slate-500">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer row */}
            <div className="flex flex-col gap-4">
              {/* Product pill badges */}
              <div className="flex flex-wrap gap-2">
                {['NXL BYLDR', 'CA BYLDRS', 'BYLDRS GUARDIAN'].map((product) => (
                  <span
                    key={product}
                    className="px-3 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-white/[0.04] border border-white/[0.08] text-slate-400"
                  >
                    {product}
                  </span>
                ))}
              </div>
              {/* Powered by */}
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                <Shield className="size-4 text-emerald-500/60" />
                <span>Powered by VSUAL Digital Media</span>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════
            RIGHT PANEL — Login Form
            ═══════════════════════════════════════════════════ */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-8 bg-gradient-to-br from-white via-slate-50/50 to-white">
          <div className="w-full max-w-md">

            {/* ── Mobile-only logo ── */}
            <div className="lg:hidden flex flex-col items-center gap-3 mb-8">
              <div className="size-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                <Rocket className="size-7 text-white" />
              </div>
              <div className="text-center">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">BYLDR</h1>
                <p className="text-slate-500 text-sm font-medium">Command Center</p>
              </div>
            </div>

            {/* ── Login card ── */}
            <Card
              className="border-slate-200/80 shadow-xl shadow-slate-900/[0.04] backdrop-blur-sm"
              style={{ animation: 'bldr-slide-up 0.6s ease-out 0.15s both' }}
            >
              <CardHeader className="space-y-2 pb-2">
                <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
                  Welcome back
                </CardTitle>
                <CardDescription className="text-slate-500 text-[15px]">
                  Sign in to access your command center
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-5 pt-4">
                <form onSubmit={handleSubmit} className="space-y-4">

                  {/* ── Email ── */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-slate-700">
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
                      className="h-11 bg-white border-slate-200 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-400 transition-colors"
                      autoComplete="email"
                      autoFocus
                    />
                  </div>

                  {/* ── Password ── */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                        Password
                      </Label>
                      <a
                        href="#"
                        onClick={(e) => e.preventDefault()}
                        className="text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
                      >
                        Forgot password?
                      </a>
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
                        className="h-11 bg-white border-slate-200 pr-10 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-400 transition-colors"
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? (
                          <EyeOff className="size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* ── Remember me ── */}
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="remember"
                      checked={rememberMe}
                      onCheckedChange={(checked) =>
                        setRememberMe(checked === true)
                      }
                      className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                    />
                    <Label
                      htmlFor="remember"
                      className="text-sm text-slate-500 cursor-pointer select-none font-normal"
                    >
                      Remember me
                    </Label>
                  </div>

                  {/* ── Error display ── */}
                  {error && (
                    <div
                      className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200/80 text-red-700 text-sm"
                      style={{ animation: 'bldr-fade-in 0.2s ease-out' }}
                    >
                      <Lock className="size-4 shrink-0 mt-0.5 text-red-500" />
                      <span className="leading-relaxed">{error}</span>
                    </div>
                  )}

                  {/* ── Submit button ── */}
                  <Button
                    type="submit"
                    className="w-full h-11 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold shadow-lg shadow-emerald-500/20 transition-all duration-200 hover:shadow-xl hover:shadow-emerald-500/30 active:scale-[0.98]"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2
                          className="size-4 mr-2 animate-spin"
                          style={{ animation: 'spin 1s linear infinite' }}
                        />
                        Signing in&hellip;
                      </>
                    ) : (
                      <>
                        Sign in
                        <ArrowRight className="size-4 ml-2" />
                      </>
                    )}
                  </Button>
                </form>

                {/* ── Separator ── */}
                <div className="relative flex items-center gap-3 py-1">
                  <Separator className="flex-1" />
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider whitespace-nowrap">
                    or continue with
                  </span>
                  <Separator className="flex-1" />
                </div>

                {/* ── Quick Access demo accounts ── */}
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-3 text-center">
                    Quick Access — Demo Accounts
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {demoAccounts.map((account) => (
                      <button
                        key={account.name}
                        type="button"
                        onClick={() => handleQuickLogin(account.email, account.password)}
                        disabled={loading}
                        className={`flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 ${account.hoverBorder} ${account.hoverBg} transition-all duration-200 cursor-pointer group disabled:opacity-50 disabled:pointer-events-none hover:-translate-y-0.5 hover:shadow-md`}
                      >
                        <div
                          className={`size-10 rounded-full bg-gradient-to-br ${account.gradient} flex items-center justify-center text-white font-bold text-sm shadow-sm group-hover:shadow-md transition-shadow duration-200`}
                        >
                          {account.name[0]}
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-semibold text-slate-800 group-hover:text-slate-900 transition-colors">
                            {account.name}
                          </p>
                          <p className="text-[11px] text-slate-400 font-medium">{account.role}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ── Bottom footer ── */}
            <div className="text-center space-y-2 mt-8" style={{ animation: 'bldr-fade-in 0.5s ease-out 0.5s both' }}>
              <p className="text-xs text-slate-400">
                Built for <span className="font-semibold text-slate-500">VSUAL Digital Media</span>
              </p>
              <div className="flex items-center justify-center gap-1.5">
                {['NXL BYLDR', 'CA BYLDRS', 'BYLDRS GUARDIAN'].map((product, i) => (
                  <span key={product} className="text-[10px] text-slate-300 font-medium">
                    {i > 0 && <span className="mx-1 text-slate-200">&middot;</span>}
                    {product}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
