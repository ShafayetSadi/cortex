import { motion } from 'framer-motion'
import { ArrowLeft, CalendarDays, UserRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '../api/client'
import { Spinner } from '../components/ui/spinner'

const DocumentDetailPage = () => {
  const { id } = useParams()
  const [document, setDocument] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get(`/api/public/documents/${id}`)
      .then(({ data }) => setDocument(data))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 py-20 text-muted-foreground">
        <Spinner /> <span className="text-sm">Loading document...</span>
      </div>
    )
  }

  if (!document) {
    return (
      <div className="py-10 text-center text-sm text-muted-foreground">
        Unable to load document.
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="mx-auto max-w-3xl space-y-6"
    >
      {/* Back */}
      <Link
        to="/"
        className="inline-flex items-center gap-2 font-mono text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to documents
      </Link>

      {/* Document */}
      <article className="rounded-sm border border-border bg-card overflow-hidden">
        {/* Header */}
        <div className="border-b border-border bg-muted/30 px-7 py-6">
          <div className="mb-2 flex items-center gap-2">
            <div className="h-px w-6 bg-primary" />
            <span className="font-mono text-xs uppercase tracking-widest text-primary">Document</span>
          </div>
          <h1 className="font-heading text-3xl font-bold leading-tight text-foreground md:text-4xl">
            {document.title}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
              <UserRound className="h-3.5 w-3.5" /> {document.author_name}
            </span>
            <span className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5" />
              {new Date(document.created_at).toLocaleDateString('en-US', {
                weekday: 'short', month: 'long', day: 'numeric', year: 'numeric',
              })}
            </span>
          </div>
        </div>

        {/* Content */}
        <iframe
          src={`/api/public/documents/${id}/file`}
          title={document.title}
          className="w-full"
          style={{ height: '82vh' }}
        />
      </article>
    </motion.div>
  )
}

export default DocumentDetailPage
