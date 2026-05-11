"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, CheckCircle, Shield, Zap, MessageSquare, ArrowRight, Play, Layout } from 'lucide-react';

const COLORS = {
  orange: '#FF4F00',
  dark: '#0A0A0A',
  gray: '#1A1A1A',
  lightGray: '#2A2A2A',
  text: '#FFFFFF',
  textSecondary: '#A0A0A0',
};

const SLIDES = [
  {
    id: 1,
    type: 'cover',
    title: 'AGENTHELM',
    subtitle: 'The Future of Agentic Governance',
    tagline: 'STOP UNPREDICTABLE AGENT BEHAVIOR',
    image: '/agenthelm_cover_1777099941437.png',
    accent: COLORS.orange,
  },
  {
    id: 2,
    type: 'pain',
    title: 'Agentic Chaos?',
    body: 'Unpredictable agents lead to unpredictable outcomes. Most developers lose control the moment their agent hits production.',
    stat: '84%',
    statLabel: 'of AI agents fail due to lack of constraints',
    image: '/agent_chaos_vs_order_1777099955783.png',
  },
  {
    id: 3,
    type: 'skill',
    skill: 'Brainstorming',
    title: 'We Ask, Then Build.',
    body: 'Our Socratic Questioning protocol forces clarity before execution. We identify blockers before they become bugs.',
    icon: <MessageSquare className="w-8 h-8 text-[#FF4F00]" />,
    image: '/socratic_brainstorming_1777099973138.png',
  },
  {
    id: 4,
    type: 'skill',
    skill: 'Plan-Writing',
    title: 'Deterministic Execution.',
    body: 'Task breakdowns are small, focused, and independently verifiable. No more black box "working..." loops.',
    icon: <Layout className="w-8 h-8 text-[#FF4F00]" />,
    image: '/plan_writing_checklist_visual_1777099989869.png',
  },
  {
    id: 5,
    type: 'moat',
    title: 'Building with a Moat',
    features: [
      'Safety Guards by Default',
      'Real-time Observability',
      'Human-in-the-Loop Approval',
      'State Checkpointing'
    ],
    image: '/agenthelm_moat_security_1777100006182.png',
  },
  {
    id: 6,
    type: 'social-proof',
    title: 'Trusted by Builders',
    body: 'AgentHelm is the backbone for high-stakes agentic workflows in finance, healthcare, and infrastructure.',
    quote: '"Finally, a framework that treats agents like production software, not just prompt loops."',
    author: 'Senior Architect @ TechGlobal',
  },
  {
    id: 7,
    type: 'setup',
    title: 'Live in < 5 Minutes',
    steps: [
      { id: '01', text: 'npx create-agenthelm-app' },
      { id: '02', text: 'Configure Safety Guards' },
      { id: '03', text: 'Deploy with Confidence' }
    ],
    cta: 'Get Started for Free',
  },
  {
    id: 8,
    type: 'cta',
    title: 'Ready to Helm your Agents?',
    body: 'Join the next generation of agentic developers.',
    handle: '@agenthelm',
    url: 'agenthelm.dev',
  }
];

