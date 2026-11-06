"use client";
import { useState } from "react";
export default function Login() {
  const [p, setP] = useState(""); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  async function go(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr("");
    const r = await fetch("/api/admin/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ password: p }) });
    setBusy(false);
    if (r.ok) location.reload(); else setErr("كلمة المرور غير صحيحة");
  }
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-900 p-4">
      <form onSubmit={go} className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold text-center">تسجيل دخول لوحة التحكم</h1>
        <input type="password" className="inp" placeholder="كلمة المرور" value={p} onChange={(e) => setP(e.target.value)} autoFocus />
        {err && <p className="text-red-600 text-sm">{err}</p>}
        <button disabled={busy} className="w-full bg-gray-900 text-white rounded-lg py-2 font-bold">{busy ? "..." : "دخول"}</button>
      </form>
    </main>
  );
}
