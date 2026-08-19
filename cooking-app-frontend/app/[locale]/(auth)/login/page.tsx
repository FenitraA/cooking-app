"use client";

import { useState } from "react";
import FormInput from "@/components/forms/FormInput";
import { useRouter } from "next/navigation";
import { safeReadError } from "@/lib/utils";
import { useTranslations } from "next-intl";

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
          credentials: "include", // IMPORTANT, to allow cookies from backend
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

      // Redirect or handle success
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
    <div className="relative flex bg-custom-dark-blue h-screen w-full">
      <div className="absolute bg-white/10 border h-full w-2/5 [clip-path:polygon(0%_0%,100%_0%,75%_100%,0%_100%)]" />
      <div className="w-full">
        <div className="relative w-1/4 min-w-96 z-10 h-110  ml-auto mr-[20%] mt-36 bg-white/10 border border-white/20 shadow-xl rounded-2xl p-5">
          <div className="max-w-md mx-auto mt-10">
            <h1 className="text-2xl font-bold mb-1 text-center text-custom-sand-dune">
              {translations("welcome_back_title")}
            </h1>
            <h2 className="text-xs text-gray-300 opacity-75 font-bold mb-6 text-center">
              {translations("enter_credentials")}
            </h2>
            <form onSubmit={handleSubmit}>
              <FormInput
                id="username"
                label={translations("fields.username")}
                value={form.username}
                onChange={handleChange}
                error={errors.username}
              />
              <FormInput
                id="password"
                label={translations("fields.password")}
                type="password"
                value={form.password}
                onChange={handleChange}
                error={errors.password}
                className="mb-12"
              />

              <button
                type="submit"
                className="w-full bg-custom-validation-green text-white p-2 rounded-xl hover:bg-custom-validation-green/80 cursor-pointer"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? translations("logging_in")
                  : translations("logging")}
              </button>

              {errors.general && (
                <p className="text-red-500 text-sm text-center mt-4">
                  {errors.general}
                </p>
              )}
            </form>

            {/* <div className="relative h-5 w-full p-4 mt-8">
              <span className="absolute -top-3 left-1/2 px-4 transform -translate-x-1/2 text-md font-semibold font-sans text-custom-selective-yellow pointer-events-none">
                Or
              </span>
              <div className="absolute top-0 right-0 w-2/5 border-t border-custom-gray-blue pointer-events-none transform translate-z-0" />
              <div className="absolute top-0 left-0 w-2/5 border-t border-custom-gray-blue pointer-events-none transform translate-z-0" />
            </div>

            <button
              onClick={() => router.push("/auth/register")}
              className="w-full bg-custom-gray-blue text-white p-2 rounded-xl hover:bg-blue-700 cursor-pointer"
            >
              Register
            </button> */}
          </div>
        </div>
      </div>
    </div>
  );
}
