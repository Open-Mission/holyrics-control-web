import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  SettingsIcon,
  SaveIcon,
  RefreshCwIcon,
  FileJsonIcon,
} from "lucide-react";
import { toast } from "sonner";

import {
  holyricsKeys,
  useGlobalSettingsQuery,
  useSetGlobalSettingsMutation,
} from "@/api/holyrics";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  coerceGlobalSettings,
  setCachedGlobalSettings,
  type HolyricsGlobalSettings,
} from "@/lib/global-settings";

function formatSettings(value: HolyricsGlobalSettings) {
  return JSON.stringify(value, null, 2);
}

export function PreferencesSettings() {
  const queryClient = useQueryClient();
  const { data, isLoading, error, refetch, isFetching } =
    useGlobalSettingsQuery();
  const saveMutation = useSetGlobalSettingsMutation();

  const settings = coerceGlobalSettings(data);
  const displayMode = settings.initial_slide?.display_mode ?? "indefinido";
  const loadedValue = data ? formatSettings(settings) : "{}";

  const [editorValue, setEditorValue] = useState("");
  const [hasLocalEdits, setHasLocalEdits] = useState(false);
  const visibleValue = hasLocalEdits ? editorValue : loadedValue;
  const isDirty = hasLocalEdits && visibleValue !== loadedValue;

  const handleRefresh = async () => {
    try {
      const result = await refetch();
      if (result.data) {
        setHasLocalEdits(false);
        setEditorValue("");
        toast.success("Global settings recarregadas.");
      }
    } catch {
      toast.error("Erro ao recarregar global settings.");
    }
  };

  const handleSave = async () => {
    let parsed: HolyricsGlobalSettings;

    try {
      parsed = coerceGlobalSettings(JSON.parse(visibleValue));
    } catch {
      toast.error("JSON inválido. Corrija antes de salvar.");
      return;
    }

    try {
      await saveMutation.mutateAsync(parsed);
      setCachedGlobalSettings(parsed);
      const formatted = formatSettings(parsed);
      setEditorValue(formatted);
      setHasLocalEdits(false);
      await queryClient.invalidateQueries({
        queryKey: holyricsKeys.systemGlobalSettings(),
      });
      toast.success("Global settings salvas com sucesso.");
    } catch {
      toast.error("Erro ao salvar global settings.");
    }
  };

  return (
    <Card className="shadow-md bg-card/50 backdrop-blur-sm border-muted/20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SettingsIcon className="size-5 text-primary" />
          Global Settings
        </CardTitle>
        <CardDescription>
          Visualize e salve as configurações globais completas do Holyrics. A
          regra de slides de música usa `initial_slide.display_mode`.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border p-4 bg-background/50 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Initial Slide
            </p>
            <p className="mt-2 text-lg font-semibold">{displayMode}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Em música: `remove` envia o índice original; qualquer outro valor
              envia `index + 1`.
            </p>
          </div>

          <div className="rounded-xl border p-4 bg-background/50 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Estado do Editor
            </p>
            <p className="mt-2 text-lg font-semibold">
              {isLoading
                ? "Carregando..."
                : error
                  ? "Erro ao carregar"
                  : isDirty
                    ? "Alterado"
                    : "Sincronizado"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              O JSON abaixo é enviado integralmente para `POST
              /api/v1/system/global-settings`.
            </p>
          </div>
        </div>

        <div className="rounded-xl border bg-muted/20 overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b bg-muted/30 px-4 py-3">
            <div className="flex items-center gap-2">
              <FileJsonIcon className="size-4 text-muted-foreground" />
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                JSON Completo
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={handleRefresh}
                disabled={isFetching}
              >
                <RefreshCwIcon
                  className={`size-3.5 ${isFetching ? "animate-spin" : ""}`}
                />
                Recarregar
              </Button>
              <Button
                type="button"
                size="sm"
                className="gap-1.5"
                onClick={handleSave}
                disabled={saveMutation.isPending || isLoading}
              >
                <SaveIcon className="size-3.5" />
                Salvar
              </Button>
            </div>
          </div>

          <div className="p-4">
            <Textarea
              value={visibleValue}
              onChange={(event) => {
                setHasLocalEdits(true);
                setEditorValue(event.target.value);
              }}
              className="min-h-105 resize-y font-mono text-xs leading-5 bg-background/80"
              spellCheck={false}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
