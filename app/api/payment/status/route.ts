import { NextRequest, NextResponse } from 'next/server'

const PAKASIR_CONFIG = {
  slug: process.env.PAKASIR_SLUG || 'uang-kas-kelas-1-ibnu-sina',
  apiKey: process.env.PAKASIR_API_KEY || '',
  statusUrl: `${process.env.PAKASIR_BASE_URL || 'https://pakasir.zone.id'}/api/transactiondetail`
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('order_id')
    const amount = searchParams.get('amount')
    
    if (!orderId || !amount) {
      return NextResponse.json({ 
        error: 'order_id and amount are required' 
      }, { status: 400 })
    }

    // Call Pakasir status API
    const statusUrl = `${PAKASIR_CONFIG.statusUrl}?project=${PAKASIR_CONFIG.slug}&amount=${amount}&order_id=${orderId}&api_key=${PAKASIR_CONFIG.apiKey}`
    
    console.log('🔍 Checking payment status:', { orderId, amount })
    
    const response = await fetch(statusUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'KasKelas-IbnuSina/1.0'
      }
    })

    if (!response.ok) {
      throw new Error(`Pakasir API error: ${response.status} ${response.statusText}`)
    }

    const statusData = await response.json()
    
    console.log('📊 Payment status response:', statusData)
    
    return NextResponse.json({
      success: true,
      data: {
        orderId,
        amount: parseInt(amount),
        status: statusData.status || 'unknown',
        paymentMethod: statusData.payment_method,
        completedAt: statusData.completed_at,
        createdAt: statusData.created_at,
        lastChecked: new Date().toISOString(),
        rawResponse: statusData
      }
    })

  } catch (error) {
    console.error('❌ Status check error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to check payment status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { orderIds } = await request.json()
    
    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json({ 
        error: 'orderIds array is required' 
      }, { status: 400 })
    }

    const results = []
    
    // Check multiple payment statuses
    for (const orderData of orderIds) {
      const { order_id, amount } = orderData
      
      try {
        const statusUrl = `${PAKASIR_CONFIG.statusUrl}?project=${PAKASIR_CONFIG.slug}&amount=${amount}&order_id=${order_id}&api_key=${PAKASIR_CONFIG.apiKey}`
        
        const response = await fetch(statusUrl)
        const statusData = await response.json()
        
        results.push({
          orderId: order_id,
          amount,
          status: statusData.status || 'unknown',
          success: response.ok,
          data: statusData
        })
        
        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100))
        
      } catch (error) {
        results.push({
          orderId: order_id,
          amount,
          status: 'error',
          success: false,
          error: error instanceof Error ? error.message : 'Check failed'
        })
      }
    }
    
    return NextResponse.json({
      success: true,
      data: {
        total: orderIds.length,
        checked: results.length,
        results,
        checkedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('❌ Bulk status check error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to check payment statuses'
    }, { status: 500 })
  }
}
