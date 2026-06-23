import { useState, useEffect, useRef, useCallback } from "react";
import type { CSSProperties, FC, ReactNode } from "react";
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from "framer-motion";

// ── COLORS ────────────────────────────────────────────────────────────────────
const C = {
  bg: "#030711", blue: "#0ea5e9", cyan: "#22d3ee",
  purple: "#a855f7", violet: "#7c3aed", pink: "#ec4899",
} as const;

// ── MEDIA QUERY HOOK ──────────────────────────────────────────────────────────
function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    setMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return mobile;
}

// ── TYPES ─────────────────────────────────────────────────────────────────────
type TechMap = Record<string, string[]>;
interface Project { title: string; desc: string; tech: string[]; gh: string; demo: string; color: string; emoji: string; }
interface ExpItem  { role: string; co: string; period: string; desc: string; color: string; }
interface Cert     { name: string; org: string; year: number; }
interface StatItem { val: number; suffix: string; label: string; }
interface GlowBtnProps  { children: ReactNode; variant?: "primary"|"outline"|"ghost"; onClick?: ()=>void; href?: string; download?: string; }
interface SectionProps  { id: string; children: ReactNode; style?: CSSProperties; }
interface SectionLabelProps { label: string; }
interface LoaderProps   { onDone: ()=>void; }
interface CountUpProps  { end: number; suffix: string; }
interface ProjectCardProps { p: Project; i: number; }
interface TypewriterProps  { words: string[]; speed?: number; }

