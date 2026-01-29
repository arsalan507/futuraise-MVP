# FuturAIse Agent System - Usage Guide

## ✅ ALL 32 AGENTS ARE BUILT!

Every agent from [AGENT_SPECIFICATIONS.md](../../AGENT_SPECIFICATIONS.md) is now implemented and ready to use.

---

## 📁 File Structure

```
lib/agents/
├── index.ts                              # Main export (use this!)
├── types.ts                              # All TypeScript types
├── claude-service.ts                     # Claude API integration
├── all-agents-implementation.ts          # Agents 4-32
├── governance/
│   ├── ceo-agent.ts                     # Agent 01
│   ├── grounding-agent.ts               # Agent 02
│   └── ethics-agent.ts                  # Agent 03
└── AGENTS_USAGE_GUIDE.md                # This file
```

---

## 🚀 Quick Start

### Import All Agents

```typescript
import { agents, coreAgents, getAgent } from '@/lib/agents'
```

### Use Specific Agents

```typescript
// Most common: AI Guide for student chat
import { coreAgents } from '@/lib/agents'

const response = await coreAgents.aiGuide.chat(
  userMessage,
  studentContext
)
```

```typescript
// Problem validation
const validation = await coreAgents.problemSolution.validateProblem(
  problemStatement
)
```

```typescript
// Track student emotions
const sentiment = await coreAgents.studentEmotional.analyzeSentiment(
  studentMessage
)
```

---

## 📖 Agent Usage by Scenario

### Scenario 1: Student Sends Chat Message

```typescript
// app/api/chat/route.ts
import { coreAgents } from '@/lib/agents'

export async function POST(req: Request) {
  const { message, studentId, checkpoint } = await req.json()

  // 1. TRACK EMOTIONAL STATE
  const sentiment = await coreAgents.studentEmotional.analyzeSentiment(message)

  if (sentiment.needsIntervention) {
    // Alert intervention agent
    await coreAgents.intervention.detectNeedsHelp(studentId)
  }

  // 2. GENERATE AI RESPONSE
  const response = await coreAgents.aiGuide.chat(message, {
    studentId,
    checkpoint,
    name: 'Student Name',
    grade: 7,
    // ... other context
  })

  // 3. CHECK FOR SAFETY
  const safetyCheck = await coreAgents.ethics.reviewContentSafety(
    response,
    'ai_response'
  )

  if (!safetyCheck.safe) {
    // Handle unsafe content
    return Response.json({ error: 'Content filtered' })
  }

  // 4. TRACK BEHAVIORAL EVENT
  await coreAgents.studentBehavioral.trackUsagePatterns(studentId)

  return Response.json({ response })
}
```

---

### Scenario 2: Student Completes Checkpoint

```typescript
// lib/workflows/checkpoint-completion.ts
import { coreAgents, agents } from '@/lib/agents'

export async function handleCheckpointCompletion(
  studentId: string,
  checkpoint: CheckpointName
) {
  // 1. VALIDATE COMPLETION QUALITY
  if (checkpoint === 'problem_validated') {
    const validation = await coreAgents.problemSolution.validateProblem(
      problemStatement
    )

    if (!validation.isValid) {
      // Don't complete checkpoint yet
      return { completed: false, reason: validation.feedback }
    }
  }

  // 2. UPDATE PROGRESS
  // Save to database

  // 3. CELEBRATE!
  await agents.desire.status.awardBadge(studentId, checkpointToBadge(checkpoint))

  // 4. NOTIFY PARENT
  await coreAgents.communication.sendEmail(
    parentId,
    'milestone_celebration',
    { checkpointName: checkpoint }
  )

  // 5. CHECK IF WEEK COMPLETED
  if (isWeekCompleted(checkpoint)) {
    await coreAgents.orchestrator.executeWorkflow('weeklyProgression', {
      studentId
    })
  }

  return { completed: true }
}
```

---

### Scenario 3: New Feature Proposal

