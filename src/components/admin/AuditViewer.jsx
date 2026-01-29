import React, { useState, useEffect } from 'react'
import AdminTable from './AdminTable'
import { getAuditLogs } from '../../utils/audit'

export default function AuditViewer(){
  const [logs, setLogs] = useState([])

  useEffect(() => {
    setLogs(getAuditLogs(500))
  }, [])

  const rows = logs.map(l => ({ id: l.id, time: new Date(l.time).toLocaleString(), user: l.user, action: l.action, entity: l.entity, details: typeof l.details === 'string' ? l.details : JSON.stringify(l.details) }))

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">Audit Logs</h2>
      <AdminTable
        columns={[
          { key: 'time', label: 'Time', sortable: true },
          { key: 'user', label: 'User', sortable: true },
          { key: 'action', label: 'Action', sortable: true },
          { key: 'entity', label: 'Entity', sortable: true },
          { key: 'details', label: 'Details', sortable: false, render: r => <pre className="text-xs max-w-xl truncate">{r.details}</pre> }
        ]}
        data={rows}
        pageSize={20}
      />
    </div>
  )
}
