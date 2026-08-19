"use client";

import { useState } from "react";
import FormInput from "@/components/forms/FormInput";
// import { useRouter } from "next/navigation";

interface RegisterForm {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export default function RegisterPage() {
  // const router = useRouter();

  const [form, setForm] = useState<RegisterForm>({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!form.username) newErrors.username = "Username is required.";
    if (!form.email) newErrors.email = "Email is required.";
    if (!form.password) newErrors.password = "Password is required.";
    if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      setIsSubmitting(true);

      // TODO: Replace with actual API call
      const response = await fakeRegisterApi(form);
      console.log("Register successful", response);

      // router.push("/dashboard");
    } catch (error: unknown) {
      console.error("Register error:", error);
      setErrors({ general: "Registration failed. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const fakeRegisterApi = async (data: RegisterForm) => {
    return new Promise<RegisterForm>((resolve) => setTimeout(() => resolve(data), 1000));
  };

  return (
    <div className="relative flex bg-custom-emerald h-screen w-full">
      <div className="absolute bg-custom-gray-blue h-full w-2/5 [clip-path:polygon(0%_0%,100%_0%,75%_100%,0%_100%)]" />
      <div className="w-full">
        <div className="relative w-1/4 min-w-96 z-10 h-140 ml-auto mr-[20%] mt-36 bg-white shadow-xl rounded-2xl p-5">
          <div className="max-w-md mx-auto mt-10">
            <h1 className="text-2xl font-bold mb-1 text-center">Register</h1>
            <h2 className="text-xs text-custom-gray-blue opacity-75 font-bold mb-6 text-center">
              Please enter the credentials
            </h2>
            <form onSubmit={handleSubmit}>
              <FormInput
                id="username"
                label="Username"
                value={form.username}
                onChange={handleChange}
                error={errors.username}
              />
              <FormInput
                id="password"
                label="Password"
                type="password"
                value={form.password}
                onChange={handleChange}
                error={errors.password}
              />
              <FormInput
                id="confirmPassword"
                label="Confirm Password"
                type="password"
                value={form.confirmPassword}
                onChange={handleChange}
                error={errors.confirmPassword}
                className="mb-12"
              />

              <button
                type="submit"
                className="w-full bg-custom-gray-blue text-white p-2 rounded-xl hover:bg-blue-700 cursor-pointer"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Registering..." : "Register"}
              </button>

              {errors.general && (
                <p className="text-red-500 text-sm text-center mt-4">{errors.general}</p>
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
              onClick={() => router.push("/auth/login")}
              className="w-full bg-custom-gray-blue text-white p-2 rounded-xl hover:bg-blue-700 cursor-pointer"
            >
              Login
            </button> */}
          </div>
        </div>
      </div>
    </div>
  );
}
