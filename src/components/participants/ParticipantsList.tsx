import Avatar from '@/components/Avatar'

export interface ParticipantItem {
  id: string
  full_name: string | null
  avatar_url: string | null
}

export default function ParticipantsList({ participants }: { participants: ParticipantItem[] }) {
  if (participants.length === 0) return null
  return (
    <ul className="divide-y divide-secondary-200 bg-white border border-secondary-200 rounded">
      {participants.map((p) => (
        <li key={p.id} className="p-3 flex items-center gap-3">
          <Avatar url={p.avatar_url || undefined} alt={p.full_name || 'Participant'} size={32} />
          <div className="text-sm text-secondary-900">{p.full_name || 'Unnamed participant'}</div>
        </li>
      ))}
    </ul>
  )
}


