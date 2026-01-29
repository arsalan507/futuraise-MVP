// Checkpoint Manager - Tracks student progress through the journey

export interface Checkpoint {
  name: string
  title: string
  week: number
  order: number
  description: string
}

export interface CheckpointProgress {
  checkpointName: string
  status: 'not_started' | 'in_progress' | 'completed'
  startedAt?: string
  completedAt?: string
  data?: Record<string, any>
}

// All checkpoints in order
export const CHECKPOINTS: Checkpoint[] = [
  {
    name: 'welcome',
    title: 'Welcome!',
    week: 1,
    order: 1,
    description: 'Introduction and getting started'
  },
  {
    name: 'target_identified',
    title: 'Target Person Identified',
    week: 1,
    order: 2,
    description: 'Choose who you want to help'
  },
  {
    name: 'problem_discovered',
    title: 'Problem Discovered',
    week: 1,
    order: 3,
    description: 'Find a real daily problem'
  },
  {
    name: 'problem_validated',
    title: 'Problem Validated',
    week: 1,
    order: 4,
    description: 'Confirm the problem is AI-solvable'
  },
  {
    name: 'solution_designed',
    title: 'Solution Designed',
    week: 2,
    order: 5,
    description: 'Choose solution type and tools'
  },
  {
    name: 'building_started',
    title: 'Building Started',
    week: 2,
    order: 6,
    description: 'Begin creating your solution'
  },
  {
    name: 'prototype_working',
    title: 'Working Prototype',
    week: 2,
    order: 7,
    description: 'Your solution works!'
  },
  {
    name: 'deployed',
    title: 'Deployed to User',
    week: 3,
    order: 8,
    description: 'Give it to your target person'
  },
  {
    name: 'feedback_collected',
    title: 'Feedback Collected',
    week: 3,
    order: 9,
    description: 'Get real usage feedback'
  },
  {
    name: 'portfolio_created',
    title: 'Portfolio Created',
    week: 3,
    order: 10,
    description: 'Document your amazing work'
  },
  {
    name: 'completed',
    title: 'Journey Completed!',
    week: 3,
    order: 11,
    description: 'You did it!'
  }
]

// Get checkpoint by name
export function getCheckpoint(name: string): Checkpoint | undefined {
  return CHECKPOINTS.find(cp => cp.name === name)
}

// Get next checkpoint
export function getNextCheckpoint(currentName: string): Checkpoint | undefined {
  const currentIndex = CHECKPOINTS.findIndex(cp => cp.name === currentName)
  if (currentIndex === -1 || currentIndex === CHECKPOINTS.length - 1) {
    return undefined
  }
  return CHECKPOINTS[currentIndex + 1]
}

// Get previous checkpoint
export function getPreviousCheckpoint(currentName: string): Checkpoint | undefined {
  const currentIndex = CHECKPOINTS.findIndex(cp => cp.name === currentName)
  if (currentIndex <= 0) {
    return undefined
  }
  return CHECKPOINTS[currentIndex - 1]
}

// Get checkpoints by week
export function getCheckpointsByWeek(week: number): Checkpoint[] {
  return CHECKPOINTS.filter(cp => cp.week === week)
}

// Calculate progress percentage
export function calculateProgress(currentCheckpoint: string): number {
  const currentIndex = CHECKPOINTS.findIndex(cp => cp.name === currentCheckpoint)
  if (currentIndex === -1) return 0
  return Math.round((currentIndex / (CHECKPOINTS.length - 1)) * 100)
}

// Get current week from checkpoint
export function getCurrentWeek(checkpointName: string): number {
  const checkpoint = getCheckpoint(checkpointName)
  return checkpoint?.week || 1
}

// Check if checkpoint is completed
export function isCheckpointCompleted(
  checkpointName: string,
  currentCheckpoint: string
): boolean {
  const checkpointIndex = CHECKPOINTS.findIndex(cp => cp.name === checkpointName)
  const currentIndex = CHECKPOINTS.findIndex(cp => cp.name === currentCheckpoint)
  return checkpointIndex < currentIndex
}

// Check if checkpoint is current
export function isCurrentCheckpoint(
  checkpointName: string,
  currentCheckpoint: string
): boolean {
  return checkpointName === currentCheckpoint
}

// Check if checkpoint is locked (future)
export function isCheckpointLocked(
  checkpointName: string,
  currentCheckpoint: string
): boolean {
  const checkpointIndex = CHECKPOINTS.findIndex(cp => cp.name === checkpointName)
  const currentIndex = CHECKPOINTS.findIndex(cp => cp.name === currentCheckpoint)
  return checkpointIndex > currentIndex
}

// Get checkpoint status
export function getCheckpointStatus(
  checkpointName: string,
  currentCheckpoint: string
): 'completed' | 'current' | 'locked' {
  if (isCheckpointCompleted(checkpointName, currentCheckpoint)) {
    return 'completed'
  }
  if (isCurrentCheckpoint(checkpointName, currentCheckpoint)) {
    return 'current'
  }
  return 'locked'
}

// Get all checkpoints with status
export function getCheckpointsWithStatus(currentCheckpoint: string): Array<Checkpoint & { status: 'completed' | 'current' | 'locked' }> {
  return CHECKPOINTS.map(cp => ({
    ...cp,
    status: getCheckpointStatus(cp.name, currentCheckpoint)
  }))
}

// Validate checkpoint transition
export function canAdvanceToCheckpoint(
  fromCheckpoint: string,
  toCheckpoint: string
): boolean {
  const fromIndex = CHECKPOINTS.findIndex(cp => cp.name === fromCheckpoint)
  const toIndex = CHECKPOINTS.findIndex(cp => cp.name === toCheckpoint)

  // Can only advance to the next checkpoint
  return toIndex === fromIndex + 1
}
