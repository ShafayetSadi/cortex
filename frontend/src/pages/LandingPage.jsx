import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Brain,
  FileText,
  Lock,
  MessageSquareText,
  Search,
  Shield,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      delay: i * 0.1,
      ease: [0.16, 1, 0.3, 1],
    },
  }),
};

const stagger = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.2 },
  },
};

const FloatingShape = ({ className, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 1.2, delay, ease: [0.16, 1, 0.3, 1] }}
    className={className}
  />
);

const FeatureCard = ({ icon: Icon, title, description, index }) => (
  <motion.div
    variants={fadeUp}
    custom={index}
    className="group relative"
  >
    <div className="absolute -inset-px rounded-sm bg-gradient-to-b from-primary/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
    <div className="relative h-full rounded-sm border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg">
      <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-sm bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="font-heading text-xl font-semibold text-foreground mb-2">
        {title}
      </h3>
      <p className="text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  </motion.div>
);

const StatItem = ({ value, label, index }) => (
  <motion.div
    variants={fadeUp}
    custom={index}
    className="text-center"
  >
    <div className="font-heading text-4xl font-bold text-primary md:text-5xl">
      {value}
    </div>
    <div className="mt-1 font-mono text-xs uppercase tracking-widest text-muted-foreground">
      {label}
    </div>
  </motion.div>
);

