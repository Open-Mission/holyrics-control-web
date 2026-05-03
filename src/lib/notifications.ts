export type LocalNotificationPermission = NotificationPermission | 'unsupported'

interface LocalNotificationOptions extends Omit<NotificationOptions, 'icon' | 'badge'> {
  icon?: string
  badge?: string
}

const DEFAULT_ICON = '/pwa-192.png'
const DEFAULT_BADGE = '/pwa-192.png'

export function getNotificationPermission(): LocalNotificationPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported'
  }

  return Notification.permission
}

export async function requestNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported' as const
  }

  return Notification.requestPermission()
}

export async function showLocalNotification(
  title: string,
  options: LocalNotificationOptions = {}
) {
  if (typeof window === 'undefined' || getNotificationPermission() !== 'granted') {
    return false
  }

  const payload: NotificationOptions = {
    icon: options.icon ?? DEFAULT_ICON,
    badge: options.badge ?? DEFAULT_BADGE,
    ...options,
  }

  try {
    const registration = await navigator.serviceWorker?.getRegistration()
    if (registration?.showNotification) {
      await registration.showNotification(title, payload)
      return true
    }

    new Notification(title, payload)
    return true
  } catch (error) {
    console.error('[Notifications] Falha ao exibir notificação local:', error)
    return false
  }
}
