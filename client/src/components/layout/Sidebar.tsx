
import { useState } from "react";
import {
  LayoutDashboard,
  Package,
  Tags,
  ShoppingCart,
  Users,
  Star,
  Settings,
  X,
  LogOut,
  PawPrint,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { logoutUser } from "../../features/auth/auth.api";
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
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const logoutMutation = useMutation({
    mutationFn: logoutUser,
    onSuccess: async () => {
      await queryClient.cancelQueries();
      queryClient.clear();
      setShowLogoutConfirm(false);
      onClose();
      toast.success("Logged out successfully");
      navigate("/login", { replace: true });
    },
    onError: () => {
      toast.error("Logout failed. Please try again.");
    },
  });

  function handleLogout() {
    logoutMutation.mutate();
  }

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

            <button
              type="button"
              onClick={() => setShowLogoutConfirm(true)}
              className="mt-1 flex min-h-[43px] w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-white/90 transition-colors hover:bg-white/10 hover:text-white"
            >
              <LogOut size={21} strokeWidth={1.8} />
              <span>Logout</span>
            </button>
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

      {/* Logout confirmation */}
      {showLogoutConfirm && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 px-4 py-6 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !logoutMutation.isPending
            ) {
              setShowLogoutConfirm(false);
            }
          }}
        >
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="logout-title"
            aria-describedby="logout-description"
            className="w-full max-w-sm rounded-2xl border border-slate-100 bg-white p-6"
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <LogOut size={26} />
            </div>

            <h2
              id="logout-title"
              className="mt-4 text-center text-xl font-bold text-slate-900"
            >
              Confirm Logout
            </h2>

            <p
              id="logout-description"
              className="mt-2 text-center text-sm leading-6 text-slate-500"
            >
              Are you sure you want to log out of your PawNest Admin Panel?
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={logoutMutation.isPending}
                onClick={() => setShowLogoutConfirm(false)}
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              {/* <button
                type="button"
                disabled={logoutMutation.isPending}
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {logoutMutation.isPending ? (
                  <>
                    <LoaderCircle size={16} className="animate-spin" />
                    Logging out
                  </>
                ) : (
                  "Yes, Logout"
                )}
              </button> */}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
