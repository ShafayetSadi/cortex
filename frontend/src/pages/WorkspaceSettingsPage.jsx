import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle,
  Building2,
  Calendar,
  Check,
  Copy,
  FileText,
  Link2,
  Loader2,
  Mail,
  Save,
  Trash2,
  UserMinus,
  UserPlus,
  Users,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Spinner } from '../components/ui/spinner'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

// ---------------------------------------------------------------------------
// Sub-component: stat card
// ---------------------------------------------------------------------------
const StatCard = ({ icon: Icon, label, value }) => (
  <div className="rounded-sm border border-border bg-card p-5 flex items-start gap-4">
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-muted text-muted-foreground">
      <Icon className="h-4 w-4" />
    </div>
    <div>
      <p className="font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-heading text-2xl font-bold text-foreground">{value}</p>
    </div>
  </div>
)

// ---------------------------------------------------------------------------
// Sub-component: invite modal
// ---------------------------------------------------------------------------
const InviteModal = ({ onClose }) => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [inviteUrl, setInviteUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const { showToast } = useToast()

  const handleGenerate = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { data } = await api.post('/api/workspaces/me/invite', {
        email: email || null,
      })
      // Replace the API base URL with the frontend origin so the link opens the app
      const token = data.token
      const url = `${window.location.origin}/register?invite=${token}`
      setInviteUrl(url)
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to generate invite link.')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    showToast('Invite link copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-foreground/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md rounded-sm border border-border bg-card p-6 shadow-lg"
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-heading text-xl font-semibold text-foreground">Invite member</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Generate a one-time invite link (valid 48 h)
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-sm p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {!inviteUrl ? (
          <form onSubmit={handleGenerate} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Email (optional)
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="colleague@company.com"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                If set, only this email address can use the link.
              </p>
            </div>

            {error && (
              <p className="rounded-sm border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800/50 dark:bg-red-950/30 dark:text-red-300">
                {error}
              </p>
            )}

            <Button type="submit" disabled={loading} className="w-full gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
              {loading ? 'Generating…' : 'Generate invite link'}
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="rounded-sm border border-border bg-muted/40 p-3">
              <p className="font-mono text-xs break-all text-foreground">{inviteUrl}</p>
            </div>
            <Button onClick={handleCopy} className="w-full gap-2">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied!' : 'Copy link'}
            </Button>
            <button
              onClick={() => setInviteUrl('')}
              className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Generate another link
            </button>
          </div>
        )}
      </motion.div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-component: delete workspace confirm dialog
// ---------------------------------------------------------------------------
const DeleteWorkspaceDialog = ({ workspaceName, onClose, onConfirm, deleting }) => {
  const [typed, setTyped] = useState('')
  const confirmWord = workspaceName || 'delete'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-foreground/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md rounded-sm border border-red-200 bg-card p-6 shadow-lg dark:border-red-800/50"
      >
        <div className="flex items-start gap-3 mb-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-heading text-lg font-semibold text-foreground">Delete workspace</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              This will permanently delete <strong>{workspaceName}</strong> and all its members,
              documents, and data. This action cannot be undone.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Type <span className="font-mono font-bold text-foreground">{confirmWord}</span> to confirm:
          </p>
          <Input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={confirmWord}
            className="font-mono"
          />
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onClose} disabled={deleting}>
              Cancel
            </Button>
            <Button
              className="flex-1 gap-2 bg-red-600 text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600"
              disabled={typed !== confirmWord || deleting}
              onClick={onConfirm}
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              {deleting ? 'Deleting…' : 'Delete workspace'}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
const WorkspaceSettingsPage = () => {
  const { workspace, logout } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  // Settings form
  const [form, setForm] = useState({ name: '', slug: '' })
  const [saving, setSaving] = useState(false)
  const [settingsError, setSettingsError] = useState('')
  const [settingsSuccess, setSettingsSuccess] = useState('')

  // Members
  const [members, setMembers] = useState([])
  const [membersLoading, setMembersLoading] = useState(true)
  const [removingId, setRemovingId] = useState(null)

  // Docs count
  const [docCount, setDocCount] = useState(null)

  // UI modals
  const [showInvite, setShowInvite] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Seed the form from context
  useEffect(() => {
    if (workspace) setForm({ name: workspace.name, slug: workspace.slug })
  }, [workspace])

  // Fetch members
  const loadMembers = async () => {
    setMembersLoading(true)
    try {
      const { data } = await api.get('/api/workspaces/me/members')
      setMembers(data)
    } finally {
      setMembersLoading(false)
    }
  }

  // Fetch doc count
  const loadDocCount = async () => {
    try {
      const { data } = await api.get('/api/documents/')
      setDocCount(data.length)
    } catch {
      setDocCount('—')
    }
  }

  useEffect(() => {
    loadMembers()
    loadDocCount()
  }, [])

  const handleSettingsSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setSettingsError('')
    setSettingsSuccess('')
    try {
      await api.put('/api/workspaces/me', { name: form.name, slug: form.slug })
      setSettingsSuccess('Workspace settings updated successfully.')
      showToast('Settings saved')
    } catch (err) {
      setSettingsError(err?.response?.data?.detail || 'Failed to update workspace settings.')
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveMember = async (userId) => {
    setRemovingId(userId)
    try {
      await api.delete(`/api/workspaces/me/members/${userId}`)
      setMembers((prev) => prev.filter((m) => m.id !== userId))
      showToast('Member removed')
    } catch (err) {
      showToast(err?.response?.data?.detail || 'Failed to remove member', 'error')
    } finally {
      setRemovingId(null)
    }
  }

  const handleDeleteWorkspace = async () => {
    setDeleting(true)
    try {
      await api.delete('/api/workspaces/me')
      logout()
      navigate('/login')
    } catch (err) {
      showToast(err?.response?.data?.detail || 'Failed to delete workspace', 'error')
      setDeleting(false)
    }
  }

  if (!workspace) {
    return (
      <div className="py-12 flex justify-center">
        <Spinner />
      </div>
    )
  }

  const createdDate = workspace.created_at
    ? new Date(workspace.created_at).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '—'

  return (
    <>
      {/* Modals */}
      <AnimatePresence>
        {showInvite && <InviteModal onClose={() => setShowInvite(false)} />}
        {showDelete && (
          <DeleteWorkspaceDialog
            workspaceName={workspace.name}
            onClose={() => setShowDelete(false)}
            onConfirm={handleDeleteWorkspace}
            deleting={deleting}
          />
        )}
      </AnimatePresence>

      <div className="space-y-10">
        {/* Page header */}
        <div>
          <div className="mb-1 flex items-center gap-2">
            <div className="h-px w-6 bg-primary" />
            <span className="font-mono text-xs uppercase tracking-widest text-primary">Admin</span>
          </div>
          <h1 className="font-heading text-4xl font-bold text-foreground">Workspace Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your organization details, members, and preferences.
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard icon={Users} label="Members" value={members.length} />
          <StatCard icon={FileText} label="Documents" value={docCount ?? '…'} />
          <StatCard icon={Calendar} label="Created" value={createdDate} />
        </div>

        {/* Settings form */}
        <section className="space-y-4">
          <h2 className="font-heading text-xl font-semibold text-foreground border-b border-border pb-2">
            General
          </h2>
          <div className="rounded-sm border border-border bg-card p-6 md:w-2/3">
            <form onSubmit={handleSettingsSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Workspace Name
                </label>
                <div className="relative">
                  <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    name="name"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Slug URL
                </label>
                <Input
                  name="slug"
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  The unique identifier for your workspace.
                </p>
              </div>

              {settingsError && (
                <p className="rounded-sm border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800/50 dark:bg-red-950/30 dark:text-red-300">
                  {settingsError}
                </p>
              )}
              {settingsSuccess && (
                <p className="rounded-sm border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700 dark:border-green-800/50 dark:bg-green-950/30 dark:text-green-300">
                  {settingsSuccess}
                </p>
              )}

              <Button type="submit" disabled={saving} className="gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? 'Saving…' : 'Save changes'}
              </Button>
            </form>
          </div>
        </section>

        {/* Members */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <h2 className="font-heading text-xl font-semibold text-foreground">Members</h2>
            <Button size="sm" className="gap-2" onClick={() => setShowInvite(true)}>
              <UserPlus className="h-4 w-4" />
              Invite member
            </Button>
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
                  <th className="px-4 py-3 text-right font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {membersLoading ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center">
                      <div className="flex items-center justify-center gap-3 text-muted-foreground">
                        <Spinner />
                        <span className="text-sm">Loading…</span>
                      </div>
                    </td>
                  </tr>
                ) : members.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-sm text-muted-foreground">
                      No members found.
                    </td>
                  </tr>
                ) : (
                  members.map((member, i) => (
                    <motion.tr
                      key={member.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{member.name}</p>
                      </td>
                      <td className="hidden px-4 py-3 md:table-cell">
                        <p className="text-xs text-muted-foreground font-mono">{member.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={[
                            'inline-flex items-center rounded-sm px-2 py-0.5 font-mono text-xs font-medium',
                            member.role === 'admin'
                              ? 'bg-primary/10 text-primary'
                              : 'bg-muted text-muted-foreground',
                          ].join(' ')}
                        >
                          {member.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="outline"
                          className="h-7 gap-1.5 px-3 text-xs text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800/50 dark:hover:bg-red-950/30"
                          disabled={removingId === member.id}
                          onClick={() => handleRemoveMember(member.id)}
                        >
                          {removingId === member.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <UserMinus className="h-3 w-3" />
                          )}
                          Remove
                        </Button>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="space-y-4">
          <h2 className="font-heading text-xl font-semibold text-red-600 dark:text-red-400 border-b border-red-200 dark:border-red-800/50 pb-2">
            Danger Zone
          </h2>
          <div className="rounded-sm border border-red-200 bg-card p-6 dark:border-red-800/50">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-medium text-foreground">Delete this workspace</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Permanently remove <strong>{workspace.name}</strong> and all its members,
                  documents, and data. This action cannot be undone.
                </p>
              </div>
              <Button
                className="shrink-0 gap-2 bg-red-600 text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600"
                onClick={() => setShowDelete(true)}
              >
                <Trash2 className="h-4 w-4" />
                Delete workspace
              </Button>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}

export default WorkspaceSettingsPage
