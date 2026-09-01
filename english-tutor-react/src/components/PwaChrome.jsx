import { useEffect, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import {
  dismissInstallPrompt,
  isIosDevice,
  isStandaloneDisplay,
  markStandaloneClass,
  wasInstallDismissed,
} from '../lib/pwa'

export default function PwaChrome() {
  const [offline, setOffline] = useState(() =>
    typeof navigator !== 'undefined' ? !navigator.onLine : false,
  )
  const [installEvent, setInstallEvent] = useState(null)
  const [showIosTip] = useState(
    () => !wasInstallDismissed() && !isStandaloneDisplay() && isIosDevice(),
  )
  const [installHidden, setInstallHidden] = useState(() => wasInstallDismissed() || isStandaloneDisplay())

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    immediate: true,
    onRegisteredSW() {
      markStandaloneClass()
    },
  })

  useEffect(() => {
    markStandaloneClass()

    const onOnline = () => setOffline(false)
    const onOffline = () => setOffline(true)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)

    const onInstall = (event) => {
      event.preventDefault()
      setInstallEvent(event)
    }
    window.addEventListener('beforeinstallprompt', onInstall)

    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
      window.removeEventListener('beforeinstallprompt', onInstall)
    }
  }, [])

  const hideInstall = () => {
    dismissInstallPrompt()
    setInstallHidden(true)
    setInstallEvent(null)
  }

  const installApp = async () => {
    if (!installEvent) return
    installEvent.prompt()
    try {
      const choice = await installEvent.userChoice
      if (choice?.outcome === 'accepted') hideInstall()
    } catch {
      hideInstall()
    }
  }

  const showInstall = !installHidden && (installEvent || showIosTip)

  return (
    <>
      {offline ? (
        <div className="pwa-banner pwa-banner--offline no-print" role="status">
          You’re offline. Opened pages still work; new data needs a connection.
        </div>
      ) : null}

      {needRefresh ? (
        <div className="pwa-banner pwa-banner--update no-print" role="status">
          <span>A new version of Kinz Teacher Platform is ready.</span>
          <button type="button" className="btn" onClick={() => updateServiceWorker(true)}>
            Refresh
          </button>
        </div>
      ) : null}

      {showInstall ? (
        <div className="pwa-install no-print" role="dialog" aria-label="Install Kinz Teacher Platform">
          <div>
            <strong>Add to your phone</strong>
            <p className="muted">
              {installEvent
                ? 'Install Kinz Teacher Platform so it opens like an app from your home screen.'
                : 'On iPhone: tap Share, then Add to Home Screen.'}
            </p>
          </div>
          <div className="pwa-install__actions">
            {installEvent ? (
              <button type="button" className="btn" onClick={installApp}>
                Install
              </button>
            ) : null}
            <button type="button" className="btn ghost" onClick={hideInstall}>
              Not now
            </button>
          </div>
        </div>
      ) : null}
    </>
  )
}
