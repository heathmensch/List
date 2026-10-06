import { SignIn } from "@clerk/nextjs";

/** First screen for signed-out visitors (middleware redirects here). */
export default function SignInPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[var(--sidebar)] px-4">
      <div className="mb-8 text-center">
        <p className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
          MyMomentum
        </p>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Sign in to continue to your goals and daily plan.
        </p>
      </div>
      <SignIn />
    </div>
  );
}
