import { isAuthed } from "../../lib/auth";
import { getContent, hasBlob } from "../../lib/store";
import Login from "../../components/Login";
import Dashboard from "../../components/Dashboard";

export const dynamic = "force-dynamic";
export const metadata = { title: "لوحة التحكم", robots: { index: false, follow: false } };

export default async function AdminPage() {
  if (!(await isAuthed())) return <Login />;
  return <Dashboard initial={await getContent()} blobReady={hasBlob()} />;
}
