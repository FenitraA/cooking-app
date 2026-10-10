"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { safeReadError } from "@/lib/utils";
import { useTranslations } from "next-intl";
import Field from "@/components/forms/Field";

interface LoginForm {
  username: string;
  password: string;
}

export default function LoginPage() {
  const router = useRouter();
  const translations = useTranslations("User");
  const [form, setForm] = useState<LoginForm>({
    username: "",
    password: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!form.username)
      newErrors.username = translations("errors.username_required");

    if (!form.password)
      newErrors.password = translations("errors.password_required");

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      setIsSubmitting(true);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/proxy/auth/login`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: form.username,
            password: form.password,
          }),
        },
      );

      if (!res.ok) {
        const msg = await safeReadError(res);
        throw new Error(msg || translations("errors.login_failed"));
      }

      router.push("/");
    } catch (error: unknown) {
      console.error("Login error:", error);
      setErrors({
        general: translations("errors.login_failed"),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    /* 
      Changed to flex, centering items on mobile, 
      and justifying to the end (right side) on large screens 
    */
    <div className="relative flex items-center justify-center lg:justify-end bg-custom-dark-blue min-h-screen w-full overflow-hidden">
      
      {/* Decorative background - hidden on mobile so it doesn't clutter, visible on lg screens */}
      <div className="hidden lg:block absolute left-0 top-0 bg-white/5 border-r border-white/10 h-full w-2/5 [clip-path:polygon(0%_0%,100%_0%,75%_100%,0%_100%)] pointer-events-none" />

      {/* Login Card Container */}
      <div className="relative z-10 w-full max-w-[90%] sm:max-w-md lg:w-1/4 lg:min-w-100 lg:mr-[15%] bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl rounded-2xl p-8 sm:p-10 transition-all">
        
        <div className="w-full mx-auto">
          <h1 className="text-3xl font-bold mb-2 text-center text-custom-sand-dune tracking-tight">
            {translations("welcome_back_title")}
          </h1>
          <h2 className="text-sm text-gray-300 opacity-80 mb-8 text-center">
            {translations("enter_credentials")}
          </h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-1">
            <Field
              id="username"
              label={translations("fields.username")}
              value={form.username}
              onChange={(v) => setForm((p) => ({ ...p, username: v }))}
              error={errors.username}
            />
            
            <Field
              id="password"
              label={translations("fields.password")}
              type="password"
              value={form.password}
              onChange={(v) => setForm((p) => ({ ...p, password: v }))}
              error={errors.password}
              className="mb-4"
            />

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-4 bg-custom-validation-green text-white font-semibold py-3 px-4 rounded-xl hover:bg-custom-validation-green/90 active:scale-[0.98] transition-all duration-200 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
                    <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75"></path>
                  </svg>
                  {translations("logging_in")}
                </span>
              ) : (
                translations("logging")
              )}
            </button>

            {errors.general && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 mt-4">
                <p className="text-red-400 text-sm text-center font-medium">
                  {errors.general}
                </p>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}