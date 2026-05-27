import Link from 'next/link';
import type { Post } from '@/lib/api';

function formatDate(iso: string | null) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function BlogCard({ post }: { post: Post }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col border border-gold/15 bg-highland/40 rounded-sm overflow-hidden hover:border-gold/40 transition-all duration-300"
    >
      {post.coverImage && (
        <div className="aspect-[16/9] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      )}
      <div className="p-6 flex flex-col flex-1">
        <div className="flex items-center gap-3 mb-3">
          {post.category && (
            <span className="font-body text-[10px] tracking-[0.2em] uppercase text-gold/80 bg-gold/10 px-2.5 py-1 rounded-sm">
              {post.category.name}
            </span>
          )}
          <span className="font-body text-[11px] text-wool-muted/60">
            {post.readingTime} min read
          </span>
        </div>

        <h2 className="font-display text-lg tracking-wide text-wool mb-3 group-hover:gold-text-gradient transition-all leading-snug">
          {post.title}
        </h2>

        <p className="font-body text-sm text-wool-muted leading-relaxed mb-5 flex-1">
          {post.excerpt}
        </p>

        <div className="flex items-center justify-between border-t border-gold/10 pt-4 mt-auto">
          <span className="font-body text-[11px] text-wool-muted/70">
            {post.author?.name || 'Duncan Funded'}
          </span>
          <span className="font-body text-[11px] text-wool-muted/50">
            {formatDate(post.publishedAt)}
          </span>
        </div>
      </div>
    </Link>
  );
}
