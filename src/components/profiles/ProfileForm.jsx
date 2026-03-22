import { useState } from 'react'
import Input, { Textarea, Select } from '../shared/Input'
import Button from '../shared/Button'
import Badge from '../shared/Badge'
import ColorPicker from '../shared/ColorPicker'
import JumpHostSelector from './JumpHostSelector'

const DEFAULT_FORM = {
  label: '', host: '', port: '22', username: '',
  authType: 'password', password: '', privateKey: '', keyPassphrase: '',
  jumpHostId: null, portForwards: [], envVars: {},
  keepaliveInterval: 10000, connectionTimeout: 15000,
  tags: [], color: '#6366f1',
}

export default function ProfileForm({ initialData, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState(() => {
    if (!initialData) return DEFAULT_FORM
    return {
      ...DEFAULT_FORM,
      ...initialData,
      port: String(initialData.port || 22),
      password: initialData.credential?.password || '',
      privateKey: initialData.credential?.privateKey || '',
      keyPassphrase: initialData.credential?.passphrase || '',
      envVars: initialData.envVars || {},
    }
  })
  const [tagInput, setTagInput] = useState('')
  const [envKey, setEnvKey] = useState('')
  const [envVal, setEnvVal] = useState('')
  const [pfType, setPfType] = useState('local')
  const [pfLocal, setPfLocal] = useState('')
  const [pfRemoteHost, setPfRemoteHost] = useState('')
  const [pfRemotePort, setPfRemotePort] = useState('')

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target?.value ?? e }))

  const addTag = () => {
    const t = tagInput.trim()
    if (t && !form.tags.includes(t)) {
      setForm(f => ({ ...f, tags: [...f.tags, t] }))
    }
    setTagInput('')
  }

  const removeTag = (t) => setForm(f => ({ ...f, tags: f.tags.filter(x => x !== t) }))

  const addEnv = () => {
    if (envKey.trim()) {
      setForm(f => ({ ...f, envVars: { ...f.envVars, [envKey.trim()]: envVal } }))
      setEnvKey(''); setEnvVal('')
    }
  }

  const removeEnv = (k) => setForm(f => {
    const ev = { ...f.envVars }
    delete ev[k]
    return { ...f, envVars: ev }
  })

  const addPortForward = () => {
    if (!pfLocal || !pfRemoteHost || !pfRemotePort) return
    setForm(f => ({
      ...f,
      portForwards: [...f.portForwards, {
        type: pfType,
        localPort: +pfLocal,
        remoteHost: pfRemoteHost,
        remotePort: +pfRemotePort,
      }]
    }))
    setPfLocal(''); setPfRemoteHost(''); setPfRemotePort('')
  }

  const removePf = (i) => setForm(f => ({ ...f, portForwards: f.portForwards.filter((_, j) => j !== i) }))

  const handleSubmit = (e) => {
    e.preventDefault()
    const credential = {}
    if (form.authType === 'password' && form.password) credential.password = form.password
    if (form.authType === 'key') {
      credential.privateKey = form.privateKey
      if (form.keyPassphrase) credential.passphrase = form.keyPassphrase
    }
    onSubmit({
      label: form.label, host: form.host, port: +form.port,
      username: form.username, authType: form.authType,
      credential: Object.keys(credential).length ? credential : undefined,
      jumpHostId: form.jumpHostId, portForwards: form.portForwards,
      envVars: form.envVars, keepaliveInterval: +form.keepaliveInterval,
      connectionTimeout: +form.connectionTimeout, tags: form.tags, color: form.color,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Identity */}
      <div className="grid grid-cols-2 gap-3">
        <Input label="Label" value={form.label} onChange={set('label')} placeholder="My Server" required className="col-span-2" />
        <Input label="Host / IP" value={form.host} onChange={set('host')} placeholder="192.168.1.1" required />
        <Input label="Port" type="number" value={form.port} onChange={set('port')} placeholder="22" />
        <Input label="Username" value={form.username} onChange={set('username')} placeholder="root" required className="col-span-2" />
      </div>

      <ColorPicker value={form.color} onChange={(c) => setForm(f => ({ ...f, color: c }))} />

      {/* Auth */}
      <Select label="Authentication" value={form.authType} onChange={set('authType')}>
        <option value="password">Password</option>
        <option value="key">Private Key</option>
        <option value="agent">SSH Agent</option>
      </Select>

      {form.authType === 'password' && (
        <Input label="Password" type="password" value={form.password} onChange={set('password')} placeholder="SSH password" />
      )}
      {form.authType === 'key' && (
        <>
          <Textarea label="Private Key (PEM)" value={form.privateKey} onChange={set('privateKey')} placeholder="-----BEGIN OPENSSH PRIVATE KEY-----" rows={5} />
          <Input label="Key Passphrase (if any)" type="password" value={form.keyPassphrase} onChange={set('keyPassphrase')} placeholder="Leave blank if none" />
        </>
      )}
      {form.authType === 'agent' && (
        <p className="text-xs text-gray-500">Uses the system SSH agent (OpenSSH / Pageant). Ensure the agent has the key loaded.</p>
      )}

      {/* Jump Host */}
      <JumpHostSelector value={form.jumpHostId} onChange={(v) => setForm(f => ({ ...f, jumpHostId: v }))} excludeId={initialData?.id} />

      {/* Port Forwards */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">Port Forwards</label>
        {form.portForwards.map((pf, i) => (
          <div key={i} className="flex items-center gap-2 text-xs text-gray-300 bg-gray-800 rounded-lg px-3 py-2">
            <span className="uppercase font-semibold text-indigo-400">{pf.type}</span>
            <span>{pf.localPort} → {pf.remoteHost}:{pf.remotePort}</span>
            <button type="button" onClick={() => removePf(i)} className="ml-auto text-red-400 hover:text-red-300">×</button>
          </div>
        ))}
        <div className="grid grid-cols-4 gap-2">
          <Select value={pfType} onChange={e => setPfType(e.target.value)}>
            <option value="local">Local</option>
            <option value="remote">Remote</option>
          </Select>
          <Input placeholder="Local port" value={pfLocal} onChange={e => setPfLocal(e.target.value)} type="number" />
          <Input placeholder="Remote host" value={pfRemoteHost} onChange={e => setPfRemoteHost(e.target.value)} />
          <Input placeholder="Remote port" value={pfRemotePort} onChange={e => setPfRemotePort(e.target.value)} type="number" />
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={addPortForward}>+ Add Forward</Button>
      </div>

      {/* Env Vars */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">Environment Variables</label>
        {Object.entries(form.envVars).map(([k, v]) => (
          <div key={k} className="flex items-center gap-2 text-xs bg-gray-800 rounded-lg px-3 py-2">
            <span className="text-emerald-400 font-mono">{k}</span>
            <span className="text-gray-500">=</span>
            <span className="text-gray-300 font-mono flex-1 truncate">{v}</span>
            <button type="button" onClick={() => removeEnv(k)} className="text-red-400 hover:text-red-300">×</button>
          </div>
        ))}
        <div className="flex gap-2">
          <Input placeholder="KEY" value={envKey} onChange={e => setEnvKey(e.target.value)} className="flex-1" />
          <Input placeholder="value" value={envVal} onChange={e => setEnvVal(e.target.value)} className="flex-1" />
          <Button type="button" variant="secondary" size="sm" onClick={addEnv}>Add</Button>
        </div>
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">Tags</label>
        <div className="flex flex-wrap gap-1.5">
          {form.tags.map(t => (
            <Badge key={t} color={form.color} onRemove={() => removeTag(t)}>{t}</Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input placeholder="Add tag..." value={tagInput} onChange={e => setTagInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag() }}} />
          <Button type="button" variant="secondary" size="sm" onClick={addTag}>Add</Button>
        </div>
      </div>

      {/* Advanced */}
      <details className="group">
        <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-300 transition-colors">Advanced settings</summary>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Input label="Keepalive (ms)" type="number" value={form.keepaliveInterval} onChange={set('keepaliveInterval')} />
          <Input label="Timeout (ms)" type="number" value={form.connectionTimeout} onChange={set('connectionTimeout')} />
        </div>
      </details>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">Cancel</Button>
        <Button type="submit" loading={loading} className="flex-1">
          {initialData ? 'Save Changes' : 'Create Profile'}
        </Button>
      </div>
    </form>
  )
}
