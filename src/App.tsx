import { useState, useEffect, useRef, useCallback } from "react";
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from "framer-motion";

// ── COLOR SYSTEM ──────────────────────────────────────────────────────────────
const C = {
  bg: "#030711",
  bg2: "#060d1f",
  blue: "#0ea5e9",
  cyan: "#22d3ee",
  purple: "#a855f7",
  violet: "#7c3aed",
  pink: "#ec4899",
  glow: "rgba(14,165,233,0.15)",
  glowPurple: "rgba(168,85,247,0.15)",
};

// ── FONT IMPORTS ──────────────────────────────────────────────────────────────
const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=JetBrains+Mono:wght@300;400;500&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body { background: ${C.bg}; color: #e2e8f0; font-family: 'Syne', sans-serif; overflow-x: hidden; cursor: none; }
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: ${C.bg}; }
    ::-webkit-scrollbar-thumb { background: ${C.blue}; border-radius: 2px; }
    ::selection { background: rgba(14,165,233,0.3); color: #fff; }
    .mono { font-family: 'JetBrains Mono', monospace; }
    @keyframes pulse-glow { 0%,100%{opacity:.6;transform:scale(1)} 50%{opacity:1;transform:scale(1.05)} }
    @keyframes float { 0%,100%{transform:translateY(0px) rotate(0deg)} 50%{transform:translateY(-20px) rotate(5deg)} }
    @keyframes scan { 0%{top:-100%} 100%{top:100%} }
    @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
    @keyframes orbit { 0%{transform:rotate(0deg) translateX(60px) rotate(0deg)} 100%{transform:rotate(360deg) translateX(60px) rotate(-360deg)} }
    @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
    @keyframes ripple { 0%{transform:scale(0);opacity:1} 100%{transform:scale(4);opacity:0} }
  `}</style>
);

// ── ANIMATED CURSOR ───────────────────────────────────────────────────────────
function Cursor() {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [hov, setHov] = useState(false);
  useEffect(() => {
    const move = (e) => setPos({ x: e.clientX, y: e.clientY });
    const over = (e) => setHov(!!e.target.closest("a,button,[data-hover]"));
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseover", over);
    return () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseover", over); };
  }, []);
  return (
    <>
      <motion.div animate={{ x: pos.x - 6, y: pos.y - 6 }} transition={{ type: "spring", stiffness: 800, damping: 40 }}
        style={{ position: "fixed", width: 12, height: 12, borderRadius: "50%", background: C.cyan, pointerEvents: "none", zIndex: 9999, mixBlendMode: "screen" }} />
      <motion.div animate={{ x: pos.x - 20, y: pos.y - 20, scale: hov ? 1.8 : 1 }} transition={{ type: "spring", stiffness: 200, damping: 30 }}
        style={{ position: "fixed", width: 40, height: 40, borderRadius: "50%", border: `1px solid ${C.blue}`, pointerEvents: "none", zIndex: 9998, opacity: 0.5 }} />
    </>
  );
}

// ── NEURAL NETWORK CANVAS ─────────────────────────────────────────────────────
function NeuralCanvas() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext("2d");
    let w, h, nodes, raf;
    const init = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
      nodes = Array.from({ length: 80 }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 2 + 1,
        hue: Math.random() > 0.5 ? "14,165,233" : "168,85,247"
      }));
    };
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      nodes.forEach(n => {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
      });
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `rgba(${nodes[i].hue},${(1 - dist / 150) * 0.25})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      nodes.forEach(n => {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${n.hue},0.8)`;
        ctx.fill();
        ctx.shadowBlur = 6; ctx.shadowColor = `rgba(${n.hue},0.6)`;
        ctx.fill();
        ctx.shadowBlur = 0;
      });
      raf = requestAnimationFrame(draw);
    };
    init(); draw();
    window.addEventListener("resize", init);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", init); };
  }, []);
  return <canvas ref={ref} style={{ position: "fixed", inset: 0, zIndex: 0, opacity: 0.6, pointerEvents: "none" }} />;
}

// ── FLOATING SHAPES ───────────────────────────────────────────────────────────
function FloatingShapes() {
  const shapes = [
    { type: "hex", size: 60, color: C.blue, x: "10%", y: "20%", delay: 0 },
    { type: "tri", size: 40, color: C.purple, x: "85%", y: "15%", delay: 1 },
    { type: "sq", size: 30, color: C.cyan, x: "75%", y: "60%", delay: 2 },
    { type: "hex", size: 45, color: C.violet, x: "5%", y: "70%", delay: 0.5 },
    { type: "tri", size: 35, color: C.pink, x: "90%", y: "80%", delay: 1.5 },
    { type: "sq", size: 25, color: C.blue, x: "50%", y: "90%", delay: 3 },
  ];
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 1 }}>
      {shapes.map((s, i) => (
        <motion.div key={i}
          animate={{ y: [0, -25, 0], rotate: [0, 15, 0], opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 5 + i, repeat: Infinity, delay: s.delay, ease: "easeInOut" }}
          style={{ position: "absolute", left: s.x, top: s.y }}>
          {s.type === "hex" && <svg width={s.size} height={s.size} viewBox="0 0 100 100">
            <polygon points="50,5 90,25 90,75 50,95 10,75 10,25" fill="none" stroke={s.color} strokeWidth="1.5" opacity="0.6" />
          </svg>}
          {s.type === "tri" && <svg width={s.size} height={s.size} viewBox="0 0 100 100">
            <polygon points="50,10 90,80 10,80" fill="none" stroke={s.color} strokeWidth="1.5" opacity="0.6" />
          </svg>}
          {s.type === "sq" && <svg width={s.size} height={s.size} viewBox="0 0 100 100">
            <rect x="10" y="10" width="80" height="80" fill="none" stroke={s.color} strokeWidth="1.5" opacity="0.6" transform="rotate(45 50 50)" />
          </svg>}
        </motion.div>
      ))}
    </div>
  );
}

// ── LOADING SCREEN ────────────────────────────────────────────────────────────
function Loader({ onDone }) {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setPct(p => { if (p >= 100) { clearInterval(t); setTimeout(onDone, 400); return 100; } return p + 2; }), 30);
    return () => clearInterval(t);
  }, [onDone]);
  return (
    <motion.div exit={{ opacity: 0 }} transition={{ duration: 0.6 }}
      style={{ position: "fixed", inset: 0, background: C.bg, zIndex: 10000, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: "center" }}>
        <div style={{ width: 80, height: 80, margin: "0 auto 32px", position: "relative" }}>
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `2px solid transparent`, borderTopColor: C.blue, borderRightColor: C.cyan }} />
          <motion.div animate={{ rotate: -360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            style={{ position: "absolute", inset: 8, borderRadius: "50%", border: `2px solid transparent`, borderTopColor: C.purple, borderLeftColor: C.pink }} />
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, color: C.cyan }}>AI</div>
        </div>
        <div className="mono" style={{ color: C.blue, fontSize: 12, letterSpacing: 4, marginBottom: 24 }}>INITIALIZING NEURAL INTERFACE</div>
        <div style={{ width: 300, height: 2, background: "rgba(255,255,255,0.1)", borderRadius: 2, overflow: "hidden" }}>
          <motion.div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${C.violet}, ${C.blue}, ${C.cyan})`, borderRadius: 2 }} />
        </div>
        <div className="mono" style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginTop: 12 }}>{pct}%</div>
      </motion.div>
    </motion.div>
  );
}

