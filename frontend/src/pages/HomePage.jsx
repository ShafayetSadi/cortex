import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Search,
  Sliders,
  UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import { Button } from "../components/ui/button";
import { Spinner } from "../components/ui/spinner";

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
};

const DocumentCard = ({ doc }) => (
  <motion.div variants={fadeUp}>
    <Link to={`/documents/${doc.id}`} className="group block h-full">
      <article className="h-full rounded-sm border border-border bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
        <div className="mb-3 flex items-start justify-between gap-3">
          <h3 className="font-heading text-lg font-semibold leading-snug text-foreground line-clamp-2 group-hover:text-primary transition-colors">
            {doc.title}
          </h3>
          <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
        </div>
        <p className="mb-4 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {doc.description}
        </p>
        <div className="flex items-center gap-4 border-t border-border pt-3">
          <span className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
            <UserRound className="h-3 w-3" /> {doc.author_name}
          </span>
          <span className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
            <CalendarDays className="h-3 w-3" />
            {new Date(doc.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>
      </article>
    </Link>
  </motion.div>
);

const HomePage = () => {
  const [question, setQuestion] = useState("");
  const [threshold, setThreshold] = useState(30);
  const [topK, setTopK] = useState(5);
  const [answer, setAnswer] = useState(null);
  const [asking, setAsking] = useState(false);
  const [askError, setAskError] = useState("");
  const [documents, setDocuments] = useState([]);
  const [docsLoading, setDocsLoading] = useState(true);
  const [showSliders, setShowSliders] = useState(false);

  useEffect(() => {
    api
      .get("/api/public/documents/")
      .then(({ data }) => setDocuments(data))
      .finally(() => setDocsLoading(false));
  }, []);

  const handleAsk = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;
    setAsking(true);
    setAskError("");
    setAnswer(null);
    try {
      const { data } = await api.post("/api/public/ask", {
        question: question.trim(),
        threshold: threshold / 100,
        top_k: topK,
      });
      setAnswer(data);
    } catch {
      setAskError("Unable to process your question. Please try again.");
    } finally {
      setAsking(false);
    }
  };

  return (
    <div className="space-y-16">
      {/* ─── Hero ────────────────────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="pt-4"
      >
        <div className="mb-2 flex items-center gap-2">
          <div className="h-px w-8 bg-primary" />
          <span className="font-mono text-xs font-medium uppercase tracking-widest text-primary">
            Cortex
          </span>
        </div>
        <h1 className="font-heading text-5xl font-bold leading-[1.1] text-foreground md:text-6xl lg:text-7xl">
          Ask Your
          <br />
          <span className="italic text-primary">Documents</span>
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Ask any question and receive AI-generated answers grounded in your
          uploaded documents. Powered by retrieval-augmented generation.
        </p>

        {/* ─── Q&A Form ────────────────────────────────────────────── */}
        <div className="mt-8 rounded-sm border border-border bg-card">
          <form onSubmit={handleAsk} className="flex gap-0">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask anything about your documents..."
                className="w-full bg-transparent py-4 pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-1 border-l border-border pr-2">
              <button
                type="button"
                onClick={() => setShowSliders((v) => !v)}
                className={[
                  "flex h-8 w-8 items-center justify-center rounded-sm transition-colors",
                  showSliders
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                ].join(" ")}
                title="Adjust search parameters"
              >
                <Sliders className="h-3.5 w-3.5" />
              </button>
              <Button type="submit" disabled={asking} className="h-9">
                {asking ? <Spinner className="h-3.5 w-3.5" /> : null}
                {asking ? "Thinking..." : "Ask"}
              </Button>
            </div>
          </form>

          {/* Sliders panel */}
          {showSliders && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-t border-border"
            >
              <div className="grid gap-6 p-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      Min Relevance
                    </label>
                    <span className="font-mono text-xs text-foreground">
                      {threshold}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={threshold}
                    onChange={(e) => setThreshold(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      Max Sources
                    </label>
                    <span className="font-mono text-xs text-foreground">
                      {topK}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={topK}
                    onChange={(e) => setTopK(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {askError && (
          <p className="mt-3 rounded-sm border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:border-red-800/50 dark:bg-red-950/30 dark:text-red-300">
            {askError}
          </p>
        )}

        {/* ─── Answer ──────────────────────────────────────────────── */}
        {answer && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="mt-4 overflow-hidden rounded-sm border border-border bg-card"
          >
            <div className="border-b border-border bg-muted/30 px-5 py-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Answer
              </p>
            </div>
            <div className="p-5">
              <p className="whitespace-pre-wrap text-base leading-relaxed text-foreground">
                {answer.answer}
              </p>

              {answer.sources.length > 0 && (
                <div className="mt-5 border-t border-border pt-4">
                  <p className="mb-2.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Sources
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {answer.sources.map((source) => (
                      <Link
                        key={source.id}
                        to={`/documents/${source.id}`}
                        className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-muted px-3 py-1 font-mono text-xs text-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-primary transition-colors"
                      >
                        <BookOpen className="h-3 w-3" />
                        {source.title}
                        <span className="text-muted-foreground">
                          {(source.score * 100).toFixed(0)}%
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </motion.section>

      {/* ─── Browse Documents ─────────────────────────────────────────── */}
      <section>
        <div className="mb-6 flex items-end justify-between border-b border-border pb-4">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <div className="h-px w-6 bg-muted-foreground" />
              <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                Archive
              </span>
            </div>
            <h2 className="font-heading text-3xl font-semibold text-foreground">
              Browse Documents
            </h2>
          </div>
          <span className="font-mono text-sm text-muted-foreground">
            {documents.length} doc{documents.length !== 1 ? "s" : ""}
          </span>
        </div>

        {docsLoading ? (
          <div className="flex items-center justify-center gap-3 py-16 text-muted-foreground">
            <Spinner /> <span className="text-sm">Loading documents...</span>
          </div>
        ) : documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-sm border border-dashed border-border py-16 text-center">
            <BookOpen className="mb-3 h-8 w-8 text-muted-foreground opacity-40" />
            <p className="text-sm text-muted-foreground">No documents yet.</p>
            <p className="mt-1 text-xs text-muted-foreground opacity-60">
              Upload a PDF to get started.
            </p>
          </div>
        ) : (
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
          >
            {documents.map((doc, index) => (
              <DocumentCard key={doc.id} doc={doc} index={index} />
            ))}
          </motion.div>
        )}
      </section>
    </div>
  );
};

export default HomePage;
