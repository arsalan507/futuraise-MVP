// Core Agent Types for FuturAIse

export interface AgentContext {
  studentId?: string
  parentId?: string
  teacherId?: string
  sessionId?: string
  timestamp: Date
}

export interface AgentResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  metadata?: Record<string, any>
}

export interface AgentInput {
  context: AgentContext
  data: any
}

export interface AgentOutput<T = any> {
  result: T
  nextActions?: string[]
  escalations?: Escalation[]
  events?: AgentEvent[]
}

export interface Escalation {
  severity: 'low' | 'medium' | 'high' | 'critical'
  reason: string
  targetAgent: string
  data?: any
}

export interface AgentEvent {
  type: string
  data: any
  timestamp: Date
}

// Agent Decision Types
export type AgentDecision = 'approve' | 'reject' | 'escalate' | 'defer'

export interface DecisionResult {
  decision: AgentDecision
  reason: string
  confidence: number
  recommendations?: string[]
}

// Checkpoint System
export type CheckpointName =
  | 'welcome'
  | 'target_identified'
  | 'problem_discovered'
  | 'problem_validated'
  | 'solution_designed'
  | 'building_started'
  | 'prototype_working'
  | 'deployed'
  | 'feedback_collected'
  | 'portfolio_created'
  | 'completed'

export type CheckpointStatus = 'not_started' | 'in_progress' | 'completed'

export interface CheckpointData {
  name: CheckpointName
  status: CheckpointStatus
  data?: Record<string, any>
  completedAt?: Date
}

// Student Context
export interface StudentContext extends AgentContext {
  studentId: string
  name: string
  grade: number
  currentWeek: number
  currentCheckpoint: CheckpointName
  completedCheckpoints: CheckpointName[]
  projectId?: string
}

// Conversation Context
export interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  metadata?: Record<string, any>
}

export interface ConversationContext {
  messages: ConversationMessage[]
  checkpoint: CheckpointName
  problemStatement?: string
  solutionType?: string
  [key: string]: any
}

// Analytics Types
export interface StudentMetrics {
  engagementScore: number // 0-100
  frustrationLevel: number // 0-10
  confidenceLevel: number // 0-10
  progressVelocity: number // checkpoints per day
  sessionCount: number
  totalTimeSpent: number // minutes
  messageCount: number
  dropoutRisk: number // 0-100
}

// Intervention Types
export interface InterventionAlert {
  studentId: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  reason: string
  detectedAt: Date
  suggestedAction: string
  context: any
}

// Project Types
export interface ProjectData {
  id: string
  studentId: string
  title: string
  problemStatement: string
  targetPerson: string
  solutionType: string
  status: 'planning' | 'building' | 'testing' | 'deployed' | 'completed'
  toolsUsed: string[]
  impactMetrics?: {
    usageCount: number
    userSatisfaction: number
    testimonial?: string
  }
}

// Communication Types
export interface MessageTemplate {
  id: string
  type: 'email' | 'whatsapp' | 'in_app'
  recipientType: 'student' | 'parent'
  subject?: string
  template: string
  variables: string[]
}

export interface ScheduledMessage {
  recipientId: string
  templateId: string
  variables: Record<string, string>
  scheduledFor: Date
  channel: 'email' | 'whatsapp' | 'in_app'
}
