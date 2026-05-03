import { toast } from 'sonner'
import { registerSW } from 'virtual:pwa-register'

let registered = false

export function registerPwa() {
  if (registered || typeof window === 'undefined') {
    return
  }

  registered = true

  registerSW({
    immediate: true,
    onOfflineReady() {
      toast.success('Modo offline pronto. O app pode abrir com os dados locais já sincronizados.')
    },
    onNeedRefresh() {
      toast.info('Uma atualização do app está disponível. Reabra o aplicativo para usar a nova versão.')
    },
    onRegisterError(error) {
      console.error('[PWA] Falha ao registrar service worker:', error)
    },
  })
}
