import { LoginForm } from "./components/login-form";
import { checkSession } from "@/hooks/use-session";

export default async function LoginPage() {
  await checkSession();

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-3xl">
        <LoginForm />
      </div>
    </div>
  );
}
