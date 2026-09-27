"use client";

import { lusitana } from "@/app/ui/fonts";
import {
  AtSymbolIcon,
  KeyIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import { ArrowRightIcon } from "@heroicons/react/20/solid";
import { Button } from "@/app/ui/button";
import { useActionState } from "react";
import { authenticate, authenticateWithOAuth } from "@/app/lib/actions";
import { useSearchParams } from "next/navigation";
import type { OAuthProviderId } from "@/app/lib/auth-providers";

const oauthProviderLabels: Record<OAuthProviderId, string> = {
  github: "GitHub",
  google: "Google",
  "microsoft-entra-id": "Microsoft",
};

export default function LoginForm({
  enabledOAuthProviders,
}: {
  enabledOAuthProviders: OAuthProviderId[];
}) {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const [errorMessage, formAction, isPending] = useActionState(
    authenticate,
    undefined,
  );

  return (
    <>
      <form action={formAction} className="space-y-3">
        <div className="flex-1 rounded-lg bg-gray-50 px-6 pb-4 pt-8">
          <h1 className={`${lusitana.className} mb-3 text-2xl`}>
            Please log in to continue.
          </h1>
          <div className="w-full">
            <div>
              <label
                className="mb-3 mt-5 block text-xs font-medium text-gray-900"
                htmlFor="email"
              >
                Email
              </label>
              <div className="relative">
                <input
                  className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500"
                  id="email"
                  type="email"
                  name="email"
                  placeholder="Enter your email address"
                  required
                />
                <AtSymbolIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
              </div>
            </div>
            <div className="mt-4">
              <label
                className="mb-3 mt-5 block text-xs font-medium text-gray-900"
                htmlFor="password"
              >
                Password
              </label>
              <div className="relative">
                <input
                  className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500"
                  id="password"
                  type="password"
                  name="password"
                  placeholder="Enter password"
                  required
                  minLength={6}
                />
                <KeyIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
              </div>
            </div>
          </div>
          <input type="hidden" name="redirectTo" value={callbackUrl} />
          <Button className="mt-4 w-full" aria-disabled={isPending}>
            Log in <ArrowRightIcon className="ml-auto h-5 w-5 text-gray-50" />
          </Button>
          <div
            className="flex h-8 items-end space-x-1"
            aria-live="polite"
            aria-atomic="true"
          >
            {errorMessage && (
              <>
                <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
                <p className="text-sm text-red-500">{errorMessage}</p>
              </>
            )}
          </div>
        </div>
      </form>
      <div className="mt-3 space-y-3 rounded-lg bg-gray-50 px-6 py-4">
        <p className="text-center text-sm text-gray-500">Or continue with</p>
        {(["github", "google", "microsoft-entra-id"] as const).map(
          (provider) => {
            const isEnabled = enabledOAuthProviders.includes(provider);
            return (
              <form action={authenticateWithOAuth} key={provider}>
                <input type="hidden" name="provider" value={provider} />
                <input type="hidden" name="redirectTo" value={callbackUrl} />
                <button
                  className="flex h-10 w-full items-center justify-center rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!isEnabled}
                  type="submit"
                >
                  Continue with {oauthProviderLabels[provider]}
                </button>
              </form>
            );
          },
        )}
        {enabledOAuthProviders.length < 3 && (
          <p className="text-center text-xs text-gray-500">
            OAuth options require provider credentials to be configured.
          </p>
        )}
      </div>
    </>
  );
}
