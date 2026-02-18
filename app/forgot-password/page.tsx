"use client";

import React, { useState } from "react";
import Link from "next/link";
import axios from "axios";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [resetLink, setResetLink] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");
    setResetLink(null);
    try {
      const res = await axios.post("/api/auth/forgot-password", { email: email.trim() });
      setStatus("success");
      setMessage(res.data.message ?? "If an account exists with this email, you will receive a reset link.");
      if (res.data.resetLink) setResetLink(res.data.resetLink);
    } catch (err: any) {
      setStatus("error");
      setMessage(err.response?.data?.error ?? "Something went wrong. Please try again.");
    }
  };

  return (
    <div className="min-h-full flex flex-1 flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
          Forgot your password?
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Enter your email and we’ll send you a link to reset it.
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">
              Email address
            </label>
            <div className="mt-2">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-md border-0 py-1.5 px-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                placeholder="you@example.com"
              />
            </div>
          </div>

          {message && (
            <div
              className={`rounded-md p-3 text-sm ${
                status === "error"
                  ? "bg-red-50 text-red-800"
                  : "bg-green-50 text-green-800"
              }`}
            >
              {message}
              {resetLink && (
                <p className="mt-2">
                  <a
                    href={resetLink}
                    className="font-medium underline hover:no-underline"
                  >
                    Open reset link (dev only)
                  </a>
                </p>
              )}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={status === "loading"}
              className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === "loading" ? "Sending…" : "Send reset link"}
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
