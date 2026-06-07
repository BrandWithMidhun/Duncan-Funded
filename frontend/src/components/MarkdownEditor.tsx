'use client';

import dynamic from 'next/dynamic';
import type { ComponentProps } from 'react';

/**
 * MDXEditor is a heavy, browser-only component (uses contentEditable
 * APIs, listens to selection events, etc). We wrap it with next/dynamic
 * + ssr:false so:
 *   1. It never tries to render during SSR/SSG (would crash)
 *   2. Its ~150KB of code only loads when the admin actually opens a
 *      post editor — public visitors and admin list pages don't pay
 *      the bundle cost.
 */
const MarkdownEditor = dynamic(() => import('./MarkdownEditorInner'), {
  ssr: false,
  loading: () => (
    <div className="border border-gold/20 bg-pine/60 rounded-sm p-8 text-center">
      <p className="font-accent italic text-wool-muted">Loading editor…</p>
    </div>
  ),
});

export default MarkdownEditor;
export type MarkdownEditorProps = ComponentProps<typeof MarkdownEditor>;
