import { SignUp } from "@clerk/nextjs";

/** Account creation for new visitors. */
export default function SignUpPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[var(--sidebar)] px-4">
      <div className="mb-8 text-center">
        <p className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
          MyMomentum
        </p>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Create an account to start tracking your goals.
        </p>
      </div>
      <SignUp />
    </div>
  );
}
