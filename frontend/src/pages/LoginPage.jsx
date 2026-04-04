import { motion } from 'framer-motion'
import { LockKeyhole, Mail } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { useAuth } from '../context/AuthContext'

const LoginPage = () => {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch {
      setError('Invalid credentials. Please try again.')
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
          <div className="h-px w-8 bg-primary" />
          <span className="font-mono text-xs font-medium uppercase tracking-widest text-primary">
            Secure Access
          </span>
        </div>
        <h2 className="font-heading text-5xl font-bold leading-[1.1] text-foreground">
          Welcome<br />
          <span className="italic">back.</span>
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Sign in to continue managing semantic documents and role-based operations.
        </p>

        <div className="mt-10 space-y-3 border-t border-border pt-8">
          {[
            'Upload and manage PDF documents',
            'Ask questions with AI-powered answers',
            'Role-based access control',
          ].map((feat) => (
            <div key={feat} className="flex items-center gap-3">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
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
        <h3 className="font-heading text-2xl font-semibold text-foreground">Sign in</h3>
        <p className="mt-1 text-xs text-muted-foreground">Use your account credentials to continue.</p>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
          <div className="grid gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Email
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
          </div>

          <div className="grid gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Password
            </label>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {error && (
            <p className="rounded-sm border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800/50 dark:bg-red-950/30 dark:text-red-300">
              {error}
            </p>
          )}

          <Button type="submit" disabled={loading} className="mt-2 w-full">
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            New here?{' '}
            <Link to="/register" className="font-medium text-primary hover:underline">
              Create an account
            </Link>
          </p>
        </form>
      </motion.div>
    </div>
  )
}

export default LoginPage
