import { useState } from 'react'
import ReactMarkdown from 'react-markdown'

const AGENT_AVATAR_URL = '/agent-avatar.png'
const REACTION_OPTIONS = ['👍', '👎', '❤️', '‼️', '❓']

const styles = `
  .mb-wrapper {
    display: flex;
    margin-bottom: 16px;
    align-items: flex-end;
    gap: 8px;
  }
  .mb-wrapper.user { justify-content: flex-end; }
  .mb-wrapper.agent, .mb-wrapper.other { justify-content: flex-start; }
  .mb-avatar {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #659B90;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 700;
    color: #fff;
    flex-shrink: 0;
    overflow: hidden;
    border: 1px solid #B9B9B9;
    align-self: flex-end;
  }
  .mb-avatar img { width: 100%; height: 100%; object-fit: cover; }
  .mb-avatar.agent { background: #106C54; }
  .mb-bubble-group {
    max-width: 68%;
    display: flex;
    flex-direction: column;
  }
  .mb-wrapper.user .mb-bubble-group { align-items: flex-end; }
  .mb-wrapper.agent .mb-bubble-group,
  .mb-wrapper.other .mb-bubble-group { align-items: flex-start; }
  .mb-label {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 4px;
    font-family: 'Cabin', sans-serif;
  }
  .mb-label.agent { color: #659B90; }
  .mb-label.other { color: #B9B9B9; }
  .mb-bubble {
    padding: 11px 15px;
    border-radius: 16px;
    font-size: 14px;
    line-height: 1.55;
    word-break: break-word;
    font-family: 'Cabin', sans-serif;
  }
  .mb-bubble p { margin: 0 0 10px 0; }
  .mb-bubble p:last-child { margin-bottom: 0; }
  .mb-bubble ul, .mb-bubble ol { margin: 4px 0 10px 0; padding-left: 16px; }
  .mb-bubble ul:last-child, .mb-bubble ol:last-child { margin-bottom: 0; }
  .mb-bubble li { margin-bottom: 6px; line-height: 1.5; }
  .mb-bubble li:last-child { margin-bottom: 0; }
  .mb-bubble strong { font-weight: 700; }
  .mb-wrapper.user .mb-bubble {
    background: #106C54;
    color: #fff;
    border-bottom-right-radius: 4px;
    white-space: pre-wrap;
  }
  .mb-wrapper.agent .mb-bubble,
  .mb-wrapper.other .mb-bubble {
    background: #F3EFE8;
    color: #7A7A7A;
    border: 1px solid #B9B9B9;
    border-bottom-left-radius: 4px;
  }
  .mb-timestamp {
    font-size: 11px;
    color: #B9B9B9;
    margin-top: 4px;
    padding: 0 2px;
  }
  .mb-itinerary-actions {
    margin-top: 6px;
    display: flex;
    align-items: center;
    gap: 5px;
    flex-wrap: wrap;
  }
  .mb-itinerary-label {
    font-size: 11px;
    color: #B9B9B9;
    font-weight: 700;
  }
  .mb-itinerary-btn {
    border: 1px solid rgba(16,108,84,0.25);
    background: rgba(255,252,246,0.75);
    color: #106C54;
    border-radius: 999px;
    padding: 3px 7px;
    font-size: 11px;
    font-weight: 800;
    cursor: pointer;
    font-family: 'Cabin', sans-serif;
    max-width: 180px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .mb-itinerary-btn:hover:not(:disabled) { background: rgba(16,108,84,0.12); }
  .mb-itinerary-btn:disabled { opacity: 0.6; cursor: default; }
  .mb-reactions {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
    margin-top: 5px;
  }
  .mb-reaction-btn {
    border: 1px solid rgba(185,185,185,0.75);
    background: rgba(255,252,246,0.85);
    border-radius: 999px;
    padding: 2px 6px;
    font-size: 12px;
    cursor: pointer;
    font-family: "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", 'Cabin', sans-serif;
    line-height: 1.2;
  }
  .mb-reaction-btn.active {
    border-color: #106C54;
    background: rgba(16,108,84,0.12);
  }
  .mb-reaction-count {
    margin-left: 2px;
    color: #659B90;
    font-size: 10px;
    font-family: 'Cabin', sans-serif;
    font-weight: 800;
  }
`

