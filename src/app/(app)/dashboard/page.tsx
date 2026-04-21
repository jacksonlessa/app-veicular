import { getServerSession } from "next-auth";
import { authOptions } from "@/infrastructure/auth/nextauth.config";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  return <div>Em construção — usuário: {session?.userId}</div>;
}
