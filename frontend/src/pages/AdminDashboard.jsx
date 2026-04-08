import { motion } from 'framer-motion'
import { FileText, Pencil, Users } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import api from '../api/client'
import DocumentForm from '../components/DocumentForm'
import { Button } from '../components/ui/button'
import { Spinner } from '../components/ui/spinner'
import { useToast } from '../context/ToastContext'

const StatCard = ({ label, value, icon: Icon, accent = false }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    className={[
      'rounded-sm border p-5',
      accent ? 'border-primary/30 bg-primary/5' : 'border-border bg-card',
    ].join(' ')}
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="font-mono text-xs font-medium uppercase tracking-widest text-muted-foreground">
          {label}
        </p>
        <p className="font-heading mt-1 text-4xl font-bold text-foreground">{value}</p>
      </div>
      {Icon && (
        <div className={[
          'flex h-9 w-9 items-center justify-center rounded-sm',
          accent ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
        ].join(' ')}>
          <Icon className="h-4 w-4" />
        </div>
      )}
    </div>
  </motion.div>
)

const AdminDashboard = () => {
  const [documents, setDocuments] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const { showToast } = useToast()

  const loadDocuments = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/api/documents/')
      setDocuments(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadDocuments() }, [])

  const saveDocument = async (formData) => {
    setSaving(true)
    setError('')
    try {
      if (editingId) {
        await api.put(`/api/documents/${editingId}`, formData)
        setEditingId(null)
        showToast('Document updated successfully')
      } else {
        await api.post('/api/documents/', formData)
        showToast('Document uploaded successfully')
      }
      await loadDocuments()
    } catch {
      setError('Unable to save document. Please try again.')
      showToast('Failed to save document', 'error')
    } finally {
      setSaving(false)
    }
  }

  const selected = documents.find((d) => d.id === editingId)
  const totalDocs = documents.length
  const userCount = useMemo(() => new Set(documents.map((d) => d.created_by)).size, [documents])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="mb-1 flex items-center gap-2">
          <div className="h-px w-6 bg-primary" />
          <span className="font-mono text-xs uppercase tracking-widest text-primary">Admin</span>
        </div>
        <h1 className="font-heading text-4xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage all documents and users across the platform.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Documents" value={totalDocs} icon={FileText} accent />
        <StatCard label="Contributing Users" value={userCount} icon={Users} />
        <StatCard
          label="Edit Mode"
          value={editingId ? 'Active' : 'Off'}
          accent={!!editingId}
        />
      </div>

      {/* Upload / Edit form */}
      <DocumentForm
        key={editingId ?? 'new'}
        onSubmit={saveDocument}
        defaultValues={selected}
        onCancel={() => setEditingId(null)}
        submitLabel={editingId ? 'Update Document' : 'Upload Document'}
        loading={saving}
        error={error}
      />

      {/* Documents table */}
      <div>
        <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
          <h2 className="font-heading text-xl font-semibold text-foreground">All Documents</h2>
          <span className="font-mono text-xs text-muted-foreground">{totalDocs} total</span>
        </div>

        <div className="overflow-hidden rounded-sm border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-3 text-left font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Title
                </th>
                <th className="hidden px-4 py-3 text-left font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground md:table-cell">
                  Preview
                </th>
                <th className="px-4 py-3 text-left font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  User
                </th>
                <th className="px-4 py-3 text-right font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center">
                    <div className="flex items-center justify-center gap-3 text-muted-foreground">
                      <Spinner /> <span className="text-sm">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    No documents found.
                  </td>
                </tr>
              ) : (
                documents.map((doc, i) => (
                  <motion.tr
                    key={doc.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className={[
                      'border-b border-border last:border-0 transition-colors',
                      editingId === doc.id
                        ? 'bg-primary/5'
                        : 'hover:bg-muted/30',
                    ].join(' ')}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground line-clamp-1">{doc.title}</p>
                    </td>
                    <td className="hidden max-w-xs px-4 py-3 md:table-cell">
                      <p className="line-clamp-1 text-xs text-muted-foreground">{doc.description}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-muted-foreground">
                        #{doc.created_by}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant={editingId === doc.id ? 'default' : 'outline'}
                        className="h-7 gap-1.5 px-3 text-xs"
                        onClick={() => setEditingId(doc.id === editingId ? null : doc.id)}
                      >
                        <Pencil className="h-3 w-3" />
                        {editingId === doc.id ? 'Editing' : 'Edit'}
                      </Button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
