import { NextRequest, NextResponse } from 'next/server'
import { initDb } from '../../../../lib/database'
import { ROLES } from '../../../../lib/auth'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()
    
    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username and password are required' },
        { status: 400 }
      )
    }

    const db = initDb()
    const dbUser = db.getUserByUsername(username)
    
    if (!dbUser) {
      // Fallback to demo users for backward compatibility
      const demoUsers = [
        {
          id: '1',
          username: 'admin',
          email: 'admin@kasibnusina.com',
          name: 'Administrator',
          role: ROLES.ADMIN,
          permissions: ROLES.ADMIN.permissions,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '2',
          username: 'bendahara',
          email: 'bendahara@kasibnusina.com',
          name: 'Bendahara Kelas 1',
          role: ROLES.BENDAHARA,
          permissions: ROLES.BENDAHARA.permissions,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]

      const user = demoUsers.find(u => u.username === username)
      if (!user || password !== 'password123') {
        return NextResponse.json(
          { success: false, error: 'Invalid username or password' },
          { status: 401 }
        )
      }

      if (!user.isActive) {
        return NextResponse.json(
          { success: false, error: 'Account is deactivated' },
          { status: 401 }
        )
      }

      return NextResponse.json({
        success: true,
        user: { ...user, lastLogin: new Date().toISOString() }
      })
    }

    // Check password for database user
    const isValidPassword = await bcrypt.compare(password, dbUser.passwordHash)
    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: 'Invalid username or password' },
        { status: 401 }
      )
    }

    if (!dbUser.isActive) {
      return NextResponse.json(
        { success: false, error: 'Account is deactivated' },
        { status: 401 }
      )
    }

    // Update last login
    db.updateUser(parseInt(dbUser.id), { 
      lastLogin: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })

    // Return user without password hash
    const { passwordHash, ...safeUser } = dbUser
    const userWithLastLogin = { 
      ...safeUser, 
      lastLogin: new Date().toISOString() 
    }

    return NextResponse.json({
      success: true,
      user: userWithLastLogin
    })

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Login failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
