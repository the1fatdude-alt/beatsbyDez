import { useEffect, useState } from "react";
import { Download, LogOut } from "lucide-react";
import { toast } from "sonner";
import {
  adminLogin, adminLogout, adminMe, fetchSubscribers, downloadSubscribersCsv, formatApiError,
} from "../lib/api";

const LoginForm = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      onLogin(await adminLogin(email, password));
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} data-testid="admin-login-form" className="max-w-sm space-y-4">
      <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email"
        data-testid="admin-email-input" className="w-full bg-transparent border border-white/20 px-4 py-3 text-sm focus:border-[#ff3300] outline-none" />
      <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password"
        data-testid="admin-password-input" className="w-full bg-transparent border border-white/20 px-4 py-3 text-sm focus:border-[#ff3300] outline-none" />
      {error && <p data-testid="admin-login-error" className="text-sm text-[#ff3300]">{error}</p>}
      <button type="submit" disabled={loading} data-testid="admin-login-button"
        className="btn-brutal w-full bg-white text-black py-3 text-xs uppercase tracking-[0.2em] font-bold hover:bg-[#ff3300] hover:text-white disabled:opacity-60">
        {loading ? "Signing in..." : "Sign In"}
      </button>
    </form>
  );
};

const SubscriberList = ({ onLogout }) => {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchSubscribers().then(setData).catch((err) => toast.error(formatApiError(err)));
  }, []);

  const exportCsv = async () => {
    const blob = await downloadSubscribersCsv();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "beatsbydez-subscribers.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div data-testid="admin-subscribers">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <p className="font-heading text-4xl uppercase">
          <span data-testid="admin-subscriber-count" className="text-[#dfff00]">{data ? data.count : "—"}</span> signups
        </p>
        <div className="flex gap-2">
          <button onClick={exportCsv} data-testid="admin-export-csv-button"
            className="btn-brutal inline-flex items-center gap-2 bg-[#dfff00] text-black px-5 py-3 text-xs uppercase tracking-[0.2em] font-bold hover:bg-white">
            <Download className="w-4 h-4" /> Download CSV
          </button>
          <button onClick={onLogout} data-testid="admin-logout-button"
            className="btn-brutal inline-flex items-center gap-2 border border-white/30 px-5 py-3 text-xs uppercase tracking-[0.2em] font-bold hover:border-[#ff3300] hover:text-[#ff3300]">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </div>
      <div className="border border-white/10 divide-y divide-white/10">
        {data?.subscribers.map((s) => (
          <div key={s.email} data-testid="admin-subscriber-row" className="flex justify-between gap-4 px-4 py-3 text-sm">
            <span className="truncate">{s.email}</span>
            <span className="text-white/50 shrink-0">
              {s.subscribed_at ? new Date(s.subscribed_at).toLocaleDateString() : ""}
              {s.welcome_sent ? " · welcomed" : ""}
            </span>
          </div>
        ))}
        {data && data.count === 0 && <p className="px-4 py-6 text-white/50 text-sm">No signups yet.</p>}
      </div>
    </div>
  );
};

export default function Admin() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    adminMe().then(setUser).catch(() => setUser(false));
  }, []);

  const logout = async () => {
    await adminLogout();
    setUser(false);
  };

  return (
    <div data-testid="admin-page" className="px-4 md:px-8 lg:px-12 py-12 md:py-16 max-w-4xl">
      <p className="text-xs tracking-[0.3em] uppercase text-[#ff3300] font-bold">/ Private</p>
      <h1 className="font-heading text-5xl md:text-7xl uppercase tracking-tighter mt-2 mb-10">Mailing List</h1>
      {user === null && <p className="text-white/50">Loading...</p>}
      {user === false && <LoginForm onLogin={setUser} />}
      {user && <SubscriberList onLogout={logout} />}
    </div>
  );
}