```typescript
// When adding a new feature to the platform
import { ceoAgent, groundingAgent, ethicsAgent } from '@/lib/agents'

async function evaluateNewFeature(featureName: string, description: string) {
  // 1. CHECK TG ALIGNMENT
  const tgCheck = await groundingAgent.validateTargetGroupAlignment(
    featureName,
    description,
    { timestamp: new Date() }
  )

  if (tgCheck.decision === 'reject') {
    console.log('❌ Feature rejected:', tgCheck.reason)
    return false
  }

  // 2. ETHICS REVIEW
  const ethicsCheck = await ethicsAgent.reviewContent(description, 'ui')

  if (!ethicsCheck.approved) {
    console.log('❌ Ethics concerns:', ethicsCheck.issues)
    return false
  }

  // 3. CEO STRATEGIC DECISION
  const ceoDecision = await ceoAgent.makeStrategicDecision(
    `Implement feature: ${featureName}`,
    { description, tgCheck, ethicsCheck },
    { timestamp: new Date() }
  )

  if (ceoDecision.decision === 'approve') {
    console.log('✅ Feature approved!')
    console.log('Recommendations:', ceoDecision.recommendations)
    return true
  }

  return false
}
```

---

### Scenario 4: Student Gets Stuck

```typescript
// Automatic intervention detection
import { coreAgents, agents } from '@/lib/agents'

export async function checkForStuckStudents() {
  const allStudents = await getAllActiveStudents()

  for (const student of allStudents) {
    // 1. DETECT IF NEEDS HELP
    const alert = await coreAgents.intervention.detectNeedsHelp(student.id)

    if (alert) {
      // 2. PRIORITIZE WITH OTHER ALERTS
      const allAlerts = await getOpenAlerts()
      const prioritized = await coreAgents.intervention.prioritizeInterventions([
        ...allAlerts,
        alert
      ])

      // 3. SEND NOTIFICATION TO TEACHER
      await agents.stakeholders.teacher.flagStudentForHelp(
        student.id,
        alert.reason
      )

      // 4. SEND AUTOMATED HELP MESSAGE
      await coreAgents.communication.sendWhatsApp(
        student.id,
        `Hey! I noticed you might be stuck. Want me to connect you with a teacher? Reply 'HELP' 💬`
      )
    }
  }
}
```

---

### Scenario 5: Generate Weekly Parent Report

```typescript
// lib/workflows/parent-reports.ts
import { agents, coreAgents } from '@/lib/agents'

export async function sendWeeklyParentReports() {
  const students = await getAllActiveStudents()

  for (const student of students) {
    // 1. GET STUDENT METRICS
    const metrics = await coreAgents.studentEmotional.trackEngagement(student.id)
    const behavior = await coreAgents.studentBehavioral.trackUsagePatterns(
      student.id
    )

    // 2. GENERATE REPORT
    const report = await agents.stakeholders.parent.generateWeeklyReport(
      student.id
    )

    // 3. SEND EMAIL
    await coreAgents.communication.sendEmail(student.parentId, 'weekly_report', {
      report,
      metrics,
      behavior
    })

    // 4. CHECK IF READY FOR UPGRADE
    if (student.completedCheckpoints.length >= 11) {
      const readiness = await agents.ops.upgrade.calculateReadinessScore(
        student.id
      )

      if (readiness > 70) {
        await agents.ops.upgrade.triggerUpgradeNurture(student.id)
      }
    }
  }
}
```

---

### Scenario 6: Project Quality Check

```typescript
// When student submits final project
import { coreAgents, agents } from '@/lib/agents'

export async function evaluateFinalProject(projectId: string) {
  const project = await getProject(projectId)

  // 1. EVALUATE AGAINST ULTIMATE STANDARD
  const quality = await coreAgents.ultimateFulfillment.evaluateSolutionQuality(
    project
  )

  if (!quality.meetsUltimateStandard) {
    // 2. PUSH FOR EXCELLENCE
    const improvements = await coreAgents.ultimateFulfillment.pushForExcellence(
      projectId,
      quality.score
    )

    // Send suggestions back to student
    return {
      approved: false,
      score: quality.score,
      feedback: quality.feedback,
      improvements
    }
  }

  // 3. TRACK IMPACT
  const impact = await coreAgents.ultimateFulfillment.trackImpact(projectId)

  // 4. GENERATE SHAREABLE ASSETS
  const assets = await agents.desire.socialProof.generateShareableAsset(project)

  // 5. AWARD COMPLETION BADGE
  await agents.desire.status.awardBadge(project.studentId, 'journey_completed')

  return {
    approved: true,
    score: quality.score,
    impact,
    shareableAssets: assets
  }
}
```

