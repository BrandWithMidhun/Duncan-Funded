'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { faqCategories as fallback } from '@/lib/faq';
import { getFaqCategories, type PublicFaqCategory } from '@/lib/api';

/**
 * Tabbed FAQ with collapsible items. Answers render as Markdown
 * (GFM + soft line breaks), so admins can use blank lines for
 * paragraphs, `- ` for bullets, `**bold**` for emphasis, `[label](url)`
 * for links, and a single Enter for a line break. Plain text without
 * any of that still renders correctly.
 *
 * Fetches live data from the API on mount; renders the hardcoded
 * fallback until the response arrives or if the API is unreachable.
 */
export default function FAQSection({
  eyebrow = 'Questions',
  title = 'FAQ',
}: {
  eyebrow?: string;
  title?: string;
} = {}) {
  const [cats, setCats] = useState<PublicFaqCategory[]>(() =>
    fallback.map((c, i) => ({
      id: c.id,
      slug: c.id,
      label: c.label,
      faqs: c.faqs.map((f, j) => ({ id: `${c.id}-${j}`, q: f.q, a: f.a })),
    })),
  );
  const [activeId, setActiveId] = useState(cats[0]?.id || '');
  const [openItem, setOpenItem] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getFaqCategories().then((data) => {
      if (!active || data.length === 0) return;
      setCats(data);
      setActiveId(data[0].id);
      setOpenItem(null);
    });
    return () => {
      active = false;
    };
  }, []);

  const current = cats.find((c) => c.id === activeId) || cats[0];
  if (!current) return null;

  return (
    <section id="faq" className="py-24 bg-navy/20 relative">
      <div className="absolute inset-0 tartan-texture opacity-5" />
      <div className="container mx-auto px-6 relative z-10 max-w-5xl">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="w-12 h-px bg-gold/40" />
            <span className="font-accent text-sm tracking-[0.3em] text-gold/70 italic uppercase">
              {eyebrow}
            </span>
            <div className="w-12 h-px bg-gold/40" />
          </div>
          <h2 className="font-display text-3xl md:text-5xl tracking-wider">
            <span className="gold-text-gradient">{title}</span>
          </h2>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          {/* Category tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-8" role="tablist">
            {cats.map((cat) => {
              const active = cat.id === activeId;
              return (
                <button
                  key={cat.id}
                  role="tab"
                  aria-selected={active}
                  onClick={() => {
                    setActiveId(cat.id);
                    setOpenItem(null);
                  }}
                  className={`font-display text-xs md:text-sm tracking-wider uppercase border px-4 py-2.5 rounded-sm transition-all ${
                    active
                      ? 'bg-highland text-gold border-gold/60 shadow-[0_0_18px_-6px_hsl(43_62%_51%/0.5)]'
                      : 'bg-highland/30 text-wool-muted border-gold/20 hover:text-gold hover:border-gold/40'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Accordion */}
          <div className="space-y-3">
            {current.faqs.map((faq) => {
              const open = openItem === faq.id;
              return (
                <div
                  key={faq.id}
                  className={`border rounded-sm bg-highland/30 px-6 transition-colors ${
                    open ? 'border-gold/30' : 'border-gold/10'
                  }`}
                >
                  <button
                    onClick={() => setOpenItem(open ? null : faq.id)}
                    aria-expanded={open}
                    className="w-full text-left flex items-center justify-between gap-4 font-display text-sm tracking-wider text-wool hover:text-gold transition-colors py-5"
                  >
                    <span>{faq.q}</span>
                    <span
                      className={`text-gold transition-transform shrink-0 ${
                        open ? 'rotate-180' : ''
                      }`}
                      aria-hidden
                    >
                      ▾
                    </span>
                  </button>
                  {open && (
                    <div className="pb-5 font-body text-sm text-wool-muted leading-relaxed faq-answer">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm, remarkBreaks]}
                        components={{
                          // Constrain headings inside an answer so they
                          // don't fight the FAQ question typography.
                          h1: (props) => (
                            <p
                              className="font-display text-sm tracking-wider text-gold uppercase mt-3 mb-1"
                              {...props}
                            />
                          ),
                          h2: (props) => (
                            <p
                              className="font-display text-sm tracking-wider text-gold uppercase mt-3 mb-1"
                              {...props}
                            />
                          ),
                          h3: (props) => (
                            <p
                              className="font-display text-xs tracking-wider text-gold uppercase mt-3 mb-1"
                              {...props}
                            />
                          ),
                          p: (props) => <p className="mb-3 last:mb-0" {...props} />,
                          ul: (props) => (
                            <ul className="list-disc pl-5 mb-3 last:mb-0 space-y-1" {...props} />
                          ),
                          ol: (props) => (
                            <ol className="list-decimal pl-5 mb-3 last:mb-0 space-y-1" {...props} />
                          ),
                          li: (props) => <li className="leading-relaxed" {...props} />,
                          a: (props) => (
                            <a
                              className="text-gold underline underline-offset-2 hover:text-gold-light break-words"
                              target={props.href?.startsWith('http') ? '_blank' : undefined}
                              rel={
                                props.href?.startsWith('http') ? 'noopener noreferrer' : undefined
                              }
                              {...props}
                            />
                          ),
                          strong: (props) => <strong className="text-wool" {...props} />,
                          em: (props) => <em className="italic" {...props} />,
                          code: (props) => (
                            <code
                              className="px-1.5 py-0.5 rounded-sm bg-pine/70 border border-gold/15 text-gold text-[12px]"
                              {...props}
                            />
                          ),
                        }}
                      >
                        {faq.a}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