export default function InstagramCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % SLIDES.length);
  const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#050505] font-sans p-4 relative overflow-hidden">
      
      {/* Background Animated Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#FF4F00]/5 rounded-full blur-[120px] animate-pulse pointer-events-none" />

      {/* IG Layout Frame */}
      <div className="relative w-full max-w-[500px] aspect-[4/5] bg-black shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden rounded-[2.5rem] border border-[#222] group/carousel">
        
        {/* Grain Overlay */}
        <div className="absolute inset-0 z-50 pointer-events-none opacity-[0.03] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

        {/* Carousel Content */}
        <div className="absolute inset-0 z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 flex flex-col"
            >
              <SlideContent slide={SLIDES[currentIndex]} />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation Overlay */}
        <div className="absolute inset-y-0 left-0 w-24 z-40 flex items-center justify-start pl-4 cursor-pointer group/nav" onClick={prevSlide}>
          <div className="p-3 rounded-full bg-black/40 backdrop-blur-md opacity-0 group-hover/nav:opacity-100 transition-all border border-white/10 -translate-x-4 group-hover/nav:translate-x-0">
            <ChevronLeft className="text-white w-6 h-6" />
          </div>
        </div>
        <div className="absolute inset-y-0 right-0 w-24 z-40 flex items-center justify-end pr-4 cursor-pointer group/nav" onClick={nextSlide}>
          <div className="p-3 rounded-full bg-black/40 backdrop-blur-md opacity-0 group-hover/nav:opacity-100 transition-all border border-white/10 translate-x-4 group-hover/nav:translate-x-0">
            <ChevronRight className="text-white w-6 h-6" />
          </div>
        </div>

        {/* Indicators */}
        <div className="absolute bottom-8 left-0 right-0 z-40 flex justify-center gap-2 px-4 pointer-events-none">
          {SLIDES.map((_, i) => (
            <motion.div 
              key={i} 
              animate={{ 
                width: i === currentIndex ? 32 : 8,
                backgroundColor: i === currentIndex ? COLORS.orange : 'rgba(255,255,255,0.2)'
              }}
              className="h-1.5 rounded-full"
            />
          ))}
        </div>
      </div>

      <div className="mt-8 text-center text-zinc-500 text-sm max-w-[400px]">
        <p className="font-medium text-zinc-400 mb-2">Instagram Content Playbook Strategy</p>
        <p>Swipe through to see the 8-slide sequence designed for conversion and growth.</p>
      </div>
    </div>
  );
}

interface Slide {
  id: number;
  type: string;
  title: string;
  subtitle?: string;
  tagline?: string;
  image?: string;
  accent?: string;
  body?: string;
  stat?: string;
  statLabel?: string;
  skill?: string;
  icon?: React.ReactNode;
  features?: string[];
  quote?: string;
  author?: string;
  steps?: { id: string; text: string }[];
  cta?: string;
  handle?: string;
  url?: string;
}

