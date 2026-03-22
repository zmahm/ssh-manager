import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import ProfileCard from './ProfileCard'
import ProfileModal from './ProfileModal'
import Button from '../shared/Button'
import { useProfiles, useDeleteProfile } from '../../hooks/useProfiles'
import useSessionStore from '../../store/sessionStore'

export default function ProfileList() {
  const { data: profiles = [], isLoading } = useProfiles()
  const deleteProfile = useDeleteProfile()
  const [modalOpen, setModalOpen] = useState(false)
  const [editProfile, setEditProfile] = useState(null)
  const [search, setSearch] = useState('')
  const activeTab = useSessionStore(s => s.getActiveTab())

  const filtered = profiles.filter(p =>
    p.label.toLowerCase().includes(search.toLowerCase()) ||
    p.host.toLowerCase().includes(search.toLowerCase()) ||
    p.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
  )

  const handleEdit = (profile) => { setEditProfile(profile); setModalOpen(true) }
  const handleAdd = () => { setEditProfile(null); setModalOpen(true) }
  const handleDelete = async (profile) => {
    if (confirm(`Delete "${profile.label}"?`)) {
      await deleteProfile.mutateAsync(profile.id)
    }
  }

  return (
    <div className="flex flex-col gap-2 h-full">
      {/* Search */}
      <div className="relative">
        <svg className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search profiles..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-8 pr-3 py-2 text-xs text-gray-300 placeholder:text-gray-600 focus:outline-none focus:border-indigo-500"
        />
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto space-y-1.5 scrollbar-none">
        {isLoading ? (
          <div className="text-center text-xs text-gray-600 py-8">Loading...</div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-xs text-gray-600 py-8"
          >
            {search ? 'No matches' : 'No profiles yet'}
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filtered.map(p => (
              <ProfileCard
                key={p.id}
                profile={p}
                onEdit={handleEdit}
                onDelete={handleDelete}
                isActive={activeTab?.profileId === p.id}
              />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Add button */}
      <Button onClick={handleAdd} variant="secondary" size="sm" className="w-full">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        New Profile
      </Button>

      <ProfileModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditProfile(null) }}
        editProfile={editProfile}
      />
    </div>
  )
}
