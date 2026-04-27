import { useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

const QUESTIONS = [
  {
    key: 'display_name',
    title: 'What should we call you in group chats?',
    emoji: '👤',
    type: 'text',
    placeholder: 'e.g. Alex, TravelBuddy, or your name',
  },
  {
    key: 'budget',
    title: 'What is your daily budget per person?',
    emoji: '💰',
    help: 'Think food, activities, and accommodation — not flights.',
    options: [
    'Under $75/day',     
    '$75–$150/day',       
    '$150–$300/day',      
    '$300+/day',          
  ],
  },
  {
    key: 'destination',
    title: 'What kind of destination are you feeling?',
    emoji: '🌍',
    options: ['Beach & coast', 'City & culture', 'Nature & outdoors', 'Open to anything'],
  },
  {
    key: 'trip_style',
    title: 'What kind of trip do you want?',
    emoji: '✈️',
    options: ['Relaxing & recharging', 'Adventure & active', 'Food & nightlife', 'Balanced mix'],
  },
  {
    key: 'pace_morning',
    title: 'What time do you wake up on vacation?',
    emoji: '🌅',
    options: ['Up at the crack of dawn', 'I like to sleep in', 'Wherever the day takes me'],
  },
  {
    key: 'pace_evening',
    title: 'What does your ideal vacation evening look like?',
    emoji: '🌙',
    options: ['Early night, fully rested', 'Out late, night owl', 'Depends on the day'],
  },
  {
    key: 'activity_style',
    title: 'How do you like to spend your days on a trip?',
    emoji: '🗺️',
    help: 'There\'s no right answer — this helps us suggest the right kind of activities.',
    options: [
      'Fully planned — I want a packed itinerary with guided tours and skip-the-line tickets',
      'Mostly planned — a few anchored activities, but room to wander',
      'Mix of both — mornings structured, afternoons free (or vice versa)',
      'Go with the flow — I discover things organically and hate feeling like a tourist',
    ],
  },
  {
    key: 'downtime',
    title: 'How much downtime do you need?',
    emoji: '🛋️',
    options: ['Lots — I need to decompress', 'Some — a mix of plans and chill', 'Minimal — pack it all in'],
  },
  {
    key: 'accommodation',
    title: 'Where do you like to stay?',
    emoji: '🏨',
    options: ['Hotel', 'Airbnb / vacation rental', 'Hostel', 'No preference'],
  },
  {
    key: 'dietary',
    title: 'Any dietary restrictions? 🍽️',
    emoji: '🍽️',
    multi: true,   // allow multiple selections
    options: ['None', 'Vegetarian', 'Vegan', 'Pescatarian', 'Gluten-free', 'Halal', 'Kosher', 'Nut-free'],
  },
]

const styles = `
  .ob-container {
    min-height: 100vh;
    background: #F3EFE8;
    display: flex; align-items: center; justify-content: center;
    padding: 24px;
    font-family: 'Cabin', sans-serif;
  }
  .ob-card {
    background: #FFFCF6;
    border: 1px solid #B9B9B9;
    border-radius: 16px; padding: 40px; width: 100%; max-width: 540px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.08);
  }
  .ob-header { margin-bottom: 32px; }
  .ob-step-label {
    font-size: 12px; font-weight: 600; color: #659B90;
    text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;
  }
  .ob-title { font-size: 22px; font-weight: 700; color: #106C54; line-height: 1.3; }
  .ob-progress-bar-bg {
    height: 4px; background: #B9B9B9; border-radius: 2px; margin-top: 20px; overflow: hidden;
  }
  .ob-progress-bar-fill {
    height: 100%; background: #106C54; border-radius: 2px; transition: width 0.3s ease;
  }
  .ob-options { display: flex; flex-direction: column; gap: 10px; margin-bottom: 32px; }
  .ob-option {
    background: #F3EFE8; border: 1px solid #B9B9B9; border-radius: 10px;
    padding: 14px 18px; font-size: 15px; color: #7A7A7A;
    cursor: pointer; transition: border-color 0.15s, background 0.15s;
    text-align: left; display: flex; align-items: center; gap: 12px;
    font-family: 'Cabin', sans-serif;
  }
  .ob-option:hover { border-color: #106C54; background: rgba(16,108,84,0.05); }
  .ob-option.selected { border-color: #106C54; background: rgba(16,108,84,0.1); color: #106C54; }
  .ob-option-dot {
    width: 18px; height: 18px; border-radius: 50%; border: 2px solid #B9B9B9;
    flex-shrink: 0; display: flex; align-items: center; justify-content: center;
    transition: border-color 0.15s, background 0.15s;
  }
  .ob-option.selected .ob-option-dot { border-color: #106C54; background: #106C54; }
  .ob-option-dot-inner { width: 7px; height: 7px; border-radius: 50%; background: #fff; display: none; }
  .ob-option.selected .ob-option-dot-inner { display: block; }
  .ob-option-check {
    width: 18px; height: 18px; border-radius: 4px; border: 2px solid #B9B9B9;
    flex-shrink: 0; display: flex; align-items: center; justify-content: center;
    transition: border-color 0.15s, background 0.15s;
    font-size: 12px; line-height: 1;
    color: #fff;
  }
  .ob-option.selected .ob-option-check { border-color: #106C54; background: #106C54; }
  .ob-footer { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
  .ob-btn {
    padding: 11px 24px; border-radius: 8px; font-size: 15px; font-weight: 600;
    cursor: pointer; border: none; transition: background 0.2s, opacity 0.2s;
    font-family: 'Cabin', sans-serif;
  }
  .ob-btn-back { background: transparent; color: #7A7A7A; border: 1px solid #B9B9B9; }
  .ob-btn-back:hover { border-color: #7A7A7A; }
  .ob-btn-next { background: #106C54; color: #fff; margin-left: auto; }
  .ob-btn-next:hover:not(:disabled) { background: #659B90; }
  .ob-btn-next:disabled { opacity: 0.5; cursor: not-allowed; }
  .ob-error {
    background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.3);
    color: #dc2626; border-radius: 8px; padding: 10px 14px;
    font-size: 13px; margin-bottom: 16px;
  }
  .ob-text-input {
    width: 100%; background: #F3EFE8; border: 1px solid #B9B9B9;
    border-radius: 10px; padding: 14px 18px; font-size: 15px; color: #7A7A7A;
    outline: none; transition: border-color 0.15s; margin-bottom: 32px;
    font-family: 'Cabin', sans-serif; box-sizing: border-box;
  }
  .ob-text-input:focus { border-color: #106C54; }
  .ob-text-input::placeholder { color: #B9B9B9; }
`

export default function Onboarding({ user, onComplete }) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const savingRef = useRef(false)

  const currentQuestion = QUESTIONS[step]
  const selectedOption = answers[currentQuestion.key]
  const progress = ((step + 1) / QUESTIONS.length) * 100

  const isOptionSelected = (option) => {
    if (currentQuestion.multi) {
      return Array.isArray(selectedOption) && selectedOption.includes(option)
    }
    return selectedOption === option
  }

  const hasSelection = () => {
    if (currentQuestion.type === 'text') {
      return typeof selectedOption === 'string' && selectedOption.trim().length > 0
    }
    if (currentQuestion.multi) {
      return Array.isArray(selectedOption) && selectedOption.length > 0
    }
    return Boolean(selectedOption)
  }

  const handleSelect = (option) => {
    if (currentQuestion.multi) {
      setAnswers((prev) => {
        const current = Array.isArray(prev[currentQuestion.key]) ? prev[currentQuestion.key] : []
        if (currentQuestion.key === 'dietary') {
          if (option === 'None') {
            return { ...prev, [currentQuestion.key]: ['None'] }
          }

          const withoutNone = current.filter((v) => v !== 'None')
          const next = withoutNone.includes(option)
            ? withoutNone.filter((v) => v !== option)
            : [...withoutNone, option]
          return { ...prev, [currentQuestion.key]: next }
        }

        const next = current.includes(option)
          ? current.filter((v) => v !== option)
          : [...current, option]
        return { ...prev, [currentQuestion.key]: next }
      })
      return
    }

    setAnswers((prev) => ({ ...prev, [currentQuestion.key]: option }))
  }

  const handleNext = () => {
    if (!hasSelection()) return
    if (step < QUESTIONS.length - 1) {
      setStep((s) => s + 1)
    }
  }

  const handleBack = () => {
    if (step > 0) setStep((s) => s - 1)
  }

  const handleFinish = async () => {
    if (!hasSelection()) return
    if (savingRef.current) return
    setError('')
    savingRef.current = true
    setLoading(true)
    try {
      const profile = { id: user.id }
      for (const q of QUESTIONS) {
        if (answers[q.key] !== undefined) profile[q.key] = answers[q.key]
      }
      profile[currentQuestion.key] = selectedOption

      const { error: insertError } = await supabase
        .from('user_profiles')
        .upsert([profile])

      if (insertError) {
        setError(insertError.message)
      } else {
        try {
          const { error: updateErr } = await supabase.auth.updateUser({ data: { onboarding_complete: true } })
          if (updateErr) {
            const msg = updateErr.message || ''
            if (!msg.includes('lock:sb-') || !msg.includes('was released because another request stole it')) {
              setError(updateErr.message)
              return
            }
          }
        } catch (e) {
          const msg = e?.message || ''
          if (!String(msg).includes('lock:sb-') || !String(msg).includes('was released because another request stole it')) {
            setError('An unexpected error occurred.')
            return
          }
        }

        onComplete()
      }
    } catch (e) {
      setError('An unexpected error occurred.')
    } finally {
      setLoading(false)
      savingRef.current = false
    }
  }

  const isLastStep = step === QUESTIONS.length - 1

  return (
    <>
      <style>{styles}</style>
      <div className="ob-container">
        <div className="ob-card">
          <div className="ob-header">
            <div className="ob-step-label">
              Step {step + 1} of {QUESTIONS.length}
            </div>
            <div className="ob-title">
              {currentQuestion.emoji ? `${currentQuestion.emoji} ` : ''}
              {currentQuestion.title}
            </div>
            <div className="ob-progress-bar-bg">
              <div
                className="ob-progress-bar-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {error && <div className="ob-error">{error}</div>}

          {currentQuestion.type === 'text' ? (
            <input
              className="ob-text-input"
              type="text"
              placeholder={currentQuestion.placeholder ?? ''}
              value={answers[currentQuestion.key] ?? ''}
              onChange={(e) => setAnswers((prev) => ({ ...prev, [currentQuestion.key]: e.target.value }))}
              onKeyDown={(e) => {
                if (loading) return
                if (e.key === 'Enter' && hasSelection()) isLastStep ? handleFinish() : handleNext()
              }}
              disabled={loading}
              autoFocus
            />
          ) : (
            <div className="ob-options">
              {currentQuestion.options.map((option) => (
                <button
                  key={option}
                  className={`ob-option${isOptionSelected(option) ? ' selected' : ''}`}
                  onClick={() => handleSelect(option)}
                  disabled={loading}
                >
                  {currentQuestion.multi ? (
                    <span className="ob-option-check">
                      {isOptionSelected(option) ? '✓' : ''}
                    </span>
                  ) : (
                    <span className="ob-option-dot">
                      <span className="ob-option-dot-inner" />
                    </span>
                  )}
                  {option}
                </button>
              ))}
            </div>
          )}

          <div className="ob-footer">
            {step > 0 ? (
              <button
                className="ob-btn ob-btn-back"
                onClick={handleBack}
                disabled={loading}
              >
                Back
              </button>
            ) : (
              <div />
            )}
            {isLastStep ? (
              <button
                className="ob-btn ob-btn-next"
                onClick={handleFinish}
                disabled={!hasSelection() || loading}
              >
                {loading ? 'Saving...' : 'Finish'}
              </button>
            ) : (
              <button
                className="ob-btn ob-btn-next"
                onClick={handleNext}
                disabled={!hasSelection()}
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
