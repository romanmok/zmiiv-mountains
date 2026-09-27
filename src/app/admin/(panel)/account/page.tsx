import { requirePageUser } from '@/lib/auth/session'
import { MIN_PASSWORD_LENGTH } from '@/lib/auth/password'
import { PageHead } from '../../_ui/Panel'
import { PasswordForm } from './PasswordForm'

export default async function AccountPage() {
  const user = await requirePageUser()
  return (
    <>
      <PageHead title="Обліковий запис" lead={`Логін: ${user.username}. Після зміни пароля всі інші пристрої, де ви заходили в адмінку, буде розлогінено.`} />
      <PasswordForm username={user.username} minLength={MIN_PASSWORD_LENGTH} />
    </>
  )
}
