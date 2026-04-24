import { useEffect, useState, useMemo } from 'react'
import { fetchUsers, createUser, updateUserRole, toggleUserStatus } from '../services/adminApi'
import { useAuth } from '../contexts/AuthContext'

const STATUS_ORDER = { PENDING: 0, ACTIVE: 1, BANNED: 2 }

function SortIcon({ direction }) {
  if (!direction) return (
    <svg className="h-3.5 w-3.5 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
    </svg>
  )
  return direction === 'asc' ? (
    <svg className="h-3.5 w-3.5 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
    </svg>
  ) : (
    <svg className="h-3.5 w-3.5 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  )
}

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Sort & filter state
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [sortField, setSortField] = useState('status')
  const [sortDir, setSortDir] = useState('asc')

  // Modal states
  const [showModal, setShowModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const data = await fetchUsers()
      setUsers(data)
    } catch (err) {
      setError('Failed to load users.')
    } finally {
      setLoading(false)
    }
  }

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const processedUsers = useMemo(() => {
    let result = [...users]

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(u =>
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q)
      )
    }

    // Status filter
    if (statusFilter !== 'ALL') {
      result = result.filter(u => u.status === statusFilter)
    }

    // Role filter
    if (roleFilter !== 'ALL') {
      result = result.filter(u => u.role === roleFilter)
    }

    // Sort
    result.sort((a, b) => {
      let aVal, bVal
      switch (sortField) {
        case 'name':
          aVal = a.name?.toLowerCase() ?? ''
          bVal = b.name?.toLowerCase() ?? ''
          break
        case 'email':
          aVal = a.email?.toLowerCase() ?? ''
          bVal = b.email?.toLowerCase() ?? ''
          break
        case 'role':
          aVal = a.role ?? ''
          bVal = b.role ?? ''
          break
        case 'status':
          aVal = STATUS_ORDER[a.status] ?? 99
          bVal = STATUS_ORDER[b.status] ?? 99
          break
        default:
          return 0
      }
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1
      return 0
    })

    return result
  }, [users, search, statusFilter, roleFilter, sortField, sortDir])

  const counts = useMemo(() => ({
    total: users.length,
    pending: users.filter(u => u.status === 'PENDING').length,
    active: users.filter(u => u.status === 'ACTIVE').length,
    banned: users.filter(u => u.status === 'BANNED').length,
  }), [users])

  const handleCreateUser = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    try {
      await createUser(newName, newEmail, newPassword)
      setShowModal(false)
      setNewName('')
      setNewEmail('')
      setNewPassword('')
      setSuccess('User created successfully.')
      loadUsers()
    } catch (err) {
      setError(err.response?.data || 'Failed to create user.')
    }
  }

  const handleRoleChange = async (targetId, newRole) => {
    setError('')
    setSuccess('')
    try {
      await updateUserRole(targetId, newRole)
      setSuccess('User role updated.')
      loadUsers()
    } catch (err) {
      setError(err.response?.data || 'Failed to update role.')
    }
  }

  const handleToggleStatus = async (targetId, currentStatus) => {
    setError('')
    setSuccess('')
    try {
      await toggleUserStatus(targetId, !currentStatus)
      setSuccess(`User has been ${currentStatus ? 'banned' : 'activated'}.`)
      loadUsers()
    } catch (err) {
      setError(err.response?.data || 'Failed to update user status.')
    }
  }

  const SortTh = ({ field, children, className = '' }) => (
    <th
      className={`px-6 py-4 font-semibold text-slate-900 cursor-pointer select-none group ${className}`}
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1.5">
        {children}
        <SortIcon direction={sortField === field ? sortDir : null} />
      </div>
    </th>
  )

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between rounded-2xl bg-white/70 p-6 shadow-xl backdrop-blur-xl ring-1 ring-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">User Management</h1>
          <p className="mt-1 text-sm text-slate-500">View and manage system users, roles, and access.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 font-semibold text-white shadow-lg shadow-indigo-600/30 transition hover:bg-indigo-700 active:scale-95"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Add User
        </button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Total Users', value: counts.total, color: 'text-slate-700', bg: 'bg-slate-50', ring: 'ring-slate-200' },
          { label: 'Pending', value: counts.pending, color: 'text-amber-600', bg: 'bg-amber-50', ring: 'ring-amber-200' },
          { label: 'Active', value: counts.active, color: 'text-emerald-600', bg: 'bg-emerald-50', ring: 'ring-emerald-200' },
          { label: 'Banned', value: counts.banned, color: 'text-red-600', bg: 'bg-red-50', ring: 'ring-red-200' },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl ${s.bg} p-4 ring-1 ${s.ring}`}>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{s.label}</p>
            <p className={`mt-1 text-3xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Alerts */}
      {(error || success) && (
        <div className={`rounded-xl p-4 text-sm font-semibold ring-1 ${error ? 'bg-red-50 text-red-600 ring-red-200' : 'bg-emerald-50 text-emerald-600 ring-emerald-200'}`}>
          {error || success}
        </div>
      )}

      {/* Search & Filters toolbar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-white p-4 shadow ring-1 ring-slate-200">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-400/20"
          />
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
          {['ALL', 'PENDING', 'ACTIVE', 'BANNED'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                statusFilter === s
                  ? s === 'PENDING' ? 'bg-amber-500 text-white shadow'
                  : s === 'ACTIVE' ? 'bg-emerald-500 text-white shadow'
                  : s === 'BANNED' ? 'bg-red-500 text-white shadow'
                  : 'bg-indigo-600 text-white shadow'
                : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {s === 'ALL' ? 'All Status' : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Role filter */}
        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
        >
          <option value="ALL">All Roles</option>
          <option value="USER">User</option>
          <option value="TECHNICIAN">Technician</option>
          <option value="MANAGER">Manager</option>
          <option value="ADMIN">Admin</option>
        </select>

        {/* Result count */}
        <span className="ml-auto text-xs font-medium text-slate-400">
          {processedUsers.length} of {counts.total} users
        </span>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50">
            <tr>
              <SortTh field="name">Name &amp; Email</SortTh>
              <SortTh field="role">Role</SortTh>
              <SortTh field="status">Status</SortTh>
              <th className="px-6 py-4 text-right font-semibold text-slate-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {loading ? (
              <tr><td colSpan="4" className="py-8 text-center text-slate-500">Loading users...</td></tr>
            ) : processedUsers.length === 0 ? (
              <tr><td colSpan="4" className="py-12 text-center">
                <p className="text-slate-500 font-medium">No users match your filters.</p>
                <button onClick={() => { setSearch(''); setStatusFilter('ALL'); setRoleFilter('ALL') }} className="mt-2 text-xs text-indigo-500 hover:underline">Clear filters</button>
              </td></tr>
            ) : (
              processedUsers.map(u => (
                <tr key={u.id} className="transition-colors hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-900">
                      {u.name}
                      {u.id === currentUser?.id && (
                        <span className="ml-2 text-[10px] uppercase font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">You</span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500">{u.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      disabled={u.id === currentUser?.id}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700 transition focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                    >
                      <option value="USER">User</option>
                      <option value="TECHNICIAN">Technician</option>
                      <option value="MANAGER">Manager</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                      u.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-200' :
                      u.status === 'PENDING' ? 'bg-amber-50 text-amber-600 ring-1 ring-inset ring-amber-200' :
                      'bg-red-50 text-red-600 ring-1 ring-inset ring-red-200'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${
                        u.status === 'ACTIVE' ? 'bg-emerald-500' :
                        u.status === 'PENDING' ? 'bg-amber-500 animate-pulse' :
                        'bg-red-500'
                      }`} />
                      {u.status === 'ACTIVE' ? 'Active' : u.status === 'PENDING' ? 'Pending' : 'Banned'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleToggleStatus(u.id, u.status === 'ACTIVE')}
                      disabled={u.id === currentUser?.id}
                      className={`rounded-lg px-4 py-2 text-xs font-semibold shadow-sm transition disabled:opacity-50 ${
                        u.status === 'ACTIVE' ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 ring-1 ring-inset ring-rose-200/50' :
                        'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 ring-1 ring-inset ring-emerald-200/50'
                      }`}
                    >
                      {u.status === 'ACTIVE' ? 'Ban User' : u.status === 'PENDING' ? 'Approve' : 'Unban User'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md animate-in fade-in zoom-in-95 rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-200">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">Add New User</h2>
              <button onClick={() => setShowModal(false)} className="rounded-full p-2 text-slate-400 hover:bg-slate-100">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Full Name</label>
                <input required value={newName} onChange={e => setNewName(e.target.value)} type="text" className="mt-1 block w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10" placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Email Address</label>
                <input required value={newEmail} onChange={e => setNewEmail(e.target.value)} type="email" className="mt-1 block w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10" placeholder="name@company.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Password</label>
                <input required value={newPassword} onChange={e => setNewPassword(e.target.value)} type="text" className="mt-1 block w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10" placeholder="TempPass123" />
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="rounded-xl px-4 py-2 font-medium text-slate-500 hover:bg-slate-100">Cancel</button>
                <button type="submit" className="rounded-xl bg-indigo-600 px-5 py-2 font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 active:scale-95">Create Account</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
