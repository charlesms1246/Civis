'use client'

import { useState } from 'react'
import { 
  Flame, 
  Target, 
  Gift, 
  Calendar, 
  TrendingUp, 
  Clock, 
  Award, 
  Sparkles,
  ChevronRight,
  CheckCircle,
  Lock,
  Star
} from 'lucide-react'

interface UserStats {
  currentStreak: number
  longestStreak: number
  weeklyCivis: number
  weeklyGoal: number
  totalCivis: number
  level: number
}

interface Challenge {
  id: string
  title: string
  description: string
  category: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  civisReward: number
  bonusMultiplier?: number
  deadline: string
  isCompleted: boolean
  isLocked: boolean
  progress: number
  maxProgress: number
  icon: string
  type: 'weekly' | 'special' | 'milestone'
  organization: string
  organizationLogo?: string
}

interface Goal {
  id: string
  title: string
  description: string
  target: number
  current: number
  civisReward: number
  deadline: string
  category: string
  isCompleted: boolean
  icon: string
}

// Mock user stats
const mockUserStats: UserStats = {
  currentStreak: 4, // 4 consecutive weeks
  longestStreak: 8, // 8 consecutive weeks
  weeklyCivis: 80,
  weeklyGoal: 100,
  totalCivis: 240,
  level: 3
}

// Mock challenges - Updated for May 2025 with specific organizations
const mockChallenges: Challenge[] = [
  {
    id: '1',
    title: 'Blood Donation Drive',
    description: 'Donate blood at participating Red Cross centers this month',
    category: 'Healthcare',
    difficulty: 'Medium',
    civisReward: 250,
    bonusMultiplier: 1.5,
    deadline: '2025-06-30',
    isCompleted: false,
    isLocked: false,
    progress: 0,
    maxProgress: 1,
    icon: '🩸',
    type: 'special',
    organization: 'Red Cross International'
  },
  {
    id: '2',
    title: 'Wikipedia Article Enhancement',
    description: 'Improve Wikipedia articles with citations and content',
    category: 'Education',
    difficulty: 'Easy',
    civisReward: 150,
    bonusMultiplier: 2,
    deadline: '2025-06-22',
    isCompleted: false,
    isLocked: false,
    progress: 1,
    maxProgress: 1,
    icon: '📚',
    type: 'special',
    organization: 'Wikimedia Foundation'
  },
  {
    id: '3',
    title: 'Community Garden Project',
    description: 'Help establish community gardens in urban areas',
    category: 'Environmental',
    difficulty: 'Hard',
    civisReward: 300,
    bonusMultiplier: 2,
    deadline: '2025-03-01',
    isCompleted: false,
    isLocked: false,
    progress: 2,
    maxProgress: 5,
    icon: '🌱',
    type: 'special',
    organization: 'Urban Green Initiative'
  }
]

// Mock goals - Updated for May 2025
const mockGoals: Goal[] = [
  {
    id: '1',
    title: 'Weekly CIVIS Target',
    description: 'Earn 100 CIVIS this week',
    target: 100,
    current: 80,
    civisReward: 10,
    deadline: '2025-06-07', // Next Saturday
    category: 'Weekly',
    isCompleted: false,
    icon: '🎯'
  },
  {
    id: '2',
    title: 'Weekly Streak Master',
    description: 'Maintain a 6-week streak',
    target: 6,
    current: 4,
    civisReward: 150,
    deadline: '2025-06-14', // 2 weeks from now
    category: 'Streak',
    isCompleted: false,
    icon: '🔥'
  },
  {
    id: '3',
    title: 'Category Explorer',
    description: 'Earn CIVIS in all 5 categories this month',
    target: 5,
    current: 4,
    civisReward: 100,
    deadline: '2025-06-30', // End of June
    category: 'Diversity',
    isCompleted: false,
    icon: '🗺️'
  },
  {
    id: '4',
    title: 'Summer Kickoff',
    description: 'Earn 200 CIVIS in June',
    target: 200,
    current: 0,
    civisReward: 20,
    deadline: '2025-06-30',
    category: 'Monthly',
    isCompleted: false,
    icon: '☀️'
  }
]

