import { FileUp, Upload, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'

const DocumentForm = ({
  onSubmit,
  defaultValues,
  onCancel,
  submitLabel = 'Save Document',
  loading = false,
  error = '',
}) => {
  const [title, setTitle] = useState(defaultValues?.title ?? '')
  const [file, setFile] = useState(null)
  const fileInputRef = useRef(null)

  const submit = (event) => {
    event.preventDefault()
    const formData = new FormData()
    formData.append('title', title)
    if (file) formData.append('file', file)
    onSubmit(formData)
  }

  const isEditing = !!defaultValues

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
            />
          </div>

          <div className="grid gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {isEditing ? 'Replace PDF (optional)' : 'PDF File'}
            </label>
            <label
              className={[
                'flex cursor-pointer flex-col items-center gap-2 rounded-sm border-2 border-dashed px-4 py-6',
                'text-sm text-muted-foreground transition-colors',
                file
                  ? 'border-primary/40 bg-primary/5 text-primary'
                  : 'border-border hover:border-primary/40 hover:bg-muted/30',
              ].join(' ')}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                required={!isEditing}
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
          </div>

          {error && (
            <p className="rounded-sm border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800/50 dark:bg-red-950/30 dark:text-red-300">
              {error}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <Button type="submit" disabled={loading}>
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
