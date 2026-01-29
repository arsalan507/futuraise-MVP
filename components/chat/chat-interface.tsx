'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface ChatInterfaceProps {
  studentId: string
  checkpoint: string
  onMessageSent?: (message: string) => void
}

export function ChatInterface({ studentId, checkpoint, onMessageSent }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [initialLoading, setInitialLoading] = useState(true)
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Load initial message from API
  useEffect(() => {
    async function loadInitialMessage() {
      try {
        const response = await fetch('/api/chat')
        if (response.ok) {
          const data = await response.json()
          setMessages([{
            role: 'assistant',
            content: data.message,
            timestamp: new Date()
          }])
        }
      } catch (error) {
        console.error('Error loading initial message:', error)
        // Fallback message
        setMessages([{
          role: 'assistant',
          content: "Hey! I'm Max, your AI building buddy! 👋\n\nOver the next 3 weeks, we're going to build something EPIC - an AI tool that solves a real problem for someone you care about.\n\nReady to get started?",
          timestamp: new Date()
        }])
      } finally {
        setInitialLoading(false)
      }
    }
    loadInitialMessage()
  }, [])

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: Message = {
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    const messageToSend = inputValue
    setInputValue('')
    setIsLoading(true)

    onMessageSent?.(messageToSend)

    try {
      // Call the real Claude API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: messageToSend }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const data = await response.json()

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])

      // If checkpoint advanced, could show celebration animation here
      if (data.checkpointAdvanced) {
        console.log('Checkpoint advanced to:', data.newCheckpoint)
        // Optional: Add celebration UI
      }

    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: Message = {
        role: 'assistant',
        content: "Oops! Something went wrong. Can you try that again? 🤔",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-lg">
      {/* Chat Header */}
      <div className="p-4 border-b-2 border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
            M
          </div>
          <div>
            <h3 className="font-bold text-lg">Max (AI Buddy)</h3>
            <p className="text-sm text-gray-500">Always here to help! 🚀</p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {initialLoading && (
          <div className="flex justify-center items-center h-full">
            <div className="text-gray-500">Loading...</div>
          </div>
        )}
        {!initialLoading && messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
              <p className={`text-xs mt-1 ${message.role === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        )))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t-2 border-gray-100">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  )
}

// Mock response function (will be replaced with Claude API)
function getMockResponse(userInput: string, checkpoint: string): string {
  const lowerInput = userInput.toLowerCase()

  // Problem discovery stage
  if (checkpoint === 'welcome' || checkpoint === 'target_identified') {
    if (lowerInput.includes('ready') || lowerInput.includes('yes')) {
      return "Awesome! Let's start!\n\nWho do you want to help? Pick one:\n\n🏠 Your parent\n👥 A friend\n👨‍👩‍👧 A sibling\n🎓 A teacher\n😊 Yourself\n\nJust tell me which one!"
    }
    if (lowerInput.includes('parent') || lowerInput.includes('mom') || lowerInput.includes('dad')) {
      return "Great choice! Let's help your parent.\n\nWhat's something that stresses them out or annoys them EVERY DAY?\n\nDon't overthink it - just tell me the first thing that comes to mind."
    }
  }

  // Problem description stage
  if (checkpoint === 'problem_discovered') {
    return `Ooh, that's interesting! Let me ask you a few questions:\n\n1. How often does this happen? (Every day? Multiple times a day?)\n2. Does it actually bother them? (Like, do they wish they could fix it?)\n3. Have they tried anything to fix it before?\n\nTell me more!`
  }

  // Default response
  return "That's interesting! Tell me more about that. I'm here to help you figure this out! 💪"
}
