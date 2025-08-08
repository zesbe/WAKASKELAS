'use client'

import { TrendingUp, TrendingDown, Info, AlertCircle, CheckCircle } from 'lucide-react'

interface Insight {
  type: 'positive' | 'negative' | 'neutral'
  title: string
  value: string
  description: string
}

interface InsightCardProps {
  insight: Insight
}

export default function InsightCard({ insight }: InsightCardProps) {
  const getIcon = () => {
    switch (insight.type) {
      case 'positive':
        return CheckCircle
      case 'negative':
        return AlertCircle
      case 'neutral':
      default:
        return Info
    }
  }

  const getColors = () => {
    switch (insight.type) {
      case 'positive':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          icon: 'text-green-500',
          title: 'text-green-800',
          value: 'text-green-700',
          description: 'text-green-600'
        }
      case 'negative':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          icon: 'text-red-500',
          title: 'text-red-800',
          value: 'text-red-700',
          description: 'text-red-600'
        }
      case 'neutral':
      default:
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          icon: 'text-blue-500',
          title: 'text-blue-800',
          value: 'text-blue-700',
          description: 'text-blue-600'
        }
    }
  }

  const colors = getColors()
  const IconComponent = getIcon()

  return (
    <div className={`p-6 rounded-2xl border-2 ${colors.bg} ${colors.border} transition-all duration-300 hover:shadow-lg hover:-translate-y-1`}>
      <div className="flex items-start space-x-4">
        <div className={`p-2 rounded-xl ${colors.bg} ${colors.icon}`}>
          <IconComponent className="h-6 w-6" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className={`text-lg font-semibold ${colors.title} mb-1`}>
            {insight.title}
          </h3>
          
          <p className={`text-2xl font-bold ${colors.value} mb-2`}>
            {insight.value}
          </p>
          
          <p className={`text-sm ${colors.description} leading-relaxed`}>
            {insight.description}
          </p>
        </div>
      </div>
      
      {/* Animated accent line */}
      <div className={`mt-4 h-1 rounded-full ${colors.bg} relative overflow-hidden`}>
        <div 
          className={`absolute inset-y-0 left-0 rounded-full ${
            insight.type === 'positive' ? 'bg-green-400' :
            insight.type === 'negative' ? 'bg-red-400' : 'bg-blue-400'
          } animate-pulse`}
          style={{ width: '100%' }}
        />
      </div>
    </div>
  )
}
