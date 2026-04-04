import { motion } from 'framer-motion'
import { UserPlus } from 'lucide-react'
import { useEffect, useState } from 'react'
import api from '../api/client'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Spinner } from '../components/ui/spinner'
import { useToast } from '../context/ToastContext'

const emptyForm = { name: '', email: '', password: '', role: 'user' }

const UserManagementPage = () => {
  const [users, setUsers] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const { showToast } = useToast()

  const loadUsers = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/api/users/')
      setUsers(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadUsers() }, [])

  const createUser = async (e) => {
    e.preventDefault()
    setCreating(true)
    try {
      await api.post('/api/users/', form)
      showToast('User created successfully')
      setForm(emptyForm)
      await loadUsers()
    } catch {
      showToast('Failed to create user', 'error')
    } finally {
      setCreating(false)
    }
  }

  const changeRole = async (userId, role) => {
    try {
      await api.put(`/api/users/${userId}`, { role })
      showToast('Role updated')
      await loadUsers()
    } catch {
      showToast('Failed to update role', 'error')
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="mb-1 flex items-center gap-2">
          <div className="h-px w-6 bg-primary" />
          <span className="font-mono text-xs uppercase tracking-widest text-primary">Admin</span>
        </div>
        <h1 className="font-heading text-4xl font-bold text-foreground">User Management</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create and manage user accounts and roles.
        </p>
      </div>

      {/* Create user form */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="rounded-sm border border-border bg-card overflow-hidden"
      >
        <div className="flex items-center gap-3 border-b border-border bg-muted/30 px-6 py-4">
          <UserPlus className="h-4 w-4 text-muted-foreground" />
          <p className="font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Create User
          </p>
        </div>
        <form onSubmit={createUser} className="p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Name
              </label>
              <Input
                placeholder="Full name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Email
              </label>
              <Input
                type="email"
                placeholder="user@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Password
              </label>
              <Input
                type="password"
                placeholder="Min. 6 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Role
              </label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="rounded-sm border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-2 focus:outline-ring focus:outline-offset-1"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <Button type="submit" disabled={creating} className="mt-5 gap-2">
            <UserPlus className="h-3.5 w-3.5" />
            {creating ? 'Creating...' : 'Create User'}
          </Button>
        </form>
      </motion.div>

      {/* Users table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
          <h2 className="font-heading text-xl font-semibold text-foreground">All Users</h2>
          <span className="font-mono text-xs text-muted-foreground">{users.length} total</span>
        </div>

        <div className="overflow-hidden rounded-sm border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-3 text-left font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Name
                </th>
                <th className="hidden px-4 py-3 text-left font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground md:table-cell">
                  Email
                </th>
                <th className="px-4 py-3 text-left font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Role
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-4 py-10 text-center">
                    <div className="flex items-center justify-center gap-3 text-muted-foreground">
                      <Spinner /> <span className="text-sm">Loading users...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((user, i) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.04 }}
                    className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-foreground">{user.name}</td>
                    <td className="hidden px-4 py-3 font-mono text-xs text-muted-foreground md:table-cell">
                      {user.email}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={user.role}
                        onChange={(e) => changeRole(user.id, e.target.value)}
                        className="rounded-sm border border-border bg-card px-2 py-1 font-mono text-xs text-foreground focus:outline-2 focus:outline-ring"
                      >
                        <option value="user">user</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}

export default UserManagementPage
