import { app } from 'electron'
import { autoUpdater } from 'electron-updater'

export async function verificarAtualizacao(): Promise<void> {
  if (!app.isPackaged) return

  try {
    await autoUpdater.checkForUpdatesAndNotify()
  } catch {
    // Sem internet ou GitHub fora do ar: a verificação é opcional e o app segue normal.
  }
}
