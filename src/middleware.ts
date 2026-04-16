import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Rotas que NÃO exigem autenticação
const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/login',
  '/',
  '/manifest.json',
]);

export default clerkMiddleware(async (auth, req) => {
  // Se NÃO for rota pública, exige login
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
