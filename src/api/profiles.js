import client from './client'

export const getProfiles = async () => (await client.get('/api/profiles')).data
export const getProfile = async (id) => (await client.get(`/api/profiles/${id}`)).data
export const createProfile = async (data) => (await client.post('/api/profiles', data)).data
export const updateProfile = async (id, data) => (await client.put(`/api/profiles/${id}`, data)).data
export const deleteProfile = async (id) => (await client.delete(`/api/profiles/${id}`)).data
