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
  // Converte HEX para RGB para cálculos
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  
  // Calcula luminância para decidir se o tema base será claro ou escuro
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  const isDarkBase = luminance < 0.6; // Se a cor for escura, vamos para um modo "Dark Premium"

  // Função helper para misturar cores
  const mix = (c1: number, c2: number, weight: number) => Math.round(c1 * weight + c2 * (1 - weight));
  const toHex = (n: number) => Math.min(255, Math.max(0, n)).toString(16).padStart(2, '0');
  const mixColor = (r1: number, g1: number, b1: number, r2: number, g2: number, b2: number, weight: number) => 
    `#${toHex(mix(r1, r2, weight))}${toHex(mix(g1, g2, weight))}${toHex(mix(b1, b2, weight))}`;

  // Se for base escura, fundos são quase pretos com tinta da cor
  // Se for base clara, fundos são quase brancos com tinta da cor
  const bgR = isDarkBase ? 10 : 252;
  const bgG = isDarkBase ? 12 : 253;
  const bgB = isDarkBase ? 18 : 255;

  const tintedBg = mixColor(r, g, b, bgR, bgG, bgB, 0.05);
  const tintedCard = mixColor(r, g, b, bgR, bgG, bgB, 0.12);
  const tintedMuted = mixColor(r, g, b, bgR, bgG, bgB, 0.20);
  const tintedBorder = mixColor(r, g, b, isDarkBase ? 40 : 220, isDarkBase ? 45 : 225, isDarkBase ? 55 : 235, 0.3);

  return {
    id: "custom",
    name: "Cores da Academia",
    description: "Tema dinâmico que adapta toda a interface às cores da sua marca.",
    icon: "🎨",
    isDark: isDarkBase,
    vars: {
      "--background": tintedBg,
      "--foreground": isDarkBase ? "#F1F5F9" : "#0F172A",
      "--card": tintedCard,
      "--card-foreground": isDarkBase ? "#F1F5F9" : "#0F172A",
      "--popover": tintedCard,
      "--popover-foreground": isDarkBase ? "#F1F5F9" : "#0F172A",
      "--primary": hex,
      "--primary-foreground": luminance < 0.7 ? "#FFFFFF" : "#0F172A",
      "--secondary": tintedMuted,
      "--secondary-foreground": isDarkBase ? "#F1F5F9" : "#0F172A",
      "--muted": tintedMuted,
      "--muted-foreground": isDarkBase ? "#94A3B8" : "#64748B",
      "--accent": hex + "20", // 12% opacity
      "--accent-foreground": isDarkBase ? "#F1F5F9" : "#0F172A",
      "--destructive": "#EF4444",
      "--destructive-foreground": "#FFFFFF",
      "--border": tintedBorder,
      "--input": tintedBorder,
      "--ring": hex,
      "--sidebar": isDarkBase ? mixColor(r, g, b, 5, 7, 10, 0.1) : mixColor(r, g, b, 255, 255, 255, 0.08),
      "--sidebar-foreground": isDarkBase ? "#F1F5F9" : "#0F172A",
      "--sidebar-accent": hex + "15",
      "--sidebar-accent-foreground": hex,
      "--sidebar-border": tintedBorder,
    },
  };
}
