import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await isAdmin()) redirect("/admin");
  return (
    <main className="login">
      <div className="login-card">
        <p className="login-kicker">Backoffice</p>
        <h1>Entrar</h1>
        <LoginForm />
      </div>
    </main>
  );
}
