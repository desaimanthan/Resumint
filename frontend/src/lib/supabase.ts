import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

// Helper function to upload profile picture
export const uploadProfilePicture = async (file: File, userId: string) => {
  const fileExt = file.name.split('.').pop()
  const fileName = `avatar.${fileExt}`
  const filePath = `user-${userId}/${fileName}`

  // Delete existing file if it exists
  await supabase.storage
    .from('profile-pictures')
    .remove([filePath])

  // Upload new file
  const { data, error } = await supabase.storage
    .from('profile-pictures')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true
    })

  if (error) {
    throw error
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('profile-pictures')
    .getPublicUrl(filePath)

  return publicUrl
}

// Helper function to delete profile picture
export const deleteProfilePicture = async (userId: string) => {
  const filePath = `user-${userId}/`
  
  // List all files for the user
  const { data: files } = await supabase.storage
    .from('profile-pictures')
    .list(filePath)

  if (files && files.length > 0) {
    const filesToDelete = files.map(file => `${filePath}${file.name}`)
    await supabase.storage
      .from('profile-pictures')
      .remove(filesToDelete)
  }
}