function formatTime(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function MsgAvatar({ displayName, avatarUrl, isAgent }) {
  const initial = displayName?.[0]?.toUpperCase() ?? '?'
  const [imgError, setImgError] = useState(false)

  // For agent: try the custom avatar file, fall back to initial
  if (isAgent) {
    return (
      <div className="mb-avatar agent">
        {!imgError
          ? <img src={AGENT_AVATAR_URL} alt="agent" onError={() => setImgError(true)} />
          : '✈'}
      </div>
    )
  }

  return (
    <div className="mb-avatar">
      {avatarUrl
        ? <img src={avatarUrl} alt={displayName} onError={() => {}} />
        : initial}
    </div>
  )
}

function AttachmentPreview({ attachments }) {
  if (!attachments || attachments.length === 0) return null
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '6px' }}>
      {attachments.map((att, i) => {
        if (att.mime_type?.startsWith('image/')) {
          return (
            <a key={i} href={att.url} target="_blank" rel="noopener noreferrer">
              <img
                src={att.url}
                alt={att.name}
                style={{ maxWidth: '200px', maxHeight: '150px', borderRadius: '8px', border: '1px solid #B9B9B9', display: 'block' }}
              />
            </a>
          )
        }
        return (
          <a key={i} href={att.url} target="_blank" rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#F3EFE8', border: '1px solid #B9B9B9', borderRadius: '8px', padding: '6px 10px', fontSize: '12px', color: '#7A7A7A', textDecoration: 'none', fontFamily: 'Cabin, sans-serif' }}
          >
            📄 {att.name}
          </a>
        )
      })}
    </div>
  )
}