function SlideContent({ slide }: { slide: Slide }) {
  switch (slide.type) {
    case 'cover':
      return (
        <div className="relative h-full w-full flex flex-col justify-end p-12 overflow-hidden">
          <motion.img 
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.6 }}
            src={slide.image} 
            className="absolute inset-0 object-cover w-full h-full" 
            alt="cover" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
          <div className="relative z-10">
            <motion.div 
               initial={{ y: 20, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               transition={{ delay: 0.3 }}
               className="text-[#FF4F00] font-bold text-sm tracking-[0.4em] mb-4 drop-shadow-lg"
            >
              {slide.tagline}
            </motion.div>
            <motion.h1 
               initial={{ y: 20, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               transition={{ delay: 0.4 }}
               className="text-white text-7xl font-black italic tracking-tighter leading-[0.85] mb-6 uppercase"
            >
              {slide.title}
            </motion.h1>
            <motion.p 
               initial={{ y: 20, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               transition={{ delay: 0.5 }}
               className="text-zinc-400 text-2xl font-light max-w-[90%] leading-tight"
            >
              {slide.subtitle}
            </motion.p>
          </div>
        </div>
      );
    
    case 'pain':
      return (
        <div className="relative h-full w-full flex flex-col p-12 bg-black">
          <div className="flex-1 relative mb-10">
            <motion.img 
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              src={slide.image} 
              className="w-full h-full object-cover rounded-[2rem] opacity-60 grayscale hover:grayscale-0 transition-all duration-700" 
              alt="chaos" 
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', damping: 12 }}
                className="text-center p-8 rounded-full bg-black/40 backdrop-blur-xl border border-[#FF4F00]/30 shadow-[0_0_50px_rgba(255,79,0,0.2)]"
              >
                <div className="text-8xl font-black text-[#FF4F00] leading-none mb-2">{slide.stat}</div>
                <div className="text-white text-[10px] uppercase tracking-[0.3em] font-black opacity-80">{slide.statLabel}</div>
              </motion.div>
            </div>
          </div>
          <div>
            <h2 className="text-white text-5xl font-black italic tracking-tighter mb-4 uppercase">{slide.title}</h2>
            <p className="text-zinc-500 text-xl leading-relaxed font-light">{slide.body}</p>
          </div>
        </div>
      );

    case 'skill':
      return (
        <div className="relative h-full w-full flex flex-col p-12 bg-black overflow-hidden">
           <div className="flex items-center gap-4 mb-10">
             <motion.div 
               animate={{ y: [0, -5, 0] }}
               transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
               className="p-4 bg-[#FF4F00] rounded-2xl shadow-[0_0_30px_rgba(255,79,0,0.4)]"
             >
                {slide.icon && React.cloneElement(slide.icon as React.ReactElement<any>, { className: "w-8 h-8 text-black" })}
             </motion.div>
             <div>
               <div className="text-[#FF4F00] text-[10px] font-black uppercase tracking-[0.4em] mb-1">Skill Module</div>
               <div className="text-white text-3xl font-black italic uppercase tracking-tighter">{slide.skill}</div>
             </div>
           </div>
           <div className="flex-1 relative mb-10">
              <motion.img 
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                src={slide.image} 
                className="w-full h-full object-cover rounded-[2.5rem] border border-white/10 shadow-2xl" 
                alt="skill" 
              />
              <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-t from-black/60 to-transparent" />
           </div>
           <h2 className="text-white text-4xl font-black italic tracking-tighter mb-4 uppercase leading-none">{slide.title}</h2>
           <p className="text-zinc-500 text-xl font-light leading-snug">{slide.body}</p>
        </div>
      );

    case 'moat':
      return (
        <div className="relative h-full w-full flex flex-col p-12 bg-[#0A0A0A]">
          <h2 className="text-white text-5xl font-black italic tracking-tighter mb-8 uppercase leading-none">{slide.title}</h2>
          <div className="space-y-4 flex-1">
            {slide.features?.map((f, i) => (
              <motion.div 
                key={i} 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-4 p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-[#FF4F00]/50 transition-colors group"
              >
                <CheckCircle className="w-6 h-6 text-[#FF4F00] group-hover:scale-110 transition-transform" />
                <span className="text-white text-lg font-medium tracking-tight">{f}</span>
              </motion.div>
            ))}
          </div>
          <div className="mt-8 h-48 relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
            <img src={slide.image} className="w-full h-full object-cover opacity-40 grayscale" alt="moat" />
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/80 to-transparent">
               <Shield className="w-16 h-16 text-[#FF4F00] drop-shadow-[0_0_20px_rgba(255,79,0,0.5)]" />
            </div>
          </div>
        </div>
      );

    case 'social-proof':
      return (
        <div className="relative h-full w-full flex flex-col p-12 bg-black justify-center items-center text-center">
            <motion.div 
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="mb-12"
            >
               <Zap className="w-16 h-16 text-[#FF4F00] fill-[#FF4F00]/20 drop-shadow-[0_0_30px_rgba(255,79,0,0.4)]" />
            </motion.div>
            <h2 className="text-white text-5xl font-black italic tracking-tighter mb-6 uppercase leading-none">{slide.title}</h2>
            <p className="text-zinc-500 text-xl font-light leading-relaxed mb-12">{slide.body}</p>
            
            <div className="w-full p-10 rounded-[2.5rem] bg-zinc-900/50 border border-zinc-800 relative italic shadow-2xl overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF4F00]/5 rounded-full blur-3xl group-hover:bg-[#FF4F00]/10 transition-all" />
               <span className="absolute -top-6 -left-4 text-9xl text-[#FF4F00] opacity-10 font-serif">"</span>
               <p className="text-white text-2xl leading-tight mb-6 relative z-10 font-medium">{slide.quote}</p>
               <p className="text-[#FF4F00] font-black text-xs not-italic uppercase tracking-[0.4em]">— {slide.author}</p>
            </div>
        </div>
      );

    case 'setup':
      return (
        <div className="relative h-full w-full flex flex-col p-12 bg-[#0A0A0A] justify-between">
          <div>
            <h2 className="text-white text-5xl font-black italic tracking-tighter mb-10 uppercase leading-none">{slide.title}</h2>
            <div className="space-y-5">
              {slide.steps?.map((s, i) => (
                <div key={i} className="flex gap-6 group">
                  <div className="text-[#FF4F00] font-black text-3xl opacity-20 group-hover:opacity-100 transition-opacity font-mono">{s.id}</div>
                  <div className="flex-1">
                    <div className="w-full bg-[#111] p-5 rounded-2xl border border-zinc-800 font-mono text-zinc-400 text-sm overflow-hidden whitespace-nowrap shadow-inner group-hover:border-[#FF4F00]/30 transition-colors">
                       <span className="text-[#FF4F00] group-hover:translate-x-1 transition-transform inline-block mr-3">$</span>
                       {s.text}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <motion.div 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="relative p-8 rounded-3xl bg-[#FF4F00] text-black font-black text-center text-2xl cursor-pointer shadow-[0_20px_50px_rgba(255,79,0,0.3)] flex items-center justify-center gap-3 overflow-hidden outline-none"
          >
             <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
             {slide.cta}
             <ArrowRight className="w-8 h-8" />
          </motion.div>
        </div>
      );

    case 'cta':
      return (
        <div className="relative h-full w-full flex flex-col p-12 bg-black items-center justify-center text-center overflow-hidden">
           {/* Animated background rings */}
           <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-[#FF4F00]/10 rounded-full animate-[ping_10s_infinite]" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-[#FF4F00]/5 rounded-full animate-[ping_15s_infinite]" />
           </div>

           <motion.div 
             initial={{ rotate: 12, scale: 0.8 }}
             animate={{ rotate: 12, scale: 1 }}
             transition={{ type: 'spring', bounce: 0.5 }}
             className="w-32 h-32 bg-[#FF4F00] rounded-[2.5rem] flex items-center justify-center mb-10 shadow-[0_0_60px_rgba(255,79,0,0.4)] relative z-10"
           >
             <Play className="w-16 h-16 text-black ml-2 fill-current" />
           </motion.div>

           <h2 className="text-white text-6xl font-black mb-8 leading-[0.9] tracking-tighter italic uppercase relative z-10">
              Ready to Helm<br/><span className="text-[#FF4F00]">your Agents?</span>
           </h2>
           <p className="text-zinc-500 text-2xl font-light mb-12 max-w-[90%] leading-tight relative z-10">{slide.body}</p>
           
           <div className="space-y-4 w-full relative z-10">
             <motion.div 
               whileHover={{ y: -5 }}
               className="p-5 rounded-3xl bg-[#111] border border-zinc-800 flex items-center justify-between group cursor-pointer hover:border-[#FF4F00]/50 transition-all shadow-xl"
             >
                <div className="flex items-center gap-3">
                   <div className="w-2 h-2 rounded-full bg-[#FF4F00] animate-pulse" />
                   <span className="text-white text-xl font-bold font-mono lowercase tracking-tight">{slide.url}</span>
                </div>
                <ArrowRight className="w-6 h-6 text-[#FF4F00] group-hover:translate-x-1 transition-transform" />
             </motion.div>
             <div className="text-zinc-600 font-black uppercase tracking-[0.5em] text-[10px] pt-4">
                Follow <span className="text-[#FF4F00]">@agenthelm</span> for agentic alpha
             </div>
           </div>
        </div>
      );

    default:
      return null;
  }
}
