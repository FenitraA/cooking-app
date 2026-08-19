"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import Banner from "@/components/layout/Banner";
import Sidebar from "@/components/layout/Sidebar";
import { UnauthorizedError } from "@/lib/errors";
import { fetchConnectedUser } from "@/lib/users/api"; // your function

type User = { id: string; username: string };

export const UserContext = React.createContext<{
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
} | null>(null);

export function useUser() {
  const ctx = React.useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used inside DashboardShell");
  return ctx;
}

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function toggleMobileMenu() {
    setMobileMenuOpen((prev) => !prev);
  }
  useEffect(() => {
    let cancelled = false;

    async function loadMe() {
      try {
        const u = await fetchConnectedUser();
        if (!cancelled) setUser(u);
      } catch (e: unknown) {
        if (e instanceof UnauthorizedError) {
          router.replace("/login");
          return;
        }
        if (!cancelled) setUser(null);
      }
    }

    loadMe();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      <div className="min-h-screen bg-custom-dark-blue">
        <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-white border-b">
          <Banner toggleMobileMenu={toggleMobileMenu} />
        </header>

        <aside
          className={`
            fixed top-16 bottom-0 left-0 z-40
            transition-transform duration-300

            lg:translate-x-0

            ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          `}
        >
          <Sidebar toggleMobileMenu={toggleMobileMenu} />
        </aside>

        <main className="pt-14 lg:pl-16">
          <div className="p-3 sm:p-6">{children}</div>
        </main>
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
      </div>
    </UserContext.Provider>
  );
}
