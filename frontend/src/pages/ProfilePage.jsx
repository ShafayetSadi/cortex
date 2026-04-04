import { motion } from 'framer-motion'
import { Camera, Trash2, UserCircle2 } from 'lucide-react'
import { useRef } from 'react'
import { Button } from '../components/ui/button'
import { useAuth } from '../context/AuthContext'

const InfoRow = ({ label, value }) => (
  <div className="flex items-start justify-between border-b border-border py-4 last:border-0">
    <span className="font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground">
      {label}
    </span>
    <span className="text-sm font-medium text-foreground capitalize">{value}</span>
  </div>
)

const ProfilePage = () => {
  const { user, profileImage, updateProfileImage } = useAuth()
  const fileInputRef = useRef(null)

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => updateProfileImage(reader.result)
    reader.readAsDataURL(file)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* Header */}
      <div>
        <div className="mb-1 flex items-center gap-2">
          <div className="h-px w-6 bg-primary" />
          <span className="font-mono text-xs uppercase tracking-widest text-primary">Account</span>
        </div>
        <h1 className="font-heading text-4xl font-bold text-foreground">Profile</h1>
      </div>

      {/* Avatar section */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="rounded-sm border border-border bg-card overflow-hidden"
      >
        <div className="border-b border-border bg-muted/30 px-6 py-4">
          <p className="font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Profile Photo
          </p>
        </div>
        <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
          {/* Avatar */}
          <div className="shrink-0">
            {profileImage ? (
              <img
                src={profileImage}
                alt="Profile"
                className="h-24 w-24 rounded-sm border border-border object-cover"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-sm border border-border bg-muted">
                <UserCircle2 className="h-14 w-14 text-muted-foreground opacity-50" />
              </div>
            )}
          </div>

          {/* Actions */}
          <div>
            <p className="mb-3 text-sm font-medium text-foreground">
              {user?.name}
            </p>
            <div className="flex flex-wrap gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
              <Button
                type="button"
                variant="outline"
                className="h-8 gap-2 px-3 text-xs"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="h-3.5 w-3.5" />
                Upload Photo
              </Button>
              {profileImage && (
                <Button
                  type="button"
                  variant="ghost"
                  className="h-8 gap-2 px-3 text-xs"
                  onClick={() => updateProfileImage(null)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove
                </Button>
              )}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              JPG, PNG or GIF. Max 5MB.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Info section */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="rounded-sm border border-border bg-card overflow-hidden"
      >
        <div className="border-b border-border bg-muted/30 px-6 py-4">
          <p className="font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Account Details
          </p>
        </div>
        <div className="px-6">
          <InfoRow label="Name" value={user?.name} />
          <InfoRow label="Email" value={user?.email} />
          <InfoRow label="Role" value={user?.role} />
        </div>
      </motion.div>
    </div>
  )
}

export default ProfilePage
