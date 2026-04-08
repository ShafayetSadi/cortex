import { motion } from 'framer-motion'
import { Building2, LockKeyhole, Mail, UserRound } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { useAuth } from '../context/AuthContext'

const RegisterWorkspacePage = () => {
  const { registerWorkspace } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ workspaceName: '', adminName: '', adminEmail: '', password: '', confirmPassword: '' })
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
      await registerWorkspace({
        workspace_name: form.workspaceName,
        admin_name: form.adminName,
        admin_email: form.adminEmail,
        password: form.password
      })
      navigate('/dashboard')
    } catch (err) {
      setError(err?.response?.data?.detail || 'Unable to register workspace. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto grid min-h-[76vh] max-w-4xl items-center gap-12 py-8 md:grid-cols-2">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="hidden md:block"
      >
        <div className="mb-3 flex items-center gap-2">
          <div className="h-px w-8 bg-accent" />
          <span className="font-mono text-xs font-medium uppercase tracking-widest text-accent">
            New Organization
          </span>
        </div>
        <h2 className="font-heading text-5xl font-bold leading-[1.1] text-foreground">
          Setup your<br />
          <span className="italic">workspace.</span>
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Create an isolated environment for your organization&apos;s knowledge base. Add team members and securely query your documents.
        </p>

        <div className="mt-10 space-y-3 border-t border-border pt-8">
          {['Complete data isolation', 'Team management and roles', 'Custom workspace slug'].map((feat) => (
            <div key={feat} className="flex items-center gap-3">
              <div className="h-1.5 w-1.5 rounded-full bg-accent" />
              <p className="text-sm text-muted-foreground">{feat}</p>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="rounded-sm border border-border bg-card p-8 shadow-sm"
      >
        <h3 className="font-heading text-2xl font-semibold text-foreground">Create workspace</h3>
        <p className="mt-1 text-xs text-muted-foreground">Set up the organization profile.</p>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
          <div className="grid gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Organization Name
            </label>
            <div className="relative">
              <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" name="workspaceName" value={form.workspaceName} onChange={handleChange} placeholder="Acme Corp" required />
            </div>
          </div>

          <div className="grid gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Admin Name
            </label>
            <div className="relative">
              <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" name="adminName" value={form.adminName} onChange={handleChange} placeholder="Your name" required />
            </div>
          </div>

          <div className="grid gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Admin Email
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" type="email" name="adminEmail" value={form.adminEmail} onChange={handleChange} placeholder="admin@example.com" required />
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
            {loading ? 'Creating...' : 'Register Workspace'}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Invited by a team?{' '}
            <Link to="/register" className="font-medium text-primary hover:underline">
              Join here
            </Link>
          </p>
        </form>
      </motion.div>
    </div>
  )
}

export default RegisterWorkspacePage
