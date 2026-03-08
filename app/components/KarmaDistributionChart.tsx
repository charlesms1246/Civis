'use client'

interface CategoryData {
  name: string
  value: number
  color: string
  icon: string
}

interface CivisDistributionChartProps {
  data: CategoryData[]
  title?: string
}

export function CivisDistributionChart({ data, title = "Civis Distribution by Category" }: CivisDistributionChartProps) {
  const maxValue = Math.max(...data.map(d => d.value))
  
  return (
    <div className="card bg-base-100 shadow-lg">
      <div className="card-body">
        <h3 className="card-title text-lg mb-4">{title}</h3>
        <div className="space-y-4">
          {data.map((category) => {
            const percentage = (category.value / maxValue) * 100
            return (
              <div key={category.name} className="flex items-center gap-3">
                <div className="text-xl min-w-8">{category.icon}</div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">{category.name}</span>
                    <span className="text-sm font-bold">{category.value.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-base-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${category.color}`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        <div className="mt-4 text-center">
          <div className="text-sm text-neutral/70">
            Total: {data.reduce((sum, cat) => sum + cat.value, 0).toLocaleString()} CIVIS
          </div>
        </div>
      </div>
    </div>
  )
}
