"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import axios from "axios";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setMessage("Passwords do not match.");
      setStatus("error");
      return;
    }
    if (!token) {
      setMessage("Missing reset token. Use the link from your email.");
      setStatus("error");
      return;
    }
    setStatus("loading");
    setMessage("");
    try {
      await axios.post("/api/auth/reset-password", {
        token,
        newPassword: password,
      });
      setStatus("success");
      setMessage("Password has been reset. You can now sign in with your new password.");
    } catch (err: any) {
      setStatus("error");
      setMessage(err.response?.data?.error ?? "Something went wrong. Please try again.");
    }
  };

  if (!token) {
    return (
      <div className="min-h-full flex flex-1 flex-col justify-center px-6 py-12 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm text-center">
          <h2 className="text-2xl font-bold text-gray-900">Invalid link</h2>
          <p className="mt-2 text-sm text-gray-600">
            This reset link is invalid or missing. Please request a new one from the{" "}
            <Link href="/forgot-password" className="font-semibold text-indigo-600 hover:text-indigo-500">
              forgot password
            </Link>{" "}
            page.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block text-sm font-semibold text-indigo-600 hover:text-indigo-500"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="min-h-full flex flex-1 flex-col justify-center px-6 py-12 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm text-center">
          <h2 className="text-2xl font-bold text-gray-900">Password reset</h2>
          <p className="mt-2 text-sm text-green-600">{message}</p>
          <Link
            href="/login"
            className="mt-6 inline-flex justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full flex flex-1 flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
          Set new password
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="password" className="block text-sm font-medium leading-6 text-gray-900">
              New password
            </label>
            <div className="mt-2">
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-md border-0 py-1.5 px-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              />
            </div>
          </div>
          <div>
            <label htmlFor="confirm" className="block text-sm font-medium leading-6 text-gray-900">
              Confirm password
            </label>
            <div className="mt-2">
              <input
                id="confirm"
                name="confirm"
                type="password"
                required
                minLength={6}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="block w-full rounded-md border-0 py-1.5 px-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              />
            </div>
          </div>

          {message && status === "error" && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">{message}</div>
          )}

          <div>
            <button
              type="submit"
              disabled={status === "loading"}
              className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === "loading" ? "Resetting…" : "Reset password"}
            </button>
          </div>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          <Link href="/login" className="font-semibold text-indigo-600 hover:text-indigo-500">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-full flex flex-1 items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
