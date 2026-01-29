import React, { useState, useEffect } from 'react'
import AdminTable from './AdminTable'
import { getCurrentUser, hasRole } from '../../utils/auth'
import { logAction } from '../../utils/audit'

export default function UsersManager({ onEdit }) {
  const [users, setUsers] = useState(() => {
    try {
      const raw = localStorage.getItem('admin_users')
      return raw ? JSON.parse(raw) : [
        { id: 'u1', name: 'Alice Admin', email: 'alice@store.test', role: 'admin', active: true },
        { id: 'u2', name: 'Bob Merchant', email: 'bob@store.test', role: 'merchant', active: true },
        { id: 'u3', name: 'Carol Customer', email: 'carol@store.test', role: 'customer', active: true }
      ]
    } catch (e) { return [] }
  })

  const [selected, setSelected] = useState([])
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    localStorage.setItem('admin_users', JSON.stringify(users))
  }, [users])

  function saveUser(u) {
    if (!u.name || !u.email) { alert('Name and email required'); return }
    if (u.id) {
      setUsers(prev => prev.map(p => p.id === u.id ? u : p))
      logAction('update', 'user', { id: u.id, email: u.email, role: u.role })
    } else {
      u.id = 'u' + Date.now() + Math.random().toString(36).slice(2,6)
      setUsers(prev => [u, ...prev])
      logAction('create', 'user', { id: u.id, email: u.email, role: u.role })
    }
    setShowForm(false)
    setEditing(null)
  }

  function removeUser(id) {
    if (!confirm('Delete this user?')) return
    setUsers(prev => prev.filter(u => u.id !== id))
    logAction('delete', 'user', { id })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold">Users</h3>
        <div className="flex items-center gap-3">
          {selected.length > 0 && (
            <>
              <div className="text-sm text-gray-700">{selected.length} selected</div>
              <button disabled={!hasRole('admin')} onClick={() => { if (!confirm('Delete selected users?')) return; setUsers(prev=>prev.filter(u=>!selected.includes(u.id))); setSelected([]) }} className="px-3 py-1 bg-red-600 text-white rounded text-sm disabled:opacity-50">Delete</button>
            </>
          )}
          <button disabled={!hasRole('admin')} onClick={() => { setEditing(null); setShowForm(true) }} className="px-3 py-2 bg-blue-600 text-white rounded disabled:opacity-50">+ New User</button>
        </div>
      </div>

      {!hasRole('admin') && (
        <div className="mb-4 p-3 bg-yellow-50 text-yellow-800 rounded">Only administrators can create or delete users. You have read-only access.</div>
      )}

      <AdminTable
        columns={[
          { key: 'name', label: 'Name', sortable: true },
          { key: 'email', label: 'Email', sortable: true },
          { key: 'role', label: 'Role', sortable: true },
          { key: 'active', label: 'Active', sortable: true, render: r => r.active ? 'Yes' : 'No' }
        ]}
        data={users}
        pageSize={10}
        onView={(u) => { setEditing(u); setShowForm(true) }}
        onSelectionChange={(ids)=>setSelected(ids)}
      />

          {showForm && (
            <UserForm user={editing} onSave={saveUser} onDelete={removeUser} onClose={() => { setShowForm(false); setEditing(null) }} />
          )}
    </div>
  )
}

function UserForm({ user, onSave, onDelete, onClose }){
  const [name, setName] = useState(user?.name||'')
  const [email, setEmail] = useState(user?.email||'')
  const [role, setRole] = useState(user?.role||'customer')
  const [active, setActive] = useState(user?.active ?? true)

  function submit(){
    onSave({ id: user?.id||null, name, email, role, active })
  }

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev || '' }
  }, [])

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">{user ? 'Edit User' : 'New User'}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">×</button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-sm text-gray-600">Name</label>
            <input value={name} onChange={e=>setName(e.target.value)} className="w-full border border-gray-300 px-3 py-2 rounded" />
          </div>
          <div>
            <label className="text-sm text-gray-600">Email</label>
            <input value={email} onChange={e=>setEmail(e.target.value)} className="w-full border border-gray-300 px-3 py-2 rounded" />
          </div>
          <div>
            <label className="text-sm text-gray-600">Role</label>
            <select value={role} onChange={e=>setRole(e.target.value)} className="w-full border border-gray-300 px-3 py-2 rounded">
              <option value="customer">Customer</option>
              <option value="merchant">Merchant</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" checked={active} onChange={e=>setActive(e.target.checked)} />
            <div className="text-sm">Active</div>
          </div>
          <div className="flex justify-end gap-3">
            {user && <button onClick={() => onDelete(user.id)} className="px-4 py-2 rounded border text-red-600">Delete</button>}
            <button onClick={onClose} className="px-4 py-2 rounded border">Cancel</button>
            <button onClick={submit} className="px-4 py-2 rounded bg-blue-600 text-white">Save</button>
          </div>
        </div>
      </div>
    </div>
  )
}