// ── GLOBAL STYLES ─────────────────────────────────────────────────────────────
const GlobalStyle: FC = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=JetBrains+Mono:wght@300;400;500&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body { background: ${C.bg}; color: #e2e8f0; font-family: 'Syne', sans-serif; overflow-x: hidden; }
    @media (pointer: fine) { body { cursor: none; } }
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: ${C.bg}; }
    ::-webkit-scrollbar-thumb { background: ${C.blue}; border-radius: 2px; }
    ::selection { background: rgba(14,165,233,0.3); color: #fff; }
    .mono { font-family: 'JetBrains Mono', monospace; }
    @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
    input, textarea { color-scheme: dark; }
    input:focus, textarea:focus { border-color: ${C.blue} !important; box-shadow: 0 0 0 2px rgba(14,165,233,0.15); }
  `}</style>
);

// ── CURSOR (desktop only) ─────────────────────────────────────────────────────
const Cursor: FC = () => {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [hov, setHov] = useState(false);
  const mobile = useIsMobile();
  useEffect(() => {
    if (mobile) return;
    const move = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY });
    const over  = (e: MouseEvent) => setHov(!!(e.target as Element).closest("a,button,[data-hover]"));
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseover", over);
    return () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseover", over); };
  }, [mobile]);
  if (mobile) return null;
  return (
    <>
      <motion.div animate={{ x: pos.x-6, y: pos.y-6 }} transition={{ type:"spring", stiffness:800, damping:40 }}
        style={{ position:"fixed", width:12, height:12, borderRadius:"50%", background:C.cyan, pointerEvents:"none", zIndex:9999, mixBlendMode:"screen" }} />
      <motion.div animate={{ x: pos.x-20, y: pos.y-20, scale: hov ? 1.8 : 1 }} transition={{ type:"spring", stiffness:200, damping:30 }}
        style={{ position:"fixed", width:40, height:40, borderRadius:"50%", border:`1px solid ${C.blue}`, pointerEvents:"none", zIndex:9998, opacity:0.5 }} />
    </>
  );
};

// ── NEURAL CANVAS ─────────────────────────────────────────────────────────────
const NeuralCanvas: FC = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let w = 0, h = 0, raf = 0;
    type Node = { x:number; y:number; vx:number; vy:number; r:number; hue:string };
    let nodes: Node[] = [];
    const init = () => {
      w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight;
      const count = window.innerWidth < 768 ? 40 : 80;
      nodes = Array.from({ length: count }, () => ({
        x: Math.random()*w, y: Math.random()*h,
        vx: (Math.random()-0.5)*0.4, vy: (Math.random()-0.5)*0.4,
        r: Math.random()*2+1, hue: Math.random()>0.5 ? "14,165,233" : "168,85,247",
      }));
    };
    const draw = () => {
      ctx.clearRect(0,0,w,h);
      nodes.forEach(n => { n.x+=n.vx; n.y+=n.vy; if(n.x<0||n.x>w) n.vx*=-1; if(n.y<0||n.y>h) n.vy*=-1; });
      for (let i=0; i<nodes.length; i++) for (let j=i+1; j<nodes.length; j++) {
        const dx=nodes[i].x-nodes[j].x, dy=nodes[i].y-nodes[j].y, dist=Math.sqrt(dx*dx+dy*dy);
        if (dist<150) { ctx.beginPath(); ctx.moveTo(nodes[i].x,nodes[i].y); ctx.lineTo(nodes[j].x,nodes[j].y); ctx.strokeStyle=`rgba(${nodes[i].hue},${(1-dist/150)*0.25})`; ctx.lineWidth=0.5; ctx.stroke(); }
      }
      nodes.forEach(n => { ctx.beginPath(); ctx.arc(n.x,n.y,n.r,0,Math.PI*2); ctx.fillStyle=`rgba(${n.hue},0.8)`; ctx.shadowBlur=6; ctx.shadowColor=`rgba(${n.hue},0.6)`; ctx.fill(); ctx.shadowBlur=0; });
      raf = requestAnimationFrame(draw);
    };
    init(); draw();
    window.addEventListener("resize", init);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", init); };
  }, []);
  return <canvas ref={ref} style={{ position:"fixed", inset:0, zIndex:0, opacity:0.5, pointerEvents:"none" }} />;
};

// ── AMBIENT LIGHTS ────────────────────────────────────────────────────────────
const AmbientLights: FC = () => (
  <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0 }}>
    <motion.div animate={{ x:[0,100,0], y:[0,-80,0] }} transition={{ duration:20, repeat:Infinity, ease:"easeInOut" }}
      style={{ position:"absolute", top:"10%", left:"5%", width:"min(600px,80vw)", height:"min(600px,80vw)", borderRadius:"50%", background:"radial-gradient(circle, rgba(14,165,233,0.07) 0%, transparent 70%)", filter:"blur(60px)" }} />
    <motion.div animate={{ x:[0,-80,0], y:[0,60,0] }} transition={{ duration:25, repeat:Infinity, ease:"easeInOut" }}
      style={{ position:"absolute", top:"50%", right:"5%", width:"min(500px,70vw)", height:"min(500px,70vw)", borderRadius:"50%", background:"radial-gradient(circle, rgba(168,85,247,0.07) 0%, transparent 70%)", filter:"blur(60px)" }} />
  </div>
);

// ── LOADER ────────────────────────────────────────────────────────────────────
const Loader: FC<LoaderProps> = ({ onDone }) => {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setPct(p => { if (p>=100){clearInterval(t);setTimeout(onDone,400);return 100;} return p+2; }), 30);
    return () => clearInterval(t);
  }, [onDone]);
  return (
    <motion.div exit={{ opacity:0 }} transition={{ duration:0.6 }}
      style={{ position:"fixed", inset:0, background:C.bg, zIndex:10000, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <motion.div initial={{ opacity:0, scale:0.8 }} animate={{ opacity:1, scale:1 }} style={{ textAlign:"center", padding:"0 24px" }}>
        <div style={{ width:80, height:80, margin:"0 auto 32px", position:"relative" }}>
          <motion.div animate={{ rotate:360 }} transition={{ duration:2, repeat:Infinity, ease:"linear" }}
            style={{ position:"absolute", inset:0, borderRadius:"50%", border:"2px solid transparent", borderTopColor:C.blue, borderRightColor:C.cyan }} />
          <motion.div animate={{ rotate:-360 }} transition={{ duration:3, repeat:Infinity, ease:"linear" }}
            style={{ position:"absolute", inset:8, borderRadius:"50%", border:"2px solid transparent", borderTopColor:C.purple, borderLeftColor:C.pink }} />
          <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, color:C.cyan }}>AI</div>
        </div>
        <div className="mono" style={{ color:C.blue, fontSize:11, letterSpacing:3, marginBottom:24 }}>INITIALIZING NEURAL INTERFACE</div>
        <div style={{ width:"min(300px,80vw)", height:2, background:"rgba(255,255,255,0.1)", borderRadius:2, overflow:"hidden", margin:"0 auto" }}>
          <motion.div style={{ height:"100%", width:`${pct}%`, background:`linear-gradient(90deg, ${C.violet}, ${C.blue}, ${C.cyan})`, borderRadius:2 }} />
        </div>
        <div className="mono" style={{ color:"rgba(255,255,255,0.4)", fontSize:11, marginTop:12 }}>{pct}%</div>
      </motion.div>
    </motion.div>
  );
};

// ── NAV ───────────────────────────────────────────────────────────────────────
const Nav: FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const mobile = useIsMobile();
  useEffect(() => {
    const s = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", s);
    return () => window.removeEventListener("scroll", s);
  }, []);
  const links = ["About","Skills","Projects","Experience","Contact"];
  const scrollTo = (id: string) => { document.getElementById(id.toLowerCase())?.scrollIntoView({ behavior:"smooth" }); setMenuOpen(false); };
  return (
    <>
      <motion.nav initial={{ y:-80 }} animate={{ y:0 }} transition={{ duration:0.8, delay:0.5 }}
        style={{ position:"fixed", top:0, left:0, right:0, zIndex:1000,
          padding: mobile ? "14px 20px" : "16px 40px",
          display:"flex", alignItems:"center", justifyContent:"space-between",
          background: scrolled||menuOpen ? "rgba(3,7,17,0.92)" : "transparent",
          backdropFilter: scrolled||menuOpen ? "blur(20px)" : "none",
          borderBottom: scrolled||menuOpen ? "1px solid rgba(14,165,233,0.15)" : "none", transition:"all 0.4s" }}>
        <motion.div whileHover={{ scale:1.05 }} style={{ fontSize:18, fontWeight:800, letterSpacing:-0.5, cursor:"pointer" }}
          onClick={() => window.scrollTo({ top:0, behavior:"smooth" })}>
          <span style={{ color:C.cyan }}>T</span><span style={{ color:"#fff" }}>TG</span>
          <span className="mono" style={{ fontSize:10, color:C.blue, marginLeft:8, opacity:0.7 }}>ML.ENG</span>
        </motion.div>

        {!mobile && (
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            {links.map(l => (
              <motion.button key={l} data-hover whileHover={{ color:C.cyan, scale:1.05 }} onClick={() => scrollTo(l)}
                style={{ background:"none", border:"none", color:"rgba(255,255,255,0.6)", fontSize:13, fontFamily:"'Syne',sans-serif", fontWeight:500, cursor:"pointer", padding:"8px 14px", borderRadius:6, letterSpacing:0.5 }}>
                {l}
              </motion.button>
            ))}
            <motion.button data-hover whileHover={{ scale:1.05 }} onClick={() => scrollTo("Contact")}
              style={{ background:`linear-gradient(135deg, ${C.blue}, ${C.purple})`, border:"none", color:"#fff", fontSize:13, fontFamily:"'Syne',sans-serif", fontWeight:600, cursor:"pointer", padding:"8px 20px", borderRadius:20, marginLeft:8 }}>
              Hire Me
            </motion.button>
          </div>
        )}

        {mobile && (
          <button onClick={() => setMenuOpen(o => !o)} aria-label="Menu"
            style={{ background:"none", border:"none", cursor:"pointer", padding:8, display:"flex", flexDirection:"column", gap:5 }}>
            {[0,1,2].map(i => (
              <motion.span key={i}
                animate={{ rotate: menuOpen && i!==1 ? (i===0?45:-45) : 0, y: menuOpen ? (i===0?9:i===2?-9:0) : 0, opacity: menuOpen && i===1 ? 0 : 1 }}
                style={{ display:"block", width:22, height:2, background:"#fff", borderRadius:2, transformOrigin:"center" }} />
            ))}
          </button>
        )}
      </motion.nav>

      <AnimatePresence>
        {mobile && menuOpen && (
          <motion.div initial={{ opacity:0, y:-16 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-16 }} transition={{ duration:0.2 }}
            style={{ position:"fixed", top:56, left:0, right:0, zIndex:999, background:"rgba(3,7,17,0.97)", backdropFilter:"blur(20px)", borderBottom:`1px solid rgba(14,165,233,0.15)`, padding:"12px 0 20px" }}>
            {links.map(l => (
              <button key={l} onClick={() => scrollTo(l)}
                style={{ display:"block", width:"100%", background:"none", border:"none", color:"rgba(255,255,255,0.7)", fontSize:16, fontFamily:"'Syne',sans-serif", fontWeight:600, cursor:"pointer", padding:"14px 24px", textAlign:"left" }}>
                {l}
              </button>
            ))}
            <div style={{ padding:"8px 24px 0" }}>
              <button onClick={() => scrollTo("Contact")}
                style={{ background:`linear-gradient(135deg, ${C.blue}, ${C.purple})`, border:"none", color:"#fff", fontSize:14, fontFamily:"'Syne',sans-serif", fontWeight:600, cursor:"pointer", padding:"12px 24px", borderRadius:20, width:"100%" }}>
                Hire Me
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// ── TYPEWRITER ────────────────────────────────────────────────────────────────
const Typewriter: FC<TypewriterProps> = ({ words, speed=80 }) => {
  const [idx, setIdx] = useState(0);
  const [txt, setTxt] = useState("");
  const [del, setDel] = useState(false);
  useEffect(() => {
    const word = words[idx % words.length];
    const timeout = setTimeout(() => {
      if (!del) { setTxt(word.slice(0,txt.length+1)); if (txt.length+1===word.length) setTimeout(()=>setDel(true),1500); }
      else { setTxt(word.slice(0,txt.length-1)); if (txt.length-1===0){setDel(false);setIdx(i=>i+1);} }
    }, del ? speed/2 : speed);
    return () => clearTimeout(timeout);
  }, [txt,del,idx,words,speed]);
  return <span><span style={{ color:C.cyan }}>{txt}</span><span style={{ animation:"blink 1s step-end infinite", color:C.blue }}>|</span></span>;
};

// ── GLOW BUTTON ───────────────────────────────────────────────────────────────
const GlowBtn: FC<GlowBtnProps> = ({ children, variant="primary", onClick, href, download }) => {
  const base: CSSProperties = { display:"inline-flex", alignItems:"center", gap:8, padding:"12px 22px", borderRadius:40, fontSize:14, fontFamily:"'Syne',sans-serif", fontWeight:600, cursor:"pointer", letterSpacing:0.5, border:"none", textDecoration:"none" };
  const styles: Record<string,CSSProperties> = {
    primary: { background:`linear-gradient(135deg, ${C.violet}, ${C.blue})`, color:"#fff", boxShadow:`0 0 30px rgba(14,165,233,0.3)` },
    outline:  { background:"transparent", color:C.cyan, border:`1px solid ${C.cyan}` },
    ghost:    { background:"rgba(255,255,255,0.05)", color:"rgba(255,255,255,0.8)", border:"1px solid rgba(255,255,255,0.1)" },
  };
  return (
    <motion.div whileHover={{ scale:1.05, y:-2 }} whileTap={{ scale:0.97 }} style={{ display:"inline-block" }}>
      {href
        ? <a href={href} download={download} style={{ ...base, ...styles[variant] }}>{children}</a>
        : <button onClick={onClick} style={{ ...base, ...styles[variant] }}>{children}</button>}
    </motion.div>
  );
};

// ── SECTION ───────────────────────────────────────────────────────────────────
const Section: FC<SectionProps> = ({ id, children, style }) => {
  const mobile = useIsMobile();
  return (
    <motion.section id={id} initial={{ opacity:0, y:60 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true, margin:"-60px" }} transition={{ duration:0.8 }}
      style={{ position:"relative", zIndex:2, padding: mobile ? "72px 20px" : "120px 40px", maxWidth:1200, margin:"0 auto", ...style }}>
      {children}
    </motion.section>
  );
};

const SectionLabel: FC<SectionLabelProps> = ({ label }) => (
  <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
    <div className="mono" style={{ color:C.blue, fontSize:11, letterSpacing:3, textTransform:"uppercase", whiteSpace:"nowrap" }}>// {label}</div>
    <div style={{ flex:1, height:1, background:`linear-gradient(90deg, ${C.blue}, transparent)` }} />
  </div>
);

// ── SCROLL PROGRESS ───────────────────────────────────────────────────────────
const ScrollProgress: FC = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness:100, damping:30 });
  return <motion.div style={{ position:"fixed", top:0, left:0, right:0, height:2, background:`linear-gradient(90deg, ${C.violet}, ${C.blue}, ${C.cyan})`, scaleX, transformOrigin:"0%", zIndex:9997 }} />;
};

// ── HERO ──────────────────────────────────────────────────────────────────────
const Hero: FC = () => {
  const mobile = useIsMobile();
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0,500], [0, mobile ? 60 : 150]);
  const opacity = useTransform(scrollY, [0,400], [1,0]);
  const roles = ["Machine Learning Engineer","Deep Learning Researcher","MLOps Architect","AI Systems Builder","Computer Vision Expert"];
  return (
    <motion.div style={{ y, opacity, position:"relative", zIndex:2, minHeight:"100vh", display:"flex", alignItems:"center", paddingTop: mobile ? 80 : 100 }}>
      <div style={{ maxWidth:1200, margin:"0 auto", padding: mobile ? "0 20px" : "0 40px", width:"100%" }}>
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.8 }}>
          {!mobile && (
            <div className="mono" style={{ color:C.blue, fontSize:12, letterSpacing:4, marginBottom:24 }}>
              <span style={{ color:C.purple }}>const</span> engineer = <span style={{ color:C.cyan }}>"ready"</span>;
            </div>
          )}
          <h1 style={{ fontSize: mobile ? "clamp(36px,10vw,52px)" : "clamp(42px,7vw,88px)", fontWeight:800, lineHeight:1.05, letterSpacing: mobile ? -0.5 : -2, marginBottom:16 }}>
            <motion.span initial={{ opacity:0, x:-40 }} animate={{ opacity:1, x:0 }} transition={{ delay:1 }}
              style={{ display:"block", background:`linear-gradient(135deg, #fff 30%, ${C.blue})`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
              Tedla Tesfaye
            </motion.span>
            <motion.span initial={{ opacity:0, x:-40 }} animate={{ opacity:1, x:0 }} transition={{ delay:1.2 }}
              style={{ display:"block", background:`linear-gradient(135deg, ${C.cyan}, ${C.purple})`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
              Godebo
            </motion.span>
          </h1>
          <div style={{ fontSize: mobile ? 15 : "clamp(16px,2.5vw,22px)", marginBottom:18, fontWeight:500, minHeight:28 }}>
            <Typewriter words={roles} />
          </div>
          <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:1.5 }}
            style={{ fontSize: mobile ? 14 : 16, lineHeight:1.8, color:"rgba(255,255,255,0.55)", maxWidth:560, marginBottom:32 }}>
            Building intelligent systems, scalable machine learning solutions, and AI-powered experiences that bridge research and real-world impact.
          </motion.p>
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:1.7 }}
            style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
            <GlowBtn href="#" download="Tedla_Tesfaye_Resume.pdf">⬇ Resume</GlowBtn>
            <GlowBtn variant="outline" onClick={() => document.getElementById("projects")?.scrollIntoView({ behavior:"smooth" })}>Projects →</GlowBtn>
            <GlowBtn variant="ghost"   onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior:"smooth" })}>Contact</GlowBtn>
          </motion.div>
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:2 }}
            style={{ display:"flex", gap:16, marginTop:32, flexWrap:"wrap" }}>
            {([ ["GitHub","https://github.com/yourusername"], ["LinkedIn","https://linkedin.com/in/yourusername"], ["Email","mailto:tedla@example.com"] ] as [string,string][]).map(([label,href]) => (
              <motion.a key={label} href={href} data-hover whileHover={{ y:-3, color:C.cyan }}
                style={{ color:"rgba(255,255,255,0.4)", fontSize:13, textDecoration:"none", fontWeight:500, display:"flex", alignItems:"center", gap:6 }}>
                <span style={{ width:6, height:6, borderRadius:"50%", background:C.blue, display:"inline-block", flexShrink:0 }} />{label}
              </motion.a>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
};

// ── AI STATS ──────────────────────────────────────────────────────────────────
const CountUp: FC<CountUpProps> = ({ end, suffix }) => {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        let start = 0;
        const step = () => { start += Math.ceil(end/40); if (start>=end){setVal(end);return;} setVal(start); requestAnimationFrame(step); };
        requestAnimationFrame(step); obs.disconnect();
      }
    }, { threshold:0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [end]);
  return <div ref={ref} style={{ fontSize:32, fontWeight:800, background:`linear-gradient(135deg, ${C.cyan}, ${C.purple})`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>{val}{suffix}</div>;
};

const AIStats: FC = () => {
  const stats: StatItem[] = [
    { val:50, suffix:"+",  label:"ML Models"   },
    { val:10, suffix:"M+", label:"Data Points" },
    { val:98, suffix:"%",  label:"Best Accuracy"},
    { val:7,  suffix:"",   label:"Projects"    },
    { val:15, suffix:"+",  label:"Papers"      },
    { val:3,  suffix:"+",  label:"Years"       },
  ];
  return (
    <div style={{ position:"relative", zIndex:2, padding:"56px 20px", background:"linear-gradient(135deg, rgba(14,165,233,0.05), rgba(168,85,247,0.05))", borderTop:"1px solid rgba(14,165,233,0.1)", borderBottom:"1px solid rgba(168,85,247,0.1)" }}>
      <div style={{ maxWidth:1200, margin:"0 auto", display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:"24px 16px", textAlign:"center" }}>
        {stats.map((s,i) => (
          <motion.div key={s.label} initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ delay:i*0.08 }}>
            <CountUp end={s.val} suffix={s.suffix} />
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginTop:4 }}>{s.label}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// ── ABOUT ─────────────────────────────────────────────────────────────────────
const About: FC = () => {
  const mobile = useIsMobile();
  const stats = [{ n:"50+", l:"ML Projects" },{ n:"3+", l:"Years Exp" },{ n:"15+", l:"Technologies" },{ n:"∞", l:"Curiosity" }];
  return (
    <Section id="about">
      <SectionLabel label="About Me" />
      <div style={{ display:"grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: mobile ? 36 : 80 }}>
        <div>
          <h2 style={{ fontSize: mobile ? 26 : 40, fontWeight:800, marginBottom:18, lineHeight:1.15 }}>
            Bridging Research{" "}
            <span style={{ background:`linear-gradient(135deg, ${C.cyan}, ${C.purple})`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>& Reality</span>
          </h2>
          <p style={{ color:"rgba(255,255,255,0.6)", lineHeight:1.85, fontSize:14, marginBottom:14 }}>
            I'm a Machine Learning Engineer with a deep passion for building production-ready AI systems that solve real-world problems at scale. My work spans deep learning, computer vision, NLP, recommendation systems, and predictive analytics.
          </p>
          <p style={{ color:"rgba(255,255,255,0.6)", lineHeight:1.85, fontSize:14, marginBottom:14 }}>
            With a foundation in software engineering and frontend development, I bring a full-stack perspective to AI: from exploratory data science and model development to cloud deployment, MLOps automation, and scalable infrastructure.
          </p>
          <p style={{ color:"rgba(255,255,255,0.6)", lineHeight:1.85, fontSize:14 }}>
            I approach every project with a research mindset — reading papers, experimenting relentlessly, and engineering systems that are not just accurate, but robust, interpretable, and maintainable.
          </p>
        </div>
        <div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:20 }}>
            {stats.map(s => (
              <motion.div key={s.l} whileHover={{ scale:1.04 }}
                style={{ padding:"18px 14px", borderRadius:14, border:"1px solid rgba(14,165,233,0.2)", background:"rgba(14,165,233,0.04)", textAlign:"center" }}>
                <div style={{ fontSize:28, fontWeight:800, background:`linear-gradient(135deg, ${C.cyan}, ${C.purple})`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>{s.n}</div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginTop:4 }}>{s.l}</div>
              </motion.div>
            ))}
          </div>
          <div style={{ padding:mobile ? 16 : 22, borderRadius:14, background:`linear-gradient(135deg, rgba(124,58,237,0.15), rgba(14,165,233,0.15))`, border:"1px solid rgba(168,85,247,0.2)" }}>
            <div className="mono" style={{ fontSize:11, color:C.purple, marginBottom:10 }}>// research_interests</div>
            {["Deep Learning & Neural Architecture Search","Computer Vision & Multimodal AI","Large Language Models & RAG Systems","MLOps & Production AI Systems","Reinforcement Learning"].map(r => (
              <div key={r} style={{ display:"flex", alignItems:"flex-start", gap:8, marginBottom:8, color:"rgba(255,255,255,0.7)", fontSize:13, lineHeight:1.5 }}>
                <span style={{ color:C.cyan, flexShrink:0, marginTop:1 }}>▹</span>{r}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
};

// ── SKILLS ────────────────────────────────────────────────────────────────────
const TECH: TechMap = {
  "Languages":    ["Python","SQL","JavaScript","TypeScript","C++","Bash"],
  "ML / DL":      ["PyTorch","TensorFlow","Scikit-learn","Keras","XGBoost","LightGBM","Hugging Face","OpenCV","spaCy","NLTK"],
  "Data Science": ["Pandas","NumPy","Matplotlib","Plotly","Seaborn","Jupyter","Apache Spark"],
  "MLOps":        ["Docker","Kubernetes","MLflow","FastAPI","Flask","Streamlit","Airflow","CI/CD"],
  "Cloud":        ["AWS","Google Cloud","Azure","Firebase","Linux","GitHub Actions"],
  "Databases":    ["PostgreSQL","MongoDB","MySQL","Redis"],
  "Frontend":     ["React","Next.js","Node.js","Tailwind CSS"],
  "Tools":        ["Git","GitHub","VS Code","Postman","Figma"],
};

const Skills: FC = () => {
  const [active, setActive] = useState("ML / DL");
  const mobile = useIsMobile();
  return (
    <Section id="skills">
      <SectionLabel label="Tech Stack" />
      <h2 style={{ fontSize: mobile ? 26 : 40, fontWeight:800, marginBottom: mobile ? 24 : 44 }}>
        Arsenal of{" "}
        <span style={{ background:`linear-gradient(135deg, ${C.cyan}, ${C.purple})`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>Technologies</span>
      </h2>
      <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:28 }}>
        {Object.keys(TECH).map(cat => (
          <motion.button key={cat} data-hover onClick={() => setActive(cat)} whileTap={{ scale:0.96 }}
            style={{ padding: mobile ? "6px 12px" : "8px 18px", borderRadius:20,
              border:`1px solid ${active===cat ? C.blue : "rgba(255,255,255,0.12)"}`,
              background: active===cat ? "rgba(14,165,233,0.15)" : "transparent",
              color: active===cat ? C.cyan : "rgba(255,255,255,0.5)",
              fontSize: mobile ? 11 : 13, fontFamily:"'Syne',sans-serif", cursor:"pointer", fontWeight:500 }}>
            {cat}
          </motion.button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={active} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }} transition={{ duration:0.25 }}
          style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
          {(TECH[active] ?? []).map((tech: string, i: number) => (
            <motion.div key={tech} initial={{ opacity:0, scale:0.8 }} animate={{ opacity:1, scale:1 }} transition={{ delay:i*0.04 }}
              whileHover={{ scale:1.08, y:-3 }} data-hover
              style={{ padding: mobile ? "8px 14px" : "10px 20px", borderRadius:40, background:"rgba(14,165,233,0.07)", border:"1px solid rgba(14,165,233,0.25)", color:"#e2e8f0", fontSize: mobile ? 12 : 13, fontWeight:500 }}>
              {tech}
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>
    </Section>
  );
};

// ── PROJECTS ──────────────────────────────────────────────────────────────────
const PROJECTS: Project[] = [
  { title:"World Cup Prediction",        desc:"An end-to-end machine learning system that predicts World Cup 2026 match outcomes using a stacked ensemble of Poisson, XGBoost, and neural network models trained on 139 engineered features — from team form and ELO ratings to venue altitude and travel fatigue — served through a live API and dashboard.",  tech:["Python","FastAPI","scikit-learn","Pandas","XGBoost", "PyTorch", "SciPy", "SQLite", "Docker", "Railway"],       gh:"https://github.com/Teddy-2004/world-cup_predictor.git",      demo:"https://wc2026-predictor-production-714b.up.railway.app/", color:C.blue,   emoji:"📈" },
  { title:"Intelligent Recommendation Engine", desc:"Scalable recommendation system using collaborative filtering, matrix factorization, and deep learning ranking models via FastAPI.",   tech:["PyTorch","FastAPI","PostgreSQL","Redis"],                gh:"https://github.com/yourusername/recommendation-engine", demo:"https://your-demo-link.com", color:C.purple, emoji:"🎯" },
  { title:"Real-Time Object Detection",        desc:"Computer vision system detecting and tracking objects in real-time using YOLOv8 and OpenCV, achieving 60 FPS on edge hardware.",      tech:["YOLOv8","OpenCV","Python","CUDA"],                       gh:"https://github.com/yourusername/object-detection",      demo:"https://your-demo-link.com", color:C.cyan,   emoji:"👁️" },
  { title:"NLP Resume Screening AI",           desc:"Transformer-based NLP system ranking resumes via semantic similarity and fine-tuned BERT embeddings with explainable scoring.",       tech:["Transformers","Hugging Face","FastAPI","spaCy"],         gh:"https://github.com/yourusername/resume-screening-ai",   demo:"https://your-demo-link.com", color:C.pink,   emoji:"📄" },
  { title:"RAG Chatbot Architecture",          desc:"Production-grade AI chatbot using Retrieval-Augmented Generation, Pinecone vector database, and OpenAI GPT pipelines.",               tech:["LangChain","Pinecone","OpenAI API","FastAPI"],           gh:"https://github.com/yourusername/rag-chatbot",           demo:"https://your-demo-link.com", color:C.violet, emoji:"🤖" },
  { title:"Predictive Analytics Dashboard",    desc:"Enterprise analytics platform for forecasting trends, anomaly detection, and automated insight generation with Plotly visuals.",      tech:["Python","Plotly","Streamlit","Pandas"],                  gh:"https://github.com/yourusername/predictive-dashboard",  demo:"https://your-demo-link.com", color:C.blue,   emoji:"📊" },
  { title:"MLOps Pipeline Platform",           desc:"Full ML lifecycle platform with automated training, deployment, A/B testing, monitoring, and CI/CD automation on Kubernetes + AWS.",  tech:["Docker","Kubernetes","MLflow","AWS","Airflow"],          gh:"https://github.com/yourusername/mlops-platform",        demo:"https://your-demo-link.com", color:C.purple, emoji:"⚙️" },
];

const ProjectCard: FC<ProjectCardProps> = ({ p, i }) => {
  const [hov, setHov] = useState(false);
  return (
    <motion.div initial={{ opacity:0, y:40 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ delay:i*0.07, duration:0.5 }}
      onHoverStart={() => setHov(true)} onHoverEnd={() => setHov(false)} data-hover
      style={{ borderRadius:18, border:`1px solid ${hov ? p.color : "rgba(255,255,255,0.08)"}`,
        background: hov ? `${p.color}0d` : "rgba(255,255,255,0.02)",
        padding:22, position:"relative", overflow:"hidden", transition:"all 0.35s",
        boxShadow: hov ? `0 0 40px ${p.color}1a` : "none" }}>
      <motion.div animate={{ opacity: hov ? 1 : 0 }} style={{ position:"absolute", top:0, left:0, right:0, height:2, background:`linear-gradient(90deg, transparent, ${p.color}, transparent)` }} />
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
        <div style={{ width:34, height:34, borderRadius:8, background:`${p.color}22`, border:`1px solid ${p.color}44`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, flexShrink:0 }}>
          {p.emoji}
        </div>
        <div style={{ display:"flex", gap:6 }}>
          <motion.a href={p.gh} target="_blank" rel="noreferrer" whileHover={{ scale:1.1 }}
            style={{ fontSize:11, color:"rgba(255,255,255,0.4)", textDecoration:"none", padding:"4px 10px", borderRadius:20, border:"1px solid rgba(255,255,255,0.1)", fontWeight:500 }}>GH</motion.a>
          <motion.a href={p.demo} target="_blank" rel="noreferrer" whileHover={{ scale:1.1 }}
            style={{ fontSize:11, color:"rgba(255,255,255,0.4)", textDecoration:"none", padding:"4px 10px", borderRadius:20, border:"1px solid rgba(255,255,255,0.1)", fontWeight:500 }}>↗</motion.a>
        </div>
      </div>
      <h3 style={{ fontSize:15, fontWeight:700, marginBottom:7, color:"#fff", lineHeight:1.3 }}>{p.title}</h3>
      <p style={{ fontSize:13, color:"rgba(255,255,255,0.5)", lineHeight:1.65, marginBottom:14 }}>{p.desc}</p>
      <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
        {p.tech.map(t => (
          <span key={t} style={{ fontSize:10, padding:"3px 9px", borderRadius:20, background:`${p.color}15`, border:`1px solid ${p.color}30`, color:p.color, fontWeight:600 }}>{t}</span>
        ))}
      </div>
    </motion.div>
  );
};

const Projects: FC = () => {
  const mobile = useIsMobile();
  return (
    <Section id="projects">
      <SectionLabel label="Projects" />
      <h2 style={{ fontSize: mobile ? 26 : 40, fontWeight:800, marginBottom:10 }}>
        Flagship{" "}
        <span style={{ background:`linear-gradient(135deg, ${C.cyan}, ${C.purple})`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>AI Systems</span>
      </h2>
      <p style={{ color:"rgba(255,255,255,0.4)", fontSize:13, marginBottom: mobile ? 28 : 48 }}>Production-grade systems built with research-first thinking.</p>
      <div style={{ display:"grid", gridTemplateColumns: mobile ? "1fr" : "repeat(auto-fit, minmax(300px, 1fr))", gap:14 }}>
        {PROJECTS.map((p,i) => <ProjectCard key={p.title} p={p} i={i} />)}
      </div>
    </Section>
  );
};

// ── EXPERIENCE ────────────────────────────────────────────────────────────────
const EXP: ExpItem[] = [
  { role:"Machine Learning Engineer", co:"AI Research Lab",  period:"2023 – Present", desc:"Designed and deployed scalable ML pipelines processing millions of records daily. Built transformer-based NLP models and computer vision systems. Led MLOps initiatives on AWS with Kubernetes orchestration.", color:C.blue },
  { role:"Data Scientist",            co:"Tech Startup",     period:"2022 – 2023",    desc:"Developed predictive analytics models for customer behavior and churn prediction. Built real-time recommendation engine serving 100k+ users with sub-100ms latency.", color:C.purple },
  { role:"Software Engineer",         co:"Software Company", period:"2021 – 2022",    desc:"Built data-driven web applications and APIs. Introduced ML-driven features to improve user engagement. Developed React dashboards for business intelligence.", color:C.cyan },
];

const Experience: FC = () => {
  const mobile = useIsMobile();
  return (
    <Section id="experience">
      <SectionLabel label="Experience" />
      <h2 style={{ fontSize: mobile ? 26 : 40, fontWeight:800, marginBottom: mobile ? 28 : 52 }}>
        Career{" "}
        <span style={{ background:`linear-gradient(135deg, ${C.cyan}, ${C.purple})`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>Timeline</span>
      </h2>
      <div style={{ position:"relative" }}>
        <div style={{ position:"absolute", left:14, top:0, bottom:0, width:1, background:`linear-gradient(180deg, ${C.blue}, ${C.purple}, transparent)` }} />
        {EXP.map((e,i) => (
          <motion.div key={e.role} initial={{ opacity:0, x:24 }} whileInView={{ opacity:1, x:0 }} viewport={{ once:true }} transition={{ delay:i*0.15 }}
            style={{ paddingLeft: mobile ? 40 : 56, paddingBottom:36, position:"relative" }}>
            <div style={{ position:"absolute", left:8, top:6, width:12, height:12, borderRadius:"50%", background:e.color, boxShadow:`0 0 12px ${e.color}` }} />
            <div className="mono" style={{ fontSize:10, color:e.color, letterSpacing:2, marginBottom:5 }}>{e.period}</div>
            <h3 style={{ fontSize: mobile ? 16 : 19, fontWeight:700, marginBottom:2 }}>{e.role}</h3>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)", marginBottom:8 }}>{e.co}</div>
            <p style={{ fontSize: mobile ? 13 : 14, color:"rgba(255,255,255,0.55)", lineHeight:1.7 }}>{e.desc}</p>
          </motion.div>
        ))}
      </div>
    </Section>
  );
};

// ── CERTIFICATIONS ────────────────────────────────────────────────────────────
const CERTS: Cert[] = [
  { name:"TensorFlow Developer Certificate", org:"Google",                     year:2023 },
  { name:"AWS Machine Learning Specialty",   org:"Amazon Web Services",        year:2023 },
  { name:"Deep Learning Specialization",     org:"Coursera / DeepLearning.AI", year:2022 },
  { name:"Professional ML Engineer",         org:"Google Cloud",               year:2022 },
  { name:"MLOps Specialization",             org:"Coursera / DeepLearning.AI", year:2023 },
];

const Certifications: FC = () => {
  const mobile = useIsMobile();
  return (
    <Section id="certifications">
      <SectionLabel label="Certifications" />
      <h2 style={{ fontSize: mobile ? 26 : 40, fontWeight:800, marginBottom: mobile ? 20 : 36 }}>
        Credentials &{" "}
        <span style={{ background:`linear-gradient(135deg, ${C.cyan}, ${C.purple})`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>Recognition</span>
      </h2>
      <div style={{ display:"grid", gridTemplateColumns: mobile ? "1fr" : "repeat(auto-fit, minmax(240px, 1fr))", gap:12 }}>
        {CERTS.map((c,i) => (
          <motion.div key={c.name} initial={{ opacity:0, y:16 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ delay:i*0.08 }}
            whileHover={{ scale:1.02 }}
            style={{ padding:"16px 18px", borderRadius:14, border:"1px solid rgba(14,165,233,0.15)", background:"rgba(14,165,233,0.03)" }}>
            <div className="mono" style={{ fontSize:10, color:C.blue, marginBottom:6, letterSpacing:2 }}>{c.year}</div>
            <div style={{ fontSize:13, fontWeight:700, marginBottom:4, lineHeight:1.4 }}>{c.name}</div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)" }}>{c.org}</div>
          </motion.div>
        ))}
      </div>
    </Section>
  );
};

// ── CONTACT ───────────────────────────────────────────────────────────────────
const Contact: FC = () => {
  const mobile = useIsMobile();
  const [form, setForm] = useState({ name:"", email:"", msg:"" });
  const [sent, setSent] = useState(false);
  const submit = (e: React.FormEvent) => { e.preventDefault(); setSent(true); setTimeout(()=>setSent(false),3000); setForm({ name:"", email:"", msg:"" }); };
  const inputStyle: CSSProperties = { width:"100%", padding:"13px 16px", borderRadius:12, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(14,165,233,0.2)", color:"#fff", fontSize:14, fontFamily:"'Syne',sans-serif", outline:"none", transition:"border-color 0.3s, box-shadow 0.3s" };
  return (
    <Section id="contact">
      <SectionLabel label="Contact" />
      <div style={{ display:"grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: mobile ? 28 : 72 }}>
        <div>
          <h2 style={{ fontSize: mobile ? 26 : 40, fontWeight:800, marginBottom:16, lineHeight:1.1 }}>
            Let's Build{" "}
            <span style={{ background:`linear-gradient(135deg, ${C.cyan}, ${C.purple})`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>Something</span>
          </h2>
          <p style={{ color:"rgba(255,255,255,0.5)", fontSize:14, lineHeight:1.8, marginBottom:24 }}>
            Open to full-time ML engineering roles, AI research collaborations, and exciting projects at the frontier of intelligence.
          </p>
          {["✉  tedla@example.com","🔗  linkedin.com/in/yourusername","⌨  github.com/yourusername"].map(line => (
            <div key={line} style={{ color:"rgba(255,255,255,0.6)", fontSize:13, marginBottom:12 }}>{line}</div>
          ))}
        </div>
        <form onSubmit={submit} style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {(["name","email"] as const).map(key => (
            <input key={key} type={key==="email"?"email":"text"} placeholder={key.charAt(0).toUpperCase()+key.slice(1)}
              value={form[key]} onChange={e => setForm(f=>({...f,[key]:e.target.value}))} required style={inputStyle} />
          ))}
          <textarea placeholder="Message" value={form.msg} rows={5}
            onChange={e => setForm(f=>({...f,msg:e.target.value}))} required style={{ ...inputStyle, resize:"vertical" }} />
          <motion.button type="submit" data-hover whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
            style={{ padding:"14px 28px", borderRadius:40, background:`linear-gradient(135deg, ${C.violet}, ${C.blue})`, border:"none", color:"#fff", fontSize:14, fontFamily:"'Syne',sans-serif", fontWeight:600, cursor:"pointer" }}>
            {sent ? "✓ Message Sent!" : "Send Message →"}
          </motion.button>
        </form>
      </div>
    </Section>
  );
};

// ── FOOTER ────────────────────────────────────────────────────────────────────
const Footer: FC = () => {
  const mobile = useIsMobile();
  return (
    <footer style={{ position:"relative", zIndex:2, borderTop:"1px solid rgba(14,165,233,0.1)", padding: mobile ? "24px 20px" : "32px 40px",
      display:"flex", flexDirection: mobile ? "column" : "row", justifyContent:"space-between", alignItems:"center", gap:14, textAlign:"center" }}>
      <div className="mono" style={{ color:"rgba(255,255,255,0.3)", fontSize:11 }}>© 2024 Tedla Tesfaye Godebo — Built with intelligence</div>
      <div style={{ display:"flex", gap:20 }}>
        {(["GitHub","LinkedIn","Email"] as const).map(s => (
          <motion.a key={s} href="#" data-hover whileHover={{ color:C.cyan, y:-2 }}
            style={{ color:"rgba(255,255,255,0.3)", fontSize:12, textDecoration:"none", fontWeight:500 }}>{s}</motion.a>
        ))}
      </div>
    </footer>
  );
};

// ── ROOT ──────────────────────────────────────────────────────────────────────
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