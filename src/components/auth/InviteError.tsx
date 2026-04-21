import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface InviteErrorProps {
  status: "not_found" | "expired_or_used";
}

export default function InviteError({ status }: InviteErrorProps) {
  const isExpired = status === "expired_or_used";

  return (
    <div className="flex flex-col items-center">
      <div className="text-center mb-10">
        <Logo size={40} />
      </div>

      <Card className="w-full">
        <CardContent className="pt-6 flex flex-col items-center gap-4 text-center">
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-destructive"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>

          <h1 className="text-lg font-bold text-text">
            {isExpired ? "Convite expirado ou já utilizado" : "Convite não encontrado"}
          </h1>

          <p className="text-sm text-text-2">
            {isExpired
              ? "Este link de convite expirou ou já foi utilizado. Peça ao dono da conta que envie um novo convite."
              : "O link de convite que você acessou é inválido. Verifique se copiou o link corretamente."}
          </p>

          <Link href="/login" className="w-full">
            <Button variant="outline" className="w-full">
              Ir para o login
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
