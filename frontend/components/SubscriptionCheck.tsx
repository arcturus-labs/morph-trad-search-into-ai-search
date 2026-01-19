'use client'

import React, { useState, forwardRef, useImperativeHandle, useEffect } from 'react'
import Cookies from 'js-cookie'
import './SubscriptionCheck.css'

const COOKIE_PREFIX = 'subscription_'
const COOKIE_EMAIL = `${COOKIE_PREFIX}email`
const COOKIE_AUTH = `${COOKIE_PREFIX}authorized`
const COOKIE_OPTIONS = { expires: 365, sameSite: 'strict' as const } // Cookies last 1 year

export interface SubscriptionCheckRef {
  checkSubscription: () => boolean
  clearAuthorization: () => void
}

const SubscriptionCheck = forwardRef<SubscriptionCheckRef>((props, ref) => {
  const [showModal, setShowModal] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')
  const [authorized, setAuthorized] = useState(false)

  // Check cookies on mount
  useEffect(() => {
    const savedEmail = Cookies.get(COOKIE_EMAIL)
    const savedAuth = Cookies.get(COOKIE_AUTH) === 'true'

    console.log('🍪 SubscriptionCheck mounted - checking cookies:')
    console.log('  Email cookie:', savedEmail || 'not set')
    console.log('  Auth cookie:', savedAuth ? 'true (authorized)' : 'false (not authorized)')

    if (savedEmail) {
      setEmail(savedEmail)
    }
    
    if (savedAuth) {
      console.log('  ✅ User is already authorized via cookie')
      setAuthorized(true)
    } else {
      console.log('  ❌ User is NOT authorized - modal will show when checkSubscription() is called')
    }
  }, [])

  const checkSubscription = (): boolean => {
    console.log('🔒 SubscriptionCheck.checkSubscription() called')
    console.log('  Authorized:', authorized)
    console.log('  URL:', typeof window !== 'undefined' ? window.location.href : 'N/A')
    
    // If bypass-subscription is in URL, return true without any other checks
    if (typeof window !== 'undefined' && window.location.href.includes('bypass-subscription')) {
      console.log('  ✅ Bypass mode enabled - allowing access')
      return true
    }

    if (!authorized) {
      console.log('  ❌ Not authorized - showing modal')
      setShowModal(true)
      return false
    }
    
    console.log('  ✅ Authorized - allowing access')
    return true
  }

  const clearAuthorization = () => {
    console.log('🧹 Clearing subscription authorization')
    Cookies.remove(COOKIE_EMAIL)
    Cookies.remove(COOKIE_AUTH)
    setAuthorized(false)
    setEmail('')
    setShowModal(false)
  }

  useImperativeHandle(ref, () => ({
    checkSubscription,
    clearAuthorization
  }))

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsVerifying(true)
    setError('')

    try {
      const response = await fetch('/api/verify_subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const result = await response.json()

      if (result.subscribed) {
        Cookies.set(COOKIE_EMAIL, email, COOKIE_OPTIONS)
        Cookies.set(COOKIE_AUTH, 'true', COOKIE_OPTIONS)
        
        setAuthorized(true)
        setShowModal(false)
      } else {
        Cookies.set(COOKIE_EMAIL, email, COOKIE_OPTIONS)
        setError(result.error || 'Subscription not found. Please check your email for verification instructions.')
      }
    } catch (error) {
      setError('An error occurred. Please try again.')
    } finally {
      setIsVerifying(false)
    }
  }

  // Debug: Log modal state
  useEffect(() => {
    if (showModal) {
      console.log('📋 Subscription modal is now visible')
    }
  }, [showModal])

  if (!showModal) return null

  console.log('🎨 Rendering subscription modal')

  return (
    <div className="subscription-modal-overlay" onClick={(e) => {
      // Prevent closing on overlay click - user must verify
      e.stopPropagation()
    }}>
      <div className="subscription-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Subscription Required</h2>
        <p>
          This application is available exclusively to subscribers. 
          Please enter your email to verify your subscription or subscribe.
        </p>
        <form onSubmit={handleVerification}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
          />
          <button type="submit" disabled={isVerifying}>
            {isVerifying ? 'Verifying...' : 'Verify or Subscribe'}
          </button>
          {error && <p className="error-message">{error}</p>}
        </form>
      </div>
    </div>
  )
})

SubscriptionCheck.displayName = 'SubscriptionCheck'

export default SubscriptionCheck
