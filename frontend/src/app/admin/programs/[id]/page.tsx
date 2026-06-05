'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import AdminShell from '@/components/AdminShell';
import ProgramForm from '@/components/ProgramForm';
import { getProgram, type Program } from '@/lib/adminApi';

export default function EditProgramPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [program, setProgram] = useState<Program | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    (async () => {
      const res = await getProgram(id);
      if (res.ok && res.data) {
        setProgram(res.data.data);
      } else {
        setError(res.error || 'Program not found.');
      }
    })();
  }, [id]);

  return (
    <AdminShell>
      <div className="mb-8">
        <h1 className="font-display text-2xl gold-text-gradient font-bold tracking-wider uppercase">
          Edit Program
        </h1>
        <p className="font-body text-sm text-wool-muted mt-1">{program?.name || 'Loading…'}</p>
      </div>
      {error && (
        <p className="font-body text-sm text-heritage bg-heritage/10 border border-heritage/30 px-4 py-3 rounded-sm mb-6">
          {error}
        </p>
      )}
      {program && <ProgramForm program={program} />}
    </AdminShell>
  );
}
