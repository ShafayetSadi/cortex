import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'

const variants = {
  default:
    'bg-primary text-primary-foreground border border-primary hover:opacity-90',
  outline:
    'border border-border bg-transparent text-foreground hover:bg-muted hover:border-foreground/30',
  ghost:
    'bg-transparent text-foreground hover:bg-muted border border-transparent',
  destructive:
    'bg-destructive text-destructive-foreground border border-destructive hover:opacity-90',
  accent:
    'bg-accent text-accent-foreground border border-accent hover:opacity-90',
}

export function Button({ className, variant = 'default', ...props }) {
  return (
    <motion.button
      whileHover={{ scale: 1.015 }}
      whileTap={{ scale: 0.975 }}
      transition={{ duration: 0.12 }}
      className={cn(
        'inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium tracking-wide leading-normal',
        'rounded-sm transition-all duration-150',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2',
        variants[variant],
        className,
      )}
      {...props}
    />
  )
}
