"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

export default function ForgetPassword() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();

  if (!token) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="w-full max-w-md p-4">
          <h1 className="text-2xl font-bold">Reset Password</h1>
          <p className="text-sm text-gray-600 mb-4">
            Entrez votre mail la team
          </p>
        </div>
        <form
          action={async (formData) => {
            const email = formData.get("email") as string;
            await authClient.forgetPassword({
              email: email as string,
              redirectTo: "/auth/forget-password",
            });
          }}
        >
          <div className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200"
            >
              Send Reset Link
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="w-full max-w-md p-4">
        <h1 className="text-2xl font-bold">Reset Password</h1>
        <p className="text-sm text-gray-600 mb-4">Entrez votre mail la team</p>
      </div>
      <form
        action={async (formData) => {
          const password = formData.get("password") as string;
          await authClient.resetPassword(
            {
              newPassword: password as string,
              token: token as string,
            },
            {
              onSuccess: () => {
                router.push("/auth/signin");
              },
              onError: (ctx) => {
                toast.error(ctx.error.message);
              },
            }
          );
        }}
      >
        <div className="space-y-4">
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              New Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200"
          >
            Reset Password
          </button>
        </div>
      </form>
    </div>
  );
}
