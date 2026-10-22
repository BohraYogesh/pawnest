
import {
  LayoutDashboard,
  Package,
  Tags,
  ShoppingCart,
  Users,
  Star,
  Settings,
  X,
  PawPrint,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import sidebarPets from "../../assets/sidebar-pet.webp";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const mainNavigation = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard },
  { label: "Products", path: "/products", icon: Package },
  { label: "Categories", path: "/categories", icon: Tags },
  { label: "Orders", path: "/orders", icon: ShoppingCart },
  { label: "Users", path: "/users", icon: Users },
  { label: "Reviews", path: "/reviews", icon: Star },
];

export default function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-[100dvh] w-[260px] flex-col overflow-hidden bg-[#006047] text-white transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand */}
        <div className="mx-5 flex h-[90px] shrink-0 items-center border-b border-white/20">
          <NavLink
            to="/"
            onClick={onClose}
            className="flex items-center gap-3"
          >
            <PawPrint
              size={39}
              strokeWidth={2.1}
              className="shrink-0 text-[#FFD88A]"
              fill="#FFD88A"
            />

            <span>
              <span className="block text-[25px] font-extrabold leading-tight tracking-tight">
                PawNest
              </span>
              <span className="mt-0.5 block text-sm leading-tight text-white/80">
                Admin
              </span>
            </span>
          </NavLink>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            className="ml-auto rounded-lg p-2 hover:bg-white/10 lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav
          aria-label="Main navigation"
          className="flex min-h-0 flex-1 flex-col overflow-hidden px-3 pt-5"
        >
          <div className="shrink-0 space-y-1">
            {mainNavigation.map(({ label, path, icon: Icon }) => (
              <NavLink
                key={path}
                to={path}
                end={path === "/"}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex min-h-[43px] items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                    isActive
                      ? "bg-[#25866B] font-semibold text-white shadow-sm"
                      : "text-white/90 hover:bg-white/10 hover:text-white"
                  }`
                }
              >
                <Icon size={21} strokeWidth={1.8} />
                <span>{label}</span>
              </NavLink>
            ))}
          </div>

          {/* Divider above Settings */}
          <div className="my-5 shrink-0 border-t border-white/25" />

          {/* Settings */}
          <div className="shrink-0">
            <NavLink
              to="/settings"
              onClick={onClose}
              className={({ isActive }) =>
                `flex min-h-[43px] items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                  isActive
                    ? "bg-[#25866B] font-semibold text-white"
                    : "text-white/90 hover:bg-white/10 hover:text-white"
                }`
              }
            >
              <Settings size={21} strokeWidth={1.8} />
              <span>Settings</span>
            </NavLink>
          </div>
        </nav>

        {/* Bottom illustration — no text */}
        <div className="relative mt-auto h-[min(34vh,300px)] min-h-[155px] shrink-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[#006047] via-[#075B43] to-[#064B39]" />

          {/* Decorative leaves */}
          <div className="absolute -bottom-5 -left-7 h-32 w-20 rotate-[-25deg] rounded-full bg-[#34836A]/40 blur-sm" />
          <div className="absolute bottom-8 -right-8 h-28 w-16 rotate-[25deg] rounded-full bg-[#34836A]/40 blur-sm" />

          <img
            src={sidebarPets}
            alt="A happy dog and cat"
            className="absolute inset-x-0 bottom-0 z-10 h-full w-full object-contain object-bottom"
          />
        </div>
      </aside>
    </>
  );
}
