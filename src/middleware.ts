export { default } from "next-auth/middleware";
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/veiculos/:path*",
    "/abastecimento/:path*",
    "/manutencao/:path*",
    "/relatorios/:path*",
    "/configuracoes/:path*",
  ],
};
