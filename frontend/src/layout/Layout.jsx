import { AnimatePresence, motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Footer from './Footer'
import Header from './Header'
import Sidebar from './Sidebar'

const Layout = ({ children }) => {
  const { user } = useAuth()
  const location = useLocation()
  const [open, setOpen] = useState(false)

  const hasDashboardShell = useMemo(() => {
    if (!user) return false
    return ['/dashboard', '/users', '/profile'].some((path) =>
      location.pathname.startsWith(path),
    )
  }, [location.pathname, user])

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header onMenuClick={() => setOpen((v) => !v)} />
      {hasDashboardShell && <Sidebar open={open} onClose={() => setOpen(false)} />}

      <main
        className={[
          'mx-auto flex w-full flex-1 px-4 pb-12 pt-8 md:px-8',
          hasDashboardShell ? 'max-w-[1400px] md:pl-[268px]' : 'max-w-6xl',
        ].join(' ')}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="w-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      <Footer withSidebarOffset={hasDashboardShell} />
    </div>
  )
}

export default Layout