// ── NAV ───────────────────────────────────────────────────────────────────────
function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const s = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", s);
    return () => window.removeEventListener("scroll", s);
  }, []);
  const links = ["About", "Skills", "Projects", "Experience", "Contact"];
  const scrollTo = (id) => { document.getElementById(id.toLowerCase())?.scrollIntoView({ behavior: "smooth" }); setOpen(false); };
  return (
    <motion.nav initial={{ y: -80 }} animate={{ y: 0 }} transition={{ duration: 0.8, delay: 0.5 }}
      style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000, padding: "16px 40px", display: "flex", alignItems: "center", justifyContent: "space-between",
        background: scrolled ? "rgba(3,7,17,0.85)" : "transparent", backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(14,165,233,0.15)" : "none", transition: "all 0.4s" }}>
      <motion.div whileHover={{ scale: 1.05 }} style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.5, cursor: "pointer" }}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
        <span style={{ color: C.cyan }}>T</span><span style={{ color: "#fff" }}>TG</span>
        <span className="mono" style={{ fontSize: 10, color: C.blue, marginLeft: 8, opacity: 0.7 }}>ML.ENG</span>
      </motion.div>
      <div style={{ display: "flex", gap: 8 }}>
        {links.map(l => (
          <motion.button key={l} data-hover whileHover={{ color: C.cyan, scale: 1.05 }} onClick={() => scrollTo(l)}
            style={{ background: "none", border: "none", color: "rgba(255,255,255,0.6)", fontSize: 13, fontFamily: "'Syne',sans-serif", fontWeight: 500, cursor: "pointer", padding: "8px 14px", borderRadius: 6, letterSpacing: 0.5 }}>
            {l}
          </motion.button>
        ))}
        <motion.button data-hover whileHover={{ scale: 1.05 }} onClick={() => scrollTo("Contact")}
          style={{ background: `linear-gradient(135deg, ${C.blue}, ${C.purple})`, border: "none", color: "#fff", fontSize: 13, fontFamily: "'Syne',sans-serif", fontWeight: 600, cursor: "pointer", padding: "8px 20px", borderRadius: 20, marginLeft: 8 }}>
          Hire Me
        </motion.button>
      </div>
    </motion.nav>
  );
}

