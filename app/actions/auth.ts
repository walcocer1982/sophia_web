'use server'

import { signOut as nextAuthSignOut } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function signOut() {
  try {
    await nextAuthSignOut({ redirect: false })
  } catch (error) {
    console.error('Error during sign out:', error)
  }

  revalidatePath('/')
  revalidatePath('/lessons')
  redirect('/')
}