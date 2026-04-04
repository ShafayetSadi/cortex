import { motion } from 'framer-motion'
import { LockKeyhole, Mail, UserRound } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { useAuth } from '../context/AuthContext'

const RegisterPage = () => {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await register({ name: form.name, email: form.email, password: form.password })
      navigate('/dashboard')
    } catch (err) {
      setError(err?.response?.data?.detail || 'Unable to register. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto grid min-h-[76vh] max-w-4xl items-center gap-12 py-8 md:grid-cols-2">
      {/* Left panel */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="hidden md:block"
      >
        <div className="mb-3 flex items-center gap-2">
          <div className="h-px w-8 bg-accent" />
          <span className="font-mono text-xs font-medium uppercase tracking-widest text-accent">
            New Account
          </span>
        </div>
        <h2 className="font-heading text-5xl font-bold leading-[1.1] text-foreground">
          Join the<br />
          <span className="italic">workspace.</span>
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Register to upload documents, manage your knowledge base, and query it in plain language.
        </p>

        <div className="mt-10 space-y-3 border-t border-border pt-8">
          {[
            'Free to get started',
            'Upload unlimited PDFs',
            'AI-powered Q&A on your documents',
          ].map((feat) => (
            <div key={feat} className="flex items-center gap-3">
              <div className="h-1.5 w-1.5 rounded-full bg-accent" />
              <p className="text-sm text-muted-foreground">{feat}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="rounded-sm border border-border bg-card p-8 shadow-sm"
      >
        <h3 className="font-heading text-2xl font-semibold text-foreground">Create account</h3>
        <p className="mt-1 text-xs text-muted-foreground">Fill in the details to get started.</p>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
          <div className="grid gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Full Name
            </label>
            <div className="relative">
              <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" name="name" value={form.name} onChange={handleChange} placeholder="Your name" required />
            </div>
          </div>

          <div className="grid gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Email
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" type="email" name="email" value={form.email} onChange={handleChange} placeholder="you@example.com" required />
            </div>
          </div>

          <div className="grid gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Password
            </label>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" type="password" name="password" value={form.password} onChange={handleChange} placeholder="Min. 6 characters" minLength={6} required />
            </div>
          </div>

          <div className="grid gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Confirm Password
            </label>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} placeholder="Repeat password" minLength={6} required />
            </div>
          </div>

          {error && (
            <p className="rounded-sm border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800/50 dark:bg-red-950/30 dark:text-red-300">
              {error}
            </p>
          )}

          <Button type="submit" disabled={loading} className="mt-2 w-full">
            {loading ? 'Creating account...' : 'Create account'}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </motion.div>
    </div>
  )
}

export default RegisterPage
