import { useEffect, useRef, useState } from 'react'
import { supabase } from './lib/supabase'
import AuthForm from './components/AuthForm'
import Onboarding from './components/Onboarding'
import ConversationList from './components/ConversationList'
import ChatWindow from './components/ChatWindow'
import ItineraryPanel from './components/ItineraryPanel'

const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Cabin:wght@400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: #F3EFE8;
    color: #7A7A7A;
    font-family: 'Cabin', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    height: 100%;
    overflow: hidden;
  }
  html { height: 100%; }
  #root { height: 100%; }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: #F3EFE8; }
  ::-webkit-scrollbar-thumb { background: #B9B9B9; border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: #999; }
`

export default function App() {
  const [appState, setAppState] = useState('loading')
  const [session, setSession] = useState(null)
  const [activeConversation, setActiveConversation] = useState(null)
  const [activeView, setActiveView] = useState('chat') // 'chat' | 'itinerary'
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const resolving = useRef(false)

  // Mobile detection — must be at top level, not inside conditionals
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    handler()
    return () => window.removeEventListener('resize', handler)
  }, [])

  const withTimeout = async (promise, ms, label) => {
    let timeoutId
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error(`${label} timed out`)), ms)
    })
    try {
      return await Promise.race([promise, timeoutPromise])
    } finally {
      clearTimeout(timeoutId)
    }
  }

  const resolveSession = async (newSession) => {
    if (resolving.current) return
    resolving.current = true
    try {
      setSession(newSession)
      if (!newSession) {
        setAppState('auth')
        setActiveConversation(null)
        return
      }
      const onboardingComplete = newSession.user.user_metadata?.onboarding_complete
      if (onboardingComplete) {
        setAppState('chat')
      } else {
        try {
          const { data: profile, error: profileError } = await withTimeout(
            supabase.from('user_profiles').select('id').eq('id', newSession.user.id).maybeSingle(),
            10000,
            'Loading profile'
          )
          if (profileError) {
            setAppState('onboarding')
          } else if (profile) {
            setAppState('chat')
          } else {
            setAppState('onboarding')
          }
        } catch (e) {
          setAppState('onboarding')
        }
      }
    } catch (e) {
      setAppState('auth')
    } finally {
      resolving.current = false
    }
  }

  useEffect(() => {
    const timeout = setTimeout(() => setAppState('auth'), 10000)

    supabase.auth.getSession().then(({ data: { session } }) => {
      clearTimeout(timeout)
      resolveSession(session)
    }).catch(() => {
      clearTimeout(timeout)
      setAppState('auth')
    })
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => resolveSession(newSession)
    )

    return () => {
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [])

  const handleOnboardingComplete = () => setAppState('chat')

  const handleSelectConversation = (id, isGroup = false) => {
    setActiveConversation({ id, isGroup })
    setActiveView('chat')
  }

  const handleNewConversation = (id, isGroup = false) => {
    setActiveConversation({ id, isGroup })
    setActiveView('chat')
  }

  const handleOpenItinerary = (id, isGroup = false) => {
    setActiveConversation({ id, isGroup })
    setActiveView('itinerary')
  }

  const handleBackToList = () => {
    setActiveConversation(null)
    setActiveView('chat')
  }

  // Derived layout flags
  const hasActivePanel = !!activeConversation
  const showSidebar = !isMobile || !hasActivePanel
  const showPanel = !isMobile || hasActivePanel

  if (appState === 'loading') {
    return (
      <>
        <style>{globalStyles}</style>
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', height: '100%', background: '#F3EFE8',
          color: '#7A7A7A', gap: '12px',
        }}>
          <div style={{ fontSize: '32px' }}>✈️</div>
          <div style={{ fontSize: '15px' }}>Loading Travel Agent...</div>
          <div style={{ fontSize: '12px', color: '#B9B9B9' }}>Connecting to server</div>
        </div>
      </>
    )
  }

  if (appState === 'auth') {
    return (
      <>
        <style>{globalStyles}</style>
        <AuthForm />
      </>
    )
  }

  if (appState === 'onboarding') {
    return (
      <>
        <style>{globalStyles}</style>
        <Onboarding user={session.user} onComplete={handleOnboardingComplete} />
      </>
    )
  }

  return (
    <>
      <style>{globalStyles}</style>
      <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

        {/* Sidebar — full screen on mobile when no panel is active */}
        {showSidebar && (
          <div style={{
            width: isMobile ? '100%' : 'auto',
            flex: isMobile ? '1' : 'none',
            overflow: 'hidden',
            height: '100%',
          }}>
            <ConversationList
              user={session.user}
              activeConversationId={activeConversation?.id}
              activeView={activeView}
              onSelect={handleSelectConversation}
              onNew={handleNewConversation}
              onOpenItinerary={handleOpenItinerary}
            />
          </div>
        )}

        {/* Main panel — full screen on mobile when active */}
        {showPanel && (
          <div style={{ flex: 1, overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
            {activeConversation ? (
              activeView === 'itinerary' ? (
                <>
                  {/* Itinerary back bar — mobile only */}
                  {isMobile && (
                    <div style={{
                      height: '52px',
                      background: '#F3EFE8',
                      borderBottom: '1px solid #B9B9B9',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0 16px',
                      flexShrink: 0,
                    }}>
                      <button
                        onClick={handleBackToList}
                        style={{
                          background: 'transparent', border: 'none', cursor: 'pointer',
                          color: '#106C54', fontSize: '22px', padding: '0 8px 0 0',
                          lineHeight: 1, fontFamily: 'Cabin, sans-serif',
                        }}
                      >
                        ‹
                      </button>
                      <span style={{
                        fontSize: '15px', fontWeight: 700,
                        color: '#106C54', fontFamily: 'Cabin, sans-serif',
                      }}>
                        Itinerary
                      </span>
                    </div>
                  )}
                  <div style={{ flex: 1, overflow: 'auto' }}>
                    <ItineraryPanel conversationId={activeConversation.id} />
                  </div>
                </>
              ) : (
                <ChatWindow
                  user={session.user}
                  session={session}
                  conversationId={activeConversation.id}
                  isGroup={activeConversation.isGroup ?? false}
                  onBack={isMobile ? handleBackToList : undefined}
                />
              )
            ) : (
              /* Desktop welcome screen — only shown on desktop when nothing selected */
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', height: '100%', background: '#FFFCF6',
                color: '#7A7A7A', gap: '12px',
              }}>
                <div style={{ fontSize: '48px' }}>✈️</div>
                <div style={{ fontSize: '20px', fontWeight: 600, color: '#106C54' }}>
                  Welcome to Juntos
                </div>
                <div style={{ fontSize: '14px' }}>
                  Select a conversation or start a new one
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