export function Campaigns() {
  const [activeTab, setActiveTab] = useState<'challenges' | 'goals'>('challenges')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'badge-success'
      case 'Medium': return 'badge-warning'
      case 'Hard': return 'badge-error'
      default: return 'badge-neutral'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'weekly': return 'badge-primary'
      case 'special': return 'badge-secondary'
      case 'milestone': return 'badge-accent'
      default: return 'badge-neutral'
    }
  }

  const filteredChallenges = selectedCategory === 'all' 
    ? mockChallenges 
    : mockChallenges.filter(c => c.category.toLowerCase() === selectedCategory)

  const getStreakColor = (streak: number) => {
    if (streak >= 8) return 'text-error'    // 8+ weeks = red (amazing!)
    if (streak >= 4) return 'text-warning'  // 4+ weeks = yellow (great!)
    if (streak >= 2) return 'text-success'  // 2+ weeks = green (good!)
    return 'text-neutral'
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header with User Stats */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold civis-gradient mb-2">Civis Challenges</h1>
            <p className="text-neutral/70">Level up your impact with weekly streaks, goals, and special challenges</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="stats shadow">
              <div className="stat">
                <div className="stat-figure text-primary">
                  <Flame className="w-8 h-8" />
                </div>
                <div className="stat-title">Weekly Streak</div>
                <div className={`stat-value ${getStreakColor(mockUserStats.currentStreak)}`}>
                  {mockUserStats.currentStreak} weeks
                </div>
                <div className="stat-desc">Best: {mockUserStats.longestStreak} weeks</div>
              </div>
            </div>
            <div className="stats shadow">
              <div className="stat">
                <div className="stat-figure text-secondary">
                  <Target className="w-8 h-8" />
                </div>
                <div className="stat-title">This Week</div>
                <div className="stat-value text-secondary">
                  {mockUserStats.weeklyCivis}/{mockUserStats.weeklyGoal}
                </div>
                <div className="stat-desc">
                  {Math.round((mockUserStats.weeklyCivis / mockUserStats.weeklyGoal) * 100)}% complete
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Progress Bar */}
        <div className="card bg-gradient-to-r from-primary/10 to-secondary/10 shadow-lg mb-6">
          <div className="card-body">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">This Week's Progress</h3>
              <div className="badge badge-primary badge-lg">
                Level {mockUserStats.level}
              </div>
            </div>
            <div className="w-full bg-base-300 rounded-full h-4 mb-2">
              <div 
                className="bg-gradient-to-r from-primary to-secondary h-4 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((mockUserStats.weeklyCivis / mockUserStats.weeklyGoal) * 100, 100)}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-sm text-neutral/70">
              <span>Week of May 26 - June 1, 2025</span>
              <span>{mockUserStats.weeklyGoal} CIVIS goal</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tabs tabs-boxed mb-6">
        <a 
          className={`tab ${activeTab === 'challenges' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('challenges')}
        >
          <Award className="w-4 h-4 mr-2" />
          Challenges
        </a>
        <a 
          className={`tab ${activeTab === 'goals' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('goals')}
        >
          <Target className="w-4 h-4 mr-2" />
          Goals
        </a>
      </div>

      {activeTab === 'challenges' && (
        <div>
          {/* Featured Organizations */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Featured Partner Organizations</h3>
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="card bg-base-200 shadow-sm">
                <div className="card-body p-4">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">🩸</div>
                    <div>
                      <h4 className="font-semibold">Red Cross International</h4>
                      <p className="text-sm text-neutral/70">Emergency assistance, disaster relief</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="card bg-base-200 shadow-sm">
                <div className="card-body p-4">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">📚</div>
                    <div>
                      <h4 className="font-semibold">Wikimedia Foundation</h4>
                      <p className="text-sm text-neutral/70">Free knowledge for everyone</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="card bg-base-200 shadow-sm">
                <div className="card-body p-4">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">🌱</div>
                    <div>
                      <h4 className="font-semibold">Urban Green Initiative</h4>
                      <p className="text-sm text-neutral/70">Community gardens for sustainability</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Category Filter */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              <button 
                className={`btn btn-sm ${selectedCategory === 'all' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setSelectedCategory('all')}
              >
                All Challenges
              </button>
              {['Donation', 'Volunteering', 'Environmental'].map(category => (
                <button 
                  key={category}
                  className={`btn btn-sm ${selectedCategory === category.toLowerCase() ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setSelectedCategory(category.toLowerCase())}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Challenges Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredChallenges.map((challenge) => (
              <div 
                key={challenge.id} 
                className={`card shadow-lg transition-all duration-300 hover:shadow-xl ${
                  challenge.isCompleted ? 'bg-success/10 border border-success/20' : 
                  challenge.isLocked ? 'bg-base-200 opacity-60' : 'bg-base-100'
                }`}
              >
                <div className="card-body">
                  <div className="flex items-start justify-between mb-3">
                    <div className="text-3xl">{challenge.icon}</div>
                    <div className="flex flex-col gap-1">
                      <div className={`badge ${getTypeColor(challenge.type)} badge-sm`}>
                        {challenge.type}
                      </div>
                      <div className={`badge ${getDifficultyColor(challenge.difficulty)} badge-sm`}>
                        {challenge.difficulty}
                      </div>
                    </div>
                  </div>

                  {/* Organization Badge */}
                  <div className="mb-2">
                    <div className="badge badge-neutral badge-sm">
                      Organized by {challenge.organization}
                    </div>
                  </div>

                  <h3 className="card-title text-lg mb-2">
                    {challenge.title}
                    {challenge.isLocked && <Lock className="w-4 h-4 text-neutral/50" />}
                    {challenge.isCompleted && <CheckCircle className="w-4 h-4 text-success" />}
                  </h3>

                  <p className="text-neutral/70 text-sm mb-4">{challenge.description}</p>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progress</span>
                      <span>{challenge.progress}/{challenge.maxProgress}</span>
                    </div>
                    <div className="w-full bg-base-300 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          challenge.isCompleted ? 'bg-success' : 'bg-primary'
                        }`}
                        style={{ width: `${(challenge.progress / challenge.maxProgress) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Reward Info */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span className="font-semibold text-primary">
                        {challenge.civisReward} CIVIS
                      </span>
                      {challenge.bonusMultiplier && (
                        <div className="badge badge-accent badge-sm">
                          {challenge.bonusMultiplier}x bonus
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Deadline */}
                  <div className="flex items-center gap-2 text-sm text-neutral/70 mb-4">
                    <Clock className="w-4 h-4" />
                    <span>Ends {new Date(challenge.deadline).toLocaleDateString()}</span>
                  </div>

                  {/* Action Button */}
                  <div className="card-actions">
                    {challenge.isCompleted ? (
                      <button className="btn btn-success btn-sm w-full" disabled>
                        <CheckCircle className="w-4 h-4" />
                        Completed
                      </button>
                    ) : challenge.isLocked ? (
                      <button className="btn btn-ghost btn-sm w-full" disabled>
                        <Lock className="w-4 h-4" />
                        Locked
                      </button>
                    ) : (
                      <button className="btn btn-primary btn-sm w-full">
                        Join Challenge
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'goals' && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockGoals.map((goal) => (
            <div 
              key={goal.id} 
              className={`card shadow-lg transition-all duration-300 hover:shadow-xl ${
                goal.isCompleted ? 'bg-success/10 border border-success/20' : 'bg-base-100'
              }`}
            >
              <div className="card-body">
                <div className="flex items-start justify-between mb-3">
                  <div className="text-3xl">{goal.icon}</div>
                  <div className="badge badge-outline badge-sm">{goal.category}</div>
                </div>

                <h3 className="card-title text-lg mb-2">
                  {goal.title}
                  {goal.isCompleted && <CheckCircle className="w-4 h-4 text-success" />}
                </h3>

                <p className="text-neutral/70 text-sm mb-4">{goal.description}</p>

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span>Progress</span>
                    <span className="font-semibold">{goal.current}/{goal.target}</span>
                  </div>
                  <div className="w-full bg-base-300 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full transition-all duration-300 ${
                        goal.isCompleted ? 'bg-success' : 'bg-primary'
                      }`}
                      style={{ width: `${Math.min((goal.current / goal.target) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <div className="text-sm text-neutral/70 mt-1">
                    {Math.round((goal.current / goal.target) * 100)}% complete
                  </div>
                </div>

                {/* Reward and Deadline */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-warning" />
                    <span className="font-semibold text-warning">+{goal.civisReward} CIVIS</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-neutral/70">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(goal.deadline).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Action */}
                <div className="card-actions">
                  {goal.isCompleted ? (
                    <button className="btn btn-success btn-sm w-full" disabled>
                      <CheckCircle className="w-4 h-4" />
                      Completed
                    </button>
                  ) : (
                    <button className="btn btn-outline btn-sm w-full">
                      View Details
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Motivational Section */}
      <div className="mt-12">
        <div className="card bg-gradient-to-br from-primary/20 to-secondary/20 shadow-xl">
          <div className="card-body text-center">
            <h2 className="text-2xl font-bold mb-4">Amazing Progress This Week! 🚀</h2>
            <p className="text-lg text-neutral/80 mb-6">
              You're on fire with {mockUserStats.currentStreak} consecutive weeks of real-world contributions. Keep the momentum going!
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <div className="stat">
                <div className="stat-title">This Week</div>
                <div className="stat-value text-primary">+{mockUserStats.weeklyCivis}</div>
                <div className="stat-desc">CIVIS earned</div>
              </div>
              <div className="stat">
                <div className="stat-title">Weekly Streak</div>
                <div className="stat-value text-warning">{mockUserStats.currentStreak}</div>
                <div className="stat-desc">weeks active</div>
              </div>
              <div className="stat">
                <div className="stat-title">Level</div>
                <div className="stat-value text-secondary">{mockUserStats.level}</div>
                <div className="stat-desc">civis champion</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 