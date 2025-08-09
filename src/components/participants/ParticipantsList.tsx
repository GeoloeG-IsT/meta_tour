import Avatar from '@/components/Avatar'
import { useI18n } from '@/contexts/I18nContext'
import { t } from '@/i18n'

export interface ParticipantItem {
  id: string
  full_name: string | null
  avatar_url: string | null
}

export default function ParticipantsList({ participants }: { participants: ParticipantItem[] }) {
  const { locale } = useI18n()
  if (participants.length === 0) return null
  return (
    <ul className="divide-y divide-secondary-200 bg-white border border-secondary-200 rounded">
      {participants.map((p) => (
        <li key={p.id} className="p-3 flex items-center gap-3">
          <Avatar url={p.avatar_url || undefined} alt={p.full_name || 'Participant'} size={32} />
          <div className="text-sm text-secondary-900">{p.full_name || t(locale, 'unnamed_participant')}</div>
        </li>
      ))}
    </ul>
  )
}


