"use client";

import { Flame } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="flex flex-col items-center animate-pulse">
        <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/25 mb-4">
          <Flame className="h-8 w-8 animate-bounce" />
        </div>
        <h1 className="text-xl font-bold text-foreground">Carregando...</h1>
        <p className="text-sm text-muted-foreground mt-1">Preparando o tatame virtual</p>
      </div>
    </div>
  );
}