const LandingPage = () => {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const features = [
    {
      icon: Brain,
      title: "AI-Powered Answers",
      description:
        "Ask questions in natural language and receive accurate answers grounded in your organization's documents.",
    },
    {
      icon: FileText,
      title: "Document Library",
      description:
        "Upload and organize your PDF documents. They're automatically chunked and embedded for semantic search.",
    },
    {
      icon: Search,
      title: "Semantic Search",
      description:
        "Find relevant information across your entire knowledge base using meaning, not just keywords.",
    },
    {
      icon: Users,
      title: "Multi-Tenant Workspaces",
      description:
        "Each organization gets an isolated workspace with their own documents, users, and access controls.",
    },
    {
      icon: Shield,
      title: "Role-Based Access",
      description:
        "Admins, users, and public roles with fine-grained permissions to keep your data secure.",
    },
    {
      icon: Zap,
      title: "Instant Citations",
      description:
        "Every answer includes source citations with relevance scores so you can verify the information.",
    },
  ];

  return (
    <div className="relative overflow-hidden">
      {/* Decorative elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <FloatingShape
          delay={0.2}
          className="absolute -right-24 top-32 h-96 w-96 rounded-full bg-gradient-to-br from-primary/8 to-accent/5 blur-3xl"
        />
        <FloatingShape
          delay={0.4}
          className="absolute -left-32 top-[60vh] h-72 w-72 rounded-full bg-gradient-to-tr from-accent/8 to-primary/5 blur-3xl"
        />
        <FloatingShape
          delay={0.6}
          className="absolute right-1/4 top-[120vh] h-64 w-64 rounded-full bg-gradient-to-bl from-primary/6 to-transparent blur-3xl"
        />
      </div>

      {/* ─── Hero Section ──────────────────────────────────────────────── */}
      <section ref={heroRef} className="relative min-h-[90vh] pt-8 md:pt-16">
        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative"
        >
          {/* Decorative line accents */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="absolute -left-4 top-8 h-px w-32 origin-left bg-gradient-to-r from-primary to-transparent md:-left-8 md:w-48"
          />

          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Left column - Text */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={stagger}
              className="flex flex-col justify-center"
            >
              <motion.div variants={fadeUp} className="mb-4 flex items-center gap-3">
                <div className="h-px w-10 bg-primary" />
                <span className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-primary">
                  Knowledge Platform
                </span>
              </motion.div>

              <motion.h1
                variants={fadeUp}
                custom={1}
                className="font-heading text-5xl font-bold leading-[1.05] text-foreground md:text-6xl lg:text-7xl"
              >
                Your company's
                <br />
                <span className="relative inline-block">
                  <span className="relative z-10 italic text-primary">knowledge</span>
                  <motion.span
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.8, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute -bottom-1 left-0 h-3 w-full origin-left bg-primary/10"
                  />
                </span>
                <br />
                <span className="text-muted-foreground">at your fingertips.</span>
              </motion.h1>

              <motion.p
                variants={fadeUp}
                custom={2}
                className="mt-6 max-w-lg text-base leading-relaxed text-muted-foreground md:text-lg"
              >
                Cortex transforms your document library into an intelligent knowledge base.
                Ask questions in plain language and get AI-generated answers grounded in{" "}
                <em className="text-foreground">your</em> documents — not the open internet.
              </motion.p>

              <motion.div
                variants={fadeUp}
                custom={3}
                className="mt-8 flex flex-wrap items-center gap-4"
              >
                <Link to="/register-workspace">
                  <Button className="group h-12 px-6 text-base">
                    Get Started
                    <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline" className="h-12 px-6 text-base">
                    Sign In
                  </Button>
                </Link>
              </motion.div>
            </motion.div>

            {/* Right column - Visual */}
            <motion.div
              initial={{ opacity: 0, x: 40, rotateY: -8 }}
              animate={{ opacity: 1, x: 0, rotateY: 0 }}
              transition={{ duration: 0.9, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="relative hidden lg:block"
            >
              <div className="relative">
                {/* Main card */}
                <div className="rounded-sm border border-border bg-card p-6 shadow-2xl shadow-primary/5">
                  <div className="mb-4 flex items-center gap-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <span className="font-mono text-xs text-muted-foreground">
                      Ask anything...
                    </span>
                  </div>
                  <div className="rounded-sm border border-border bg-background p-4">
                    <p className="text-sm text-foreground">
                      What are our Q3 revenue projections?
                    </p>
                  </div>

                  <div className="mt-6 space-y-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                        AI Response
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed text-foreground">
                      Based on the Q3 Financial Planning document, the projected
                      revenue for Q3 2024 is <strong>$4.2M</strong>, representing
                      a 23% increase from Q2...
                    </p>
                    <div className="flex gap-2 pt-2">
                      <span className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-muted px-2.5 py-1 font-mono text-xs">
                        <BookOpen className="h-3 w-3" />
                        Q3-Financial-Plan.pdf
                        <span className="text-primary">94%</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Floating accent card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.7 }}
                  className="absolute -bottom-16 -left-8 rounded-sm border border-border bg-card p-4 shadow-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-primary/10">
                      <Lock className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">
                        Secure & Private
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Your data stays yours
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Floating stats card */}
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.9 }}
                  className="absolute -top-4 right-0 rounded-sm border border-border bg-card p-4 shadow-lg"
                >
                  <div className="flex items-center gap-2">
                    <MessageSquareText className="h-4 w-4 text-accent" />
                    <span className="font-mono text-xs text-muted-foreground">
                      2,847 questions answered
                    </span>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ─── Features Section ──────────────────────────────────────────── */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={stagger}
        className="py-24 md:py-32"
      >
        <motion.div variants={fadeUp} className="mb-12 text-center md:mb-16">
          <div className="mb-4 flex items-center justify-center gap-3">
            <div className="h-px w-10 bg-muted-foreground" />
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Capabilities
            </span>
            <div className="h-px w-10 bg-muted-foreground" />
          </div>
          <h2 className="font-heading text-4xl font-bold text-foreground md:text-5xl">
            Everything you need to
            <br />
            <span className="italic text-primary">unlock knowledge</span>
          </h2>
        </motion.div>

        <motion.div
          variants={stagger}
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          {features.map((feature, index) => (
            <FeatureCard key={feature.title} {...feature} index={index} />
          ))}
        </motion.div>
      </motion.section>

      {/* ─── How It Works Section ──────────────────────────────────────── */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={stagger}
        className="py-24 md:py-32"
      >
        <div className="grid gap-16 lg:grid-cols-2">
          <motion.div variants={fadeUp}>
            <div className="mb-4 flex items-center gap-3">
              <div className="h-px w-10 bg-primary" />
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-primary">
                How It Works
              </span>
            </div>
            <h2 className="font-heading text-4xl font-bold text-foreground md:text-5xl">
              From question
              <br />
              <span className="italic text-primary">to answer</span>
              <br />
              <span className="text-muted-foreground">in seconds.</span>
            </h2>
            <p className="mt-6 text-base leading-relaxed text-muted-foreground md:text-lg">
              Cortex uses retrieval-augmented generation (RAG) to find the most
              relevant passages from your documents and generate accurate,
              grounded answers.
            </p>
          </motion.div>

          <motion.div variants={stagger} className="space-y-6">
            {[
              {
                step: "01",
                title: "Upload Documents",
                description:
                  "Add PDF documents to your workspace. They're automatically processed and indexed.",
              },
              {
                step: "02",
                title: "Ask Questions",
                description:
                  "Type your question in natural language — no special syntax needed.",
              },
              {
                step: "03",
                title: "Get Grounded Answers",
                description:
                  "Receive AI-generated answers with source citations and relevance scores.",
              },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                variants={fadeUp}
                custom={index}
                className="flex gap-4"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-sm border border-primary/30 bg-primary/5 font-mono text-sm font-semibold text-primary">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-heading text-xl font-semibold text-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* ─── Stats Section ─────────────────────────────────────────────── */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={stagger}
        className="border-y border-border py-16"
      >
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <StatItem value="99%" label="Accuracy" index={0} />
          <StatItem value="<2s" label="Response Time" index={1} />
          <StatItem value="∞" label="Documents" index={2} />
          <StatItem value="24/7" label="Availability" index={3} />
        </div>
      </motion.section>

      {/* ─── CTA Section ───────────────────────────────────────────────── */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={stagger}
        className="py-24 md:py-32"
      >
        <motion.div
          variants={fadeUp}
          className="relative overflow-hidden rounded-sm border border-border bg-gradient-to-br from-primary/5 via-card to-accent/5 p-12 text-center md:p-16"
        >
          {/* Background pattern */}
          <div className="pointer-events-none absolute inset-0 opacity-30">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `radial-gradient(circle at 2px 2px, var(--border) 1px, transparent 0)`,
                backgroundSize: "32px 32px",
              }}
            />
          </div>

          <div className="relative">
            <h2 className="font-heading text-4xl font-bold text-foreground md:text-5xl">
              Ready to transform your
              <br />
              <span className="italic text-primary">knowledge management?</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground md:text-lg">
              Start building your intelligent knowledge base today. No credit
              card required.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link to="/register-workspace">
                <Button className="group h-12 px-8 text-base">
                  Create Your Workspace
                  <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" className="h-12 px-8 text-base">
                  Sign In to Existing
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </motion.section>
    </div>
  );
};

export default LandingPage;
