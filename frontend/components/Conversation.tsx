'use client'

import { useState, useEffect, useRef } from 'react'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface ConversationProps {
  onSearchFromChat?: (payload: any) => void
  externalInputValue?: string
  onExternalInputValueSet?: () => void
}

export default function Conversation({ onSearchFromChat, externalInputValue, onExternalInputValueSet }: ConversationProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const chatHistoryRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Sync external input value when it changes
  useEffect(() => {
    if (externalInputValue !== undefined) {
      setInputValue(externalInputValue)
      if (onExternalInputValueSet) {
        onExternalInputValueSet()
      }
      // Focus the input when external value is set
      setTimeout(() => {
        inputRef.current?.focus()
      }, 0)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalInputValue])

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      const response = await fetch(`/api/advanced_ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage.content }),
      })
      if (!response.ok) {
        throw new Error('Failed to get chat response')
      }

      const data = await response.json()
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response_text || 'No response received',
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])

      // If the response has a payload with a query, trigger search with full payload
      if (data.payload && data.payload.q && onSearchFromChat) {
        onSearchFromChat(data.payload)
      }
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div style={{
      position: 'fixed',
      right: 0,
      top: 0,
      width: '500px',
      height: '100vh',
      backgroundColor: '#ffffff',
      borderLeft: '1px solid #dee2e6',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 1000,
    }}>
      {/* Chat History */}
      <div
        ref={chatHistoryRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {messages.length === 0 ? (
          <div style={{
            color: '#7f8c8d',
            textAlign: 'center',
            marginTop: '40px',
            fontSize: '14px',
          }}>
            Start a conversation to get help with your property search.
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: message.role === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              <div
                style={{
                  maxWidth: '80%',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  backgroundColor: message.role === 'user' ? '#3498db' : '#ecf0f1',
                  color: message.role === 'user' ? '#ffffff' : '#2c3e50',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  wordWrap: 'break-word',
                }}
              >
                {message.content}
              </div>
              <div
                style={{
                  fontSize: '11px',
                  color: '#95a5a6',
                  marginTop: '4px',
                  paddingLeft: message.role === 'user' ? '0' : '4px',
                  paddingRight: message.role === 'user' ? '4px' : '0',
                }}
              >
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
          }}>
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '8px',
                backgroundColor: '#ecf0f1',
                color: '#2c3e50',
                fontSize: '14px',
              }}
            >
              Thinking...
            </div>
          </div>
        )}
      </div>

      {/* Chat Input */}
      <div style={{
        borderTop: '1px solid #dee2e6',
        padding: '16px',
        backgroundColor: '#f8f9fa',
      }}>
        <div style={{
          display: 'flex',
          gap: '8px',
        }}>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            disabled={isLoading}
            style={{
              flex: 1,
              padding: '12px',
              border: '1px solid #bdc3c7',
              borderRadius: '4px',
              fontSize: '14px',
              outline: 'none',
            }}
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
            style={{
              padding: '12px 24px',
              backgroundColor: isLoading || !inputValue.trim() ? '#bdc3c7' : '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: isLoading || !inputValue.trim() ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              if (!isLoading && inputValue.trim()) {
                e.currentTarget.style.backgroundColor = '#2980b9'
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading && inputValue.trim()) {
                e.currentTarget.style.backgroundColor = '#3498db'
              }
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
