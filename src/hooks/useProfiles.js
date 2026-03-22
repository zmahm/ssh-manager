import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getProfiles, createProfile, updateProfile, deleteProfile } from '../api/profiles'
import useProfileStore from '../store/profileStore'
import { useEffect } from 'react'

export function useProfiles() {
  const setProfiles = useProfileStore(s => s.setProfiles)

  const query = useQuery({
    queryKey: ['profiles'],
    queryFn: getProfiles,
    staleTime: 30_000,
  })

  useEffect(() => {
    if (query.data) setProfiles(query.data)
  }, [query.data])

  return query
}

export function useCreateProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createProfile,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profiles'] }),
  })
}

export function useUpdateProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => updateProfile(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profiles'] }),
  })
}

export function useDeleteProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteProfile,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profiles'] }),
  })
}
