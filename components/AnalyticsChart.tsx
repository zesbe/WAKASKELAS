'use client'

import { useMemo } from 'react'

interface AnalyticsChartProps {
  data: any[]
  type: 'line' | 'bar' | 'pie'
  xKey: string
  yKeys: string[]
  colors?: string[]
  labels?: string[]
  height?: number
}

export default function AnalyticsChart({ 
  data, 
  type, 
  xKey, 
  yKeys, 
  colors = ['#3b82f6'], 
  labels,
  height = 300 
}: AnalyticsChartProps) {
  
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null
    
    // Calculate max value for scaling
    const maxValue = Math.max(
      ...data.flatMap(item => 
        yKeys.map(key => Math.abs(item[key] || 0))
      )
    )
    
    return {
      data,
      maxValue: maxValue * 1.1, // Add 10% padding
      minValue: type === 'line' ? Math.min(
        ...data.flatMap(item => 
          yKeys.map(key => item[key] || 0)
        )
      ) * 1.1 : 0
    }
  }, [data, yKeys, type])

  if (!chartData) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Tidak ada data untuk ditampilkan
      </div>
    )
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const formatValue = (value: number) => {
    if (Math.abs(value) >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`
    } else if (Math.abs(value) >= 1000) {
      return `${(value / 1000).toFixed(1)}K`
    }
    return value.toString()
  }

  if (type === 'pie') {
    const total = data.reduce((sum, item) => sum + (item[yKeys[0]] || 0), 0)
    let currentAngle = 0
    
    return (
      <div className="flex items-center justify-center">
        <div className="relative" style={{ width: height, height: height }}>
          <svg width={height} height={height} className="transform -rotate-90">
            {data.map((item, index) => {
              const value = item[yKeys[0]] || 0
              const percentage = value / total
              const angle = percentage * 360
              const radius = height / 2 - 20
              const centerX = height / 2
              const centerY = height / 2
              
              const startAngle = currentAngle
              const endAngle = currentAngle + angle
              currentAngle += angle
              
              const startX = centerX + radius * Math.cos((startAngle * Math.PI) / 180)
              const startY = centerY + radius * Math.sin((startAngle * Math.PI) / 180)
              const endX = centerX + radius * Math.cos((endAngle * Math.PI) / 180)
              const endY = centerY + radius * Math.sin((endAngle * Math.PI) / 180)
              
              const largeArcFlag = angle > 180 ? 1 : 0
              
              const pathData = [
                `M ${centerX} ${centerY}`,
                `L ${startX} ${startY}`,
                `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`,
                'Z'
              ].join(' ')
              
              return (
                <path
                  key={index}
                  d={pathData}
                  fill={colors[index % colors.length]}
                  stroke="white"
                  strokeWidth="2"
                />
              )
            })}
          </svg>
          
          {/* Center label */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-sm font-medium text-gray-600">Total</div>
              <div className="text-lg font-bold text-gray-900">{formatCurrency(total)}</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (type === 'bar') {
    const barWidth = 40
    const spacing = 60
    const chartWidth = data.length * spacing
    const chartHeight = height - 60
    
    return (
      <div className="overflow-x-auto">
        <svg width={Math.max(chartWidth, 600)} height={height} className="min-w-full">
          {/* Y-axis labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
            const y = chartHeight - (ratio * chartHeight) + 40
            const value = chartData.minValue + (chartData.maxValue - chartData.minValue) * ratio
            
            return (
              <g key={index}>
                <line
                  x1="40"
                  y1={y}
                  x2={chartWidth + 40}
                  y2={y}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                />
                <text
                  x="35"
                  y={y + 4}
                  textAnchor="end"
                  className="text-xs fill-gray-500"
                >
                  {formatValue(value)}
                </text>
              </g>
            )
          })}
          
          {/* Bars */}
          {data.map((item, dataIndex) => {
            const x = dataIndex * spacing + 50
            
            return yKeys.map((yKey, keyIndex) => {
              const value = item[yKey] || 0
              const barHeight = Math.abs(value) / chartData.maxValue * chartHeight
              const y = value >= 0 
                ? chartHeight - barHeight + 40
                : chartHeight + 40
              
              return (
                <g key={`${dataIndex}-${keyIndex}`}>
                  <rect
                    x={x + keyIndex * (barWidth / yKeys.length)}
                    y={y}
                    width={barWidth / yKeys.length}
                    height={barHeight}
                    fill={colors[keyIndex % colors.length]}
                    rx="2"
                  />
                  
                  {/* Value label */}
                  <text
                    x={x + keyIndex * (barWidth / yKeys.length) + (barWidth / yKeys.length) / 2}
                    y={y - 5}
                    textAnchor="middle"
                    className="text-xs fill-gray-700 font-medium"
                  >
                    {formatValue(value)}
                  </text>
                </g>
              )
            })
          })}
          
          {/* X-axis labels */}
          {data.map((item, index) => (
            <text
              key={index}
              x={index * spacing + 50 + barWidth / 2}
              y={height - 10}
              textAnchor="middle"
              className="text-xs fill-gray-700"
            >
              {item[xKey]}
            </text>
          ))}
        </svg>
        
        {/* Legend */}
        {labels && (
          <div className="flex justify-center mt-4 space-x-6">
            {labels.map((label, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: colors[index % colors.length] }}
                />
                <span className="text-sm text-gray-600">{label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  if (type === 'line') {
    const chartWidth = Math.max(600, data.length * 80)
    const chartHeight = height - 60
    
    return (
      <div className="overflow-x-auto">
        <svg width={chartWidth} height={height} className="min-w-full">
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
            const y = chartHeight - (ratio * chartHeight) + 40
            const value = chartData.minValue + (chartData.maxValue - chartData.minValue) * ratio
            
            return (
              <g key={index}>
                <line
                  x1="40"
                  y1={y}
                  x2={chartWidth - 40}
                  y2={y}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                />
                <text
                  x="35"
                  y={y + 4}
                  textAnchor="end"
                  className="text-xs fill-gray-500"
                >
                  {formatValue(value)}
                </text>
              </g>
            )
          })}
          
          {/* Lines */}
          {yKeys.map((yKey, keyIndex) => {
            const points = data.map((item, index) => {
              const x = (index / (data.length - 1)) * (chartWidth - 80) + 40
              const value = item[yKey] || 0
              const normalizedValue = (value - chartData.minValue) / (chartData.maxValue - chartData.minValue)
              const y = chartHeight - (normalizedValue * chartHeight) + 40
              return `${x},${y}`
            }).join(' ')
            
            return (
              <g key={keyIndex}>
                <polyline
                  points={points}
                  fill="none"
                  stroke={colors[keyIndex % colors.length]}
                  strokeWidth="2"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
                
                {/* Data points */}
                {data.map((item, index) => {
                  const x = (index / (data.length - 1)) * (chartWidth - 80) + 40
                  const value = item[yKey] || 0
                  const normalizedValue = (value - chartData.minValue) / (chartData.maxValue - chartData.minValue)
                  const y = chartHeight - (normalizedValue * chartHeight) + 40
                  
                  return (
                    <circle
                      key={index}
                      cx={x}
                      cy={y}
                      r="4"
                      fill={colors[keyIndex % colors.length]}
                      stroke="white"
                      strokeWidth="2"
                    />
                  )
                })}
              </g>
            )
          })}
          
          {/* X-axis labels */}
          {data.map((item, index) => (
            <text
              key={index}
              x={(index / (data.length - 1)) * (chartWidth - 80) + 40}
              y={height - 10}
              textAnchor="middle"
              className="text-xs fill-gray-700"
            >
              {item[xKey]}
            </text>
          ))}
        </svg>
        
        {/* Legend */}
        {labels && (
          <div className="flex justify-center mt-4 space-x-6">
            {labels.map((label, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: colors[index % colors.length] }}
                />
                <span className="text-sm text-gray-600">{label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return null
}
