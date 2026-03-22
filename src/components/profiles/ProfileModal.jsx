import Modal from '../shared/Modal'
import ProfileForm from './ProfileForm'
import { useCreateProfile, useUpdateProfile } from '../../hooks/useProfiles'

export default function ProfileModal({ open, onClose, editProfile = null }) {
  const create = useCreateProfile()
  const update = useUpdateProfile()
  const isEdit = !!editProfile

  const handleSubmit = async (data) => {
    if (isEdit) {
      await update.mutateAsync({ id: editProfile.id, data })
    } else {
      await create.mutateAsync(data)
    }
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? `Edit — ${editProfile.label}` : 'New SSH Profile'}
      size="lg"
    >
      <ProfileForm
        initialData={editProfile}
        onSubmit={handleSubmit}
        onCancel={onClose}
        loading={create.isPending || update.isPending}
      />
    </Modal>
  )
}
