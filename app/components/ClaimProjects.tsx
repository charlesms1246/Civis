'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Project {
  id: string
  name: string
  description: string
  icon: string
  category: string
  civisReward: string
  status: 'active' | 'coming-soon'
  difficulty: 'easy' | 'medium' | 'hard'
}

const projects: Project[] = [
  {
    id: 'wikipedia-donation',
    name: 'Wikipedia Donation',
    description: 'Support free knowledge by donating to Wikipedia',
    icon: '📚',
    category: 'Donation',
    civisReward: '50-500 CIVIS',
    status: 'active',
    difficulty: 'easy'
  },
  {
    id: 'red-cross-blood',
    name: 'Red Cross Blood Donation',
    description: 'Save lives by donating blood through Red Cross',
    icon: '🩸',
    category: 'Healthcare',
    civisReward: '300 CIVIS',
    status: 'coming-soon',
    difficulty: 'medium'
  },
  {
    id: 'devcon-volunteer',
    name: 'Devcon Volunteer',
    description: 'Volunteer at Devcon blockchain conference',
    icon: '⚡',
    category: 'Volunteering',
    civisReward: '200-800 CIVIS',
    status: 'coming-soon',
    difficulty: 'medium'
  },
  {
    id: 'ethglobal-volunteer',
    name: 'ETHGlobal Volunteer',
    description: 'Help organize ETHGlobal hackathons',
    icon: '🌐',
    category: 'Volunteering',
    civisReward: '150-600 CIVIS',
    status: 'coming-soon',
    difficulty: 'medium'
  },
  {
    id: 'beach-cleanup',
    name: 'Beach Cleanup',
    description: 'Join organized beach cleaning events',
    icon: '��️',
    category: 'Environmental',
    civisReward: '100-400 CIVIS',
    status: 'coming-soon',
    difficulty: 'easy'
  },
  {
    id: 'food-bank',
    name: 'Food Bank Volunteer',
    description: 'Help distribute food to those in need',
    icon: '🍎',
    category: 'Community',
    civisReward: '150-350 CIVIS',
    status: 'coming-soon',
    difficulty: 'easy'
  }
]

const categoryColors = {
  'Donation': 'badge-secondary',
  'Healthcare': 'badge-error',
  'Volunteering': 'badge-primary',
  'Environmental': 'badge-success',
  'Community': 'badge-warning',
  'Education': 'badge-info'
}

const difficultyColors = {
  'easy': 'badge-success',
  'medium': 'badge-warning',
  'hard': 'badge-error'
}

export function ClaimProjects() {
  const [filter, setFilter] = useState<string>('all')
  const [showSubmitForm, setShowSubmitForm] = useState(false)

  const filteredProjects = projects.filter(project => {
    if (filter === 'all') return true
    if (filter === 'active') return project.status === 'active'
    return project.category === filter
  })

  const categories = ['all', 'active', ...Array.from(new Set(projects.map(p => p.category)))]

  return (
    <div className="space-y-8">
      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 justify-center">
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setFilter(category)}
            className={`btn btn-sm ${filter === category ? 'btn-primary' : 'btn-outline'}`}
          >
            {category === 'all' ? 'All Projects' : 
             category === 'active' ? 'Available Now' : 
             category}
          </button>
        ))}
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map(project => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>

      {/* Submit New Project */}
      <div className="mt-16 text-center">
        <div className="card bg-base-200 p-8 max-w-md mx-auto">
          <div className="text-4xl mb-4">💡</div>
          <h3 className="text-xl font-bold mb-2">Know a Good Project?</h3>
          <p className="text-base-content/70 mb-4">
            Submit a new project for the community to earn CIVIS from
          </p>
          <button
            onClick={() => setShowSubmitForm(true)}
            className="btn btn-primary btn-outline"
          >
            Submit New Project
          </button>
        </div>
      </div>

      {/* Submit Form Modal */}
      {showSubmitForm && (
        <SubmitProjectModal onClose={() => setShowSubmitForm(false)} />
      )}
    </div>
  )
}

function ProjectCard({ project }: { project: Project }) {
  const isActive = project.status === 'active'
  
  return (
    <div className={`card bg-base-100 shadow-xl border-2 transition-all duration-300 hover:shadow-2xl ${
      isActive 
        ? 'border-primary/30 hover:border-primary/60' 
        : 'border-base-300 opacity-75'
    }`}>
      <div className="card-body">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="text-4xl">{project.icon}</div>
          {!isActive && (
            <div className="badge badge-neutral text-xs">Coming Soon</div>
          )}
        </div>

        {/* Content */}
        <h3 className="card-title text-lg mb-2">{project.name}</h3>
        <p className="text-sm text-base-content/70 mb-4">{project.description}</p>

        {/* Badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          <div className={`badge badge-sm ${categoryColors[project.category as keyof typeof categoryColors]}`}>
            {project.category}
          </div>
          <div className={`badge badge-sm ${difficultyColors[project.difficulty]}`}>
            {project.difficulty}
          </div>
        </div>

        {/* Reward */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-base-content/60">Reward:</span>
          <span className="font-semibold text-primary">{project.civisReward}</span>
        </div>

        {/* Action */}
        <div className="card-actions justify-end">
          {isActive ? (
            <Link href={`/claim/${project.id}`} className="btn btn-primary btn-sm">
              Start Claim
            </Link>
          ) : (
            <button className="btn btn-disabled btn-sm" disabled>
              Coming Soon
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function SubmitProjectModal({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    website: '',
    contactEmail: '',
    reasoning: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Handle form submission
    console.log('Project submission:', formData)
    // In real app, this would send to an API
    alert('Thank you for your submission! We\'ll review it and get back to you.')
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="card bg-base-100 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="card-body">
          <div className="flex justify-between items-center mb-4">
            <h3 className="card-title">Submit New Project</h3>
            <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle">✕</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Project Name *</span>
              </label>
              <input
                type="text"
                placeholder="e.g., Local Food Bank"
                className="input input-bordered"
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Description *</span>
              </label>
              <textarea
                placeholder="Describe what this project does and how it helps"
                className="textarea textarea-bordered h-20"
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Category *</span>
              </label>
              <select
                className="select select-bordered"
                value={formData.category}
                onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
                required
              >
                <option value="">Choose category</option>
                <option value="Donation">Donation</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Volunteering">Volunteering</option>
                <option value="Environmental">Environmental</option>
                <option value="Community">Community</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Website</span>
              </label>
              <input
                type="url"
                placeholder="https://example.org"
                className="input input-bordered"
                value={formData.website}
                onChange={e => setFormData(prev => ({ ...prev, website: e.target.value }))}
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Contact Email *</span>
              </label>
              <input
                type="email"
                placeholder="your@email.com"
                className="input input-bordered"
                value={formData.contactEmail}
                onChange={e => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Why should this be added? *</span>
              </label>
              <textarea
                placeholder="Explain why this project deserves CIVIS rewards"
                className="textarea textarea-bordered h-20"
                value={formData.reasoning}
                onChange={e => setFormData(prev => ({ ...prev, reasoning: e.target.value }))}
                required
              />
            </div>

            <div className="card-actions justify-end pt-4">
              <button type="button" onClick={onClose} className="btn btn-ghost">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Submit Project
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
} 