---

## 🎯 Agent Responsibility Quick Reference

| Agent | Primary Use Case | When to Call |
|-------|------------------|--------------|
| **AI Guide** | Chat responses | Every student message |
| **Problem-Solution** | Problem discovery | Week 1 journey |
| **Ultimate Fulfillment** | Quality checking | Project submission |
| **Student Emotional** | Sentiment tracking | Every interaction |
| **Student Behavioral** | Usage patterns | Analytics, dropout detection |
| **Student Psychological** | Learning optimization | Adaptive content |
| **Intervention Intelligence** | Stuck detection | Background checks (every 6 hours) |
| **Communication** | Send messages | Nudges, reports, celebrations |
| **Orchestrator** | Workflow execution | State transitions |
| **Ethics** | Safety checks | All user-generated content |
| **Grounding** | TG alignment | New features, content |
| **CEO** | Strategic decisions | Major changes |

---

## 🔄 Typical Request Flow

```
Student Action
    ↓
┌─────────────────────────────────────┐
│ 1. BEHAVIORAL TRACKING              │  ← Student Behavioral Agent
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ 2. EMOTIONAL ANALYSIS               │  ← Student Emotional Agent
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ 3. AI RESPONSE GENERATION           │  ← AI Guide Agent
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ 4. SAFETY CHECK                     │  ← Ethics Agent
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ 5. CHECKPOINT DETECTION             │  ← Problem-Solution Agent
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ 6. INTERVENTION CHECK (if needed)   │  ← Intervention Agent
└─────────────────────────────────────┘
    ↓
Response to Student
```

---

## 💡 Best Practices

### 1. Always Track Events

```typescript
// After any significant action
await coreAgents.studentBehavioral.trackUsagePatterns(studentId)
```

### 2. Check Safety First

```typescript
// Before showing any AI-generated content
const safe = await coreAgents.ethics.reviewContentSafety(content, 'ai_response')
if (!safe.safe) {
  // Handle appropriately
}
```

### 3. Validate Against TG

```typescript
// Before launching new features
const aligned = await groundingAgent.validateTargetGroupAlignment(
  feature,
  description
)
```

### 4. Use Orchestrator for Complex Workflows

```typescript
// Don't manually chain actions - use orchestrator
await coreAgents.orchestrator.executeWorkflow('onboarding', {
  studentId,
  parentId
})
```

### 5. Combine Multiple Agents

```typescript
// For comprehensive analysis
const [emotional, behavioral, psychological] = await Promise.all([
  coreAgents.studentEmotional.trackEngagement(studentId),
  coreAgents.studentBehavioral.trackUsagePatterns(studentId),
  coreAgents.studentPsychological.analyzeLearningPattern(studentId)
])
```

---

## 🐛 Debugging

### Check if agents are loaded

```typescript
import { validateAgentSystem } from '@/lib/agents'

const { valid, missing } = validateAgentSystem()
console.log('Agent system valid:', valid)
if (!valid) console.error('Missing agents:', missing)
```

### Get agent by name dynamically

```typescript
import { getAgent } from '@/lib/agents'

const agent = getAgent('problem-solution')
if (agent) {
  // Use agent
}
```

### Test individual agent

```typescript
import { coreAgents } from '@/lib/agents'

// Test problem validation
const result = await coreAgents.problemSolution.validateProblem(
  'My mom forgets to drink water'
)
console.log('Validation result:', result)
```

---

## 🔮 Next Steps

### To Connect Agents to Your App:

1. **Chat Interface** (PRIORITY 1)
   ```typescript
   // app/api/chat/route.ts
   import { coreAgents } from '@/lib/agents'
   // Use coreAgents.aiGuide.chat()
   ```

2. **Checkpoint System**
   ```typescript
   // lib/workflows/checkpoints.ts
   // Import and use agents for validation
   ```

3. **Background Jobs**
   ```typescript
   // lib/cron/check-stuck-students.ts
   import { coreAgents } from '@/lib/agents'
   // Run intervention checks
   ```

4. **Analytics Dashboard**
   ```typescript
   // app/admin/dashboard/page.tsx
   import { agents } from '@/lib/agents'
   // Use analytics agents
   ```

---

## ✅ All 32 Agents Built & Ready!

Every agent from the spec is implemented and ready to use. Just import and call! 🎉
