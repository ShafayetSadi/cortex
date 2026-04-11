import { motion } from 'framer-motion'
import { CalendarDays, FileText, Folder, FolderOpen, FolderPlus, Pencil, Trash2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
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

// ── Inline collection name editor ──────────────────────────────────────────
const CollectionNameEditor = ({ initial, onSave, onCancel }) => {
  const [value, setValue] = useState(initial)
  const ref = useRef(null)
  useEffect(() => ref.current?.focus(), [])
  return (
    <form
      className="flex items-center gap-1"
      onSubmit={(e) => { e.preventDefault(); if (value.trim()) onSave(value.trim()) }}
    >
      <input
        ref={ref}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="min-w-0 flex-1 rounded border border-border bg-background px-2 py-0.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
      />
      <button type="submit" className="text-primary hover:opacity-80 text-xs font-semibold">Save</button>
      <button type="button" onClick={onCancel} className="text-muted-foreground hover:opacity-80">
        <X className="h-3 w-3" />
      </button>
    </form>
  )
}

// ── New collection input ────────────────────────────────────────────────────
const NewCollectionInput = ({ onCreate, onCancel }) => {
  const [name, setName] = useState('')
  const ref = useRef(null)
  useEffect(() => ref.current?.focus(), [])
  return (
    <form
      className="mt-1 flex items-center gap-1 px-2"
      onSubmit={(e) => { e.preventDefault(); if (name.trim()) { onCreate(name.trim()); setName('') } }}
    >
      <input
        ref={ref}
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Collection name..."
        className="min-w-0 flex-1 rounded border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
      />
      <button type="submit" className="text-primary hover:opacity-80 text-xs font-semibold">Add</button>
      <button type="button" onClick={onCancel} className="text-muted-foreground hover:opacity-80">
        <X className="h-3 w-3" />
      </button>
    </form>
  )
}

const UserDashboard = () => {
  const [documents, setDocuments] = useState([])
  const [collections, setCollections] = useState([])
  const [activeCollectionId, setActiveCollectionId] = useState(null) // null = All
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [usage, setUsage] = useState(null)
  const [renamingCollectionId, setRenamingCollectionId] = useState(null)
  const [showNewCollection, setShowNewCollection] = useState(false)
  const { showToast } = useToast()

  const loadAll = async () => {
    setLoading(true)
    try {
      const [{ data: docs }, { data: usageData }, { data: cols }] = await Promise.all([
        api.get('/api/documents/'),
        api.get('/api/users/me/usage'),
        api.get('/api/collections/'),
      ])
      setDocuments(docs)
      setUsage(usageData)
      setCollections(cols)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAll() }, [])

  // ── Documents ─────────────────────────────────────────────────────────────

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
      await loadAll()
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
      await loadAll()
    } catch {
      showToast('Failed to delete document', 'error')
    }
  }

  // ── Collections ───────────────────────────────────────────────────────────

  const createCollection = async (name) => {
    try {
      await api.post('/api/collections/', { name })
      setShowNewCollection(false)
      showToast('Collection created')
      await loadAll()
    } catch {
      showToast('Failed to create collection', 'error')
    }
  }

  const renameCollection = async (id, name) => {
    try {
      await api.put(`/api/collections/${id}`, { name })
      setRenamingCollectionId(null)
      showToast('Collection renamed')
      await loadAll()
    } catch {
      showToast('Failed to rename collection', 'error')
    }
  }

  const deleteCollection = async (id) => {
    if (!window.confirm('Delete this collection? Documents inside will be moved to All Documents.')) return
    try {
      await api.delete(`/api/collections/${id}`)
      if (activeCollectionId === id) setActiveCollectionId(null)
      showToast('Collection deleted')
      await loadAll()
    } catch {
      showToast('Failed to delete collection', 'error')
    }
  }

  // ── Filtered documents ────────────────────────────────────────────────────

  const visibleDocs = activeCollectionId === null
    ? documents
    : documents.filter((d) => d.collection_id === activeCollectionId)

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
          Manage your uploaded documents and their collections.
        </p>
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
        docCount={usage?.documents_uploaded ?? documents.length}
        docLimit={usage?.documents_limit ?? 5}
        collections={collections}
        defaultCollectionId={editingId ? selected?.collection_id : activeCollectionId}
      />

      {/* Collections + Document list */}
      <div className="flex gap-6">
        {/* Collections sidebar */}
        <aside className="w-52 shrink-0">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Collections
            </span>
            <button
              onClick={() => setShowNewCollection((v) => !v)}
              className="text-muted-foreground hover:text-primary transition-colors"
              title="New collection"
            >
              <FolderPlus className="h-3.5 w-3.5" />
            </button>
          </div>

          {showNewCollection && (
            <NewCollectionInput
              onCreate={createCollection}
              onCancel={() => setShowNewCollection(false)}
            />
          )}

          <nav className="mt-1 space-y-0.5">
            {/* All Documents */}
            <button
              onClick={() => setActiveCollectionId(null)}
              className={[
                'flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm transition-colors',
                activeCollectionId === null
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-foreground hover:bg-muted',
              ].join(' ')}
            >
              {activeCollectionId === null
                ? <FolderOpen className="h-3.5 w-3.5 shrink-0" />
                : <Folder className="h-3.5 w-3.5 shrink-0" />}
              <span className="truncate">All Documents</span>
              <span className="ml-auto font-mono text-xs text-muted-foreground">{documents.length}</span>
            </button>

            {collections.map((col) => (
              <div key={col.id} className="group relative">
                {renamingCollectionId === col.id ? (
                  <div className="px-2 py-1">
                    <CollectionNameEditor
                      initial={col.name}
                      onSave={(name) => renameCollection(col.id, name)}
                      onCancel={() => setRenamingCollectionId(null)}
                    />
                  </div>
                ) : (
                  <button
                    onClick={() => setActiveCollectionId(col.id)}
                    className={[
                      'flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm transition-colors',
                      activeCollectionId === col.id
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-foreground hover:bg-muted',
                    ].join(' ')}
                  >
                    {activeCollectionId === col.id
                      ? <FolderOpen className="h-3.5 w-3.5 shrink-0" />
                      : <Folder className="h-3.5 w-3.5 shrink-0" />}
                    <span className="truncate">{col.name}</span>
                    <span className="ml-auto font-mono text-xs text-muted-foreground">{col.document_count}</span>
                  </button>
                )}
                {/* Hover actions */}
                {renamingCollectionId !== col.id && (
                  <div className="absolute right-1 top-1/2 -translate-y-1/2 hidden items-center gap-0.5 group-hover:flex">
                    <button
                      onClick={(e) => { e.stopPropagation(); setRenamingCollectionId(col.id) }}
                      className="rounded p-0.5 text-muted-foreground hover:text-foreground"
                      title="Rename"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteCollection(col.id) }}
                      className="rounded p-0.5 text-muted-foreground hover:text-red-500"
                      title="Delete collection"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </nav>
        </aside>

        {/* Document list */}
        <div className="min-w-0 flex-1">
          <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
            <h2 className="font-heading text-xl font-semibold text-foreground">
              {activeCollectionId === null
                ? 'All Documents'
                : collections.find((c) => c.id === activeCollectionId)?.name ?? 'Collection'}
            </h2>
            <span className="font-mono text-xs text-muted-foreground">
              {usage ? `${usage.documents_uploaded} / ${usage.documents_limit}` : `${documents.length} total`}
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-3 py-16 text-muted-foreground">
              <Spinner /> <span className="text-sm">Loading documents...</span>
            </div>
          ) : visibleDocs.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-sm border border-dashed border-border py-16 text-center">
              <FileText className="mb-3 h-8 w-8 text-muted-foreground opacity-40" />
              <p className="text-sm text-muted-foreground">No documents here yet.</p>
              <p className="mt-1 text-xs text-muted-foreground opacity-60">
                {activeCollectionId ? 'Upload a document and assign it to this collection.' : 'Upload your first PDF above.'}
              </p>
            </div>
          ) : (
            <motion.div
              variants={stagger}
              initial="hidden"
              animate="visible"
              className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
            >
              {visibleDocs.map((doc) => {
                const docCollection = doc.collection_id
                  ? collections.find((c) => c.id === doc.collection_id)
                  : null
                return (
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
                      {docCollection && (
                        <div className="mb-2 flex items-center gap-1 text-xs text-muted-foreground">
                          <Folder className="h-3 w-3 shrink-0" />
                          <span className="truncate">{docCollection.name}</span>
                        </div>
                      )}
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
                )
              })}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}

export default UserDashboard
