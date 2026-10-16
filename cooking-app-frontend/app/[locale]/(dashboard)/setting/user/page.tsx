"use client";

import React, { useEffect, useState } from "react";
import Field from "@/components/forms/Field";
import { getErrorMessage, UnauthorizedError } from "@/lib/errors";
import { changeUsername, changeUserPassword } from "@/lib/users/api";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useUser } from "@/components/layout/dashboardShell";

export default function AccountSettingsForm() {
  const router = useRouter();
  const translations = useTranslations("User");
  const generalTranslations = useTranslations("General");

  const { user, setUser } = useUser();
  const [newUsername, setNewUsername] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const [savingUsername, setSavingUsername] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const passwordConfirmed = newPassword === confirmNewPassword;
  const usernameUnchanged = newUsername === user?.username;

  useEffect(() => {
    setNewUsername(user?.username || "");
  }, [user]);

  async function submitUsername(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (user == null) {
      setError(translations("errors.noUser"));
      return;
    }

    if (!newUsername.trim()) {
      setError(translations("errors.usernameRequired"));
      return;
    }

    setSavingUsername(true);
    try {
      const userRes = await changeUsername({
        id: user.id,
        newUsername: newUsername.trim(),
      });
      setSuccess(translations("success.usernameUpdated"));
      setUser(userRes);
    } catch (e: unknown) {
      if (e instanceof UnauthorizedError) {
        router.replace("/login");
        return;
      }
      setError(getErrorMessage(e));
    } finally {
      setSavingUsername(false);
    }
  }

  async function submitPassword(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (user == null) {
      setError(translations("errors.noUser"));
      return;
    }
    if (!oldPassword.trim()) {
      setError(translations("errors.oldPasswordRequired"));
      return;
    }
    if (!newPassword.trim()) {
      setError(translations("errors.newPasswordRequired"));
      return;
    }
    if (newPassword.length < 6) {
      setError(translations("errors.passwordMinLength"));
      return;
    }
    if (!passwordConfirmed) {
      setError(translations("errors.passwordsNotMatch"));
      return;
    }

    setSavingPassword(true);
    try {
      await changeUserPassword({
        id: user.id,
        oldPassword: oldPassword,
        newPassword: newPassword,
      });

      setSuccess(translations("success.passwordUpdated"));
      setOldPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (e: unknown) {
      if (e instanceof UnauthorizedError) {
        router.replace("/login");
        return;
      }
      setError(getErrorMessage(e));
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div className="rounded-xl border h-auto bg-white/10 border-white/20 p-6 shadow-hard-br space-y-6 lg:w-1/2 w-full mt-6">
      <header className="relative mb-4 mx-1 flex items-center justify-center rounded-xl border border-custom-sand-dune/30 bg-custom-sand-dune/5 px-6 py-3 shadow-sm">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold tracking-tight text-custom-sand-dune">
            {translations("settingTitle")}
          </h1>
        </div>
      </header>

      <div>
        <p className="mt-1 text-sm text-gray-500">
          {translations("description")}
        </p>
      </div>

      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          {success}
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={submitUsername} className="space-y-4">
        <Field
          id="newUsername"
          label={translations("fields.newUsername")}
          value={newUsername}
          onChange={setNewUsername}
          placeholder={translations("placeholders.username")}
        />

        <div className="flex flex-row-reverse items-center justify-between gap-2">
          <button
            type="submit"
            disabled={usernameUnchanged || savingUsername}
            className="h-10 rounded-lg bg-custom-validation-green px-5 text-sm text-white disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {savingUsername
              ? generalTranslations("actions.saving")
              : translations("actions.updateUsername")}
          </button>
        </div>
      </form>

      <div className="border-t" />

      <form onSubmit={submitPassword} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Field
            id="oldPassword"
            label={translations("fields.oldPassword")}
            value={oldPassword}
            onChange={setOldPassword}
            placeholder={translations("placeholders.password")}
            type="password"
          />
          <Field
            id="newPassword"
            label={translations("fields.newPassword")}
            value={newPassword}
            onChange={setNewPassword}
            placeholder={translations("placeholders.password")}
            type="password"
          />
          <Field
            id="confirmNewPassword"
            label={translations("fields.confirmNewPassword")}
            value={confirmNewPassword}
            onChange={setConfirmNewPassword}
            placeholder={translations("placeholders.password")}
            type="password"
          />
        </div>

        <div className="flex flex-row-reverse items-center justify-between gap-2">
          <button
            type="submit"
            disabled={!passwordConfirmed || savingPassword || !newPassword}
            className="h-10 rounded-lg bg-custom-validation-green px-5 text-sm text-white disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {savingPassword
              ? generalTranslations("actions.saving")
              : translations("actions.updatePassword")}
          </button>
        </div>
      </form>
    </div>
  );
}
