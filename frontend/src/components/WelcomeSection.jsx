import { useState } from "react";
import { ArrowRight, Gift, Tag, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { subscribeNewsletter, formatApiError } from "../lib/api";
import { SOCIALS } from "../lib/socials";

const PERKS = [
  { Icon: Gift, title: "Freebies", text: "Free beats before anyone else" },
  { Icon: Tag, title: "Promos", text: "Early access + merch deals" },
  { Icon: Sparkles, title: "New Projects", text: "First word on drops & collabs" },
];

const SignupForm = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await subscribeNewsletter(email);
      setDone(true);
      setEmail("");
      toast.success(
        res.already_subscribed ? "You're already on the list." : res.welcome_sent ? "Welcome in. Check your inbox." : "Welcome in. You're on the list."
      );
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <p data-testid="welcome-signup-success" className="font-heading text-2xl md:text-3xl uppercase text-[#dfff00]">
        You're in. Welcome to the world.
      </p>
    );
  }

  return (
    <form onSubmit={submit} data-testid="welcome-signup-form" className="flex flex-col sm:flex-row max-w-xl">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        data-testid="welcome-email-input"
        className="flex-1 bg-black/60 border border-white/25 px-5 py-4 text-sm focus:border-[#dfff00] outline-none"
      />
      <button
        type="submit"
        disabled={loading}
        data-testid="welcome-signup-button"
        className="btn-brutal inline-flex items-center justify-center gap-2 bg-[#dfff00] text-black px-7 py-4 text-xs uppercase tracking-[0.2em] font-bold hover:bg-[#ff3300] hover:text-white disabled:opacity-60"
      >
        {loading ? "Joining..." : "Sign Me Up"} <ArrowRight className="w-4 h-4" />
      </button>
    </form>
  );
};

export const WelcomeSection = () => (
  <section
    id="welcome"
    data-testid="welcome-section"
    className="relative overflow-hidden px-4 md:px-8 lg:px-12 py-20 md:py-28 border-b border-white/10"
  >
    <div className="absolute -top-40 right-0 w-[45vw] h-[45vw] rounded-full bg-[#ff3300] opacity-[0.07] blur-3xl" />
    <div className="relative grid lg:grid-cols-12 gap-12 items-end">
      <div className="lg:col-span-7">
        <p className="text-xs tracking-[0.3em] uppercase text-[#ff3300] font-bold">/ The Mailing List</p>
        <h2 data-testid="welcome-headline" className="font-heading text-6xl md:text-8xl uppercase tracking-tighter leading-[0.85] mt-3">
          Welcome to<br /><span className="text-[#dfff00]">my world.</span>
        </h2>
        <p className="text-white/70 text-base md:text-lg mt-6 mb-8 max-w-lg">
          Drop your email and you're family. Freebies, promos and new projects land in your inbox first.
        </p>
        <SignupForm />
      </div>
      <div className="lg:col-span-5 space-y-6">
        <ul className="border-t border-white/10">
          {PERKS.map(({ Icon, title, text }) => (
            <li key={title} className="flex items-center gap-4 border-b border-white/10 py-4">
              <Icon className="w-5 h-5 text-[#dfff00] shrink-0" />
              <span className="font-heading text-xl uppercase tracking-tight w-36 shrink-0">{title}</span>
              <span className="text-sm text-white/60">{text}</span>
            </li>
          ))}
        </ul>
        <div>
          <p className="text-[10px] tracking-[0.3em] uppercase font-bold text-white/50 mb-3">Follow Dez</p>
          <div className="flex flex-wrap gap-2">
            {SOCIALS.map(({ key, label, href, Icon }) => (
              <a
                key={key}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                data-testid={`welcome-social-${key}`}
                className="inline-flex items-center gap-2 border border-white/20 px-4 py-2.5 text-[11px] uppercase tracking-[0.2em] font-bold hover:border-[#ff3300] hover:text-[#ff3300] transition-colors"
              >
                <Icon className="w-4 h-4" /> {label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  </section>
);
