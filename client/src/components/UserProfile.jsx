import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

const styles = `
  .pp-wrapper {
    position: relative;
    flex-shrink: 0;
  }
  .pp-trigger-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: #106C54;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 15px;
    font-weight: 700;
    color: #fff;
    overflow: hidden;
    border: 2px solid #B9B9B9;
    cursor: pointer;
    transition: border-color 0.2s, opacity 0.2s;
    flex-shrink: 0;
  }
  .pp-trigger-avatar:hover { border-color: #106C54; opacity: 0.85; }
  .pp-trigger-avatar img { width: 100%; height: 100%; object-fit: cover; }
  .pp-dropdown {
    position: absolute;
    top: calc(100% + 10px);
    right: 0;
    width: 220px;
    background: #FFFCF6;
    border: 1px solid #B9B9B9;
    border-radius: 14px;
    box-shadow: 0 8px 28px rgba(0,0,0,0.12);
    z-index: 100;
    overflow: hidden;
  }
  .pp-dropdown-inner {
    padding: 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }
  .pp-big-avatar {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: #106C54;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 26px;
    font-weight: 700;
    color: #fff;
    overflow: hidden;
    border: 2px solid #B9B9B9;
    cursor: pointer;
    position: relative;
    flex-shrink: 0;
  }
  .pp-big-avatar:hover .pp-avatar-overlay { opacity: 1; }
  .pp-avatar-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0,0,0,0.35);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.2s;
    border-radius: 50%;
    font-size: 11px;
    font-weight: 700;
    color: #fff;
    font-family: 'Cabin', sans-serif;
  }
  .pp-big-avatar img { width: 100%; height: 100%; object-fit: cover; }
  .pp-display-name {
    font-size: 14px;
    font-weight: 700;
    color: #106C54;
    font-family: 'Cabin', sans-serif;
  }
  .pp-hint {
    font-size: 11px;
    color: #B9B9B9;
    font-family: 'Cabin', sans-serif;
    text-align: center;
  }
  .pp-error {
    font-size: 11px;
    color: #dc2626;
    font-family: 'Cabin', sans-serif;
    text-align: center;
  }
  .pp-uploading {
    font-size: 11px;
    color: #659B90;
    font-family: 'Cabin', sans-serif;
  }
`

export default function ProfilePanel({ user, onAvatarChange }) {
  const [open, setOpen] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)
  const wrapperRef = useRef(null)

  useEffect(() => { loadProfile() }, [user.id])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const loadProfile = async () => {
    const { data } = await supabase
      .from('user_profiles')
      .select('display_name, avatar_url')
      .eq('id', user.id)
      .maybeSingle()
    if (data) {
      setDisplayName(data.display_name ?? user.email.split('@')[0])
      setAvatarUrl(data.avatar_url ?? null)
    } else {
      setDisplayName(user.email.split('@')[0])
    }
  }

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    if (!file.type.startsWith('image/')) { setError('Please upload an image file.'); return }
    if (file.size > 5 * 1024 * 1024) { setError('Image must be under 5MB.'); return }
    setError('')
    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `${user.id}.${ext}`
      const { data, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { contentType: file.type, upsert: true })
      if (uploadError) throw uploadError
      const { data: pub } = supabase.storage.from('avatars').getPublicUrl(data.path)
      const url = `${pub.publicUrl}?t=${Date.now()}`
      await supabase.from('user_profiles').update({ avatar_url: url }).eq('id', user.id)
      setAvatarUrl(url)
      onAvatarChange?.(url)
    } catch (err) {
      setError(err.message || 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  const initial = displayName?.[0]?.toUpperCase() ?? '?'

  return (
    <>
      <style>{styles}</style>
      <div className="pp-wrapper" ref={wrapperRef}>
        {/* Small avatar trigger */}
        <div
          className="pp-trigger-avatar"
          onClick={() => setOpen((v) => !v)}
          title={displayName}
        >
          {avatarUrl
            ? <img src={avatarUrl} alt="avatar" />
            : initial}
        </div>

        {/* Dropdown */}
        {open && (
          <div className="pp-dropdown">
            <div className="pp-dropdown-inner">
              <div className="pp-big-avatar" onClick={() => fileInputRef.current?.click()}>
                {avatarUrl
                  ? <img src={avatarUrl} alt="avatar" />
                  : initial}
                <div className="pp-avatar-overlay">
                  {uploading ? 'Uploading...' : 'Change'}
                </div>
              </div>
              <div className="pp-display-name">{displayName}</div>
              {uploading
                ? <div className="pp-uploading">Uploading...</div>
                : <div className="pp-hint">Click photo to change</div>}
              {error && <div className="pp-error">{error}</div>}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileChange}
                disabled={uploading}
              />
            </div>
          </div>
        )}
      </div>
    </>
  )
}