# Integração Clerk + React Router

Ao usar `react-router-dom`, você pode criar um componente de proteção de rota (`ProtectedRoute`) para redirecionar usuários não autenticados.

## Exemplo de ProtectedRoute

```tsx
// components/ProtectedRoute.tsx
import { useAuth } from "@clerk/clerk-react";
import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return <div>Carregando...</div>;
  }

  if (!isSignedIn) {
    // Redireciona para login se não estiver autenticado
    return <Navigate to="/sign-in" replace />;
  }

  // Renderiza a rota filha se autenticado
  return <Outlet />;
}
```

## Configuração de Rotas

```tsx
// App.tsx
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import PublicPage from "./pages/PublicPage";

function App() {
  return (
    <Routes>
      {/* Rotas Públicas */}
      <Route path="/" element={<PublicPage />} />
      
      {/* Rotas Protegidas */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
      </Route>
    </Routes>
  );
}
```
