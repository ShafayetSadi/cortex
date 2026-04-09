import { AlertCircle, FileUp, Upload, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'

const MAX_FILE_SIZE_MB = 2

const DocumentForm = ({
  onSubmit,
  defaultValues,
  onCancel,
  submitLabel = 'Save Document',
  loading = false,
  error = '',
  docCount = 0,
  docLimit = 5,
}) => {
  const [title, setTitle] = useState(defaultValues?.title ?? '')
  const [file, setFile] = useState(null)
  const [fileError, setFileError] = useState('')
  const fileInputRef = useRef(null)

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0] ?? null
    if (selected && selected.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setFileError(`File is too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`)
      setFile(null)
      e.target.value = ''
    } else {
      setFileError('')
      setFile(selected)
    }
  }

  const submit = (event) => {
    event.preventDefault()
    if (fileError) return
    const formData = new FormData()
    formData.append('title', title)
    if (file) formData.append('file', file)
    onSubmit(formData)
  }

  const isEditing = !!defaultValues
  const atDocLimit = !isEditing && docCount >= docLimit
  const docPct = Math.min((docCount / docLimit) * 100, 100)
  const docBarColor = docCount >= docLimit ? 'bg-red-500' : docCount >= docLimit * 0.8 ? 'bg-amber-500' : 'bg-primary'

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b border-border bg-muted/40">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {isEditing ? 'Edit Document' : 'Upload Document'}
          </CardTitle>
          {isEditing && (
            <button
              type="button"
              onClick={onCancel}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Cancel edit"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-5">
        {/* Document quota bar */}
        {!isEditing && (
          <div className="mb-4 rounded-sm border border-border bg-muted/30 px-4 py-3">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Document Quota
              </span>
              <span className={`font-mono text-xs font-medium ${docCount >= docLimit ? 'text-red-500' : 'text-foreground'}`}>
                {docCount} / {docLimit}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full transition-all duration-300 ${docBarColor}`}
                style={{ width: `${docPct}%` }}
              />
            </div>
            {atDocLimit && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-red-500">
                <AlertCircle className="h-3 w-3" />
                Limit reached. Delete a document to upload more.
              </p>
            )}
          </div>
        )}

        <form onSubmit={submit} className="grid gap-4">
          <div className="grid gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Title
            </label>
            <Input
              placeholder="Enter document title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              disabled={atDocLimit}
            />
          </div>

          <div className="grid gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {isEditing ? 'Replace PDF (optional)' : 'PDF File'}
              </label>
              <span className="font-mono text-xs text-muted-foreground">Max {MAX_FILE_SIZE_MB}MB</span>
            </div>
            <label
              className={[
                'flex cursor-pointer flex-col items-center gap-2 rounded-sm border-2 border-dashed px-4 py-6',
                'text-sm text-muted-foreground transition-colors',
                atDocLimit ? 'cursor-not-allowed opacity-50' : '',
                fileError ? 'border-red-400 bg-red-50 dark:bg-red-950/20' :
                file
                  ? 'border-primary/40 bg-primary/5 text-primary'
                  : 'border-border hover:border-primary/40 hover:bg-muted/30',
              ].join(' ')}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                required={!isEditing}
                disabled={atDocLimit}
                className="hidden"
              />
              {file ? (
                <>
                  <FileUp className="h-6 w-6" />
                  <span className="font-medium font-mono text-xs">{file.name}</span>
                  <span className="text-xs opacity-70">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </>
              ) : (
                <>
                  <Upload className="h-6 w-6 opacity-50" />
                  <span>Click to select a PDF file</span>
                  {isEditing && <span className="text-xs opacity-60">Leave empty to keep current file</span>}
                </>
              )}
            </label>
            {fileError && (
              <p className="flex items-center gap-1.5 text-xs text-red-500">
                <AlertCircle className="h-3 w-3" />
                {fileError}
              </p>
            )}
          </div>

          {error && (
            <p className="rounded-sm border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800/50 dark:bg-red-950/30 dark:text-red-300">
              {error}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <Button type="submit" disabled={loading || atDocLimit || !!fileError}>
              {loading ? 'Saving...' : submitLabel}
            </Button>
            {isEditing && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export default DocumentForm
