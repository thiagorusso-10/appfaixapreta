"use client";

import { useAcademy } from "@/contexts/AcademyThemeContext";
import { useSupabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { Check, Palette, Paintbrush, Sparkles, Upload, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { PRESET_THEMES, generateCustomTheme, type ThemeDefinition } from "@/lib/themes";

// Mini preview component que simula o app inteiro com as cores do tema
function ThemePreview({ theme, compact = false }: { theme: ThemeDefinition; compact?: boolean }) {
  const v = theme.vars;
  return (
    <div
      className={cn("rounded-xl overflow-hidden border shadow-inner", compact ? "w-full" : "w-full")}
      style={{ borderColor: v["--border"] }}
    >
      {/* Simulated top bar */}
      <div className="flex h-5 items-center px-2 gap-1" style={{ backgroundColor: v["--sidebar"], borderBottom: `1px solid ${v["--border"]}` }}>
        <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "#EF4444" }} />
        <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "#F59E0B" }} />
        <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "#22C55E" }} />
        <span className="text-[6px] ml-1 font-medium" style={{ color: v["--muted-foreground"] }}>Faixa Preta</span>
      </div>
      <div className="flex" style={{ backgroundColor: v["--background"] }}>
        {/* Sidebar */}
        <div className="w-12 shrink-0 p-1.5 space-y-1" style={{ backgroundColor: v["--sidebar"], borderRight: `1px solid ${v["--border"]}` }}>
          <div className="h-4 w-4 mx-auto rounded" style={{ backgroundColor: v["--primary"] }} />
          <div className="h-1.5 w-6 mx-auto rounded-full" style={{ backgroundColor: v["--sidebar-accent"] }} />
          <div className="h-1.5 w-6 mx-auto rounded-full" style={{ backgroundColor: v["--sidebar-accent"] }} />
          <div className="h-1.5 w-6 mx-auto rounded-full mt-2" style={{ backgroundColor: v["--primary"], opacity: 0.5 }} />
        </div>
        {/* Main content */}
        <div className="flex-1 p-2 space-y-1.5 min-h-[80px]">
          {/* Title */}
          <div className="h-1.5 w-12 rounded-full" style={{ backgroundColor: v["--foreground"] }} />
          <div className="h-1 w-16 rounded-full" style={{ backgroundColor: v["--muted-foreground"], opacity: 0.5 }} />
          {/* Cards Row */}
          <div className="flex gap-1 mt-1">
            <div className="flex-1 rounded p-1" style={{ backgroundColor: v["--card"], border: `1px solid ${v["--border"]}` }}>
              <div className="h-1 w-4 rounded-full mb-0.5" style={{ backgroundColor: v["--muted-foreground"] }} />
              <div className="h-2 w-5 rounded-sm" style={{ backgroundColor: v["--foreground"] }} />
            </div>
            <div className="flex-1 rounded p-1" style={{ backgroundColor: v["--card"], border: `1px solid ${v["--border"]}` }}>
              <div className="h-1 w-4 rounded-full mb-0.5" style={{ backgroundColor: v["--muted-foreground"] }} />
              <div className="h-2 w-5 rounded-sm" style={{ backgroundColor: v["--foreground"] }} />
            </div>
          </div>
          {/* Button */}
          <div className="flex gap-1 mt-1">
            <div className="h-3 w-10 rounded text-[5px] font-bold flex items-center justify-center" style={{ backgroundColor: v["--primary"], color: v["--primary-foreground"] }}>
              Botão
            </div>
            <div className="h-3 w-8 rounded text-[5px] flex items-center justify-center" style={{ backgroundColor: v["--secondary"], color: v["--secondary-foreground"] }}>
              Sec
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { academy, updateAcademy, saveAcademyToDb, activeTheme, applyTheme, isSaving } = useAcademy();
  const [isCustom, setIsCustom] = useState(activeTheme.id === "custom");
  const [customColor, setCustomColor] = useState(academy?.primaryColorHex || "#3B82F6");
  const [academyName, setAcademyName] = useState(academy?.name || "");
  const [academyDoc, setAcademyDoc] = useState(academy?.documentNumber || "");
  const [pixKey, setPixKey] = useState(academy?.pixKey || "");
  const [saved, setSaved] = useState(false);
  const [customThemePreview, setCustomThemePreview] = useState<ThemeDefinition | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(academy?.logoUrl || null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoUploadError, setLogoUploadError] = useState<string | null>(null);

  const supabase = useSupabase();

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !academy?.id) return;

    setIsUploadingLogo(true);
    setLogoUploadError(null);

    const reader = new FileReader();
    reader.onloadend = () => {
      // 1. Comprimir com canvas (máx 300px, webp 80%)
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 300;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) { height = Math.round(height * MAX_SIZE / width); width = MAX_SIZE; }
        } else {
          if (height > MAX_SIZE) { width = Math.round(width * MAX_SIZE / height); height = MAX_SIZE; }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        // 2. Converter canvas para Blob (formato webp para menor peso)
        canvas.toBlob(async (blob) => {
          if (!blob) {
            setLogoUploadError('Falha ao processar imagem.');
            setIsUploadingLogo(false);
            return;
          }

          try {
            // 3. Upload para o Supabase Storage
            const fileName = `logo_${academy.id}_${Date.now()}.webp`;
            const filePath = `${academy.id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
              .from('academy-logos')
              .upload(filePath, blob, {
                contentType: 'image/webp',
                upsert: true, // Substitui se já existir
              });

            if (uploadError) {
              console.error('Erro no upload da logo:', uploadError);
              setLogoUploadError('Erro ao enviar imagem. Tente novamente.');
              setIsUploadingLogo(false);
              return;
            }

            // 4. Pega a URL pública permanente
            const { data } = supabase.storage
              .from('academy-logos')
              .getPublicUrl(filePath);

            const publicUrl = data.publicUrl;

            // 5. Atualiza preview local e o contexto
            setLogoPreview(publicUrl);
            await updateAcademy({ logoUrl: publicUrl });

            // 6. Salva a URL no banco imediatamente
            await supabase
              .from('academies')
              .update({ logo_url: publicUrl })
              .eq('id', academy.id);
          } catch (err) {
            console.error('Exceção no upload da logo:', err);
            setLogoUploadError('Erro inesperado ao enviar imagem.');
          } finally {
            setIsUploadingLogo(false);
          }
        }, 'image/webp', 0.8);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = async () => {
    setLogoPreview(null);
    await updateAcademy({ logoUrl: undefined });
    if (academy?.id) {
      await supabase.from('academies').update({ logo_url: null }).eq('id', academy.id);
    }
  };

  if (!academy) return null;

  const handleSelectPreset = (theme: ThemeDefinition) => {
    setIsCustom(false);
    applyTheme(theme);
  };

  const handleCustomColorChange = (color: string) => {
    setCustomColor(color);
    if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
      const theme = generateCustomTheme(color);
      setCustomThemePreview(theme);
    }
  };

  const handleApplyCustom = () => {
    if (/^#[0-9A-Fa-f]{6}$/.test(customColor)) {
      const theme = generateCustomTheme(customColor);
      setIsCustom(true);
      applyTheme(theme);
      updateAcademy({ primaryColorHex: customColor });
    }
  };

  const handleSave = async () => {
    const newName = academyName || academy.name;
    const newDoc = academyDoc || academy.documentNumber;
    const newPix = pixKey || academy.pixKey;

    // 1. Atualiza estado local e localStorage imediatamente
    await updateAcademy({
      name: newName,
      documentNumber: newDoc,
      pixKey: newPix,
    });

    // 2. Salva DIRETAMENTE no Supabase com os valores do formulário
    // (Não usa saveAcademyToDb porque o estado React ainda não atualizou neste ponto)
    try {
      const dbPayload: Record<string, any> = {
        name: newName,
        document_number: newDoc || null,
        pix_key: newPix || null,
        primary_color_hex: academy.primaryColorHex ?? '#3B82F6',
      };

      // Inclui logo_url se existir e não for base64
      if (academy.logoUrl && !academy.logoUrl.startsWith('data:')) {
        dbPayload.logo_url = academy.logoUrl;
      }

      const { error } = await supabase
        .from('academies')
        .update(dbPayload)
        .eq('id', academy.id);

      if (error) {
        console.error('handleSave: erro ao salvar no banco:', error);
        setSaved(false);
        alert(`Erro ao salvar: ${error.message}`);
        return;
      }

      // Atualiza cache local com dados confirmados
      const updatedAcademy = { ...academy, name: newName, documentNumber: newDoc, pixKey: newPix };
      localStorage.setItem('academy-data', JSON.stringify(updatedAcademy));

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('handleSave: exceção:', err);
      alert('Erro inesperado ao salvar. Verifique o console.');
    }
  };

  return (
    <div className="space-y-8 animate-slide-up max-w-3xl">
       {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Configurações</h1>
        <p className="text-muted-foreground mt-1">Personalize a identidade e a aparência completa do seu sistema.</p>
      </div>

      {/* Perfil da Academia */}
      <Card className="glass-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Perfil da Academia
          </CardTitle>
          <CardDescription>Estes dados aparecem no aplicativo dos seus alunos.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-2">
            <Label>Logo da Academia</Label>
            <div className="flex items-center gap-5">
              {/* Preview */}
              <div className="relative group">
                <div className={`h-20 w-20 rounded-2xl border-2 border-dashed overflow-hidden flex items-center justify-center bg-muted/50 transition-colors ${isUploadingLogo ? 'border-primary animate-pulse' : 'border-border group-hover:border-primary/40'}`}>
                  {isUploadingLogo ? (
                    <Loader2 className="h-6 w-6 text-primary animate-spin" />
                  ) : logoPreview ? (
                    <img src={logoPreview} alt="Logo" className="h-full w-full object-cover" />
                  ) : (
                    <Upload className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                {logoPreview && !isUploadingLogo && (
                  <button
                    onClick={handleRemoveLogo}
                    className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-md hover:scale-110 transition-transform cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
              {/* Upload Button */}
              <div className="space-y-1.5">
                <label
                  htmlFor="logo-upload"
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${isUploadingLogo ? 'bg-secondary/50 text-secondary-foreground/50 cursor-not-allowed' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80 cursor-pointer'}`}
                >
                  {isUploadingLogo ? (
                    <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Enviando...</>
                  ) : (
                    <><Upload className="h-3.5 w-3.5" /> {logoPreview ? 'Trocar Logo' : 'Enviar Logo'}</>
                  )}
                </label>
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  disabled={isUploadingLogo}
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                {logoUploadError ? (
                  <p className="text-[11px] text-destructive">{logoUploadError}</p>
                ) : logoPreview && !isUploadingLogo ? (
                  <p className="text-[11px] text-emerald-600 font-medium">✓ Logo salva no servidor</p>
                ) : (
                  <p className="text-[11px] text-muted-foreground">PNG, JPG ou WebP. Máx recomendado: 300×300px.</p>
                )}
              </div>
            </div>
          </div>


          {/* Nome e CNPJ */}
          <div className="grid gap-2">
            <Label htmlFor="academyName">Nome da Academia</Label>
            <Input
              id="academyName"
              value={academyName || academy.name}
              onChange={(e) => setAcademyName(e.target.value)}
              className="rounded-xl"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="document">CNPJ / CPF</Label>
            <Input
              id="document"
              value={academyDoc || academy.documentNumber}
              onChange={(e) => setAcademyDoc(e.target.value)}
              className="rounded-xl"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="pixKey">Chave PIX (Para Pagamentos)</Label>
            <Input
              id="pixKey"
              value={pixKey}
              onChange={(e) => setPixKey(e.target.value)}
              placeholder="CPF, CNPJ, E-mail ou Celular"
              className="rounded-xl"
            />
          </div>
        </CardContent>
      </Card>

      {/* Seletor de Temas Completos */}
      <Card className="glass-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-primary" />
            Tema do Sistema
          </CardTitle>
          <CardDescription>Escolha um visual completo que transforma todo o app — fundos, cards, sidebar, textos e cores.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Temas Predefinidos */}
          <div>
            <Label className="text-sm font-medium text-muted-foreground mb-3 block">Templates Completos</Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {PRESET_THEMES.map((theme) => {
                const isSelected = activeTheme.id === theme.id && !isCustom;
                return (
                  <button
                    key={theme.id}
                    onClick={() => handleSelectPreset(theme)}
                    className={cn(
                      "group relative rounded-2xl border-2 p-3 text-left transition-all duration-300 hover:shadow-lg hover:scale-[1.02] cursor-pointer",
                      isSelected
                        ? "border-primary shadow-lg shadow-primary/20 ring-1 ring-primary/30"
                        : "border-border/50 hover:border-primary/30"
                    )}
                  >
                    {/* Selected Check */}
                    {isSelected && (
                      <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-primary flex items-center justify-center shadow-md z-10">
                        <Check className="h-3.5 w-3.5 text-primary-foreground" />
                      </div>
                    )}

                    {/* Mini App Preview */}
                    <div className="mb-3">
                      <ThemePreview theme={theme} compact />
                    </div>

                    {/* Theme Info */}
                    <div className="flex items-start gap-2">
                      <span className="text-lg">{theme.icon}</span>
                      <div>
                        <h4 className="font-semibold text-foreground text-sm leading-tight">{theme.name}</h4>
                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{theme.description}</p>
                      </div>
                    </div>

                    {/* Color Palette */}
                    <div className="flex items-center gap-1 mt-2.5">
                      {[theme.vars["--background"], theme.vars["--sidebar"], theme.vars["--card"], theme.vars["--primary"], theme.vars["--muted-foreground"]].map((color, i) => (
                        <div key={i} className="h-3 w-3 rounded-full border border-white/20 shadow-sm" style={{ backgroundColor: color }} />
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Separador */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-border/60" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">ou crie o seu</span>
            <div className="flex-1 h-px bg-border/60" />
          </div>

          {/* Tema Customizado */}
          <div>
            <Label className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <Paintbrush className="h-3.5 w-3.5" />
              Tema da Sua Academia
            </Label>
            <div className={cn(
              "rounded-2xl border-2 p-5 transition-all duration-300",
              isCustom
                ? "border-primary shadow-lg shadow-primary/10 ring-1 ring-primary/30"
                : "border-border/50"
            )}>
              {isCustom && (
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                  <span className="text-xs font-medium text-primary">Tema personalizado ativo</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-5">
                {/* Color Controls */}
                <div className="flex-1 space-y-3">
                  <div className="grid gap-2">
                    <Label htmlFor="customColor" className="text-sm">Cor principal da academia</Label>
                    <div className="flex gap-2 items-center">
                      <Input
                        id="customColor"
                        value={customColor}
                        onChange={(e) => handleCustomColorChange(e.target.value)}
                        placeholder="#3B82F6"
                        className="max-w-[150px] rounded-xl font-mono text-sm"
                      />
                      <input
                        type="color"
                        value={customColor}
                        onChange={(e) => handleCustomColorChange(e.target.value)}
                        className="w-10 h-10 rounded-xl border-2 border-border/50 cursor-pointer shadow-sm hover:shadow-md transition-shadow"
                        style={{ padding: '2px' }}
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground">O sistema gera automaticamente fundos, cards, textos e bordas harmonizados com essa cor.</p>
                  </div>
                  <Button
                    variant="default"
                    size="sm"
                    className="rounded-xl"
                    onClick={handleApplyCustom}
                  >
                    <Paintbrush className="mr-2 h-3.5 w-3.5" />
                    Aplicar Tema
                  </Button>
                </div>

                {/* Live Preview */}
                <div className="sm:w-56 space-y-2">
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Preview</span>
                  <ThemePreview theme={customThemePreview || generateCustomTheme(customColor)} />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex justify-end gap-3 items-center">
        {isSaving && (
          <span className="text-xs text-muted-foreground animate-pulse">Salvando no banco...</span>
        )}
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className={cn(
            "rounded-xl px-8 transition-all duration-300 min-w-[160px]",
            saved
              ? "bg-emerald-500 hover:bg-emerald-500 shadow-lg shadow-emerald-500/20"
              : "shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30"
          )}
        >
          {isSaving ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
              Salvando...
            </span>
          ) : saved ? (
            <><Check className="mr-2 h-4 w-4" /> Salvo no Banco!</>
          ) : (
            "Salvar Alterações"
          )}
        </Button>
      </div>
    </div>
  );
}
