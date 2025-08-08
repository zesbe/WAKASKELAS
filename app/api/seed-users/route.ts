import { NextResponse } from 'next/server'
import { initDb } from '../../../lib/database'
import { ROLES } from '../../../lib/auth'
import bcrypt from 'bcryptjs'

export async function POST() {
  try {
    const db = initDb()
    
    // Check if users already exist
    const existingUsers = db.getAllUsers()
    if (existingUsers.length > 0) {
      return NextResponse.json({
        success: false,
        message: 'Users already exist. Delete existing users first.',
        count: existingUsers.length
      })
    }

    const defaultPassword = 'password123'
    const passwordHash = await bcrypt.hash(defaultPassword, 12)

    const seedUsers = [
      {
        username: 'admin',
        email: 'admin@kasibnusina.com',
        name: 'Administrator System',
        passwordHash,
        role: ROLES.ADMIN,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        username: 'bendahara',
        email: 'bendahara@kasibnusina.com',
        name: 'Bendahara Kelas 1 Ibnu Sina',
        passwordHash,
        role: ROLES.BENDAHARA,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        username: 'guru',
        email: 'guru@kasibnusina.com',
        name: 'Guru Kelas 1 Ibnu Sina',
        passwordHash,
        role: ROLES.GURU,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        username: 'viewer',
        email: 'viewer@kasibnusina.com',
        name: 'Viewer Only',
        passwordHash,
        role: ROLES.VIEWER,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]

    const createdUsers = []
    for (const userData of seedUsers) {
      try {
        const userId = db.createUser(userData)
        createdUsers.push({
          id: userId,
          username: userData.username,
          email: userData.email,
          name: userData.name,
          role: userData.role.displayName
        })
      } catch (error) {
        console.error(`Failed to create user ${userData.username}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully created ${createdUsers.length} seed users`,
      users: createdUsers,
      defaultPassword: defaultPassword,
      note: 'All users have the same default password: password123'
    })

  } catch (error) {
    console.error('Error creating seed users:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create seed users',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    const db = initDb()
    const users = db.getAllUsers()
    
    let deletedCount = 0
    for (const user of users) {
      try {
        db.deleteUser(parseInt(user.id))
        deletedCount++
      } catch (error) {
        console.error(`Failed to delete user ${user.id}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Deleted ${deletedCount} users`,
      deletedCount
    })

  } catch (error) {
    console.error('Error deleting users:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete users',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const db = initDb()
    const users = db.getAllUsers()
    
    const safeUsers = users.map(user => {
      const { passwordHash, ...safeUser } = user
      return safeUser
    })

    return NextResponse.json({
      success: true,
      users: safeUsers,
      count: safeUsers.length
    })

  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch users',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
