// Definição dos temas completos do sistema
// Cada tema altera TODAS as variáveis CSS do app

export interface ThemeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  isDark: boolean;
  // Todas as variáveis CSS do design system
  vars: Record<string, string>;
}

export const PRESET_THEMES: ThemeDefinition[] = [
  {
    id: "light",
    name: "Faixa Branca",
    description: "Claro, limpo e minimalista. O visual padrão com fundos brancos e textos escuros.",
    icon: "🤍",
    isDark: false,
    vars: {
      "--background": "#F8FAFC",
      "--foreground": "#0F172A",
      "--card": "#FFFFFF",
      "--card-foreground": "#0F172A",
      "--popover": "#FFFFFF",
      "--popover-foreground": "#0F172A",
      "--primary": "#0F172A",
      "--primary-foreground": "#FFFFFF",
      "--secondary": "#F1F5F9",
      "--secondary-foreground": "#0F172A",
      "--muted": "#F1F5F9",
      "--muted-foreground": "#64748B",
      "--accent": "#F1F5F9",
      "--accent-foreground": "#0F172A",
      "--destructive": "#EF4444",
      "--destructive-foreground": "#FAFAFA",
      "--border": "#E2E8F0",
      "--input": "#E2E8F0",
      "--ring": "#CBD5E1",
      "--sidebar": "#FFFFFF",
      "--sidebar-foreground": "#0F172A",
      "--sidebar-accent": "#F1F5F9",
      "--sidebar-accent-foreground": "#0F172A",
      "--sidebar-border": "#E2E8F0",
    },
  },
  {
    id: "midnight",
    name: "Faixa Preta",
    description: "Escuro e sofisticado. Fundo negro com detalhes azulados, ideal para dojos tradicionais.",
    icon: "🖤",
    isDark: true,
    vars: {
      "--background": "#0B0F1A",
      "--foreground": "#E2E8F0",
      "--card": "#111827",
      "--card-foreground": "#E2E8F0",
      "--popover": "#111827",
      "--popover-foreground": "#E2E8F0",
      "--primary": "#6366F1",
      "--primary-foreground": "#FFFFFF",
      "--secondary": "#1E293B",
      "--secondary-foreground": "#E2E8F0",
      "--muted": "#1E293B",
      "--muted-foreground": "#94A3B8",
      "--accent": "#1E293B",
      "--accent-foreground": "#E2E8F0",
      "--destructive": "#F87171",
      "--destructive-foreground": "#FFFFFF",
      "--border": "#1E293B",
      "--input": "#1E293B",
      "--ring": "#334155",
      "--sidebar": "#0F172A",
      "--sidebar-foreground": "#E2E8F0",
      "--sidebar-accent": "#1E293B",
      "--sidebar-accent-foreground": "#E2E8F0",
      "--sidebar-border": "#1E293B",
    },
  },
  {
    id: "ocean",
    name: "Oceano Profundo",
    description: "Azul intenso com tons de safira. Moderno, confiável e cheio de personalidade.",
    icon: "🌊",
    isDark: true,
    vars: {
      "--background": "#0C1222",
      "--foreground": "#CBD5E1",
      "--card": "#0F1A2E",
      "--card-foreground": "#CBD5E1",
      "--popover": "#0F1A2E",
      "--popover-foreground": "#CBD5E1",
      "--primary": "#3B82F6",
      "--primary-foreground": "#FFFFFF",
      "--secondary": "#172554",
      "--secondary-foreground": "#BFDBFE",
      "--muted": "#172554",
      "--muted-foreground": "#7DD3FC",
      "--accent": "#1E3A5F",
      "--accent-foreground": "#BAE6FD",
      "--destructive": "#FB923C",
      "--destructive-foreground": "#FFFFFF",
      "--border": "#1E3A5F",
      "--input": "#1E3A5F",
      "--ring": "#2563EB",
      "--sidebar": "#0A1628",
      "--sidebar-foreground": "#CBD5E1",
      "--sidebar-accent": "#172554",
      "--sidebar-accent-foreground": "#BFDBFE",
      "--sidebar-border": "#1E3A5F",
    },
  },
];

// Gera um tema customizado a partir de uma cor hex
// Usa FUNDOS NEUTROS com a cor apenas em destaques/botões/acentos
export function generateCustomTheme(hex: string): ThemeDefinition {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  const isDark = luminance < 0.5;

  // Mix sutil: gera um off-white levemente tingido pela cor (5% da cor + 95% branco)
  const tintedWhite = `#${[r, g, b].map(c => Math.min(255, Math.round(245 + c * 0.04)).toString(16).padStart(2, '0')).join('')}`;
  // Accent suave: 10% cor + 90% branco
  const softAccent = `#${[r, g, b].map(c => Math.min(255, Math.round(235 + c * 0.08)).toString(16).padStart(2, '0')).join('')}`;

  return {
    id: "custom",
    name: "Personalizado",
    description: "Tema com fundos neutros + cor da academia nos destaques.",
    icon: "🎨",
    isDark: false, // Custom via academy primary color is generally light-based in current logic
    vars: {
      // Fundos: neutros brancos/slate — NÃO na cor da academia
      "--background": "#F8FAFC",
      "--foreground": "#0F172A",
      "--card": "#FFFFFF",
      "--card-foreground": "#0F172A",
      "--popover": "#FFFFFF",
      "--popover-foreground": "#0F172A",
      // Primary: COR DA ACADEMIA — botões, links e destaques
      "--primary": hex,
      "--primary-foreground": isDark ? "#FFFFFF" : "#0F172A",
      // Secondary/Muted: neutros com leve tint da cor
      "--secondary": softAccent,
      "--secondary-foreground": "#0F172A",
      "--muted": "#F1F5F9",
      "--muted-foreground": "#64748B",
      "--accent": softAccent,
      "--accent-foreground": "#0F172A",
      "--destructive": "#EF4444",
      "--destructive-foreground": "#FFFFFF",
      // Bordas e inputs: neutros
      "--border": "#E2E8F0",
      "--input": "#E2E8F0",
      "--ring": hex,
      // Sidebar: fundo neutro com accent na cor da academia
      "--sidebar": tintedWhite,
      "--sidebar-foreground": "#0F172A",
      "--sidebar-accent": softAccent,
      "--sidebar-accent-foreground": "#0F172A",
      "--sidebar-border": "#E2E8F0",
    },
  };
}
