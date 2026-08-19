"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation"; // ✅ locale-aware
import { ChevronDown, Globe, LogOut, Menu, Settings, User } from "lucide-react";
import { BASE_URL, LOCALES } from "@/lib/variables";
import { useUser } from "./dashboardShell";
import { fetchHealth } from "@/lib/users/api";

export default function Bannert({
  toggleMobileMenu,
}: {
  toggleMobileMenu: () => void;
}) {
  const router = useRouter();

  const gt = useTranslations("General");
  const ut = useTranslations("User");

  const pathname = usePathname(); // returns pathname WITHOUT locale, e.g. "/household"
  const locale = useLocale(); // current locale, e.g. "fr"

  const { user, setUser } = useUser();

  const [openUser, setOpenUser] = useState(false);
  const [openLang, setOpenLang] = useState(false);

  const userRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        await fetchHealth();
      } catch(e) {
        console.log(e)
      }
    }, 10 * 60 * 1000); // every 10 minutes

    return () => clearInterval(interval);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    function close(e: MouseEvent) {
      const t = e.target as Node;
      if (userRef.current && !userRef.current.contains(t)) setOpenUser(false);
      if (langRef.current && !langRef.current.contains(t)) setOpenLang(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  async function logout() {
    await fetch(`${BASE_URL}/proxy/auth/logout`, {
      method: "POST",
      credentials: "include",
    });

    setOpenUser(false);
    setUser(null);

    router.replace("/login");
    router.refresh();
  }

  function changeLanguage(nextLocale: string) {
    setOpenLang(false);
    router.replace(pathname, { locale: nextLocale });
    // router.refresh();
  }

  return (
    <div className="h-full flex items-center justify-between bg-custom-dark-blue border-b border-white/10 shadow-sm">
      {/* Logo area */}
      <div className="flex flex-row items-center gap-3 h-11/12 px-4 sm:border-r border-white/10">
        <div
          onClick={toggleMobileMenu}
          className="lg:hidden p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-md transition-colors"
        >
          <Menu size={24} />
        </div>
        <div className="hidden lg:block ">
          <Image
            src="/images/logo.png"
            width={28}
            height={28}
            alt="App logo"
            className="drop-shadow-sm"
          />
        </div>

        <h1 className="text-md sm:text-2xl font-bold tracking-tight mt-0.5">
          <span className="bg-linear-to-r from-green-400 via-green-300 to-orange-400 bg-clip-text text-transparent">
            {gt("app_title")}
          </span>
        </h1>
      </div>

      <div className="flex-1"></div>

      {/* Right side */}
      <div className="flex items-center justify-between mr-4 gap-4 px-4 sm:gap-18">
        {/* Language selector */}
        <div className="relative flex items-center gap-2" ref={langRef}>
          <Globe size={18} className="text-white/70" />

          <button
            type="button"
            className="
          flex items-center gap-2
          rounded-xl
          bg-white/10
          backdrop-blur-sm
          border border-white/10
          px-3 py-1
          text-sm text-white
          hover:bg-white/15
          transition-all
          cursor-pointer
        "
            onClick={() => setOpenLang((v) => !v)}
          >
            <span className="uppercase hidden sm:block">{locale}</span>
            <ChevronDown className="h-4 w-4" />
          </button>

          {openLang && (
            <div className="absolute right-0 top-12 w-44 rounded-2xl border border-white/10 bg-[#1f2937] shadow-xl overflow-hidden">
              {LOCALES.map((l) => (
                <button
                  key={l.value}
                  type="button"
                  onClick={() => changeLanguage(l.value)}
                  className={`
                w-full text-left px-4 py-3 text-sm text-white/90
                hover:bg-white/10 transition-colors cursor-pointer
                ${l.value === locale ? "bg-white/10 font-semibold" : ""}
              `}
                >
                  {l.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* User menu */}
        <div className="relative" ref={userRef}>
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => setOpenUser((v) => !v)}
            role="button"
            tabIndex={0}
          >
            <div
              className="
            h-8 w-8 rounded-full
            bg-white/10
            border border-white/10
            backdrop-blur-sm
            flex items-center justify-center
            hover:bg-white/15
            transition-all
          "
            >
              <User size={16} className="text-white/90" />
            </div>

            <div className="hidden sm:block text-sm text-white/90 font-medium">
              {user?.username}
            </div>
          </div>

          {openUser && (
            <div className="absolute right-0 top-12 w-52 rounded-2xl border border-white/10 bg-[#1f2937] shadow-xl overflow-hidden">
              <Link
                onClick={() => setOpenUser(false)}
                href="/setting/user"
                className="
              flex items-center px-4 py-3 text-sm
              text-white/90 hover:bg-white/10
              transition-colors
            "
              >
                <Settings size={18} className="mr-3" />
                {ut("setting_title")}
              </Link>

              <button
                onClick={logout}
                className="
              flex items-center w-full px-4 py-3 text-sm
              text-red-400 hover:bg-red-500/10
              transition-colors cursor-pointer
            "
                type="button"
              >
                <LogOut size={18} className="mr-3" />
                {gt("actions.logout")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
