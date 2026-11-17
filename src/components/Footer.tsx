import { Link } from 'react-router-dom';
import { Mail, MapPin, Phone } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-[#FAF8F5] border-t border-[#EAE4DC] text-[#4A443F]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <Link to="/" className="font-display text-2xl font-semibold text-[#1C1917]">
              Zari &amp; Loom
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-[#6B6560]">
              Curated Indian handloom sarees, bridal lehengas, and tailored silk ensembles crafted
              with master weavers across Varanasi, Kanchipuram, and Chanderi.
            </p>
          </div>

          <div>
            <h3 className="font-sans text-xs font-semibold tracking-wider text-[#1C1917] uppercase mb-4">
              Collections
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/shop?category=sarees" className="hover:text-[#1C1917] transition-colors">
                  Signature Sarees
                </Link>
              </li>
              <li>
                <Link to="/shop?category=silk-sarees" className="hover:text-[#1C1917] transition-colors">
                  Pure Silk Sarees
                </Link>
              </li>
              <li>
                <Link to="/shop?category=designer-sarees" className="hover:text-[#1C1917] transition-colors">
                  Designer Organza
                </Link>
              </li>
              <li>
                <Link to="/shop?category=lehengas" className="hover:text-[#1C1917] transition-colors">
                  Bridal Lehengas
                </Link>
              </li>
              <li>
                <Link to="/shop?category=suits" className="hover:text-[#1C1917] transition-colors">
                  Silk Suits &amp; Kurtis
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-sans text-xs font-semibold tracking-wider text-[#1C1917] uppercase mb-4">
              Client Services
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/shop" className="hover:text-[#1C1917] transition-colors">
                  Explore All Pieces
                </Link>
              </li>
              <li>
                <Link to="/cart" className="hover:text-[#1C1917] transition-colors">
                  Shopping Bag
                </Link>
              </li>
              <li>
                <Link to="/wishlist" className="hover:text-[#1C1917] transition-colors">
                  Saved Wishlist
                </Link>
              </li>
              <li>
                <Link to="/account" className="hover:text-[#1C1917] transition-colors">
                  Order History &amp; Account
                </Link>
              </li>
              <li>
                <Link to="/admin/login" className="text-[#9A7B4F] hover:text-[#1C1917] transition-colors">
                  Atelier Admin Portal
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-sans text-xs font-semibold tracking-wider text-[#1C1917] uppercase mb-4">
              Atelier &amp; Concierge
            </h3>
            <ul className="space-y-3 text-sm text-[#6B6560]">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#9A7B4F] shrink-0 mt-0.5" />
                <span>14 Kala Ghoda Heritage Lane, Fort, Mumbai 400001</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#9A7B4F] shrink-0" />
                <span className="tabular-nums">+91 22 4901 8820</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#9A7B4F] shrink-0" />
                <span>concierge@zariandloom.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-[#E6DFD6] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#7D766F]">
          <p>&copy; {new Date().getFullYear()} Zari &amp; Loom Atelier. All rights reserved.</p>
          <p>Complimentary insured shipping across India on orders above ₹4,999.</p>
        </div>
      </div>
    </footer>
  );
}