// ── TYPING ANIMATION ──────────────────────────────────────────────────────────
function Typewriter({ words, speed = 80 }) {
  const [idx, setIdx] = useState(0);
  const [txt, setTxt] = useState("");
  const [del, setDel] = useState(false);
  useEffect(() => {
    const word = words[idx % words.length];
    const timeout = setTimeout(() => {
      if (!del) {
        setTxt(word.slice(0, txt.length + 1));
        if (txt.length + 1 === word.length) setTimeout(() => setDel(true), 1500);
      } else {
        setTxt(word.slice(0, txt.length - 1));
        if (txt.length - 1 === 0) { setDel(false); setIdx(i => i + 1); }
      }
    }, del ? speed / 2 : speed);
    return () => clearTimeout(timeout);
  }, [txt, del, idx, words, speed]);
  return (
    <span>
      <span style={{ color: C.cyan }}>{txt}</span>
      <span style={{ animation: "blink 1s step-end infinite", color: C.blue }}>|</span>
    </span>
  );
}

// ── GLOW BUTTON ───────────────────────────────────────────────────────────────
function GlowBtn({ children, variant = "primary", onClick, href, download }) {
  const base = { display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 28px", borderRadius: 40, fontSize: 14, fontFamily: "'Syne',sans-serif", fontWeight: 600, cursor: "pointer", letterSpacing: 0.5, border: "none", textDecoration: "none" };
  const styles = {
    primary: { background: `linear-gradient(135deg, ${C.violet}, ${C.blue})`, color: "#fff", boxShadow: `0 0 30px rgba(14,165,233,0.3)` },
    outline: { background: "transparent", color: C.cyan, border: `1px solid ${C.cyan}`, boxShadow: `0 0 20px rgba(34,211,238,0.1)` },
    ghost: { background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.8)", border: "1px solid rgba(255,255,255,0.1)" },
  };
  const El = href ? "a" : "button";
  return (
    <motion.div whileHover={{ scale: 1.06, y: -2 }} whileTap={{ scale: 0.97 }} style={{ display: "inline-block" }}>
      <El href={href} download={download} onClick={onClick} style={{ ...base, ...styles[variant] }}>{children}</El>
    </motion.div>
  );
}

// ── SECTION WRAPPER ───────────────────────────────────────────────────────────
function Section({ id, children, style }) {
  return (
    <motion.section id={id} initial={{ opacity: 0, y: 60 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.8 }}
      style={{ position: "relative", zIndex: 2, padding: "120px 40px", maxWidth: 1200, margin: "0 auto", ...style }}>
      {children}
    </motion.section>
  );
}

function SectionLabel({ label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
      <div className="mono" style={{ color: C.blue, fontSize: 11, letterSpacing: 3, textTransform: "uppercase" }}>// {label}</div>
      <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${C.blue}, transparent)` }} />
    </div>
  );
}

// ── HERO ──────────────────────────────────────────────────────────────────────
function Hero() {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 150]);
  const o = useTransform(scrollY, [0, 400], [1, 0]);
  const roles = ["Machine Learning Engineer", "Deep Learning Researcher", "MLOps Architect", "AI Systems Builder", "Computer Vision Expert"];
  return (
    <motion.div style={{ y, opacity: o, position: "relative", zIndex: 2, minHeight: "100vh", display: "flex", alignItems: "center", paddingTop: 100 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 40px", width: "100%" }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
          <div className="mono" style={{ color: C.blue, fontSize: 12, letterSpacing: 4, marginBottom: 24 }}>
            <span style={{ color: C.purple }}>const</span> engineer = <span style={{ color: C.cyan }}>"ready"</span>;
          </div>
          <h1 style={{ fontSize: "clamp(42px, 7vw, 88px)", fontWeight: 800, lineHeight: 1.05, letterSpacing: -2, marginBottom: 24 }}>
            <motion.span initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1 }} style={{ display: "block", background: `linear-gradient(135deg, #fff 30%, ${C.blue})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Tedla Tesfaye
            </motion.span>
            <motion.span initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.2 }} style={{ display: "block", background: `linear-gradient(135deg, ${C.cyan}, ${C.purple})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Godebo
            </motion.span>
          </h1>
          <div style={{ fontSize: "clamp(16px, 2.5vw, 22px)", marginBottom: 24, fontWeight: 500, minHeight: 36 }}>
            <Typewriter words={roles} />
          </div>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}
            style={{ fontSize: 16, lineHeight: 1.8, color: "rgba(255,255,255,0.55)", maxWidth: 580, marginBottom: 48 }}>
            Building intelligent systems, scalable machine learning solutions, and AI-powered experiences that bridge research and real-world impact.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.7 }}
            style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <GlowBtn href="#" download="Tedla_Tesfaye_Resume.pdf">⬇ Download Resume</GlowBtn>
            <GlowBtn variant="outline" onClick={() => document.getElementById("projects")?.scrollIntoView({ behavior: "smooth" })}>View Projects →</GlowBtn>
            <GlowBtn variant="ghost" onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}>Get In Touch</GlowBtn>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }} style={{ display: "flex", gap: 20, marginTop: 48 }}>
            {[["GitHub", "https://github.com/yourusername"], ["LinkedIn", "https://linkedin.com/in/yourusername"], ["Email", "mailto:tedla@example.com"]].map(([label, href]) => (
              <motion.a key={label} href={href} data-hover whileHover={{ y: -4, color: C.cyan }}
                style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, textDecoration: "none", fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.blue, display: "inline-block" }} />{label}
              </motion.a>
            ))}
          </motion.div>
        </motion.div>
        <div style={{ position: "absolute", right: "5%", top: "50%", transform: "translateY(-50%)", opacity: 0.12, fontSize: 200, fontWeight: 800, color: C.blue, userSelect: "none", letterSpacing: -10 }}>AI</div>
      </div>
    </motion.div>
  );
}

// ── ABOUT ─────────────────────────────────────────────────────────────────────
function About() {
  const stats = [{ n: "50+", l: "ML Projects" }, { n: "3+", l: "Years Exp" }, { n: "15+", l: "Technologies" }, { n: "∞", l: "Curiosity" }];
  return (
    <Section id="about">
      <SectionLabel label="About Me" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: 40, fontWeight: 800, marginBottom: 24, lineHeight: 1.1 }}>
            Bridging Research <span style={{ background: `linear-gradient(135deg, ${C.cyan}, ${C.purple})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>& Reality</span>
          </h2>
          <p style={{ color: "rgba(255,255,255,0.6)", lineHeight: 1.9, fontSize: 15, marginBottom: 16 }}>
            I'm a Machine Learning Engineer with a deep passion for building production-ready AI systems that solve real-world problems at scale. My work spans deep learning, computer vision, NLP, recommendation systems, and predictive analytics — translating cutting-edge research into impactful products.
          </p>
          <p style={{ color: "rgba(255,255,255,0.6)", lineHeight: 1.9, fontSize: 15, marginBottom: 16 }}>
            With a foundation in software engineering and frontend development, I bring a full-stack perspective to AI: from exploratory data science and model development to cloud deployment, MLOps automation, and scalable infrastructure. I've shipped models to production on AWS, GCP, and Azure, with CI/CD pipelines, containerized microservices, and monitoring dashboards.
          </p>
          <p style={{ color: "rgba(255,255,255,0.6)", lineHeight: 1.9, fontSize: 15 }}>
            I approach every project with a research mindset — reading papers, experimenting relentlessly, and engineering systems that are not just accurate, but robust, interpretable, and maintainable. I'm driven by the belief that AI, built responsibly and thoughtfully, can fundamentally improve human lives.
          </p>
        </div>
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 32 }}>
            {stats.map(s => (
              <motion.div key={s.l} whileHover={{ scale: 1.04, borderColor: C.blue }}
                style={{ padding: "24px", borderRadius: 16, border: "1px solid rgba(14,165,233,0.2)", background: "rgba(14,165,233,0.04)", textAlign: "center", transition: "border-color 0.3s" }}>
                <div style={{ fontSize: 36, fontWeight: 800, background: `linear-gradient(135deg, ${C.cyan}, ${C.purple})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{s.n}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 4, letterSpacing: 1 }}>{s.l}</div>
              </motion.div>
            ))}
          </div>
          <div style={{ padding: 24, borderRadius: 16, background: `linear-gradient(135deg, rgba(124,58,237,0.15), rgba(14,165,233,0.15))`, border: "1px solid rgba(168,85,247,0.2)" }}>
            <div className="mono" style={{ fontSize: 12, color: C.purple, marginBottom: 8 }}>// research_interests</div>
            {["Deep Learning & Neural Architecture Search", "Computer Vision & Multimodal AI", "Large Language Models & RAG Systems", "MLOps & Production AI Systems", "Reinforcement Learning"].map(r => (
              <div key={r} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, color: "rgba(255,255,255,0.7)", fontSize: 13 }}>
                <span style={{ color: C.cyan }}>▹</span> {r}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}

// ── SKILLS ────────────────────────────────────────────────────────────────────
const TECH = {
  "Languages": ["Python", "SQL", "JavaScript", "TypeScript", "C++", "Bash"],
  "ML / DL": ["PyTorch", "TensorFlow", "Scikit-learn", "Keras", "XGBoost", "LightGBM", "Hugging Face", "OpenCV", "spaCy", "NLTK"],
  "Data Science": ["Pandas", "NumPy", "Matplotlib", "Plotly", "Seaborn", "Jupyter", "Apache Spark"],
  "MLOps": ["Docker", "Kubernetes", "MLflow", "FastAPI", "Flask", "Streamlit", "Airflow", "CI/CD"],
  "Cloud": ["AWS", "Google Cloud", "Azure", "Firebase", "Linux", "GitHub Actions"],
  "Databases": ["PostgreSQL", "MongoDB", "MySQL", "Redis"],
  "Frontend": ["React", "Next.js", "Node.js", "Tailwind CSS"],
  "Tools": ["Git", "GitHub", "VS Code", "Postman", "Figma"],
};
const catColors = ["blue", "purple", "cyan", "violet", "pink", "blue", "purple", "cyan"];

function Skills() {
  const [active, setActive] = useState("ML / DL");
  return (
    <Section id="skills">
      <SectionLabel label="Tech Stack" />
      <h2 style={{ fontSize: 40, fontWeight: 800, marginBottom: 48 }}>
        Arsenal of <span style={{ background: `linear-gradient(135deg, ${C.cyan}, ${C.purple})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Technologies</span>
      </h2>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 40 }}>
        {Object.keys(TECH).map(cat => (
          <motion.button key={cat} data-hover onClick={() => setActive(cat)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
            style={{ padding: "8px 20px", borderRadius: 20, border: `1px solid ${active === cat ? C.blue : "rgba(255,255,255,0.12)"}`, background: active === cat ? `rgba(14,165,233,0.15)` : "transparent",
              color: active === cat ? C.cyan : "rgba(255,255,255,0.5)", fontSize: 13, fontFamily: "'Syne',sans-serif", cursor: "pointer", fontWeight: 500 }}>
            {cat}
          </motion.button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={active} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}
          style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          {TECH[active].map((tech, i) => (
            <motion.div key={tech} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
              whileHover={{ scale: 1.08, y: -4 }} data-hover
              style={{ padding: "10px 20px", borderRadius: 40, background: "rgba(14,165,233,0.07)", border: "1px solid rgba(14,165,233,0.25)", color: "#e2e8f0", fontSize: 13, fontWeight: 500, cursor: "default",
                boxShadow: "0 0 15px rgba(14,165,233,0.05)" }}>
              {tech}
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>
    </Section>
  );
}

// ── PROJECTS ──────────────────────────────────────────────────────────────────
const PROJECTS = [
  { title: "AI Stock Market Prediction", desc: "Deep learning system for stock forecasting using LSTM networks, feature engineering, sentiment analysis, and time-series modeling with Streamlit dashboard.", tech: ["Python", "TensorFlow", "LSTM", "Pandas", "Streamlit"], gh: "https://github.com/yourusername/stock-prediction", demo: "https://your-demo-link.com", color: C.blue },
  { title: "Intelligent Recommendation Engine", desc: "Scalable recommendation system using collaborative filtering, matrix factorization, and deep learning ranking models served via FastAPI with real-time inference.", tech: ["PyTorch", "FastAPI", "PostgreSQL", "Redis"], gh: "https://github.com/yourusername/recommendation-engine", demo: "https://your-demo-link.com", color: C.purple },
  { title: "Real-Time Object Detection", desc: "Computer vision system detecting and tracking objects in real-time using YOLOv8 and OpenCV, achieving 60FPS on edge hardware.", tech: ["YOLOv8", "OpenCV", "Python", "CUDA"], gh: "https://github.com/yourusername/object-detection", demo: "https://your-demo-link.com", color: C.cyan },
  { title: "NLP Resume Screening AI", desc: "Transformer-based NLP system that ranks resumes using semantic similarity and fine-tuned BERT embeddings with explainable scoring.", tech: ["Transformers", "Hugging Face", "FastAPI", "spaCy"], gh: "https://github.com/yourusername/resume-screening-ai", demo: "https://your-demo-link.com", color: C.pink },
  { title: "RAG Chatbot Architecture", desc: "Production-grade AI chatbot using Retrieval-Augmented Generation, Pinecone vector database, and OpenAI GPT pipelines for context-aware responses.", tech: ["LangChain", "Pinecone", "OpenAI API", "FastAPI"], gh: "https://github.com/yourusername/rag-chatbot", demo: "https://your-demo-link.com", color: C.violet },
  { title: "Predictive Analytics Dashboard", desc: "Enterprise analytics platform for forecasting business trends, anomaly detection, and automated insight generation with interactive Plotly visualizations.", tech: ["Python", "Plotly", "Streamlit", "Pandas"], gh: "https://github.com/yourusername/predictive-dashboard", demo: "https://your-demo-link.com", color: C.blue },
  { title: "MLOps Pipeline Platform", desc: "Full ML lifecycle platform with automated training, deployment, A/B testing, monitoring, and CI/CD automation on Kubernetes and AWS.", tech: ["Docker", "Kubernetes", "MLflow", "AWS", "Airflow"], gh: "https://github.com/yourusername/mlops-platform", demo: "https://your-demo-link.com", color: C.purple },
];

function ProjectCard({ p, i }) {
  const [hov, setHov] = useState(false);
  return (
    <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.6 }}
      onHoverStart={() => setHov(true)} onHoverEnd={() => setHov(false)} data-hover
      style={{ borderRadius: 20, border: `1px solid ${hov ? p.color : "rgba(255,255,255,0.08)"}`, background: hov ? `rgba(${p.color === C.blue ? "14,165,233" : p.color === C.purple ? "168,85,247" : p.color === C.cyan ? "34,211,238" : p.color === C.pink ? "236,72,153" : "124,58,237"},0.06)` : "rgba(255,255,255,0.02)",
        padding: 28, position: "relative", overflow: "hidden", transition: "all 0.4s", cursor: "default",
        boxShadow: hov ? `0 0 40px ${p.color}22` : "none" }}>
      <motion.div animate={{ opacity: hov ? 1 : 0 }} style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${p.color}, transparent)` }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: `${p.color}22`, border: `1px solid ${p.color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
          {["📈", "🎯", "👁️", "📄", "🤖", "📊", "⚙️"][i]}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <motion.a href={p.gh} target="_blank" whileHover={{ scale: 1.1, color: p.color }}
            style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textDecoration: "none", padding: "4px 12px", borderRadius: 20, border: "1px solid rgba(255,255,255,0.1)", fontWeight: 500 }}>GH</motion.a>
          <motion.a href={p.demo} target="_blank" whileHover={{ scale: 1.1, color: p.color }}
            style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textDecoration: "none", padding: "4px 12px", borderRadius: 20, border: "1px solid rgba(255,255,255,0.1)", fontWeight: 500 }}>↗</motion.a>
        </div>
      </div>
      <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 10, color: "#fff", lineHeight: 1.3 }}>{p.title}</h3>
      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.7, marginBottom: 20 }}>{p.desc}</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {p.tech.map(t => (
          <span key={t} style={{ fontSize: 10, padding: "3px 10px", borderRadius: 20, background: `${p.color}15`, border: `1px solid ${p.color}30`, color: p.color, fontWeight: 600, letterSpacing: 0.5 }}>{t}</span>
        ))}
      </div>
    </motion.div>
  );
}

