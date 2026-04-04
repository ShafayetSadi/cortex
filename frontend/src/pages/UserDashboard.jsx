import { motion } from 'framer-motion'
import { CalendarDays, FileText, Pencil, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import api from '../api/client'
import DocumentForm from '../components/DocumentForm'
import { Button } from '../components/ui/button'
import { Spinner } from '../components/ui/spinner'
import { useToast } from '../context/ToastContext'

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
}
const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
}

const UserDashboard = () => {
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

  const deleteDocument = async (id) => {
    if (!window.confirm('Delete this document? This cannot be undone.')) return
    try {
      await api.delete(`/api/documents/${id}`)
      if (editingId === id) setEditingId(null)
      showToast('Document deleted')
      await loadDocuments()
    } catch {
      showToast('Failed to delete document', 'error')
    }
  }

  const selected = documents.find((d) => d.id === editingId)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="mb-1 flex items-center gap-2">
          <div className="h-px w-6 bg-primary" />
          <span className="font-mono text-xs uppercase tracking-widest text-primary">My Documents</span>
        </div>
        <h1 className="font-heading text-4xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your uploaded documents and their content.
        </p>
      </div>

      {/* Upload / Edit form */}
      <DocumentForm
        onSubmit={saveDocument}
        defaultValues={selected}
        onCancel={() => setEditingId(null)}
        submitLabel={editingId ? 'Update Document' : 'Upload Document'}
        loading={saving}
        error={error}
      />

      {/* Document list */}
      <div>
        <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
          <h2 className="font-heading text-xl font-semibold text-foreground">
            Your Documents
          </h2>
          <span className="font-mono text-xs text-muted-foreground">
            {documents.length} total
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-3 py-16 text-muted-foreground">
            <Spinner /> <span className="text-sm">Loading documents...</span>
          </div>
        ) : documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-sm border border-dashed border-border py-16 text-center">
            <FileText className="mb-3 h-8 w-8 text-muted-foreground opacity-40" />
            <p className="text-sm text-muted-foreground">No documents yet.</p>
            <p className="mt-1 text-xs text-muted-foreground opacity-60">Upload your first PDF above.</p>
          </div>
        ) : (
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
          >
            {documents.map((doc) => (
              <motion.div key={doc.id} variants={fadeUp}>
                <article
                  className={[
                    'rounded-sm border bg-card p-5 transition-all duration-200',
                    editingId === doc.id
                      ? 'border-primary shadow-sm'
                      : 'border-border hover:border-border/80 hover:shadow-sm',
                  ].join(' ')}
                >
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <h3 className="font-heading text-lg font-semibold leading-snug text-foreground line-clamp-2">
                      {doc.title}
                    </h3>
                    {editingId === doc.id && (
                      <span className="shrink-0 rounded-sm border border-primary/30 bg-primary/10 px-1.5 py-0.5 font-mono text-xs text-primary">
                        editing
                      </span>
                    )}
                  </div>
                  <p className="mb-3 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                    {doc.description}
                  </p>
                  <div className="mb-4 flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
                    <CalendarDays className="h-3 w-3" />
                    {new Date(doc.created_at).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                    })}
                  </div>
                  <div className="flex gap-2 border-t border-border pt-3">
                    <Button
                      variant="outline"
                      className="h-8 gap-1.5 px-3 text-xs"
                      onClick={() => setEditingId(doc.id === editingId ? null : doc.id)}
                    >
                      <Pencil className="h-3 w-3" />
                      {editingId === doc.id ? 'Cancel' : 'Edit'}
                    </Button>
                    <Button
                      variant="destructive"
                      className="h-8 gap-1.5 px-3 text-xs"
                      onClick={() => deleteDocument(doc.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </Button>
                  </div>
                </article>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default UserDashboard
