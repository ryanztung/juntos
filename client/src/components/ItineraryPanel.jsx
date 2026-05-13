import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

const DAY_COUNT = 5
const DEFAULT_DAY_COUNT = 5
const MAX_DAY_COUNT = 14
const ICON_OPTIONS = [
  { label: 'Auto', value: 'AUTO' },
  { label: 'Food', value: '🍴' },
  { label: 'Coffee', value: '☕' },
  { label: 'Beach', value: '🌊' },
  { label: 'Nature', value: '🌿' },
  { label: 'Stay', value: '🏠' },
  { label: 'Art', value: '🎨' },
  { label: 'Shop', value: '🛒' },
  { label: 'Transport', value: '🚗' },
  { label: 'Note', value: '⭐' },
  { label: 'Place', value: '📍' },
]

const styles = `
  .it-page { height: 100%; background: #FFFCF6; font-family: 'Cabin', sans-serif; display: flex; flex-direction: column; }
  .it-header { min-height: 66px; padding: 12px 16px; background: #F3EFE8; border-bottom: 1px solid #B9B9B9; display: flex; flex-direction: column; gap: 8px; flex-shrink: 0; }
  .it-header-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .it-trip-length { display: flex; align-items: center; gap: 6px; color: #659B90; font-size: 12px; font-weight: 800; }
  .it-title { font-size: 18px; font-weight: 700; color: #106C54; }
  .it-sub { font-size: 12px; color: #659B90; margin-top: 2px; }
  .it-body { flex: 1; overflow: auto; padding: 20px; }
  .it-empty { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; color: #7A7A7A; gap: 10px; }
  .it-empty-icon { font-size: 42px; }
  .it-empty-title { font-size: 17px; font-weight: 700; color: #106C54; }
  .it-empty-sub { font-size: 13px; max-width: 380px; line-height: 1.45; }
  .it-board { display: grid; grid-template-columns: repeat(var(--day-count), minmax(245px, 1fr)); gap: 14px; min-width: calc(var(--day-count) * 245px + (var(--day-count) - 1) * 14px); align-items: flex-start; }
  .it-day { background: #F3EFE8; border: 1px solid #B9B9B9; border-radius: 16px; min-height: 440px; display: flex; flex-direction: column; overflow: hidden; transition: border-color 0.15s ease, background 0.15s ease; }
  .it-day.drag-over { border-color: #106C54; background: rgba(16,108,84,0.08); }
  .it-day-head { padding: 14px; border-bottom: 1px solid #B9B9B9; display: flex; align-items: center; justify-content: space-between; background: rgba(16,108,84,0.05); }
  .it-day-title { font-size: 14px; font-weight: 800; color: #106C54; }
  .it-day-count { font-size: 11px; color: #659B90; font-weight: 700; }
  .it-day-items { padding: 12px; display: flex; flex-direction: column; gap: 10px; flex: 1; min-height: 360px; }
  .it-card { background: #FFFCF6; border: 1px solid rgba(185,185,185,0.75); border-radius: 14px; padding: 12px; cursor: grab; box-shadow: 0 2px 8px rgba(0,0,0,0.04); touch-action: none; }
  .it-card:active { cursor: grabbing; }
  .it-card-back { min-height: 150px; display: flex; flex-direction: column; gap: 9px; }
  .it-card-back-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; color: #106C54; font-size: 13px; font-weight: 800; }
  .it-card-title-row { display: flex; align-items: center; gap: 7px; margin-bottom: 7px; }
  .it-card-emoji { width: 48px; height: 34px; border: 1px solid rgba(16,108,84,0.18); border-radius: 999px; background: rgba(16,108,84,0.1); flex-shrink: 0; font-size: 15px; font-family: "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif; text-align: center; outline: none; cursor: pointer; padding: 0 2px; }
  .it-card-emoji:hover { background: rgba(16,108,84,0.16); }
  .it-card-title-input, .it-card-desc-input { width: 100%; border: 1px solid transparent; background: transparent; color: #106C54; font-family: 'Cabin', sans-serif; outline: none; border-radius: 8px; overflow: hidden; }
  .it-card-title-input { font-size: 14px; font-weight: 800; line-height: 1.25; resize: none; min-height: 36px; }
  .it-card-desc-input { font-size: 13px; color: #7A7A7A; line-height: 1.45; resize: none; min-height: 84px; }
  .it-card-title-input:focus, .it-card-desc-input:focus { border-color: rgba(16,108,84,0.25); background: #fff; padding: 5px 7px; }
  .it-card-meta { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 9px; }
  .it-card-full-desc { color: #7A7A7A; font-size: 13px; line-height: 1.45; white-space: pre-wrap; background: rgba(243,239,232,0.7); border: 1px solid rgba(185,185,185,0.55); border-radius: 10px; padding: 10px; flex: 1; }
  .it-full-text-btn { width: 100%; border: 1px dashed rgba(16,108,84,0.28); background: rgba(16,108,84,0.06); color: #106C54; border-radius: 10px; padding: 6px 8px; font-size: 12px; font-weight: 800; cursor: pointer; font-family: 'Cabin', sans-serif; margin-top: 6px; }
  .it-full-text-btn:hover:not(:disabled) { background: rgba(16,108,84,0.11); }
  .it-full-text-btn:disabled { opacity: 0.45; cursor: default; }
  .it-price { font-size: 11px; color: #659B90; font-weight: 800; }
  .it-controls { display: flex; gap: 6px; flex-wrap: wrap; justify-content: flex-end; align-items: center; }
  .it-btn { border: 1px solid #B9B9B9; background: #fff; color: #106C54; border-radius: 999px; padding: 4px 8px; font-size: 11px; font-weight: 800; cursor: pointer; font-family: 'Cabin', sans-serif; }
  .it-add-btn { border: 1px solid #106C54; background: #106C54; color: #FFFCF6; border-radius: 999px; padding: 8px 12px; font-size: 12px; font-weight: 800; cursor: pointer; font-family: 'Cabin', sans-serif; }
  .it-add-btn:hover:not(:disabled) { background: #0b5a45; }
  .it-add-btn:disabled { opacity: 0.45; cursor: default; }
  .it-delete-btn { border: 1px solid rgba(176,65,65,0.35); background: rgba(176,65,65,0.06); color: #B04141; border-radius: 999px; padding: 4px 8px; font-size: 11px; font-weight: 800; cursor: pointer; font-family: 'Cabin', sans-serif; }
  .it-delete-btn:hover { background: rgba(176,65,65,0.12); }
  .it-btn:hover:not(:disabled) { border-color: #106C54; background: rgba(16,108,84,0.06); }
  .it-btn:disabled { opacity: 0.45; cursor: default; }
  .it-day-empty { color: #B9B9B9; font-size: 12px; line-height: 1.4; border: 1px dashed #B9B9B9; border-radius: 12px; padding: 12px; text-align: center; }
  .it-add-panel { margin-bottom: 16px; background: #F3EFE8; border: 1px solid #B9B9B9; border-radius: 16px; padding: 14px; display: flex; flex-direction: column; gap: 10px; }
  .it-add-panel-row { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }  .it-add-input { border: 1px solid #B9B9B9; background: #FFFCF6; color: #106C54; border-radius: 10px; padding: 9px 10px; font-size: 13px; font-family: 'Cabin', sans-serif; outline: none; }
  .it-add-input:focus { border-color: #106C54; }
  .it-trip-length { display: flex; align-items: center; gap: 7px; color: #659B90; font-size: 12px; font-weight: 800; }
  .it-trip-length-input { width: 58px; border: 1px solid #B9B9B9; background: #FFFCF6; color: #106C54; border-radius: 10px; padding: 7px 8px; font-size: 13px; font-family: 'Cabin', sans-serif; outline: none; }
  .it-trip-length-input:focus { border-color: #106C54; }
`

