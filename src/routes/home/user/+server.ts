import { json } from '@sveltejs/kit'
import { err } from "$lib/server/utils"
import { TEST_USER } from "$lib/mock-data-goals"
import { createUser, deleteUser, getUserById, updateUser } from "$lib/server/db/users"

// GET /api/user - Get user by id
export async function GET({ locals, url, params }) {
    const userId = TEST_USER.id
    if (!userId) {
        return err({ status: 401 })
    }
    
    try {
        const id = url.searchParams.get('userId') || userId    
        const user = await getUserById(id)

        if (!user) {
            return err({ status: 404 })
        }   
        return json(user)
    }
    catch (error) {
        console.error(error)
        return err({ status: 500, message: 'Failed to get user' })
    }
}

// POST /api/user - Create a new user
export async function POST({ locals, request }) {
    const userId = TEST_USER.id
    
    if (!userId) {
      return err({ status: 401 })
    }
    
    const userData = await request.json()
    
    try {
      const success = await createUser({ ...userData, id: userData.id })
      return json({ success })
    } 
    catch (error) {
      console.error(error)
      return err({ status: 500, message: 'Failed to create user' })
    }
}

// PUT /api/user - Update a user
export async function PUT({ locals, request }) {
    const userId = TEST_USER.id
    const userData = await request.json()
    
    if (!userId) {
        return err({ status: 400, message: 'Missing user id' })
    }
    if (!userData) {
        return err({ status: 400, message: 'Missing user data' })
    }
    
    try {
      const success = await updateUser({ userId, data: userData })
      return json({ success })
    } 
    catch (error) {
      console.error(error)
      return err({ status: 500, message: 'Failed to update user' })
    }
}

// DELETE /api/user - Delete a user
export async function DELETE({ locals, url }) {
    const userId = TEST_USER.id
    
    if (!userId) {
      return err({ status: 400, message: 'Missing user id' })
    }
    
    try {
      const success = await deleteUser(userId)
      
      if (!success) {
        console.error("User not found")
        return err({ status: 404, message: 'User not found' })
      }

      return json({ success })
    } 
    catch (error) {
      console.error(error)
      return err({ status: 500, message: 'Failed to delete user' })
    }
}