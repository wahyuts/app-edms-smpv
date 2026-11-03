import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../../../src/index.css';
import DocumentActionGroup from '../../../src/features/document-register/components/DocumentActionGroup';
import { useProjectContextStore } from '../../../src/shared/stores/project-context.store';

export const Fixture = () => {
  const [role, setRole] = useState('Admin'); const [project, setProject] = useState('SYNTHETIC-P1');
  const [surface, setSurface] = useState('PFD'); const [outcome, setOutcome] = useState('COMPLETED');
  const [calls, setCalls] = useState([]); const [toast, setToast] = useState(''); const [refreshes, setRefreshes] = useState(0);
  useEffect(() => {
    useProjectContextStore.getState().setProjectContext({ activeProject: { id: project }, activeMembership: { officialRole: role } });
  }, [role, project]);
  useEffect(() => { window.__fixtureOutcome = outcome; }, [outcome]);
  useEffect(() => {
    const called = (event) => setCalls((current) => [...current, event.detail]);
    const notified = (event) => setToast(event.detail.message);
    window.addEventListener('fixture-call', called); window.addEventListener('fixture-toast', notified);
    return () => { window.removeEventListener('fixture-call', called); window.removeEventListener('fixture-toast', notified); };
  }, []);
  const selectClass = 'rounded-md border border-[#123A5A] bg-[#08233B] p-2';
  return <main className="min-h-screen bg-[#020D18] p-6 text-[#F8FAFC]">
    <h1 className="text-xl font-bold">Sprint D - Synthetic UI Validation</h1>
    <div className="my-6 flex flex-wrap gap-3">
      <select aria-label="Fixture role" className={selectClass} value={role} onChange={(e) => setRole(e.target.value)}>{['Admin','Document Owner','Team Process','Team Project','Viewer'].map((v) => <option key={v}>{v}</option>)}</select>
      <select aria-label="Fixture surface" className={selectClass} value={surface} onChange={(e) => setSurface(e.target.value)}>{['PFD','P&ID','SLA Monitoring'].map((v) => <option key={v}>{v}</option>)}</select>
      <select aria-label="Fixture outcome" className={selectClass} value={outcome} onChange={(e) => setOutcome(e.target.value)}>{['COMPLETED','PENDING','UNKNOWN','FAILED'].map((v) => <option key={v}>{v}</option>)}</select>
      <button className={selectClass} onClick={() => setProject(project === 'SYNTHETIC-P1' ? 'SYNTHETIC-P2' : 'SYNTHETIC-P1')}>Switch fixture project</button>
    </div>
    <p>DELETE calls: {calls.filter((v) => v === 'DELETE').length} | GET calls: {calls.filter((v) => v === 'GET').length} | Refreshes: {refreshes}</p>
    {toast ? <p role="status">{toast}</p> : null}
    <div className="mt-6 overflow-x-auto border border-[#123A5A] p-4">
      <h2 className="mb-4 text-lg font-bold">{surface}</h2>
      <DocumentActionGroup documentItem={{ id: 'SYNTHETIC-D1', projectId: project, documentNumber: '20-DA-9', status: 'Process Comment', drawing: surface === 'P&ID' ? 'P&ID' : 'PFD', lifecycle: 'Active' }}
        onWorkflowComplete={async () => setRefreshes((v) => v + 1)} />
    </div>
  </main>;
};
createRoot(document.getElementById('root')).render(<StrictMode><Fixture /></StrictMode>);