function parseEvent(content, prefix) {
  try {
    return JSON.parse((content || '').replace(new RegExp(`^${prefix}`), ''))
  } catch {
    return null
  }
}

function parseItem(content) {
  return parseEvent(content, '__ITINERARY_ITEM__')
}

function parseUpdate(content) {
  return parseEvent(content, '__ITINERARY_UPDATE__')
}

function parseDelete(content) {
  return parseEvent(content, '__ITINERARY_DELETE__')
}

function parseSettings(content) {
  return parseEvent(content, '__ITINERARY_SETTINGS__')
}

function normalizedDayCount(value) {
  const number = Number(value)
  if (!Number.isFinite(number)) return DEFAULT_DAY_COUNT
  return Math.min(MAX_DAY_COUNT, Math.max(1, Math.round(number)))
}

function withDefaults(item, index) {
  return {
    ...item,
    day: item.day || ((index % DAY_COUNT) + 1),
    title: item.title || 'Untitled stop',
    description: item.short_description || item.description || '',
    price: item.price || extractPriceTier(`${item.description || ''} ${item.original_description || ''}`),
  }
}

function conciseDescription(description) {
  const cleaned = (description || '').replace(/\s+/g, ' ').replace(/\bPrice:\s*\${1,4}\b/gi, '').trim()
  if (cleaned.length <= 115) return cleaned
  const sentence = cleaned.split(/(?<=[.!?])\s+/)[0]
  if (sentence && sentence.length <= 140) return sentence
  return `${cleaned.slice(0, 112).trim()}...`
}

