import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, LogOut, Menu, Moon, Sun, UserCircle2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

const NavItem = ({ to, children }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      [
        'relative px-1 py-0.5 text-sm font-medium tracking-wide transition-colors duration-150',
        isActive
          ? 'text-foreground'
          : 'text-muted-foreground hover:text-foreground',
      ].join(' ')
    }
  >
    {({ isActive }) => (
      <>
        {children}
        {isActive && (
          <motion.span
            layoutId="nav-underline"
            className="absolute inset-x-0 -bottom-px h-px bg-primary"
          />
        )}
      </>
    )}
  </NavLink>
)

const Header = ({ onMenuClick }) => {
  const { user, logout, profileImage } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const onOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onOutsideClick)
    return () => document.removeEventListener('mousedown', onOutsideClick)
  }, [])

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-[1400px] items-center justify-between px-4 md:px-8">

        {/* Left: logo + mobile menu trigger */}
        <div className="flex items-center gap-3">
          {user && (
            <button
              className="flex items-center justify-center rounded-sm p-1.5 text-muted-foreground hover:text-foreground md:hidden transition-colors"
              onClick={onMenuClick}
              aria-label="Toggle sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}

          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-primary text-primary-foreground">
              <svg viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5">
                <path
                  d="M10 2L12 8L18 10L12 12L10 18L8 12L2 10L8 8L10 2Z"
                  fill="currentColor"
                />
              </svg>
            </div>
            <span className="hidden font-heading text-2xl font-semibold italic leading-none tracking-tight text-foreground md:block">
              Cortex
            </span>
          </Link>
        </div>

        {/* Center: nav links */}
        <nav className="hidden items-center gap-6 md:flex">
          <NavItem to="/">Home</NavItem>
          {user && <NavItem to="/dashboard">Dashboard</NavItem>}
        </nav>

        {/* Right: theme toggle + user menu */}
        <div className="flex items-center gap-2" ref={menuRef}>
          <button
            onClick={toggleTheme}
            className="flex h-8 w-8 items-center justify-center rounded-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {user ? (
            <div className="relative">
              <button
                onClick={() => setOpen((v) => !v)}
                className="flex items-center gap-2 rounded-sm border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                {profileImage ? (
                  <img src={profileImage} alt="Profile" className="h-5 w-5 rounded-full object-cover" />
                ) : (
                  <UserCircle2 className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="hidden sm:block">{user.name}</span>
                <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {open && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-1.5 w-44 rounded-sm border border-border bg-card shadow-lg py-1"
                  >
                    <Link
                      to="/profile"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                    >
                      <UserCircle2 className="h-3.5 w-3.5 text-muted-foreground" />
                      Profile
                    </Link>
                    <div className="my-1 border-t border-border" />
                    <button
                      onClick={() => { setOpen(false); logout() }}
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                    >
                      <LogOut className="h-3.5 w-3.5 text-muted-foreground" />
                      Sign out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/register"
                className="rounded-sm border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                Register
              </Link>
              <Link
                to="/login"
                className="rounded-sm border border-primary bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
              >
                Sign in
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
