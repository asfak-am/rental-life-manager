import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { houseService } from '../../services'

function monthKeyToLabel(key) {
  const [y, m] = String(key || '').split('-')
  try {
    const d = new Date(Number(y), Number(m) - 1, 1)
    return d.toLocaleDateString('en-US', { month: 'short' })
  } catch (e) {
    return key
  }
}

function chunkArray(arr, size) {
  const out = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

export default function RentPaymentsTable({ houseId, members = [], isAdmin = false, onPayMemberRent, markingMemberKey = '' }) {
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)
  const queryClient = useQueryClient()

  const monthsOfYear = useMemo(() => {
    const arr = []
    for (let m = 1; m <= 12; m++) {
      const mm = String(m).padStart(2, '0')
      arr.push(`${year}-${mm}`)
    }
    return arr.reverse() // newest first
  }, [year])

  const queries = useQuery({
    queryKey: ['rent-payments-table', houseId, year],
    queryFn: async () => {
      if (!houseId) return { statuses: [] }
      // backend caps to 8 months per call - fetch in chunks
      const chunks = chunkArray(monthsOfYear, 8)
      const responses = []
      for (const chunk of chunks) {
        const res = await houseService.getRentStatuses(chunk)
        responses.push(res.data?.statuses || [])
      }
      const combined = [].concat(...responses)
      return { statuses: combined }
    },
    enabled: Boolean(houseId),
    staleTime: 30 * 1000,
  })

  const monthMap = useMemo(() => {
    const map = new Map()
    ;(queries.data?.statuses || []).forEach(status => {
      const m = status.month
      const inner = new Map((status.memberStatuses || []).map(ms => [String(ms.userId), ms]))
      map.set(m, inner)
    })
    return map
  }, [queries.data])

  const handlePrev = () => setYear(y => y - 1)
  const handleNext = () => setYear(y => y + 1)

  const markMemberRentMutation = useMutation({
    mutationFn: ({ userId, month }) => houseService.payRentForMember(userId, month),
    onMutate: async ({ userId, month }) => {
      await queryClient.cancelQueries({ queryKey: ['rent-payments-table', houseId, year] })

      const previousTable = queryClient.getQueryData(['rent-payments-table', houseId, year])
      const targetUserId = String(userId)
      const targetMonth = String(month)

      queryClient.setQueryData(['rent-payments-table', houseId, year], (previous) => {
        if (!previous || !Array.isArray(previous.statuses)) return previous

        return {
          ...previous,
          statuses: previous.statuses.map(status => {
            if (String(status.month) !== targetMonth || !Array.isArray(status.memberStatuses)) return status

            const memberStatuses = status.memberStatuses.map(memberStatus => (
              String(memberStatus.userId) === targetUserId
                ? { ...memberStatus, status: 'paid', paidAt: memberStatus.paidAt || new Date().toISOString() }
                : memberStatus
            ))

            const paidCount = memberStatuses.filter(memberStatus => memberStatus.status === 'paid').length

            return {
              ...status,
              memberStatuses,
              paidCount,
              unpaidCount: Math.max(memberStatuses.length - paidCount, 0),
            }
          }),
        }
      })

      return { previousTable }
    },
    onError: (error, variables, context) => {
      if (context?.previousTable) {
        queryClient.setQueryData(['rent-payments-table', houseId, year], context.previousTable)
      }
      toast.error(error?.response?.data?.message || 'Failed to mark member rent as paid')
    },
    onSuccess: (res) => {
      const payload = res?.data || res
      if (payload?.rentStatus) {
        queryClient.invalidateQueries({ queryKey: ['rent-payments-table', houseId, year] })
      }
      queryClient.invalidateQueries({ queryKey: ['rent-status', houseId] })
      queryClient.invalidateQueries({ queryKey: ['rent-statuses', houseId] })
      toast.success('Member rent marked as paid')
    },
  })

  const currentMarkingKey = markMemberRentMutation.isPending && markMemberRentMutation.variables
    ? `${String(markMemberRentMutation.variables.userId)}:${String(markMemberRentMutation.variables.month)}`
    : ''

  const todayKey = (() => {
    const now = new Date()
    const mm = `${now.getMonth() + 1}`.padStart(2, '0')
    return `${now.getFullYear()}-${mm}`
  })()

  if (queries.isLoading) {
    return (
      <div className="bg-white rounded-[30px] p-6 border border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Rent Matrix</p>
            <h3 className="text-lg font-black mt-1">{year}</h3>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 rounded border border-slate-200 bg-white text-sm">Prev</button>
            <button className="px-3 py-1 rounded border border-slate-200 bg-white text-sm">Next</button>
          </div>
        </div>
        <div className="h-40 grid place-items-center text-slate-400">Loading rent matrix...</div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-[30px] p-4 border border-slate-200">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Rent Matrix</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handlePrev} className="px-3 py-1 rounded border border-slate-200 bg-white text-sm hover:bg-surface">Prev</button>
          <div className="text-center px-4">
            <h3 className="text-lg font-black">{year}</h3>
          </div>
          <button onClick={handleNext} className="px-3 py-1 rounded border border-slate-200 bg-white text-sm hover:bg-surface">Next</button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full table-auto border-collapse divide-y divide-slate-100">
          <thead>
            <tr>
              <th className="p-3 text-left sticky left-0 bg-white z-10">Member</th>
              {(monthsOfYear || []).map(month => {
                const isCurrent = month === todayKey
                return (
                  <th key={month} className={`p-3 text-center ${isCurrent ? 'bg-primary/10 text-primary' : 'text-slate-600'}`}>
                    {monthKeyToLabel(month)}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {members.map(member => (
              <tr key={member._id} className="border-t hover:bg-surface-container-low transition-colors">
                <td className="p-3 font-semibold sticky left-0 bg-white z-10">{member.displayName || member.name}</td>
                {monthsOfYear.map(month => {
                  const m = monthMap.get(month)
                  const status = m ? m.get(String(member._id)) : undefined
                  const inactive = typeof status === 'undefined'
                  const paid = !inactive && status && status.status === 'paid'
                  const paidAt = status?.paidAt
                  const cellKey = `${member._id}:${month}`
                  const isCurrent = month === todayKey
                  return (
                    <td key={cellKey} className={`p-3 text-center ${isCurrent ? 'bg-primary/10' : ''}`}>
                      <div className="flex items-center justify-center gap-2">
                        {inactive ? (
                          <div className="w-3 h-3 rounded-full bg-slate-300" title="Not a member this month" />
                        ) : (
                          <span className={`material-symbols-outlined ${paid ? 'text-emerald-600' : 'text-red-500'}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                            {paid ? 'check' : 'close'}
                          </span>
                        )}
                        {!inactive && !paid && isAdmin && (
                          <button
                            onClick={() => markMemberRentMutation.mutate({ userId: member._id, month })}
                            disabled={currentMarkingKey === `${String(member._id)}:${month}`}
                            className="text-[11px] px-2 py-1 rounded bg-primary text-on-primary"
                          >
                            {currentMarkingKey === `${String(member._id)}:${month}` ? 'Marking...' : 'Mark'}
                          </button>
                        )}
                      </div>
                      {paidAt && <div className="text-xs text-slate-400 mt-1">{new Date(paidAt).toLocaleDateString()}</div>}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
