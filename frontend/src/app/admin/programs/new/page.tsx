import AdminShell from '@/components/AdminShell';
import ProgramForm from '@/components/ProgramForm';

export default function NewProgramPage() {
  return (
    <AdminShell>
      <div className="mb-8">
        <h1 className="font-display text-2xl gold-text-gradient font-bold tracking-wider uppercase">
          New Program
        </h1>
        <p className="font-body text-sm text-wool-muted mt-1">
          Create a new program to appear in the configurator.
        </p>
      </div>
      <ProgramForm />
    </AdminShell>
  );
}
