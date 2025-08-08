import { NextRequest, NextResponse } from 'next/server'
import { initDb } from '../../../../lib/database'
import { ROLES } from '../../../../lib/auth'
import bcrypt from 'bcryptjs'

interface RouteParams {
  params: {
    id: string
  }
}

// Get user by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params
    const db = initDb()
    const user = db.getUserById(parseInt(id))
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Remove password hash from response
    const { passwordHash, ...safeUser } = user
    
    return NextResponse.json({
      success: true,
      user: safeUser
    })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}

// Update user
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params
    const { username, email, name, roleName, isActive, password } = await request.json()
    
    const db = initDb()
    const existingUser = db.getUserById(parseInt(id))
    
    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Validate role if provided
    let role = existingUser.role
    if (roleName) {
      const newRole = Object.values(ROLES).find(r => r.name === roleName)
      if (!newRole) {
        return NextResponse.json(
          { success: false, error: 'Invalid role' },
          { status: 400 }
        )
      }
      role = newRole
    }

    // Check for duplicate username/email if changed
    if (username && username !== existingUser.username) {
      const duplicate = db.getUserByUsername(username)
      if (duplicate) {
        return NextResponse.json(
          { success: false, error: 'Username already exists' },
          { status: 409 }
        )
      }
    }

    if (email && email !== existingUser.email) {
      const duplicate = db.getUserByEmail(email)
      if (duplicate) {
        return NextResponse.json(
          { success: false, error: 'Email already exists' },
          { status: 409 }
        )
      }
    }

    const updates: any = {
      username: username || existingUser.username,
      email: email || existingUser.email,
      name: name || existingUser.name,
      role,
      permissions: role.permissions,
      isActive: isActive !== undefined ? isActive : existingUser.isActive,
      updatedAt: new Date().toISOString()
    }

    // Hash new password if provided
    if (password) {
      updates.passwordHash = await bcrypt.hash(password, 12)
    }

    db.updateUser(parseInt(id), updates)
    
    // Return updated user (without password hash)
    const { passwordHash, ...safeUser } = { ...existingUser, ...updates }
    
    return NextResponse.json({
      success: true,
      user: safeUser
    })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update user' },
      { status: 500 }
    )
  }
}

// Delete user
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params
    const db = initDb()
    const user = db.getUserById(parseInt(id))
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Prevent deleting admin users (safety check)
    if (user.role.name === 'super_admin' || user.role.name === 'admin') {
      const adminCount = db.getAllUsers().filter(u => 
        u.role.name === 'super_admin' || u.role.name === 'admin'
      ).length
      
      if (adminCount <= 1) {
        return NextResponse.json(
          { success: false, error: 'Cannot delete the last admin user' },
          { status: 400 }
        )
      }
    }

    db.deleteUser(parseInt(id))
    
    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}