function Projects() {
  return (
    <Section id="projects">
      <SectionLabel label="Projects" />
      <h2 style={{ fontSize: 40, fontWeight: 800, marginBottom: 16 }}>
        Flagship <span style={{ background: `linear-gradient(135deg, ${C.cyan}, ${C.purple})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>AI Systems</span>
      </h2>
      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 15, marginBottom: 56 }}>Production-grade systems built with research-first thinking.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
        {PROJECTS.map((p, i) => <ProjectCard key={p.title} p={p} i={i} />)}
      </div>
    </Section>
  );
}

// ── EXPERIENCE ────────────────────────────────────────────────────────────────
const EXP = [
  { role: "Machine Learning Engineer", co: "AI Research Lab", period: "2023 – Present", desc: "Designed and deployed scalable ML pipelines processing millions of records daily. Built transformer-based NLP models and computer vision systems for production. Led MLOps initiatives on AWS with Kubernetes orchestration.", color: C.blue },
  { role: "Data Scientist", co: "Tech Startup", period: "2022 – 2023", desc: "Developed predictive analytics models for customer behavior and churn prediction. Built real-time recommendation engine serving 100k+ users with sub-100ms latency.", color: C.purple },
  { role: "Software Engineer", co: "Software Company", period: "2021 – 2022", desc: "Built data-driven web applications and APIs. Introduced ML-driven features to improve user engagement. Developed React dashboards for business intelligence.", color: C.cyan },
];

function Experience() {
  return (
    <Section id="experience">
      <SectionLabel label="Experience" />
      <h2 style={{ fontSize: 40, fontWeight: 800, marginBottom: 56 }}>
        Career <span style={{ background: `linear-gradient(135deg, ${C.cyan}, ${C.purple})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Timeline</span>
      </h2>
      <div style={{ position: "relative" }}>
        <div style={{ position: "absolute", left: 20, top: 0, bottom: 0, width: 1, background: `linear-gradient(180deg, ${C.blue}, ${C.purple}, transparent)` }} />
        {EXP.map((e, i) => (
          <motion.div key={e.role} initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.2 }}
            style={{ paddingLeft: 60, paddingBottom: 48, position: "relative" }}>
            <motion.div whileHover={{ scale: 1.3 }} style={{ position: "absolute", left: 14, top: 6, width: 12, height: 12, borderRadius: "50%", background: e.color, boxShadow: `0 0 15px ${e.color}` }} />
            <div className="mono" style={{ fontSize: 11, color: e.color, letterSpacing: 2, marginBottom: 6 }}>{e.period}</div>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 2 }}>{e.role}</h3>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 12 }}>{e.co}</div>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", lineHeight: 1.7 }}>{e.desc}</p>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}

// ── CONTACT ───────────────────────────────────────────────────────────────────
function Contact() {
  const [form, setForm] = useState({ name: "", email: "", msg: "" });
  const [sent, setSent] = useState(false);
  const submit = (e) => { e.preventDefault(); setSent(true); setTimeout(() => setSent(false), 3000); setForm({ name: "", email: "", msg: "" }); };
  const inputStyle = { width: "100%", padding: "14px 20px", borderRadius: 12, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(14,165,233,0.2)", color: "#fff", fontSize: 14, fontFamily: "'Syne',sans-serif", outline: "none", transition: "border-color 0.3s" };
  return (
    <Section id="contact">
      <SectionLabel label="Contact" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "start" }}>
        <div>
          <h2 style={{ fontSize: 40, fontWeight: 800, marginBottom: 24, lineHeight: 1.1 }}>
            Let's Build <span style={{ background: `linear-gradient(135deg, ${C.cyan}, ${C.purple})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Something</span>
          </h2>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 15, lineHeight: 1.8, marginBottom: 40 }}>
            Open to full-time ML engineering roles, AI research collaborations, and exciting projects at the frontier of intelligence. Let's talk.
          </p>
          {[["✉", "tedla@example.com"], ["🔗", "linkedin.com/in/yourusername"], ["⌨", "github.com/yourusername"]].map(([icon, val]) => (
            <div key={val} style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20, color: "rgba(255,255,255,0.6)", fontSize: 14 }}>
              <span>{icon}</span> <span>{val}</span>
            </div>
          ))}
        </div>
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {[["name", "Name", "text"], ["email", "Email", "email"]].map(([key, ph, type]) => (
            <motion.input key={key} whileFocus={{ borderColor: C.blue }} type={type} placeholder={ph} value={form[key]}
              onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} required
              style={inputStyle} />
          ))}
          <motion.textarea whileFocus={{ borderColor: C.blue }} placeholder="Message" value={form.msg} rows={5}
            onChange={e => setForm(f => ({ ...f, msg: e.target.value }))} required
            style={{ ...inputStyle, resize: "vertical" }} />
          <motion.button type="submit" data-hover whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            style={{ padding: "14px 32px", borderRadius: 40, background: `linear-gradient(135deg, ${C.violet}, ${C.blue})`, border: "none", color: "#fff", fontSize: 14, fontFamily: "'Syne',sans-serif", fontWeight: 600, cursor: "pointer", boxShadow: `0 0 30px rgba(14,165,233,0.3)` }}>
            {sent ? "✓ Message Sent!" : "Send Message →"}
          </motion.button>
        </form>
      </div>
    </Section>
  );
}

