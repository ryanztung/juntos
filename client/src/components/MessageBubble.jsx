import ReactMarkdown from 'react-markdown'

const AGENT_AVATAR_URL = '/agent-avatar.png'

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

import { useState } from 'react'

export default function MessageBubble({ message, isGroup, currentUserId }) {
  const isAgent = message.is_agent || message.role === 'assistant'
  const isOwn = !isAgent && message.sender_id === currentUserId

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
          <div className="mb-timestamp">{formatTime(message.created_at)}</div>
        </div>
      </div>
    </>
  )
}
