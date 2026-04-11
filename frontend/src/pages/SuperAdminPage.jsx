import { FileText, Globe, Trash2, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import api from '../api/client'
import { useToast } from '../context/ToastContext'

const TABS = ['Workspaces', 'Users', 'Documents']

const StatCard = ({ label, value, icon: Icon }) => (
  <div className="rounded-sm border border-border bg-card px-4 py-3">
    <div className="flex items-center justify-between">
      <div>
        <p className="font-mono text-xs font-medium uppercase tracking-widest text-muted-foreground">{label}</p>
        <p className="font-heading mt-0.5 text-2xl font-bold text-foreground">{value}</p>
      </div>
      {Icon && (
        <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-muted text-muted-foreground">
          <Icon className="h-3.5 w-3.5" />
        </div>
      )}
    </div>
  </div>
)

const RoleBadge = ({ role }) => {
  const colors = {
    superadmin: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    admin: 'bg-primary/10 text-primary border-primary/20',
    user: 'bg-muted text-muted-foreground border-border',
  }
  return (
    <span className={`inline-flex items-center rounded-sm border px-1.5 py-0.5 font-mono text-xs font-semibold ${colors[role] ?? colors.user}`}>
      {role}
    </span>
  )
}

const SuperAdminPage = () => {
  const [tab, setTab] = useState('Workspaces')
  const [workspaces, setWorkspaces] = useState([])
  const [users, setUsers] = useState([])
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const { showToast } = useToast()

  const loadAll = async () => {
    setLoading(true)
    try {
      const [wsRes, usersRes, docsRes] = await Promise.all([
        api.get('/api/superadmin/workspaces'),
        api.get('/api/superadmin/users'),
        api.get('/api/superadmin/documents'),
      ])
      setWorkspaces(wsRes.data)
      setUsers(usersRes.data)
      setDocuments(docsRes.data)
    } catch {
      showToast('Failed to load data', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAll() }, [])

  const deleteWorkspace = async (id) => {
    if (!window.confirm('Delete this workspace and all its data?')) return
    try {
      await api.delete(`/api/superadmin/workspaces/${id}`)
      showToast('Workspace deleted')
      loadAll()
    } catch (e) {
      showToast(e?.response?.data?.detail ?? 'Failed to delete workspace', 'error')
    }
  }

  const deleteUser = async (id) => {
    if (!window.confirm('Delete this user?')) return
    try {
      await api.delete(`/api/superadmin/users/${id}`)
      showToast('User deleted')
      loadAll()
    } catch (e) {
      showToast(e?.response?.data?.detail ?? 'Failed to delete user', 'error')
    }
  }

  const deleteDocument = async (id) => {
    if (!window.confirm('Delete this document?')) return
    try {
      await api.delete(`/api/superadmin/documents/${id}`)
      showToast('Document deleted')
      loadAll()
    } catch {
      showToast('Failed to delete document', 'error')
    }
  }

  const changeRole = async (userId, role) => {
    try {
      await api.put(`/api/superadmin/users/${userId}`, { role })
      showToast('Role updated')
      loadAll()
    } catch (e) {
      showToast(e?.response?.data?.detail ?? 'Failed to update role', 'error')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="mb-1 flex items-center gap-2">
          <div className="h-px w-6 bg-purple-500" />
          <span className="font-mono text-xs uppercase tracking-widest text-purple-400">Superadmin</span>
        </div>
        <h1 className="font-heading text-4xl font-bold text-foreground">Platform Admin</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage all workspaces, users, and documents across the platform.</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Workspaces" value={workspaces.length} icon={Globe} />
        <StatCard label="Total Users" value={users.length} icon={Users} />
        <StatCard label="Total Documents" value={documents.length} icon={FileText} />
      </div>

      {/* Tabs */}
      <div>
        <div className="flex gap-1 border-b border-border">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={[
                'px-4 py-2 text-sm font-medium transition-colors',
                tab === t
                  ? 'border-b-2 border-purple-500 text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              ].join(' ')}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="mt-4">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : tab === 'Workspaces' ? (
            <WorkspacesTable workspaces={workspaces} onDelete={deleteWorkspace} />
          ) : tab === 'Users' ? (
            <UsersTable users={users} onDelete={deleteUser} onRoleChange={changeRole} />
          ) : (
            <DocumentsTable documents={documents} onDelete={deleteDocument} />
          )}
        </div>
      </div>
    </div>
  )
}

const WorkspacesTable = ({ workspaces, onDelete }) => (
  <div className="overflow-x-auto rounded-sm border border-border">
    <table className="w-full text-sm">
      <thead className="border-b border-border bg-muted/40">
        <tr>
          {['Name', 'Slug', 'Users', 'Documents', 'Created', ''].map((h) => (
            <th key={h} className="px-4 py-2.5 text-left font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {workspaces.length === 0 ? (
          <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">No workspaces</td></tr>
        ) : workspaces.map((ws) => (
          <tr key={ws.id} className="hover:bg-muted/20">
            <td className="px-4 py-2.5 font-medium text-foreground">{ws.name}</td>
            <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{ws.slug}</td>
            <td className="px-4 py-2.5 text-foreground">{ws.user_count}</td>
            <td className="px-4 py-2.5 text-foreground">{ws.document_count}</td>
            <td className="px-4 py-2.5 text-muted-foreground">{new Date(ws.created_at).toLocaleDateString()}</td>
            <td className="px-4 py-2.5">
              {ws.slug !== 'system' && (
                <button onClick={() => onDelete(ws.id)} className="text-muted-foreground hover:text-red-500 transition-colors">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)

const ROLES = ['user', 'admin']

const UsersTable = ({ users, onDelete, onRoleChange }) => (
  <div className="overflow-x-auto rounded-sm border border-border">
    <table className="w-full text-sm">
      <thead className="border-b border-border bg-muted/40">
        <tr>
          {['Name', 'Email', 'Role', 'Workspace', 'Joined', ''].map((h) => (
            <th key={h} className="px-4 py-2.5 text-left font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {users.length === 0 ? (
          <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">No users</td></tr>
        ) : users.map((u) => (
          <tr key={u.id} className="hover:bg-muted/20">
            <td className="px-4 py-2.5 font-medium text-foreground">{u.name}</td>
            <td className="px-4 py-2.5 text-muted-foreground">{u.email}</td>
            <td className="px-4 py-2.5">
              <select
                value={u.role}
                onChange={(e) => onRoleChange(u.id, e.target.value)}
                disabled={u.role === 'superadmin'}
                className="rounded border border-border bg-background px-2 py-0.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </td>
            <td className="px-4 py-2.5 text-muted-foreground">{u.workspace_name}</td>
            <td className="px-4 py-2.5 text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</td>
            <td className="px-4 py-2.5">
              {u.role !== 'superadmin' && (
                <button onClick={() => onDelete(u.id)} className="text-muted-foreground hover:text-red-500 transition-colors">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)

const DocumentsTable = ({ documents, onDelete }) => (
  <div className="overflow-x-auto rounded-sm border border-border">
    <table className="w-full text-sm">
      <thead className="border-b border-border bg-muted/40">
        <tr>
          {['Title', 'Workspace', 'Uploaded', ''].map((h) => (
            <th key={h} className="px-4 py-2.5 text-left font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {documents.length === 0 ? (
          <tr><td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">No documents</td></tr>
        ) : documents.map((doc) => (
          <tr key={doc.id} className="hover:bg-muted/20">
            <td className="px-4 py-2.5 font-medium text-foreground">{doc.title}</td>
            <td className="px-4 py-2.5 text-muted-foreground font-mono text-xs">{doc.workspace_id}</td>
            <td className="px-4 py-2.5 text-muted-foreground">{new Date(doc.created_at).toLocaleDateString()}</td>
            <td className="px-4 py-2.5">
              <button onClick={() => onDelete(doc.id)} className="text-muted-foreground hover:text-red-500 transition-colors">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)

export default SuperAdminPage
