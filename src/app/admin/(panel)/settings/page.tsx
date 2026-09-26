import { getSiteSettings, SETTING_GROUPS } from '@/lib/settings'
import { PageHead } from '../../_ui/Panel'
import { SettingsForm } from './SettingsForm'

export default async function SettingsPage() {
  const values = await getSiteSettings()
  return (
    <>
      <PageHead
        title="Тексти сайту"
        lead="Назва, заголовки й підписи на головній. Після збереження зміни одразу видно на сайті. Необовʼязкові рядки (другий абзац, контакт) зникають, якщо поле порожнє."
      />
      <SettingsForm groups={SETTING_GROUPS} values={values} />
    </>
  )
}
