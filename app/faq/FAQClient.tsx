"use client";

import React from "react";
import CursorGrid from "@/components/ui/CursorGrid";

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
  return (
    <div className="relative min-h-screen py-12 px-4">
      {/* Dynamic CursorGrid Interactive Background - Full Screen Stretch */}
      <div className="fixed inset-0 z-0 opacity-70 pointer-events-none w-screen h-screen overflow-hidden">
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

      <div className="relative z-10 max-w-4xl mx-auto space-y-12">
        {/* Hero Header */}
        <section className="text-center space-y-4 pt-4">
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight uppercase">
            FAQ
          </h1>
          <p className="text-base md:text-lg text-white/70 max-w-2xl mx-auto">
            Got questions? We've got answers!
          </p>
        </section>

        {/* FAQs */}
        <section className="space-y-4">
          {faqs.map((faq, index) => (
            <details
              key={index}
              className="group bg-neutral-900/80 backdrop-blur-md border border-white/10 hover:border-white/30 rounded-2xl overflow-hidden transition-all duration-300"
            >
              <summary className="flex justify-between items-center cursor-pointer p-6 hover:bg-white/5 transition-colors list-none">
                <h3 className="text-lg font-bold text-white pr-4">
                  {faq.question}
                </h3>
                <span className="text-2xl text-indigo-400 font-bold transition-transform group-open:rotate-45 flex-shrink-0">
                  +
                </span>
              </summary>
              <div className="px-6 pb-6 text-white/70 leading-relaxed border-t border-white/10 pt-4">
                {faq.answer}
              </div>
            </details>
          ))}
        </section>

        {/* Still have questions */}
        <section className="bg-gradient-to-r from-neutral-900/90 via-neutral-900/90 to-neutral-800/90 backdrop-blur-md border border-white/10 rounded-2xl p-8 md:p-12 text-center space-y-6 shadow-2xl">
          <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">
            Still Have Questions?
          </h2>
          <p className="text-white/70">
            Can't find what you're looking for? Feel free to reach out to us!
          </p>
          <a
            href="/contact"
            className="inline-block px-8 py-3 rounded-xl bg-white text-neutral-900 font-bold hover:bg-neutral-200 transition-colors"
          >
            Contact Us
          </a>
        </section>
      </div>
    </div>
  );
}
