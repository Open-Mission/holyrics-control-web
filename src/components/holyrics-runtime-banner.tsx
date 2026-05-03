import {
  BellRingIcon,
  ServerCrashIcon,
  WifiIcon,
  WifiOffIcon,
} from 'lucide-react'

import { useHolyricsConnection } from '@/hooks/use-holyrics-connection'
import { Alert, AlertAction, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

export function HolyricsRuntimeBanner() {
  const {
    activeServerId,
    activeServerName,
    browserOnline,
    holyricsReachable,
    notificationPermission,
    requestNotificationPermission,
  } = useHolyricsConnection()

  if (!activeServerId) {
    return null
  }

  if (!browserOnline) {
    return (
      <Alert variant="destructive" className="rounded-none border-x-0 border-t-0 bg-card/95 px-4 py-3 md:px-6">
        <WifiOffIcon />
        <AlertTitle>Dispositivo offline</AlertTitle>
        <AlertDescription>
          O app continua acessível com os dados locais salvos. Ações no Holyrics podem falhar até a rede voltar.
        </AlertDescription>
        {notificationPermission === 'default' ? (
          <AlertAction>
            <Button size="xs" variant="outline" onClick={() => void requestNotificationPermission()}>
              <BellRingIcon data-icon="inline-start" />
              Ativar notificações
            </Button>
          </AlertAction>
        ) : null}
      </Alert>
    )
  }

  if (holyricsReachable === false) {
    return (
      <Alert variant="destructive" className="rounded-none border-x-0 border-t-0 bg-card/95 px-4 py-3 md:px-6">
        <ServerCrashIcon />
        <AlertTitle>Holyrics indisponível</AlertTitle>
        <AlertDescription>
          {activeServerName
            ? `Não foi possível alcançar "${activeServerName}" agora. O conteúdo local segue disponível, mas comandos dependentes do Holyrics podem falhar.`
            : 'Não foi possível alcançar o Holyrics agora. O conteúdo local segue disponível, mas comandos dependentes do Holyrics podem falhar.'}
        </AlertDescription>
        {notificationPermission === 'default' ? (
          <AlertAction>
            <Button size="xs" variant="outline" onClick={() => void requestNotificationPermission()}>
              <BellRingIcon data-icon="inline-start" />
              Ativar notificações
            </Button>
          </AlertAction>
        ) : null}
      </Alert>
    )
  }

  if (notificationPermission === 'default') {
    return (
      <Alert className="rounded-none border-x-0 border-t-0 bg-card/95 px-4 py-3 md:px-6">
        <BellRingIcon />
        <AlertTitle>Notificações locais disponíveis</AlertTitle>
        <AlertDescription>
          Ative para receber avisos de perda de conexão com o Holyrics e início de apresentação neste dispositivo.
        </AlertDescription>
        <AlertAction>
          <Button size="xs" variant="outline" onClick={() => void requestNotificationPermission()}>
            <WifiIcon data-icon="inline-start" />
            Ativar
          </Button>
        </AlertAction>
      </Alert>
    )
  }

  return null
}
