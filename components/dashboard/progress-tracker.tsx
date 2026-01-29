'use client'

import { CHECKPOINTS, getCheckpointStatus } from '@/lib/checkpoints/checkpoint-manager'
import { Check, Lock, Circle } from 'lucide-react'

interface ProgressTrackerProps {
  currentCheckpoint: string
}

export function ProgressTracker({ currentCheckpoint }: ProgressTrackerProps) {
  const checkpointsWithStatus = CHECKPOINTS.map(cp => ({
    ...cp,
    status: getCheckpointStatus(cp.name, currentCheckpoint)
  }))

  // Group by week
  const weeks = [1, 2, 3]

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6">Your Journey</h2>

      <div className="space-y-8">
        {weeks.map(week => {
          const weekCheckpoints = checkpointsWithStatus.filter(cp => cp.week === week)

          return (
            <div key={week}>
              <div className="flex items-center gap-2 mb-4">
                <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                  Week {week}
                </div>
                <div className="flex-1 h-0.5 bg-gray-200"></div>
              </div>

              <div className="space-y-3">
                {weekCheckpoints.map((checkpoint) => (
                  <div
                    key={checkpoint.name}
                    className={`flex items-start gap-3 p-4 rounded-lg transition-all ${
                      checkpoint.status === 'current'
                        ? 'bg-blue-50 border-2 border-blue-500'
                        : checkpoint.status === 'completed'
                        ? 'bg-green-50 border-2 border-green-200'
                        : 'bg-gray-50 border-2 border-gray-200'
                    }`}
                  >
                    {/* Icon */}
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      checkpoint.status === 'completed'
                        ? 'bg-green-500 text-white'
                        : checkpoint.status === 'current'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-300 text-gray-500'
                    }`}>
                      {checkpoint.status === 'completed' && <Check size={18} />}
                      {checkpoint.status === 'current' && <Circle size={18} />}
                      {checkpoint.status === 'locked' && <Lock size={18} />}
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <h3 className={`font-semibold ${
                        checkpoint.status === 'locked' ? 'text-gray-400' : 'text-gray-900'
                      }`}>
                        {checkpoint.title}
                      </h3>
                      <p className={`text-sm ${
                        checkpoint.status === 'locked' ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {checkpoint.description}
                      </p>

                      {checkpoint.status === 'current' && (
                        <div className="mt-2 inline-block px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
                          In Progress
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
