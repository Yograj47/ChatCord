// Local-only fixture using production components; no backend requests or real data.
import { StrictMode, useState } from 'react';
import { AppSplash } from '@/shared/ui/AppSplash';
import { createRoot } from 'react-dom/client';
import { Modal } from '@/shared/ui/Modal';
import { CreateRoomForm } from '@/features/rooms/components/CreateRoomForm';
import { EditRoomForm } from '@/features/rooms/components/EditRoomForm';
import '@/styles/index.css';

export function Preview() {
  const [mode, setMode] = useState<'create' | 'edit' | null>(null);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState('No submission yet');
  const close = () => setMode(null);
  const submit = async () => {
    setPending(true);
    await new Promise((resolve) => setTimeout(resolve, 5000));
    setPending(false);
    setResult('Simulated failure: dialog and draft retained');
  };
  return (
    <main className="min-h-screen bg-zinc-950 p-8 text-zinc-100">
      <h1>Dialog accessibility verification</h1>
      <button onClick={() => setMode('create')}>Open create</button>{' '}
      <button onClick={() => setMode('edit')}>Open edit</button>{' '}
      <button onClick={() => setResult('Background activated')}>Background control</button>
      <p role="status">{result}</p>
      <Modal
        isOpen={Boolean(mode)}
        onClose={close}
        isPending={pending}
        title={mode === 'edit' ? 'Edit test room' : 'Create test room'}
        description="Local keyboard and form verification"
      >
        {mode === 'edit' ? (
          <EditRoomForm
            initialName="Test room"
            onSubmit={submit}
            onCancel={close}
            isLoading={pending}
          />
        ) : (
          <CreateRoomForm onSubmit={submit} onCancel={close} isLoading={pending} />
        )}
      </Modal>
    </main>
  );
}
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {new URLSearchParams(window.location.search).has('splash') ? <AppSplash /> : <Preview />}
  </StrictMode>,
);
