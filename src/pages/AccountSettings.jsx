import React, { useState, useEffect } from 'react'

export default function AccountSettings({ user = null, onUpdateUser, onSignOut }) {
  const [name, setName] = useState(user?.name || '')
  const [email] = useState(user?.email || '')
  const [phone, setPhone] = useState('')
  const [prefs, setPrefs] = useState({ email: true, sms: false, push: false, marketing: false })
  const [saved, setSaved] = useState(false)
  const [cards, setCards] = useState([])
  const [showCardForm, setShowCardForm] = useState(false)
  const [cardForm, setCardForm] = useState({ name: '', number: '', expiry: '', cvc: '', isDefault: false })
  const [cardError, setCardError] = useState('')

  useEffect(() => {
    if (!email) return
    try {
      const raw = localStorage.getItem('user_prefs_' + email)
      if (raw) {
        setPrefs(JSON.parse(raw))
      }
      const rawInfo = localStorage.getItem('user_info_' + email)
      if (rawInfo) {
        const info = JSON.parse(rawInfo)
        setPhone(info.phone || '')
        setName(info.name || name)
      }
      const rawCards = localStorage.getItem('user_cards_' + email)
      if (rawCards) {
        setCards(JSON.parse(rawCards))
      }
    } catch (e) {}
  }, [email])

  function handleSave() {
    try {
      localStorage.setItem('user_prefs_' + email, JSON.stringify(prefs))
      localStorage.setItem('user_info_' + email, JSON.stringify({ name, phone }))
    } catch (e) {}
    setSaved(true)
    if (onUpdateUser) onUpdateUser({ name, email, phone })
    setTimeout(() => setSaved(false), 2000)
  }

  function handleAddCard() {
    setCardError('')
    const { name: cardName, number, expiry, cvc, isDefault } = cardForm

    if (!cardName || !number || !expiry || !cvc) {
      setCardError('All fields are required')
      return
    }

    if (number.replace(/\s/g, '').length < 13) {
      setCardError('Card number must be at least 13 digits')
      return
    }

    const newCard = {
      id: Date.now(),
      name: cardName,
      lastFour: number.slice(-4),
      expiry,
      isDefault: isDefault || cards.length === 0
    }

    const updatedCards = isDefault ? cards.map(c => ({...c, isDefault: false})).concat(newCard) : cards.concat(newCard)
    setCards(updatedCards)
    try {
      localStorage.setItem('user_cards_' + email, JSON.stringify(updatedCards))
    } catch (e) {}

    setCardForm({ name: '', number: '', expiry: '', cvc: '', isDefault: false })
    setShowCardForm(false)
  }

  function handleRemoveCard(id) {
    const updated = cards.filter(c => c.id !== id)
    if (updated.length > 0 && cards.find(c => c.id === id).isDefault) {
      updated[0].isDefault = true
    }
    setCards(updated)
    try {
      localStorage.setItem('user_cards_' + email, JSON.stringify(updated))
    } catch (e) {}
  }

  function handleSetDefault(id) {
    const updated = cards.map(c => ({...c, isDefault: c.id === id}))
    setCards(updated)
    try {
      localStorage.setItem('user_cards_' + email, JSON.stringify(updated))
    } catch (e) {}
  }

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg">Please sign in to access account settings.</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="px-8 py-12 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Account Settings</h1>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
            <input value={name} onChange={e => setName(e.target.value)} className="w-full border rounded-lg px-4 py-2 bg-white dark:bg-black text-gray-900 dark:text-gray-200" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email (read-only)</label>
            <input value={email} readOnly className="w-full border rounded-lg px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-200" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} className="w-full border rounded-lg px-4 py-2 bg-white dark:bg-black text-gray-900 dark:text-gray-200" />
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Communication Preferences</h3>
            <div className="space-y-2">
              <label className="flex items-center gap-3">
                <input type="checkbox" checked={prefs.email} onChange={e => setPrefs(p => ({...p, email: e.target.checked}))} />
                <span className="text-sm">Email notifications</span>
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" checked={prefs.sms} onChange={e => setPrefs(p => ({...p, sms: e.target.checked}))} />
                <span className="text-sm">SMS notifications</span>
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" checked={prefs.push} onChange={e => setPrefs(p => ({...p, push: e.target.checked}))} />
                <span className="text-sm">Push notifications</span>
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" checked={prefs.marketing} onChange={e => setPrefs(p => ({...p, marketing: e.target.checked}))} />
                <span className="text-sm">Marketing emails</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={handleSave} className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">Save Settings</button>
            <button onClick={() => onSignOut && onSignOut()} className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition">Sign Out</button>
          </div>

          {saved && <div className="text-sm text-green-600">Settings saved</div>}

          <hr className="border-gray-200 dark:border-gray-700" />

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Payment Cards</h3>
              <button onClick={() => setShowCardForm(!showCardForm)} className="text-sm bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition">
                {showCardForm ? 'Cancel' : 'Add Card'}
              </button>
            </div>

            {showCardForm && (
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-4 border border-gray-200 dark:border-gray-600">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Add New Card</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Card Name (e.g., Visa)</label>
                    <input type="text" placeholder="Visa" value={cardForm.name} onChange={e => setCardForm({...cardForm, name: e.target.value})} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-200 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Card Number</label>
                    <input type="text" placeholder="4111 1111 1111 1111" value={cardForm.number} onChange={e => setCardForm({...cardForm, number: e.target.value})} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-200 text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expiry (MM/YY)</label>
                      <input type="text" placeholder="12/25" value={cardForm.expiry} onChange={e => setCardForm({...cardForm, expiry: e.target.value})} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-200 text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CVC</label>
                      <input type="text" placeholder="123" value={cardForm.cvc} onChange={e => setCardForm({...cardForm, cvc: e.target.value})} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-200 text-sm" />
                    </div>
                  </div>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={cardForm.isDefault} onChange={e => setCardForm({...cardForm, isDefault: e.target.checked})} />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Set as default payment method</span>
                  </label>
                  {cardError && <div className="text-sm text-red-600 dark:text-red-400">{cardError}</div>}
                  <button onClick={handleAddCard} className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition font-medium text-sm">Save Card</button>
                </div>
              </div>
            )}

            {cards.length === 0 ? (
              <div className="text-sm text-gray-600 dark:text-gray-400 italic">No saved payment cards yet.</div>
            ) : (
              <div className="space-y-2">
                {cards.map(card => (
                  <div key={card.id} className={`flex items-center justify-between p-3 border rounded-lg ${card.isDefault ? 'border-blue-500 bg-blue-50 dark:bg-blue-900' : 'border-gray-200 dark:border-gray-600'}`}>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white text-sm">{card.name} •••• {card.lastFour}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Expires {card.expiry}</div>
                      {card.isDefault && <div className="text-xs text-blue-600 dark:text-blue-400 font-semibold mt-1">Default payment method</div>}
                    </div>
                    <div className="flex gap-2">
                      {!card.isDefault && (
                        <button onClick={() => handleSetDefault(card.id)} className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition">Set Default</button>
                      )}
                      <button onClick={() => handleRemoveCard(card.id)} className="text-xs px-2 py-1 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 rounded hover:bg-red-200 dark:hover:bg-red-800 transition">Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
