import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-bg">
      <div className="flex flex-col items-center gap-8 w-full max-w-[430px] px-6">
        <Logo size={48} />
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text">Bem-vindo</h1>
          <p className="text-text-2 mt-1">Controle de gastos e manutenção de veículos</p>
        </div>
        <Button className="w-full">Entrar</Button>
      </div>
    </main>
  );
}
