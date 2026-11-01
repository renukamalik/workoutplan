import { q } from '@/lib/db';
import NewClientForm from './NewClientForm';

export default async function NewClient() {
  const templates = await q<any>(`SELECT id, title FROM plans WHERE is_template ORDER BY created_at`);
  return (
    <>
      <div><h1>Add client</h1><p className="muted">Fill in what you have. She can complete the rest in her own profile.</p></div>
      <NewClientForm templates={templates} />
    </>
  );
}
