import { Link } from 'react-router-dom'

const Footer = ({ withSidebarOffset = false }) => (
  <footer className={`border-t border-border bg-background ${withSidebarOffset ? 'md:pl-60' : ''}`}>
    <div className="mx-auto w-full max-w-[1400px] px-6 py-8 md:px-8">
      <div className="grid gap-8 md:grid-cols-3">
        <div>
          <p className="font-heading text-base font-semibold text-foreground">Cortex</p>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Upload PDFs and ask questions — get AI-generated answers grounded in your documents.
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Navigation</p>
          <div className="mt-3 flex flex-col gap-1.5">
            <Link to="/" className="text-xs text-foreground hover:text-primary transition-colors">Home</Link>
            <Link to="/dashboard" className="text-xs text-foreground hover:text-primary transition-colors">Dashboard</Link>
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Stack</p>
          <p className="mt-3 font-mono text-xs text-muted-foreground leading-relaxed">
            React · Tailwind CSS · Framer Motion<br />FastAPI · RAG · Pgvector
          </p>
        </div>
      </div>
      <div className="mt-8 border-t border-border pt-6">
        <p className="font-mono text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Cortex
        </p>
      </div>
    </div>
  </footer>
)

export default Footer
