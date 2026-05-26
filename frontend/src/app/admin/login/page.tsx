'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { login } from '@/lib/adminApi';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (res.ok) {
      router.push('/admin');
    } else {
      setError(res.error || 'Sign in failed.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 tartan-texture">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <Image
            src="/assets/duncan-crest.png"
            alt="Duncan Funded"
            width={72}
            height={72}
            className="h-18 w-18 object-contain mb-4"
          />
          <h1 className="font-display text-2xl gold-text-gradient font-bold tracking-wider uppercase">
            Admin Console
          </h1>
          <p className="font-accent text-sm text-wool-muted italic mt-1">
            Duncan Funded — content management
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 border border-gold/20 bg-highland/50 backdrop-blur-sm p-8 rounded-sm"
        >
          <div>
            <label
              htmlFor="email"
              className="font-body text-xs uppercase tracking-widest text-wool-muted mb-2 block"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="w-full bg-pine/60 border border-gold/20 px-4 py-3 rounded-sm font-body text-wool focus:border-gold outline-none transition"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="font-body text-xs uppercase tracking-widest text-wool-muted mb-2 block"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full bg-pine/60 border border-gold/20 px-4 py-3 rounded-sm font-body text-wool focus:border-gold outline-none transition"
            />
          </div>

          {error && (
            <p className="font-body text-sm text-heritage bg-heritage/10 border border-heritage/30 px-3 py-2 rounded-sm">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full font-display text-sm tracking-[0.2em] uppercase text-gold tartan-button px-6 py-3 rounded-sm hover:text-gold-light transition-all disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div className="text-center mt-6">
          <Link
            href="/"
            className="font-body text-xs tracking-wider text-wool-muted hover:text-gold transition-colors uppercase"
          >
            ← Back to site
          </Link>
        </div>
      </div>
    </div>
  );
}