// ── FOOTER ────────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{ position: "relative", zIndex: 2, borderTop: "1px solid rgba(14,165,233,0.1)", padding: "40px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
      <div className="mono" style={{ color: "rgba(255,255,255,0.3)", fontSize: 12 }}>© 2024 Tedla Tesfaye Godebo — Built with intelligence</div>
      <div style={{ display: "flex", gap: 24 }}>
        {["GitHub", "LinkedIn", "Email"].map(s => (
          <motion.a key={s} href="#" data-hover whileHover={{ color: C.cyan, y: -2 }}
            style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, textDecoration: "none", fontWeight: 500 }}>{s}</motion.a>
        ))}
      </div>
    </footer>
  );
}

// ── SCROLL PROGRESS ───────────────────────────────────────────────────────────
function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  return <motion.div style={{ position: "fixed", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${C.violet}, ${C.blue}, ${C.cyan})`, scaleX, transformOrigin: "0%", zIndex: 9997 }} />;
}

// ── CERTIFICATIONS ────────────────────────────────────────────────────────────
function Certifications() {
  const certs = [
    { name: "TensorFlow Developer Certificate", org: "Google", year: 2023 },
    { name: "AWS Machine Learning Specialty", org: "Amazon Web Services", year: 2023 },
    { name: "Deep Learning Specialization", org: "Coursera / DeepLearning.AI", year: 2022 },
    { name: "Professional Machine Learning Engineer", org: "Google Cloud", year: 2022 },
    { name: "MLOps Specialization", org: "Coursera / DeepLearning.AI", year: 2023 },
  ];
  return (
    <Section id="certifications">
      <SectionLabel label="Certifications" />
      <h2 style={{ fontSize: 40, fontWeight: 800, marginBottom: 40 }}>
        Credentials & <span style={{ background: `linear-gradient(135deg, ${C.cyan}, ${C.purple})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Recognition</span>
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
        {certs.map((c, i) => (
          <motion.div key={c.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
            whileHover={{ scale: 1.03, borderColor: C.blue }}
            style={{ padding: "20px 24px", borderRadius: 16, border: "1px solid rgba(14,165,233,0.15)", background: "rgba(14,165,233,0.03)", transition: "all 0.3s" }}>
            <div className="mono" style={{ fontSize: 10, color: C.blue, marginBottom: 8, letterSpacing: 2 }}>{c.year}</div>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{c.name}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{c.org}</div>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}

// ── AI STATS ──────────────────────────────────────────────────────────────────
function AIStats() {
  const stats = [
    { val: 50, suffix: "+", label: "ML Models Deployed" },
    { val: 10, suffix: "M+", label: "Data Points Processed" },
    { val: 98, suffix: "%", label: "Model Accuracy (Best)" },
    { val: 7, suffix: "", label: "Flagship Projects" },
    { val: 15, suffix: "+", label: "Papers Studied" },
    { val: 3, suffix: "+", label: "Years of AI Research" },
  ];
  return (
    <div style={{ position: "relative", zIndex: 2, padding: "80px 40px", background: `linear-gradient(135deg, rgba(14,165,233,0.05), rgba(168,85,247,0.05))`, borderTop: "1px solid rgba(14,165,233,0.1)", borderBottom: "1px solid rgba(168,85,247,0.1)" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 32, textAlign: "center" }}>
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
            <CountUp end={s.val} suffix={s.suffix} />
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 4, letterSpacing: 0.5 }}>{s.label}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function CountUp({ end, suffix }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        let start = 0;
        const step = () => {
          start += Math.ceil(end / 40);
          if (start >= end) { setVal(end); return; }
          setVal(start); requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
        obs.disconnect();
      }
    }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [end]);
  return <div ref={ref} style={{ fontSize: 40, fontWeight: 800, background: `linear-gradient(135deg, ${C.cyan}, ${C.purple})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{val}{suffix}</div>;
}

// ── AMBIENT LIGHT ─────────────────────────────────────────────────────────────
function AmbientLights() {
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
      <motion.div animate={{ x: [0, 100, 0], y: [0, -80, 0] }} transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        style={{ position: "absolute", top: "10%", left: "5%", width: 600, height: 600, borderRadius: "50%", background: `radial-gradient(circle, rgba(14,165,233,0.07) 0%, transparent 70%)`, filter: "blur(60px)" }} />
      <motion.div animate={{ x: [0, -80, 0], y: [0, 60, 0] }} transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        style={{ position: "absolute", top: "50%", right: "5%", width: 500, height: 500, borderRadius: "50%", background: `radial-gradient(circle, rgba(168,85,247,0.07) 0%, transparent 70%)`, filter: "blur(60px)" }} />
      <motion.div animate={{ x: [0, 60, 0], y: [0, -40, 0] }} transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        style={{ position: "absolute", bottom: "10%", left: "30%", width: 400, height: 400, borderRadius: "50%", background: `radial-gradient(circle, rgba(34,211,238,0.05) 0%, transparent 70%)`, filter: "blur(60px)" }} />
    </div>
  );
}

// ── ROOT APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const [loading, setLoading] = useState(true);
  const done = useCallback(() => setLoading(false), []);
  return (
    <>
      <GlobalStyle />
      <AnimatePresence>{loading && <Loader onDone={done} />}</AnimatePresence>
      {!loading && (
        <>
          <Cursor />
          <NeuralCanvas />
          <AmbientLights />
          <FloatingShapes />
          <ScrollProgress />
          <Nav />
          <main>
            <Hero />
            <AIStats />
            <About />
            <Skills />
            <Projects />
            <Experience />
            <Certifications />
            <Contact />
          </main>
          <Footer />
        </>
      )}
    </>
  );
}