"use client";

import React, { useRef } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import CursorGrid from "@/components/ui/CursorGrid";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const faqs = [
  {
    question: "What is Sabrang?",
    answer:
      "Sabrang is the annual flagship cultural and techno-management festival of JK Lakshmipat University, Jaipur. It features 50+ events including cultural competitions, technical challenges, e-sports tournaments, and professional shows over three days.",
  },
  {
    question: "When and where is Sabrang 2026?",
    answer:
      "Sabrang 2026 will be held at JK Lakshmipat University, Mahapura, Ajmer Road, Jaipur, Rajasthan 302026.",
  },
  {
    question: "Who can participate?",
    answer:
      "All college students from recognized universities across India can participate in Sabrang. Some events may have specific eligibility criteria, so please check individual event details.",
  },
  {
    question: "How do I register for events?",
    answer:
      "Create an account on our website, browse the events page, and click \"Register Now\" for any event you're interested in. You'll receive a unique QR code for entry.",
  },
  {
    question: "Is there an entry fee?",
    answer:
      "Entry to the festival is free for JKLU students. External participants may need to pay a nominal registration fee for certain events. Check individual event pages for details.",
  },
  {
    question: "What is the total prize pool?",
    answer:
      "The total prize pool exceeds ₹2.5 Lakhs, distributed across all technical, cultural, and flagship events.",
  },
  {
    question: "Can I participate in multiple events?",
    answer:
      "Yes! You can register for as many events as you want, provided there are no scheduling conflicts.",
  },
  {
    question: "Will there be accommodation available?",
    answer:
      "Yes, limited accommodation is available on campus on a first-come, first-served basis. Please contact us in advance to arrange accommodation.",
  },
  {
    question: "Is food available on campus?",
    answer:
      "Absolutely! We'll have a food festival with multiple vendors offering a variety of cuisines. Food courts will be operational throughout the festival.",
  },
  {
    question: "How do I get my QR code?",
    answer:
      "After successful registration for any event, your unique QR code will be available in your dashboard. You can also find the QR string below the code for manual entry.",
  },
  {
    question: "Can I get a refund if I cancel my registration?",
    answer:
      "Refund policies vary by event. Please check the specific event's terms and conditions or contact our support team.",
  },
  {
    question: "Is there parking available?",
    answer:
      "Yes, parking is available on campus for both two-wheelers and four-wheelers. Follow the signage on the day of the event.",
  },
  {
    question: "Are outside food/drinks allowed?",
    answer:
      "Outside food and drinks are not permitted inside the venue. However, we have plenty of food options available at affordable prices.",
  },
  {
    question: "How can I volunteer for Sabrang?",
    answer:
      "We're always looking for enthusiastic volunteers! Fill out the contact form on our website or email us at sabrang@jklu.edu.in with your details.",
  },
  {
    question: "Can I sponsor Sabrang?",
    answer:
      "Yes! We offer various sponsorship packages. Contact our sponsorship team or reach out via our contact page for more details.",
  },
  {
    question: "Will there be live streaming of events?",
    answer:
      "Select events will be live-streamed on our social media channels. Follow us on Instagram and YouTube for updates.",
  },
  {
    question: "What should I bring to the festival?",
    answer:
      "Bring your college ID, registration QR code, comfortable clothes, and lots of energy! Some events may require specific equipment - check event rules.",
  },
];