function extractPriceTier(text) {
  const cleaned = text || ''
  return cleaned.match(/\bPrice:\s*(\${1,4})\b/i)?.[1]
    || cleaned.match(/(?:^|[\s(:—-])(\${1,4})(?=\s|[).,—-]|$)/)?.[1]
    || null
}

function suggestedIcon(item) {
  const text = `${item.title || ''} ${item.description || ''}`.toLowerCase()
  if (/\b(flight|airport|airline|rental car|rideshare|uber|lyft|shuttle|taxi|drive|road trip|transport|ferry|bus|train)\b/.test(text)) return '🚗'
  if (/\b(hotel|resort|inn|lodge|condo|airbnb|vrbo|stay|staying|lodging|accommodation|check-in|check in)\b/.test(text)) return '🏠'
  if (/\b(coffee|cafe|café|espresso|latte|bakery|pastry|breakfast|brunch|bagel|donut)\b/.test(text)) return '☕'
  if (/\b(restaurant|dinner|lunch|food|eat|meal|tavern|grill|kitchen|bistro|bar|sushi|pizza|taco|tacos|seafood|steak|fish house|fish market|noodle|ramen|poke|plate lunch|luau)\b/.test(text)) return '🍴'
  if (/\b(beach|ocean|snorkel|snorkeling|surf|swim|sunset|sand|shore|bay|cove|reef|harbor|water|boat|sail|kayak|paddleboard)\b/.test(text)) return '🌊'
  if (/\b(hike|trail|park|nature|waterfall|lookout|summit|garden|botanical|farm|ranch|volcano|valley|forest|scenic)\b/.test(text)) return '🌿'
  if (/\b(museum|gallery|culture|cultural|historic|history|art|show|performance|theater|theatre|temple)\b/.test(text)) return '🎨'
  if (/\b(shop|shopping|market|mall|boutique|souvenir|store|swap meet)\b/.test(text)) return '🛒'
  return '📍'
}

function cardIcon(item) {
  return item.icon && item.icon !== 'AUTO' ? item.icon : suggestedIcon(item)
}

