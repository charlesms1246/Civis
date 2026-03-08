'use client'

import { TrendingUp, Users, Star, Target, Calendar, Trophy } from 'lucide-react'

interface StatsProps {
  totalUsers: number
  totalCivis: number
  weeklyActiveUsers: number
  newUsersThisWeek: number
  topCategoryThisWeek: string
  averageCivisPerUser: number
}

export function LeaderboardStats({ 
  totalUsers,
  totalCivis,
  weeklyActiveUsers,
  newUsersThisWeek,
  topCategoryThisWeek,
  averageCivisPerUser
}: StatsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
      <div className="stat bg-base-100 shadow rounded-lg p-4">
        <div className="stat-figure text-primary">
          <Users className="w-6 h-6" />
        </div>
        <div className="stat-title text-xs">Total Users</div>
        <div className="stat-value text-lg">{totalUsers.toLocaleString()}</div>
      </div>
      
      <div className="stat bg-base-100 shadow rounded-lg p-4">
        <div className="stat-figure text-secondary">
          <Trophy className="w-6 h-6" />
        </div>
        <div className="stat-title text-xs">Total CIVIS</div>
        <div className="stat-value text-lg">{totalCivis.toLocaleString()}</div>
      </div>
      
      <div className="stat bg-base-100 shadow rounded-lg p-4">
        <div className="stat-figure text-success">
          <TrendingUp className="w-6 h-6" />
        </div>
        <div className="stat-title text-xs">Weekly Active</div>
        <div className="stat-value text-lg">{weeklyActiveUsers}</div>
      </div>
      
      <div className="stat bg-base-100 shadow rounded-lg p-4">
        <div className="stat-figure text-info">
          <Star className="w-6 h-6" />
        </div>
        <div className="stat-title text-xs">New This Week</div>
        <div className="stat-value text-lg">{newUsersThisWeek}</div>
      </div>
      
      <div className="stat bg-base-100 shadow rounded-lg p-4">
        <div className="stat-figure text-warning">
          <Target className="w-6 h-6" />
        </div>
        <div className="stat-title text-xs">Avg CIVIS</div>
        <div className="stat-value text-lg">{averageCivisPerUser}</div>
      </div>
      
      <div className="stat bg-base-100 shadow rounded-lg p-4">
        <div className="stat-figure text-accent">
          <Calendar className="w-6 h-6" />
        </div>
        <div className="stat-title text-xs">Top Category</div>
        <div className="stat-value text-lg text-xs">{topCategoryThisWeek}</div>
      </div>
    </div>
  )
} 