export default function FAQClient() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // Reveal for single sections
    const revealElements = gsap.utils.toArray<HTMLElement>('.gsap-reveal');

    revealElements.forEach((el) => {
      gsap.fromTo(
        el,
        {
          opacity: 0,
          y: 40, // reduced translation for mobile
          scale: 0.98, // smoother scale on mobile
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: "top 95%",
            end: "top 70%",
            scrub: 1,
          },
        }
      );
    });

    // Staggered reveal for FAQ items
    const faqCards = gsap.utils.toArray<HTMLElement>('.gsap-faq-card');
    if (faqCards.length > 0) {
      gsap.fromTo(
        faqCards,
        {
          opacity: 0,
          x: -20, // reduced translation for mobile
        },
        {
          opacity: 1,
          x: 0,
          stagger: 0.1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ".gsap-faq-container",
            start: "top 90%",
            end: "bottom 85%",
            scrub: 1.5,
          },
        }
      );
    }
  }, { scope: containerRef });

  return (
    <div className="relative min-h-screen py-16 px-4 sm:px-6 md:px-8 pb-24 overflow-x-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#0a0a0a] to-black" ref={containerRef}>
      {/* Dynamic CursorGrid Interactive Background */}
      <div className="fixed inset-0 z-0 opacity-70 pointer-events-none overflow-hidden">
        <CursorGrid
          cellSize={70}
          color="#D946EF"
          radius={160}
          falloff="smooth"
          holdTime={400}
          fadeDuration={800}
          lineWidth={1.2}
          maxOpacity={0.85}
          fillOpacity={0.05}
          gridOpacity={0.08}
          cellRadius={8}
          clickPulse={true}
          pulseSpeed={600}
        />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto space-y-12 md:space-y-16">
        {/* Hero Header */}
        <motion.section 
          className="text-center space-y-4 pt-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="inline-block px-4 py-1.5 mb-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-semibold text-xs md:text-sm tracking-widest uppercase">
            Help Center
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-white tracking-tight uppercase drop-shadow-lg">
            FAQ
          </h1>
          <p className="text-sm sm:text-base md:text-xl text-white/70 max-w-2xl mx-auto font-medium px-4">
            Got questions? We've got answers! Explore the most commonly asked queries below.
          </p>
        </motion.section>

        {/* FAQs */}
        <section className="space-y-4 gsap-faq-container">
          {faqs.map((faq, index) => (
            <details
              key={index}
              className="group bg-neutral-900/50 backdrop-blur-xl border border-white/5 hover:border-indigo-500/30 rounded-2xl overflow-hidden transition-all duration-300 shadow-xl gsap-faq-card"
            >
              <summary className="flex justify-between items-center cursor-pointer p-5 md:p-6 hover:bg-indigo-500/5 transition-colors list-none">
                <h3 className="text-base md:text-lg font-bold text-white/90 group-hover:text-white pr-4 transition-colors">
                  {faq.question}
                </h3>
                <span className="text-xl md:text-2xl text-indigo-400 font-bold transition-transform group-open:rotate-45 flex-shrink-0 bg-indigo-500/10 w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center">
                  +
                </span>
              </summary>
              <div className="px-5 md:px-6 pb-5 md:pb-6 text-sm md:text-base text-white/60 leading-relaxed border-t border-white/5 pt-4 bg-black/20">
                {faq.answer}
              </div>
            </details>
          ))}
        </section>

        {/* Still have questions */}
        <section className="bg-gradient-to-br from-indigo-900/40 via-neutral-900/90 to-purple-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 sm:p-10 md:p-14 text-center space-y-6 shadow-2xl relative overflow-hidden gsap-reveal">
          {/* Decorative blur elements inside the card */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none rounded-3xl">
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/30 rounded-full blur-[80px]" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/30 rounded-full blur-[80px]" />
          </div>

          <div className="relative z-10 space-y-4 md:space-y-6">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white uppercase tracking-tight">
              Still Have Questions?
            </h2>
            <p className="text-sm md:text-lg text-white/70 max-w-lg mx-auto">
              Can't find what you're looking for? Feel free to reach out to our support team!
            </p>
            <a
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 md:px-8 md:py-4 rounded-xl bg-white text-neutral-900 text-sm md:text-base font-black uppercase tracking-wider hover:scale-105 transition-transform shadow-[0_0_30px_rgba(255,255,255,0.2)] md:shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:shadow-[0_0_50px_rgba(255,255,255,0.5)]"
            >
              <span>Contact Us</span>
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
