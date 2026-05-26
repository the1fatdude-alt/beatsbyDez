import { useState } from "react";
import { Instagram, Twitter, Youtube } from "lucide-react";
import { subscribeNewsletter } from "../lib/api";
import { toast } from "sonner";

export const Footer = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await subscribeNewsletter(email);
      toast.success("You're on the list.");
      setEmail("");
    } catch {
      toast.error("Could not subscribe. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer data-testid="footer" className="bg-black border-t border-white/10 mt-24">
      <div className="px-4 md:px-8 lg:px-12 py-16 grid md:grid-cols-3 gap-12">
        <div>
          <h3 className="font-heading text-3xl uppercase tracking-tight">
            JOIN THE LIST
          </h3>
          <p className="text-white/60 text-sm mt-2 mb-6 max-w-sm">
            Exclusive drops, artist news, and early access. Straight to your inbox. No noise.
          </p>
          <form onSubmit={submit} className="flex gap-0" data-testid="newsletter-form">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              data-testid="newsletter-email-input"
              placeholder="your@email.com"
              className="flex-1 bg-transparent border border-white/20 px-4 py-3 text-sm focus:border-[#ff3300] outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              data-testid="newsletter-submit-button"
              className="btn-brutal bg-white text-black px-6 py-3 text-xs uppercase tracking-[0.2em] font-bold hover:bg-[#ff3300] hover:text-white"
            >
              {loading ? "..." : "Join"}
            </button>
          </form>
        </div>

        <div>
          <h4 className="text-xs tracking-[0.2em] uppercase font-bold mb-4">Navigate</h4>
          <ul className="space-y-2 text-sm text-white/70">
            <li><a href="/shop" className="hover:text-[#ff3300]">Shop All</a></li>
            <li><a href="/shop?category=vinyl" className="hover:text-[#ff3300]">Vinyl</a></li>
            <li><a href="/shop?category=apparel" className="hover:text-[#ff3300]">Apparel</a></li>
            <li><a href="/artists/dez" className="hover:text-[#ff3300]">The Producer</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs tracking-[0.2em] uppercase font-bold mb-4">Follow</h4>
          <div className="flex gap-4">
            <a data-testid="social-instagram" href="#" className="border border-white/20 p-3 hover:border-[#ff3300] hover:text-[#ff3300] transition-colors">
              <Instagram className="w-4 h-4" />
            </a>
            <a data-testid="social-twitter" href="#" className="border border-white/20 p-3 hover:border-[#ff3300] hover:text-[#ff3300] transition-colors">
              <Twitter className="w-4 h-4" />
            </a>
            <a data-testid="social-youtube" href="#" className="border border-white/20 p-3 hover:border-[#ff3300] hover:text-[#ff3300] transition-colors">
              <Youtube className="w-4 h-4" />
            </a>
          </div>
          <p className="text-white/40 text-xs mt-8">
            © {new Date().getFullYear()} BeatsByDez. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
