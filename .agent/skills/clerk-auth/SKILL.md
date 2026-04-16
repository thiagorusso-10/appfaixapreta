---
name: clerk-auth
description: Guia especializado sobre implementação de autenticação com Clerk em aplicações React/Vite, incluindo configuração, componentes e padrões de proteção. Útil quando o usuário precisa adicionar login, cadastro ou gerenciamento de usuários.
---

# Autenticação com Clerk (React/Vite)

Esta skill fornece orientações e padrões para implementar autenticação segura usando Clerk em aplicações React puras (Vite).

## Início Rápido

### 1. Instalação

```bash
npm install @clerk/clerk-react
```

### 2. Configuração de Ambiente

Adicione sua chave publicável ao arquivo `.env`:

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
```

### 3. Configuração do Provider

Envolva sua aplicação com o `<ClerkProvider>` no ponto de entrada (ex: `main.tsx`):

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import App from './App'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key")
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <App />
    </ClerkProvider>
  </React.StrictMode>,
)
```

## Componentes de Controle

Use estes componentes para controlar a visibilidade da UI baseada no estado de autenticação:

- **`<SignedIn>`**: Renderiza filhos apenas quando o usuário está logado.
- **`<SignedOut>`**: Renderiza filhos apenas quando o usuário NÃO está logado.
- **`<UserButton>`**: Botão de perfil do usuário (avatar + menu).
- **`<SignInButton>`**: Botão que abre o modal/página de login.

### Exemplo de Header

```tsx
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react";

export default function Header() {
  return (
    <header>
      <nav>
        <SignedOut>
          <SignInButton />
        </SignedOut>
        <SignedIn>
          <UserButton />
        </SignedIn>
      </nav>
    </header>
  );
}
```

## Hooks

Use hooks para acessar dados do usuário e sessão:

- **`useUser()`**: Retorna `{ isLoaded, isSignedIn, user }`. Útil para exibir nome, email, etc.
- **`useAuth()`**: Retorna `{ isLoaded, userId, sessionId, getToken }`. Útil para proteger rotas ou fazer chamadas API autenticadas.

## Proteção de Rotas

Para proteger rotas em React (SPA), recomenda-se renderização condicional ou wrappers de rota.

Veja [references/react-router.md](references/react-router.md) para integração com React Router.
