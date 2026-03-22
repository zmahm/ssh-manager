import { Select } from '../shared/Input'
import useProfileStore from '../../store/profileStore'

export default function JumpHostSelector({ value, onChange, excludeId }) {
  const profiles = useProfileStore(s => s.profiles)
  const options = profiles.filter(p => p.id !== excludeId)

  return (
    <Select
      label="Jump Host (Bastion)"
      value={value || ''}
      onChange={e => onChange(e.target.value || null)}
    >
      <option value="">None (direct connection)</option>
      {options.map(p => (
        <option key={p.id} value={p.id}>
          {p.label} — {p.username}@{p.host}:{p.port}
        </option>
      ))}
    </Select>
  )
}
