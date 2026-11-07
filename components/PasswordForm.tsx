"use client";
import { useState } from "react";
export default function PasswordForm() {
  const [f, setF] = useState({ current: "", next: "", confirm: "" });
  const [msg, setMsg] = useState<[boolean, string] | null>(null);
  const [busy, setBusy] = useState(false);
  async function go(e: React.FormEvent) {
    e.preventDefault(); setMsg(null);
    if (f.next !== f.confirm) return setMsg([false, "تأكيد كلمة المرور غير مطابق"]);
    if (f.next.length < 6) return setMsg([false, "كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل"]);
    setBusy(true);
    const r = await fetch("/api/admin/password", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(f) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (r.ok) { setMsg([true, "✅ تم تغيير كلمة المرور. استخدم الجديدة في الدخول القادم."]); setF({ current: "", next: "", confirm: "" }); }
    else setMsg([false, "❌ " + (j.error || "تعذر التغيير")]);
  }
  const inp = (k: keyof typeof f, label: string) => (
    <label className="block mb-4"><span className="block text-sm font-semibold mb-1">{label}</span>
      <input type="password" autoComplete={k === "current" ? "current-password" : "new-password"} className="inp" value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} required /></label>
  );
  return (
    <form onSubmit={go} className="max-w-md">
      <h2 className="text-xl font-bold mb-4">تغيير كلمة المرور</h2>
      {inp("current", "كلمة المرور الحالية")}
      {inp("next", "كلمة المرور الجديدة")}
      {inp("confirm", "تأكيد كلمة المرور الجديدة")}
      {msg && <p className={`mb-3 text-sm ${msg[0] ? "text-green-700" : "text-red-600"}`}>{msg[1]}</p>}
      <button disabled={busy} className="bg-gray-900 text-white rounded-lg px-6 py-2 font-bold">{busy ? "..." : "تغيير كلمة المرور"}</button>
    </form>
  );
}
