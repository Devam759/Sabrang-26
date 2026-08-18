import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRightIcon, LinkedInIcon, InstagramIcon, WhatsAppIcon, FacebookIcon } from '../common/Icons'
import './HeroConclusion.css'

export default function HeroConclusion() {
  return (
    <section className="relative min-h-screen z-[70] flex flex-col items-center justify-center text-center px-6 py-20 overflow-visible bg-transparent text-white">
      
      {/* Background Glow (Aura) */}
      <div 
        style={{
          position: 'absolute',
          bottom: '-10%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '80vw',
          height: '50vh',
          background: 'radial-gradient(circle, var(--white-subtle) 0%, rgba(0,0,0,0) 70%)',
          filter: 'blur(100px)',
          pointerEvents: 'none',
        }}
      ></div>

      <div className="z-10 max-w-4xl group flex-1 flex flex-col justify-center">
        <p className="text-[10px] tracking-[0.2em] uppercase text-[var(--text-muted)] mb-8 font-medium" style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}>
          The journey concludes here
        </p>
        
        <h2 className="tracking-tight leading-[1.1] font-normal" style={{ 
          fontFamily: "var(--font-playfair), serif",
          fontSize: 'clamp(3rem, 8vw, 6rem)'
        }}>
          Join the <br /><i style={{ fontStyle: 'italic', fontWeight: 300, opacity: 0.6 }}>Singularity.</i>
        </h2>

        <div style={{ marginTop: '30px', marginBottom: '30px' }}>
          
        </div>

        {/* Register Button - Shine & Slide Animation */}
        <div className="relative inline-block mt-8">

          
          <Link 
            href="#" 
            className="register-btn-main group"
          >
            Register For Sabrang
            <ArrowRightIcon />
          </Link>
        </div>
      </div>

      {/* Premium Footer Section - Absolute Bottom to use below space */}
      <div className="w-[90%] mx-auto z-20 flex flex-col gap-6 py-12">
        <div 
          className="group/footer flex flex-col md:flex-row items-center gap-4 md:gap-0 rounded-[12px] md:rounded-[32px] border border-white/10 backdrop-blur-[50px] px-6 py-4 md:px-16 md:py-12 transition-all duration-500 hover:border-white/20"
          style={{
            background: 'var(--white-subtle)',
            boxShadow: '0 30px 60px rgba(0, 0, 0, 0.5)',
          }}
        >
          {/* Top Spacer for Mobile */}
          <div className="h-1 md:hidden" />

          {/* Left: Branding */}
          <div className="md:flex-1 flex flex-col md:flex-row items-center gap-4 md:gap-6 justify-center md:justify-start px-6 md:px-10">
            <div className="text-center md:text-left">
              <p className="text-[14px] md:text-[18px] font-bold tracking-[0.3em] uppercase leading-none mb-3 text-white" style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}>SABRANG 26</p>
              <p className="text-[11px] md:text-[15px] font-medium tracking-[0.2em] text-white/80 uppercase" style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}>JK Lakshmipat University</p>
            </div>
          </div>

          {/* Center: Navigation */}
          <div className="md:flex-[1.5] flex flex-row justify-center gap-12 md:gap-16">
            {['FAQ', 'TEAM'].map((label) => (
              <Link 
                key={label}
                href="#" 
                className="text-[14px] md:text-[16.5px] tracking-[0.35em] text-gray-400 hover:text-white transition-all duration-300 uppercase relative group/link"
                style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
              >
                {label}
                <span className="absolute -bottom-2 left-1/2 w-0 h-[1.5px] bg-[var(--text-primary)] transition-all duration-300 -translate-x-1/2 group-hover/link:w-[60%]" />
              </Link>
            ))}
          </div>

          {/* Right: Socials */}
          <div className="md:flex-1 flex gap-10 md:gap-10 items-center justify-center">
            <a href="https://www.linkedin.com/school/jk-lakshmipat-university/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center text-gray-400 hover:text-white hover:scale-125 transition-all duration-300">
              <LinkedInIcon size={20} />
            </a>
            <a href="https://www.instagram.com/jklu_jaipur/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center text-gray-400 hover:text-white hover:scale-125 transition-all duration-300">
              <InstagramIcon size={20} />
            </a>
            <a href="https://www.facebook.com/jklu.jaipur/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center text-gray-400 hover:text-white hover:scale-125 transition-all duration-300">
              <FacebookIcon size={20} />
            </a>
          </div>

          {/* Bottom Spacer for Mobile */}
          <div className="h-1 md:hidden" />
        </div>


        
        <p className="text-center text-[9px] pb-8 tracking-[0.4em] text-gray-400 uppercase"
         style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}>
          © 2026 All Rights Reserved. JK Lakshmipat University.
        </p>
      </div>

    </section>
  )
}
