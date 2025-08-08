import { NextRequest, NextResponse } from 'next/server'
import { initDb } from '../../../lib/database'
import { ROLES, User } from '../../../lib/auth'
import bcrypt from 'bcryptjs'

// Get all users
export async function GET() {
  try {
    const db = initDb()
    const users = db.getAllUsers()
    
    // Remove password hash from response
    const safeUsers = users.map(user => {
      const { passwordHash, ...safeUser } = user
      return safeUser
    })
    
    return NextResponse.json({
      success: true,
      users: safeUsers
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

// Create new user
export async function POST(request: NextRequest) {
  try {
    const { username, email, name, password, roleName } = await request.json()
    
    // Validation
    if (!username || !email || !name || !password || !roleName) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Validate role exists
    const role = Object.values(ROLES).find(r => r.name === roleName)
    if (!role) {
      return NextResponse.json(
        { success: false, error: 'Invalid role' },
        { status: 400 }
      )
    }

    // Check if username or email already exists
    const db = initDb()
    const existingUser = db.getUserByUsername(username) || db.getUserByEmail(email)
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Username or email already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12)

    // Create user
    const newUser: Omit<User, 'id'> & { passwordHash: string } = {
      username,
      email,
      name,
      role: role as any,
      permissions: role.permissions as any,
      isActive: true,
      passwordHash,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const userId = db.createUser(newUser)
    
    return NextResponse.json({
      success: true,
      user: {
        id: userId.toString(),
        username,
        email,
        name,
        role,
        permissions: role.permissions,
        isActive: true,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt
      }
    })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create user' },
      { status: 500 }
    )
  }
}
