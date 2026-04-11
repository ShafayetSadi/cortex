import { motion } from 'framer-motion'
import { FileText, Folder, FolderOpen, FolderPlus, Pencil, Trash2, Users, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import api from '../api/client'
import DocumentForm from '../components/DocumentForm'
import { Button } from '../components/ui/button'
import { Spinner } from '../components/ui/spinner'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

const StatCard = ({ label, value, icon: Icon, accent = false }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    className={[
      'rounded-sm border px-4 py-3',
      accent ? 'border-primary/30 bg-primary/5' : 'border-border bg-card',
    ].join(' ')}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="font-mono text-xs font-medium uppercase tracking-widest text-muted-foreground">
          {label}
        </p>
        <p className="font-heading mt-0.5 text-2xl font-bold text-foreground">{value}</p>
      </div>
      {Icon && (
        <div className={[
          'flex h-7 w-7 items-center justify-center rounded-sm',
          accent ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
        ].join(' ')}>
          <Icon className="h-3.5 w-3.5" />
        </div>
      )}
    </div>
  </motion.div>
)

const CollectionNameEditor = ({ initial, onSave, onCancel }) => {
  const [value, setValue] = useState(initial)

  return (
    <form
      className="flex items-center gap-1"
      onSubmit={(event) => {
        event.preventDefault()
        if (value.trim()) onSave(value.trim())
      }}
    >
      <input
        autoFocus
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className="min-w-0 flex-1 rounded border border-border bg-background px-2 py-0.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
      />
      <button type="submit" className="text-xs font-semibold text-primary hover:opacity-80">Save</button>
      <button type="button" onClick={onCancel} className="text-muted-foreground hover:opacity-80">
        <X className="h-3 w-3" />
      </button>
    </form>
  )
}

const NewCollectionInput = ({ onCreate, onCancel }) => {
  const [name, setName] = useState('')

  return (
    <form
      className="mt-1 flex items-center gap-1 px-2"
      onSubmit={(event) => {
        event.preventDefault()
        if (name.trim()) {
          onCreate(name.trim())
          setName('')
        }
      }}
    >
      <input
        autoFocus
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Collection name..."
        className="min-w-0 flex-1 rounded border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
      />
      <button type="submit" className="text-xs font-semibold text-primary hover:opacity-80">Add</button>
      <button type="button" onClick={onCancel} className="text-muted-foreground hover:opacity-80">
        <X className="h-3 w-3" />
      </button>
    </form>
  )
}

const AdminDashboard = () => {
  const [documents, setDocuments] = useState([])
  const [collections, setCollections] = useState([])
  const [activeCollectionId, setActiveCollectionId] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [renamingCollectionId, setRenamingCollectionId] = useState(null)
  const [showNewCollection, setShowNewCollection] = useState(false)
  const { showToast } = useToast()

  const [usage, setUsage] = useState(null)
  const { workspace } = useAuth()

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

  const selected = documents.find((d) => d.id === editingId)
  const totalDocs = documents.length
  const visibleDocs = activeCollectionId === null
    ? documents
    : documents.filter((doc) => doc.collection_id === activeCollectionId)
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
          Manage documents and users in the <span className="text-foreground font-medium">{workspace?.name}</span> workspace.
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
        docCount={usage?.documents_uploaded ?? documents.length}
        docLimit={usage?.documents_limit ?? 5}
        collections={collections}
        defaultCollectionId={editingId ? selected?.collection_id : activeCollectionId}
      />

      <div className="flex gap-6">
        <aside className="w-52 shrink-0">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Collections
            </span>
            <button
              onClick={() => setShowNewCollection((value) => !value)}
              className="text-muted-foreground transition-colors hover:text-primary"
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
            <button
              onClick={() => setActiveCollectionId(null)}
              className={[
                'flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm transition-colors',
                activeCollectionId === null
                  ? 'bg-primary/10 font-medium text-primary'
                  : 'text-foreground hover:bg-muted',
              ].join(' ')}
            >
              {activeCollectionId === null
                ? <FolderOpen className="h-3.5 w-3.5 shrink-0" />
                : <Folder className="h-3.5 w-3.5 shrink-0" />}
              <span className="truncate">All Documents</span>
              <span className="ml-auto font-mono text-xs text-muted-foreground">{documents.length}</span>
            </button>

            {collections.map((collection) => (
              <div key={collection.id} className="group relative">
                {renamingCollectionId === collection.id ? (
                  <div className="px-2 py-1">
                    <CollectionNameEditor
                      initial={collection.name}
                      onSave={(name) => renameCollection(collection.id, name)}
                      onCancel={() => setRenamingCollectionId(null)}
                    />
                  </div>
                ) : (
                  <button
                    onClick={() => setActiveCollectionId(collection.id)}
                    className={[
                      'flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm transition-colors',
                      activeCollectionId === collection.id
                        ? 'bg-primary/10 font-medium text-primary'
                        : 'text-foreground hover:bg-muted',
                    ].join(' ')}
                  >
                    {activeCollectionId === collection.id
                      ? <FolderOpen className="h-3.5 w-3.5 shrink-0" />
                      : <Folder className="h-3.5 w-3.5 shrink-0" />}
                    <span className="truncate">{collection.name}</span>
                    <span className="ml-auto font-mono text-xs text-muted-foreground">{collection.document_count}</span>
                  </button>
                )}
                {renamingCollectionId !== collection.id && (
                  <div className="absolute right-1 top-1/2 hidden -translate-y-1/2 items-center gap-0.5 group-hover:flex">
                    <button
                      onClick={(event) => {
                        event.stopPropagation()
                        setRenamingCollectionId(collection.id)
                      }}
                      className="rounded p-0.5 text-muted-foreground hover:text-foreground"
                      title="Rename"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button
                      onClick={(event) => {
                        event.stopPropagation()
                        deleteCollection(collection.id)
                      }}
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

        {/* Documents table */}
        <div className="min-w-0 flex-1">
          <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
            <h2 className="font-heading text-xl font-semibold text-foreground">
              {activeCollectionId === null
                ? 'All Documents'
                : collections.find((collection) => collection.id === activeCollectionId)?.name ?? 'Collection'}
            </h2>
            <span className="font-mono text-xs text-muted-foreground">{visibleDocs.length} shown</span>
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
                    Collection
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
                    <td colSpan={5} className="px-4 py-10 text-center">
                      <div className="flex items-center justify-center gap-3 text-muted-foreground">
                        <Spinner /> <span className="text-sm">Loading...</span>
                      </div>
                    </td>
                  </tr>
                ) : visibleDocs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-sm text-muted-foreground">
                      No documents found.
                    </td>
                  </tr>
                ) : (
                  visibleDocs.map((doc, i) => {
                    const docCollection = doc.collection_id
                      ? collections.find((collection) => collection.id === doc.collection_id)
                      : null

                    return (
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
                            {docCollection?.name ?? 'None'}
                          </span>
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
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
