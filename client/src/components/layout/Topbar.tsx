import { useState } from "react";
import { Menu, UserRound, ChevronDown } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { logoutUser } from "../../features/auth/auth.api";
import NotificationBell from "../../features/notifications/components/NotificationBell";
import { getAdminProfile } from "../../features/profile/profile.api";
import GlobalSearch from "./GlobalSearch";

interface TopbarProps {
  onMenuClick: () => void;
}

export default function Topbar({ onMenuClick }: TopbarProps) {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch admin profile, including avatar
  const { data: profile } = useQuery({
    queryKey: ["admin-profile"],
    queryFn: getAdminProfile,
  });

  const logoutMutation = useMutation({
    mutationFn: logoutUser,

    onSuccess: async () => {
      await queryClient.clear();
      setProfileMenuOpen(false);
      toast.success("Logged out successfully");
      navigate("/login", { replace: true });
    },

    onError: () => {
      toast.error("Logout failed. Please try again.");
    },
  });

  function handleProfileClick() {
    setProfileMenuOpen(false);
    navigate("/profile");
  }

  function handleLogout() {
    setProfileMenuOpen(false);
    setLogoutConfirmOpen(true);
  }

  function confirmLogout() {
    logoutMutation.mutate(undefined, {
      onSettled: () => {
        setLogoutConfirmOpen(false);
      },
    });
  }

  // Reusable avatar UI
  function AdminAvatar({ size = "normal" }: { size?: "normal" | "small" }) {
    const dimensions = size === "normal" ? "h-10 w-10" : "h-10 w-10";

    return (
      <span
        className={`flex ${dimensions} shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#49866E]/15 text-[#295F4C]`}
      >
        {profile?.avatarUrl ? (
          <img
            src={profile.avatarUrl}
            alt={profile.name || "Admin"}
            className="h-full w-full object-cover"
          />
        ) : (
          <UserRound size={21} />
        )}
      </span>
    );
  }

  return (
    <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8">
      {/* Left Section */}
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation"
          className="rounded-xl p-2 text-slate-600 transition hover:bg-[#49866E]/10 hover:text-[#295F4C] lg:hidden"
        >
          <Menu size={22} />
        </button>

        {/* Search */}
        <GlobalSearch />

        {/* Mobile Brand */}
        <span className="truncate text-lg font-bold text-[#295F4C] sm:hidden">
          PawNest
        </span>
      </div>

      {/* Right Section */}
      <div className="flex shrink-0 items-center gap-2 sm:gap-4">
        <NotificationBell />

        <div className="h-8 w-px bg-slate-200" />

        {/* Admin Profile Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setProfileMenuOpen((open) => !open)}
            aria-expanded={profileMenuOpen}
            aria-haspopup="menu"
            aria-label="Open admin profile menu"
            className="flex items-center gap-2 rounded-xl p-1.5 transition hover:bg-slate-50 sm:gap-3"
          >
            <AdminAvatar />

            <span className="hidden text-left sm:block">
              <span className="block max-w-36 truncate text-sm font-semibold text-slate-800">
                {profile?.name || "Admin"}
              </span>

              <span className="block text-xs text-slate-500">
                {profile?.role || "Store Manager"}
              </span>
            </span>

            <ChevronDown
              size={16}
              className={`hidden text-slate-400 transition-transform sm:block ${
                profileMenuOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Dropdown */}
          {profileMenuOpen && (
            <>
              {/* Click outside to close */}
              <button
                type="button"
                aria-label="Close profile menu"
                className="fixed inset-0 z-40 cursor-default"
                onClick={() => setProfileMenuOpen(false)}
              />

              <div
                role="menu"
                className="absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-xl"
              >
                {/* Profile Header */}
                <div className="flex items-center gap-3 rounded-xl bg-[#49866E]/10 px-3 py-3">
                  <AdminAvatar />

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {profile?.name || "Admin"}
                    </p>

                    <p className="text-xs text-slate-500">
                      {profile?.role || "Store Manager"}
                    </p>
                  </div>
                </div>

                {/* My Profile */}
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleProfileClick}
                  className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-700 transition hover:bg-[#49866E]/10 hover:text-[#295F4C]"
                >
                  <UserRound size={19} />
                  <span>My Profile</span>
                </button>

                {/* Logout */}
                <button
                  type="button"
                  role="menuitem"
                  disabled={logoutMutation.isPending}
                  onClick={handleLogout}
                  className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {logoutMutation.isPending ? (
                    <span className="h-[19px] w-[19px] animate-spin rounded-full border-2 border-red-600/30 border-t-red-600" />
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="19"
                      height="19"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" x2="9" y1="12" y2="12" />
                    </svg>
                  )}

                  <span>
                    {logoutMutation.isPending ? "Logging out..." : "Logout"}
                  </span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {logoutConfirmOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-modal-title"
            className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-6 shadow-2xl"
          >
            {/* Icon */}
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="27"
                height="27"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" x2="9" y1="12" y2="12" />
              </svg>
            </div>

            {/* Content */}
            <div className="mt-4 text-center">
              <h2
                id="logout-modal-title"
                className="text-xl font-bold text-slate-900"
              >
                Confirm Logout
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Are you sure you want to log out of your PawNest Admin account?
                You will need to log in again to access your dashboard.
              </p>
            </div>

            {/* Actions */}
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                disabled={logoutMutation.isPending}
                onClick={() => setLogoutConfirmOpen(false)}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-1"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={logoutMutation.isPending}
                onClick={confirmLogout}
                className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-1"
              >
                {logoutMutation.isPending && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                )}

                {logoutMutation.isPending ? "Logging out..." : "Yes, Logout"}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
