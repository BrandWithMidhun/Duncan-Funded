import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-pine flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-6 pt-32 pb-20">
        <div className="text-center">
          <div className="font-display text-7xl md:text-8xl gold-text-gradient font-bold tracking-wider mb-4">
            404
          </div>
          <h1 className="font-display text-2xl text-wool tracking-wider mb-3 uppercase">
            Off the Map
          </h1>
          <p className="font-accent text-lg text-wool-muted italic mb-8 max-w-md mx-auto">
            This path leads nowhere the clan recognises.
          </p>
          <Link
            href="/"
            className="inline-block font-display text-xs tracking-[0.2em] uppercase text-gold tartan-button px-8 py-3 rounded-sm hover:text-gold-light transition-all"
          >
            Return Home
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
