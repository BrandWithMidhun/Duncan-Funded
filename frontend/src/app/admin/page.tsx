'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminShell from '@/components/AdminShell';
import { listAdminPosts, listSubscribers, listMessages } from '@/lib/adminApi';

interface Stats {
  posts: number;
  published: number;
  drafts: number;
  subscribers: number;
  messages: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    (async () => {
      const [posts, subs, msgs] = await Promise.all([
        listAdminPosts(),
        listSubscribers(),
        listMessages(),
      ]);
      const postList = posts.ok && posts.data ? posts.data.data : [];
      setStats({
        posts: postList.length,
        published: postList.filter((p) => p.status === 'PUBLISHED').length,
        drafts: postList.filter((p) => p.status === 'DRAFT').length,
        subscribers: subs.ok && subs.data ? subs.data.total : 0,
        messages: msgs.ok && msgs.data ? msgs.data.total : 0,
      });
    })();
  }, []);

  const cards = [
    { label: 'Total Posts', value: stats?.posts },
    { label: 'Published', value: stats?.published },
    { label: 'Drafts', value: stats?.drafts },
    { label: 'Subscribers', value: stats?.subscribers },
    { label: 'Messages', value: stats?.messages },
  ];

  return (
    <AdminShell>
      <div className="mb-8">
        <h1 className="font-display text-2xl gold-text-gradient font-bold tracking-wider uppercase">
          Dashboard
        </h1>
        <p className="font-body text-sm text-wool-muted mt-1">
          Overview of your content and audience.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
        {cards.map((c) => (
          <div
            key={c.label}
            className="border border-gold/15 bg-highland/40 rounded-sm p-5 text-center"
          >
            <div className="font-display text-3xl gold-text-gradient font-bold">
              {c.value === undefined ? '—' : c.value}
            </div>
            <div className="font-body text-[11px] tracking-wider text-wool-muted uppercase mt-1">
              {c.label}
            </div>
          </div>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-4 max-w-2xl">
        <Link
          href="/admin/posts/new"
          className="border border-gold/20 bg-highland/40 rounded-sm p-6 hover:border-gold/50 transition-all"
        >
          <h2 className="font-display text-base text-gold tracking-wider mb-1 uppercase">
            Write a New Post
          </h2>
          <p className="font-body text-sm text-wool-muted">
            Create and publish a new blog article.
          </p>
        </Link>
        <Link
          href="/admin/posts"
          className="border border-gold/20 bg-highland/40 rounded-sm p-6 hover:border-gold/50 transition-all"
        >
          <h2 className="font-display text-base text-gold tracking-wider mb-1 uppercase">
            Manage Posts
          </h2>
          <p className="font-body text-sm text-wool-muted">
            Edit, publish, or remove existing articles.
          </p>
        </Link>
      </div>
    </AdminShell>
  );
}
