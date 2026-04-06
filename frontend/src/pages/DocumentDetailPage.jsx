import { motion } from 'framer-motion'
import { ArrowLeft, CalendarDays, FileText, UserRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '../api/client'
import { Spinner } from '../components/ui/spinner'

const DocumentDetailPage = () => {
  const { id } = useParams()
  const [document, setDocument] = useState(null)
  const [pdfUrl, setPdfUrl] = useState(null)
  const [loading, setLoading] = useState(true)
  const [pdfError, setPdfError] = useState(false)

  useEffect(() => {
    let objectUrl = null

    const load = async () => {
      try {
        // 1. Fetch document metadata (requires auth header — api client sends it)
        const { data } = await api.get(`/api/public/documents/${id}`)
        setDocument(data)

        // 2. Fetch the PDF binary through the api client so the JWT is forwarded.
        //    A plain <iframe src="..."> cannot send Authorization headers.
        const fileRes = await api.get(`/api/public/documents/${id}/file`, {
          responseType: 'blob',
        })
        objectUrl = URL.createObjectURL(fileRes.data)
        setPdfUrl(objectUrl)
      } catch {
        setPdfError(true)
      } finally {
        setLoading(false)
      }
    }

    load()

    // Clean up the blob URL when the component unmounts to free memory
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 py-20 text-muted-foreground">
        <Spinner /> <span className="text-sm">Loading document…</span>
      </div>
    )
  }

  if (!document || pdfError) {
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

      {/* Document card */}
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
                weekday: 'short',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>

        {/* PDF viewer — blob URL carries no auth headers, so the browser can load it */}
        {pdfUrl ? (
          <iframe
            src={pdfUrl}
            title={document.title}
            className="w-full"
            style={{ height: '82vh' }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
            <FileText className="h-8 w-8 opacity-40" />
            <p className="text-sm">PDF preview unavailable.</p>
          </div>
        )}
      </article>
    </motion.div>
  )
}

export default DocumentDetailPage