function stripMarkdown(text) {
  return (text || '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\*\*/g, '')
    .trim()
}

function extractPriceTier(text) {
  const cleaned = text || ''
  return cleaned.match(/\bPrice:\s*(\${1,4})\b/i)?.[1]
    || cleaned.match(/(?:^|[\s(:—-])(\${1,4})(?=\s|[).,—-]|$)/)?.[1]
    || null
}

function extractItinerarySuggestions(content) {
  const raw = (content || '').split(/\n\s*(?:#{1,6}\s*)?(?:sources|citations|references)\s*:?\s*\n/i)[0] || ''
  const casualMatches = Array.from(raw.matchAll(/\b(?:should we|we should|let'?s|lets|want to|could we)\s+(?:do|visit|try|check out|go to|add|plan)\s+([^?.!\n]{3,80})/gi))
    .map((match) => {
      const title = stripMarkdown(match[1]).replace(/^the\s+/i, '').trim()
      return {
        title: title.charAt(0).toUpperCase() + title.slice(1),
        description: 'Suggested in group chat.',
        price: null,
      }
    })
    .filter((item) => item.title && !/\b(source|google|reddit|review|pacing|needs?|preferences?)\b/i.test(item.title))
  const paragraphSplit = raw
    .split(/(?=\s+(?:[-*]\s+|\d+\.\s+)?(?:\[[^\]]+\]\([^)]+\)|[A-Z][A-Za-z0-9&'.’\- ]{1,80})(?:\s*\([^)]*\))?:\s+)/g)
  const lines = raw
    .split('\n')
    .flatMap((l) => paragraphSplit.length > 1 ? l.split(/(?=\s+(?:\[[^\]]+\]\([^)]+\)|[A-Z][A-Za-z0-9&'.’\- ]{1,80})(?:\s*\([^)]*\))?:\s+)/g) : [l])
    .map((l) => l.trim())
    .filter(Boolean)

  const structured = lines
    .map((line) => line.replace(/^[-*]\s+/, '').replace(/^\d+\.\s+/, '').trim())
    .filter((line) => {
      const plain = stripMarkdown(line)
      const title = plain.split(':')[0]?.trim() || ''
      const hasPrice = Boolean(extractPriceTier(line))
      const placeSignal = /\b(restaurant|cafe|coffee|tavern|bar|grill|kitchen|bistro|house|beach|park|trail|museum|hotel|resort|market|tour|snorkel|surf|hike|lookout|waterfall|harbor|pier|garden|luau|spa|farm|ranch|bay|cove|point|road|center|village|mall|shop|winery|brewery|boat|cruise|walk|drive|excursion|activity|experience)\b/i.test(plain)
      const titleLooksSpecific = /^[A-Z0-9][A-Za-z0-9&'.’\- ]{2,80}$/.test(title) && !/\b(the|this|these|for|why|because|overall|option|idea)\b/i.test(title)
      const summaryTitle = /\b(pacing|needs?|preference|preferences|tradeoffs?|constraints?|budget|downtime|group fit|summary|vibe|style|dietary|accessibility|plan|approach|recommendation strategy)\b/i.test(title)
      const sourceLike = /\b(source|sources|citation|citations|reference|references|google|reddit|review|reviews|tripadvisor|yelp)\b/i.test(title) || /^https?:\/\//i.test(plain)
      if (!line.includes(':')) return false
      if (/^#{1,6}\s+/.test(line)) return false
      if (/^(group fit summary|sources|citations)$/i.test(line.replace(':', '').trim())) return false
      if (/^based on everyone'?s preferences/i.test(line)) return false
      if (summaryTitle) return false
      if (sourceLike) return false
      return hasPrice || (/^[\[]?[A-Z][^:]{2,90}:\s+.{14,}/.test(plain) && (placeSignal || titleLooksSpecific))
    })
    .map((line) => {
      const cleaned = stripMarkdown(line)
      const [titlePart, ...rest] = cleaned.split(':')
      const price = extractPriceTier(cleaned)
      const description = rest.join(':')
        .replace(/\bPrice:\s*\${1,4}\b/gi, '')
        .replace(/(?:^|[\s(:—-])\${1,4}(?=\s|[).,—-]|$)/, ' ')
        .replace(/\s+/g, ' ')
        .trim()
      return {
        title: titlePart.trim(),
        description,
        price,
      }
    })
    .filter((item) => item.title && item.description)
    .filter((item) => !/\b(source|sources|citation|citations|reference|references|google|reddit|review|reviews|tripadvisor|yelp)\b/i.test(`${item.title} ${item.description}`))
  return [...casualMatches, ...structured]
    .filter((item, index, arr) => arr.findIndex((x) => x.title.toLowerCase() === item.title.toLowerCase()) === index)
    .slice(0, 12)
}

export default function MessageBubble({ message, isGroup, currentUserId, onAddToItinerary, reactions = {}, onReact }) {
  const isAgent = message.is_agent || message.role === 'assistant'
  const isOwn = !isAgent && message.sender_id === currentUserId
  const [savedTitles, setSavedTitles] = useState(new Set())

  let side
  if (isAgent) side = 'agent'
  else if (isGroup && !isOwn) side = 'other'
  else side = 'user'

  let label = null
  if (isAgent) label = { text: 'Travel Agent', cls: 'agent' }
  else if (isGroup && !isOwn && message.sender_display_name) {
    label = { text: message.sender_display_name, cls: 'other' }
  }

  const showAvatar = isAgent || (!isOwn && (isGroup || isAgent))
  const suggestions = (isAgent || isGroup) && onAddToItinerary ? extractItinerarySuggestions(message.content) : []

  const handleAdd = async (item) => {
    const ok = await onAddToItinerary(item)
    if (ok !== false) {
      setSavedTitles((prev) => new Set([...prev, item.title]))
    }
  }

  return (
    <>
      <style>{styles}</style>
      <div className={`mb-wrapper ${side}`}>
        {showAvatar && (
          <MsgAvatar
            displayName={isAgent ? 'Agent' : message.sender_display_name}
            avatarUrl={isAgent ? null : message.sender_avatar_url}
            isAgent={isAgent}
          />
        )}
        <div className="mb-bubble-group">
          {label && <div className={`mb-label ${label.cls}`}>{label.text}</div>}
          <AttachmentPreview attachments={message.attachments} />
          <div className="mb-bubble">
            {isAgent
              ? <ReactMarkdown>{message.content}</ReactMarkdown>
              : message.content}
          </div>
          {suggestions.length > 0 && (
            <div className="mb-itinerary-actions">
              <span className="mb-itinerary-label">Save</span>
              {suggestions.map((item) => {
                const saved = savedTitles.has(item.title)
                return (
                  <button
                    key={item.title}
                    className="mb-itinerary-btn"
                    onClick={() => handleAdd(item)}
                    disabled={saved}
                    title={item.title}
                  >
                    {saved ? '✓' : '+'} {item.title}
                  </button>
                )
              })}
            </div>
          )}
          {onReact && (
            <div className="mb-reactions">
              {REACTION_OPTIONS.map((emoji) => {
                const reaction = reactions[emoji]
                return (
                  <button
                    key={emoji}
                    className={`mb-reaction-btn${reaction?.reacted ? ' active' : ''}`}
                    onClick={() => onReact(message.id, emoji)}
                    title="React"
                  >
                    {emoji}
                    {reaction?.count > 0 && <span className="mb-reaction-count">{reaction.count}</span>}
                  </button>
                )
              })}
            </div>
          )}
          <div className="mb-timestamp">{formatTime(message.created_at)}</div>
        </div>
      </div>
    </>
  )
}
