// middleware.ts  (raiz do projeto)
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Usuário autenticado tentando acessar login/register → redireciona para dashboard
    if (token && (pathname === "/login" || pathname === "/register")) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // Define quais rotas precisam de autenticação
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Rotas públicas: qualquer um acessa
        const publicPaths = ["/", "/login", "/register", "/api/users"];
        if (publicPaths.some((p) => pathname === p)) return true;

        // Rotas de API do NextAuth sempre liberadas
        if (pathname.startsWith("/api/auth")) return true;

        // Todo o resto exige autenticação
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    // Protege todas as rotas exceto _next/static, _next/image, favicon
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$).*)",
  ],
};