export default function ItineraryPanel({ conversationId }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [draggingItemId, setDraggingItemId] = useState(null)
  const [dragOverDay, setDragOverDay] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newCard, setNewCard] = useState({ title: '', description: '', day: 1, icon: 'AUTO' })
  const [dayCount, setDayCount] = useState(DEFAULT_DAY_COUNT)
  const [expandedCardIds, setExpandedCardIds] = useState(new Set())
  const touchDragRef = useRef({ itemId: null, startX: 0, startY: 0 })

  const mergeEvents = (messages) => {
    const itemMap = new Map()
    let itemIndex = 0
    for (const message of messages || []) {
      const content = message?.content || ''
      if (content.startsWith('__ITINERARY_ITEM__')) {
        const item = parseItem(content)
        if (!item?.title) continue
        itemMap.set(item.item_id, {
          ...withDefaults(item, itemIndex),
          description: conciseDescription(item.short_description || item.description),
          original_description: item.original_description || item.description || item.short_description || '',
          message_id: message.id,
          created_at: message.created_at,
        })
        itemIndex += 1
      } else if (content.startsWith('__ITINERARY_UPDATE__')) {
        const update = parseUpdate(content)
        if (!update?.item_id || !itemMap.has(update.item_id)) continue
        itemMap.set(update.item_id, {
          ...itemMap.get(update.item_id),
          ...update.updates,
        })
      } else if (content.startsWith('__ITINERARY_DELETE__')) {
        const deleted = parseDelete(content)
        if (deleted?.item_id) itemMap.delete(deleted.item_id)
      }
    }
    return Array.from(itemMap.values())
  }

  const mergeSettings = (messages) => {
    let count = DEFAULT_DAY_COUNT
    for (const message of messages || []) {
      const content = message?.content || ''
      if (!content.startsWith('__ITINERARY_SETTINGS__')) continue
      const settings = parseSettings(content)
      if (settings?.day_count) count = normalizedDayCount(settings.day_count)
    }
    return count
  }

  useEffect(() => {
    if (!conversationId) {
      setItems([])
      setDayCount(DEFAULT_DAY_COUNT)
      setLoading(false)
      return
    }

    let channel
    const loadItems = async () => {
      setLoading(true)
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .or('content.like.__ITINERARY_ITEM__%,content.like.__ITINERARY_UPDATE__%,content.like.__ITINERARY_DELETE__%,content.like.__ITINERARY_SETTINGS__%')
        .order('created_at', { ascending: true })
      setItems(mergeEvents(data || []))
      setDayCount(mergeSettings(data || []))
      setLoading(false)
    }

    loadItems()
    channel = supabase
      .channel(`itinerary-${conversationId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, (payload) => {
        const content = payload.new?.content || ''
        if (content.startsWith('__ITINERARY_ITEM__')) {
          const item = parseItem(content)
          if (!item?.title) return
          setItems((prev) => [...prev, {
            ...withDefaults(item, prev.length),
            description: conciseDescription(item.short_description || item.description),
            original_description: item.original_description || item.description || item.short_description || '',
            message_id: payload.new.id,
            created_at: payload.new.created_at,
          }].filter((entry, index, arr) => arr.findIndex((x) => x.item_id === entry.item_id) === index))
        } else if (content.startsWith('__ITINERARY_UPDATE__')) {
          const update = parseUpdate(content)
          if (!update?.item_id) return
          setItems((prev) => prev.map((item) => (item.item_id === update.item_id ? { ...item, ...update.updates } : item)))
        } else if (content.startsWith('__ITINERARY_DELETE__')) {
          const deleted = parseDelete(content)
          if (!deleted?.item_id) return
          setItems((prev) => prev.filter((item) => item.item_id !== deleted.item_id))
        } else if (content.startsWith('__ITINERARY_SETTINGS__')) {
          const settings = parseSettings(content)
          if (settings?.day_count) setDayCount(normalizedDayCount(settings.day_count))
        }
      })
      .subscribe()

    return () => {
      if (channel) supabase.removeChannel(channel)
    }
  }, [conversationId])

  const days = useMemo(() => Array.from({ length: dayCount }, (_, i) => i + 1), [dayCount])

  const updateTripLength = async (value) => {
    const nextDayCount = normalizedDayCount(value)
    const itemsToMove = items.filter((item) => item.day > nextDayCount)
    setDayCount(nextDayCount)
    setNewCard((prev) => ({ ...prev, day: Math.min(Number(prev.day) || 1, nextDayCount) }))
    setItems((prev) => prev.map((item) => (item.day > nextDayCount ? { ...item, day: nextDayCount } : item)))
    if (!conversationId) return
    await supabase.from('messages').insert({
      conversation_id: conversationId,
      role: 'user',
      content: `__ITINERARY_SETTINGS__${JSON.stringify({
        day_count: nextDayCount,
        updated_at: new Date().toISOString(),
      })}`,
      is_agent: false,
    })
    await Promise.all(itemsToMove.map((item) => saveUpdate(item.item_id, { day: nextDayCount })))
  }

  const saveUpdate = async (itemId, updates) => {
    if (!conversationId || !itemId) return
    await supabase.from('messages').insert({
      conversation_id: conversationId,
      role: 'user',
      content: `__ITINERARY_UPDATE__${JSON.stringify({
        item_id: itemId,
        updates,
        updated_at: new Date().toISOString(),
      })}`,
      is_agent: false,
    })
  }

  const updateItem = (itemId, updates, persist = false) => {
    setItems((prev) => prev.map((item) => (item.item_id === itemId ? { ...item, ...updates } : item)))
    if (persist) saveUpdate(itemId, updates)
  }

  const moveItem = (itemId, day) => {
    setItems((prev) => prev.map((item) => (item.item_id === itemId ? { ...item, day } : item)))
    saveUpdate(itemId, { day })
  }

  const deleteItem = async (itemId) => {
    if (!conversationId || !itemId) return
    setItems((prev) => prev.filter((item) => item.item_id !== itemId))
    await supabase.from('messages').insert({
      conversation_id: conversationId,
      role: 'user',
      content: `__ITINERARY_DELETE__${JSON.stringify({
        item_id: itemId,
        deleted_at: new Date().toISOString(),
      })}`,
      is_agent: false,
    })
  }

  const addCustomCard = async () => {
    const title = newCard.title.trim()
    const description = newCard.description.trim()
    if (!conversationId || !title) return
    const item = {
      item_id: crypto.randomUUID(),
      title,
      description,
      day: Number(newCard.day) || 1,
      icon: newCard.icon || 'AUTO',
      price: null,
      source: 'custom',
      created_at: new Date().toISOString(),
    }
    setItems((prev) => [...prev, item])
    setNewCard({ title: '', description: '', day: Number(newCard.day) || 1, icon: 'AUTO' })
    setShowAddForm(false)
    const { error } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      role: 'user',
      content: `__ITINERARY_ITEM__${JSON.stringify(item)}`,
      is_agent: false,
    })
    if (error) {
      setItems((prev) => prev.filter((x) => x.item_id !== item.item_id))
    }
  }

  const handleDrop = (day) => {
    if (draggingItemId) moveItem(draggingItemId, day)
    setDraggingItemId(null)
    setDragOverDay(null)
  }

  const toggleCardDetails = (itemId) => {
    setExpandedCardIds((prev) => {
      const next = new Set(prev)
      if (next.has(itemId)) next.delete(itemId)
      else next.add(itemId)
      return next
    })
  }

  const handleTouchStart = (e, itemId) => {
    touchDragRef.current.itemId = itemId
    touchDragRef.current.startX = e.touches[0].clientX
    touchDragRef.current.startY = e.touches[0].clientY
  }

  const handleTouchEnd = (e) => {
    const { itemId } = touchDragRef.current
    if (!itemId) return
    const touch = e.changedTouches[0]
    const el = document.elementFromPoint(touch.clientX, touch.clientY)
    const dayEl = el?.closest('[data-day]')
    if (dayEl) {
      const day = Number(dayEl.getAttribute('data-day'))
      if (day) moveItem(itemId, day)
    }
    touchDragRef.current.itemId = null
    setDragOverDay(null)
  }

  const handleTouchMove = (e) => {
    const touch = e.touches[0]
    const el = document.elementFromPoint(touch.clientX, touch.clientY)
    const dayEl = el?.closest('[data-day]')
    setDragOverDay(dayEl ? Number(dayEl.getAttribute('data-day')) : null)
  }
  
  return (
    <>
      <style>{styles}</style>
      <div className="it-page">
        <div className="it-header">
          <div>
            <div className="it-title">Trip Itinerary</div>
            <div className="it-sub">Drag saved ideas between days, then edit the details</div>
          </div>
          <div className="it-header-actions">
            <label className="it-trip-length">
              Trip days
              <input
                className="it-trip-length-input"
                type="number"
                min="1"
                max={MAX_DAY_COUNT}
                value={dayCount}
                disabled={!conversationId}
                onChange={(e) => updateTripLength(e.target.value)}
              />
            </label>
            <div className="it-sub">{items.length} item{items.length === 1 ? '' : 's'}</div>
            <button className="it-add-btn" onClick={() => setShowAddForm((v) => !v)} disabled={!conversationId}>
              {showAddForm ? 'Cancel' : '+ Add card'}
            </button>
          </div>
        </div>
        <div className="it-body">
          {!conversationId ? (
            <div className="it-empty">
              <div className="it-empty-icon">🗓️</div>
              <div className="it-empty-title">Select a chat first</div>
              <div className="it-empty-sub">Choose an agent or group chat, then save AI suggestions into its itinerary.</div>
            </div>
          ) : loading ? (
            <div className="it-empty"><div className="it-empty-sub">Loading itinerary...</div></div>
          ) : (
            <>
              {showAddForm && (
                <div className="it-add-panel">
                  <input
                    className="it-add-input"
                    placeholder="Card title"
                    value={newCard.title}
                    onChange={(e) => setNewCard((prev) => ({ ...prev, title: e.target.value }))}
                    style={{ width: '100%' }}
                  />
                  <input
                    className="it-add-input"
                    placeholder="Short note, time, or details"
                    value={newCard.description}
                    onChange={(e) => setNewCard((prev) => ({ ...prev, description: e.target.value }))}
                    style={{ width: '100%' }}
                  />
                  <div className="it-add-panel-row">
                    <select
                      className="it-add-input"
                      value={newCard.day}
                      onChange={(e) => setNewCard((prev) => ({ ...prev, day: Number(e.target.value) }))}
                      style={{ flex: 1 }}
                    >
                      {days.map((day) => <option key={day} value={day}>Day {day}</option>)}
                    </select>
                    <select
                      className="it-add-input"
                      value={newCard.icon}
                      onChange={(e) => setNewCard((prev) => ({ ...prev, icon: e.target.value }))}
                      style={{ flex: 1 }}
                    >
                      {ICON_OPTIONS.map((icon) => (
                        <option key={icon.value} value={icon.value}>{icon.value === 'AUTO' ? `Auto ${suggestedIcon(newCard)}` : `${icon.value} ${icon.label}`}</option>
                      ))}
                    </select>
                    <button className="it-add-btn" onClick={addCustomCard} disabled={!newCard.title.trim()}>
                      Add
                    </button>
                  </div>
                </div>
              )}
              {items.length === 0 && !showAddForm ? (
                <div className="it-empty">
                  <div className="it-empty-icon">✨</div>
                  <div className="it-empty-title">No itinerary items yet</div>
                  <div className="it-empty-sub">Ask the AI agent for recommendations, click “Add to itinerary,” or create your own card.</div>
                </div>
              ) : (
                <div className="it-board" style={{ '--day-count': dayCount }}>
                  {days.map((day) => {
                    const dayItems = items.filter((item) => item.day === day)
                    return (
                      <div
                        key={day}
                        data-day={day}
                        className={`it-day${dragOverDay === day ? ' drag-over' : ''}`}
                        onDragOver={(e) => { e.preventDefault(); setDragOverDay(day) }}
                        onDragLeave={() => setDragOverDay(null)}
                        onDrop={() => handleDrop(day)}
                      >
                        <div className="it-day-head">
                          <div className="it-day-title">Day {day}</div>
                          <div className="it-day-count">{dayItems.length} stop{dayItems.length === 1 ? '' : 's'}</div>
                        </div>
                        <div className="it-day-items">
                          {dayItems.length === 0 ? (
                            <div className="it-day-empty">Drop saved ideas here.</div>
                          ) : dayItems.map((item) => {
                            const isExpanded = expandedCardIds.has(item.item_id)
                            const fullDescription = item.original_description || item.description
                            const hasFullDescription = Boolean(fullDescription)
                            return (
                              <div
                                key={item.item_id || item.message_id}
                                className="it-card"
                                draggable={!isExpanded}
                                onDragStart={() => setDraggingItemId(item.item_id)}
                                onDragEnd={() => { setDraggingItemId(null); setDragOverDay(null) }}
                                onTouchStart={(e) => { if (!isExpanded) handleTouchStart(e, item.item_id) }}
                                onTouchMove={(e) => { if (!isExpanded) { e.preventDefault(); handleTouchMove(e) } }}
                                onTouchEnd={(e) => { if (!isExpanded) handleTouchEnd(e) }}
                              >
                                {isExpanded ? (
                                  <div className="it-card-back">
                                    <div className="it-card-back-head">
                                      <span>{cardIcon(item)} {item.title}</span>
                                      <button className="it-btn" onClick={() => toggleCardDetails(item.item_id)}>Back</button>
                                    </div>
                                    <div className="it-card-full-desc">{fullDescription}</div>
                                  </div>
                                ) : (
                                  <>
                                    <div className="it-card-title-row">
                                      <select
                                        className="it-card-emoji"
                                        value={item.icon || 'AUTO'}
                                        onChange={(e) => updateItem(item.item_id, { icon: e.target.value }, true)}
                                      >
                                        {ICON_OPTIONS.map((icon) => (
                                          <option key={icon.value} value={icon.value}>{icon.value === 'AUTO' ? cardIcon(item) : icon.value}</option>
                                        ))}
                                      </select>
                                      <textarea
                                        className="it-card-title-input"
                                        value={item.title}
                                        rows={Math.max(2, Math.ceil((item.title || '').length / 24))}
                                        draggable={false}
                                        onChange={(e) => updateItem(item.item_id, { title: e.target.value })}
                                        onBlur={(e) => saveUpdate(item.item_id, { title: e.target.value })}
                                      />
                                    </div>
                                    <div className="it-card-meta">
                                      <span className="it-price">{item.price ? `Price: ${item.price}` : item.source === 'custom' ? 'Custom card' : 'No price'}</span>
                                      <div className="it-controls">
                                        <button className="it-btn" onClick={() => toggleCardDetails(item.item_id)} disabled={!hasFullDescription}>
                                          View details
                                        </button>
                                        <button className="it-delete-btn" onClick={() => deleteItem(item.item_id)}>
                                          Delete
                                        </button>
                                      </div>
                                    </div>
                                  </>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}
