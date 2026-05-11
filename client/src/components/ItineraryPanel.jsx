import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

const DAY_COUNT = 5
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
  .it-header { height: 66px; padding: 0 24px; background: #F3EFE8; border-bottom: 1px solid #B9B9B9; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; }
  .it-header-actions { display: flex; align-items: center; gap: 10px; }
  .it-title { font-size: 18px; font-weight: 700; color: #106C54; }
  .it-sub { font-size: 12px; color: #659B90; margin-top: 2px; }
  .it-body { flex: 1; overflow: auto; padding: 20px; }
  .it-empty { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; color: #7A7A7A; gap: 10px; }
  .it-empty-icon { font-size: 42px; }
  .it-empty-title { font-size: 17px; font-weight: 700; color: #106C54; }
  .it-empty-sub { font-size: 13px; max-width: 380px; line-height: 1.45; }
  .it-board { display: grid; grid-template-columns: repeat(5, minmax(245px, 1fr)); gap: 14px; min-width: 1220px; align-items: flex-start; }
  .it-day { background: #F3EFE8; border: 1px solid #B9B9B9; border-radius: 16px; min-height: 440px; display: flex; flex-direction: column; overflow: hidden; transition: border-color 0.15s ease, background 0.15s ease; }
  .it-day.drag-over { border-color: #106C54; background: rgba(16,108,84,0.08); }
  .it-day-head { padding: 14px; border-bottom: 1px solid #B9B9B9; display: flex; align-items: center; justify-content: space-between; background: rgba(16,108,84,0.05); }
  .it-day-title { font-size: 14px; font-weight: 800; color: #106C54; }
  .it-day-count { font-size: 11px; color: #659B90; font-weight: 700; }
  .it-day-items { padding: 12px; display: flex; flex-direction: column; gap: 10px; flex: 1; min-height: 360px; }
  .it-card { background: #FFFCF6; border: 1px solid rgba(185,185,185,0.75); border-radius: 14px; padding: 12px; cursor: grab; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
  .it-card:active { cursor: grabbing; }
  .it-card-title-row { display: flex; align-items: center; gap: 7px; margin-bottom: 7px; }
  .it-card-emoji { width: 48px; height: 34px; border: 1px solid rgba(16,108,84,0.18); border-radius: 999px; background: rgba(16,108,84,0.1); flex-shrink: 0; font-size: 15px; font-family: "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif; text-align: center; outline: none; cursor: pointer; padding: 0 2px; }
  .it-card-emoji:hover { background: rgba(16,108,84,0.16); }
  .it-card-title-input, .it-card-desc-input { width: 100%; border: 1px solid transparent; background: transparent; color: #106C54; font-family: 'Cabin', sans-serif; outline: none; border-radius: 8px; }
  .it-card-title-input { font-size: 14px; font-weight: 800; }
  .it-card-desc-input { font-size: 13px; color: #7A7A7A; line-height: 1.45; resize: vertical; min-height: 64px; }
  .it-card-title-input:focus, .it-card-desc-input:focus { border-color: rgba(16,108,84,0.25); background: #fff; padding: 5px 7px; }
  .it-card-meta { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 9px; }
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
  .it-add-panel { margin-bottom: 16px; background: #F3EFE8; border: 1px solid #B9B9B9; border-radius: 16px; padding: 14px; display: grid; grid-template-columns: minmax(160px, 1fr) minmax(240px, 2fr) 120px 110px auto; gap: 10px; align-items: center; min-width: 980px; }
  .it-add-input { border: 1px solid #B9B9B9; background: #FFFCF6; color: #106C54; border-radius: 10px; padding: 9px 10px; font-size: 13px; font-family: 'Cabin', sans-serif; outline: none; }
  .it-add-input:focus { border-color: #106C54; }
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

function withDefaults(item, index) {
  return {
    ...item,
    day: item.day || ((index % DAY_COUNT) + 1),
    title: item.title || 'Untitled stop',
    description: item.short_description || item.description || '',
    price: item.price || null,
  }
}

function conciseDescription(description) {
  const cleaned = (description || '').replace(/\s+/g, ' ').replace(/\bPrice:\s*\${1,4}\b/gi, '').trim()
  if (cleaned.length <= 115) return cleaned
  const sentence = cleaned.split(/(?<=[.!?])\s+/)[0]
  if (sentence && sentence.length <= 140) return sentence
  return `${cleaned.slice(0, 112).trim()}...`
}

function suggestedIcon(item) {
  const text = `${item.title || ''} ${item.description || ''}`.toLowerCase()
  if (/beach|ocean|snorkel|surf|swim|sunset|sand|shore/.test(text)) return '🌊'
  if (/breakfast|coffee|cafe|brunch|bakery|pastry/.test(text)) return '☕'
  if (/lunch|dinner|restaurant|tavern|food|eat|meal|fish house|grill|kitchen|bistro|bar|sushi|pizza|tacos|seafood|steak|house/.test(text)) return '🍴'
  if (/hike|trail|park|nature|waterfall|lookout|summit|garden/.test(text)) return '🌿'
  if (/hotel|resort|stay|accommodation/.test(text)) return '🏠'
  if (/museum|gallery|culture|historic/.test(text)) return '🎨'
  if (/shop|market|mall/.test(text)) return '🛒'
  if (/flight|airport|drive|car|transport/.test(text)) return '🚗'
  if (item.source === 'custom') return '⭐'
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

  useEffect(() => {
    if (!conversationId) {
      setItems([])
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
        .or('content.like.__ITINERARY_ITEM__%,content.like.__ITINERARY_UPDATE__%,content.like.__ITINERARY_DELETE__%')
        .order('created_at', { ascending: true })
      setItems(mergeEvents(data || []))
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
        }
      })
      .subscribe()

    return () => {
      if (channel) supabase.removeChannel(channel)
    }
  }, [conversationId])

  const days = useMemo(() => Array.from({ length: DAY_COUNT }, (_, i) => i + 1), [])

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
                  />
                  <input
                    className="it-add-input"
                    placeholder="Short note, time, or details"
                    value={newCard.description}
                    onChange={(e) => setNewCard((prev) => ({ ...prev, description: e.target.value }))}
                  />
                  <select
                    className="it-add-input"
                    value={newCard.day}
                    onChange={(e) => setNewCard((prev) => ({ ...prev, day: Number(e.target.value) }))}
                  >
                    {days.map((day) => <option key={day} value={day}>Day {day}</option>)}
                  </select>
                  <select
                    className="it-add-input"
                    value={newCard.icon}
                    onChange={(e) => setNewCard((prev) => ({ ...prev, icon: e.target.value }))}
                  >
                    {ICON_OPTIONS.map((icon) => (
                      <option key={icon.value} value={icon.value}>{icon.value === 'AUTO' ? `Auto ${suggestedIcon(newCard)}` : `${icon.value} ${icon.label}`}</option>
                    ))}
                  </select>
                  <button className="it-add-btn" onClick={addCustomCard} disabled={!newCard.title.trim()}>
                    Add
                  </button>
                </div>
              )}
              {items.length === 0 && !showAddForm ? (
                <div className="it-empty">
                  <div className="it-empty-icon">✨</div>
                  <div className="it-empty-title">No itinerary items yet</div>
                  <div className="it-empty-sub">Ask the AI agent for recommendations, click “Add to itinerary,” or create your own card.</div>
                </div>
              ) : (
                <div className="it-board">
                  {days.map((day) => {
                    const dayItems = items.filter((item) => item.day === day)
                    return (
                      <div
                        key={day}
                        className={`it-day${dragOverDay === day ? ' drag-over' : ''}`}
                        onDragOver={(e) => {
                          e.preventDefault()
                          setDragOverDay(day)
                        }}
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
                          ) : dayItems.map((item) => (
                            <div
                              key={item.item_id || item.message_id}
                              className="it-card"
                              draggable
                              onDragStart={() => setDraggingItemId(item.item_id)}
                              onDragEnd={() => {
                                setDraggingItemId(null)
                                setDragOverDay(null)
                              }}
                            >
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
                                <input
                                  className="it-card-title-input"
                                  value={item.title}
                                  onChange={(e) => updateItem(item.item_id, { title: e.target.value })}
                                  onBlur={(e) => saveUpdate(item.item_id, { title: e.target.value })}
                                />
                              </div>
                              <textarea
                                className="it-card-desc-input"
                                value={item.description}
                                onChange={(e) => updateItem(item.item_id, { description: e.target.value })}
                                onBlur={(e) => saveUpdate(item.item_id, { description: e.target.value })}
                              />
                              <div className="it-card-meta">
                                <span className="it-price">{item.price ? `Price: ${item.price}` : item.source === 'custom' ? 'Custom card' : 'No price'}</span>
                                <div className="it-controls">
                                  <button className="it-delete-btn" onClick={() => deleteItem(item.item_id)}>
                                    Delete
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
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
