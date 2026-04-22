import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import api from '../services/api'

const HouseContext = createContext(null)

export function HouseProvider({ children }) {
  const { user } = useAuth()
  const [house, setHouse]     = useState(null)
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) { setHouse(null); setMembers([]); return }
    setLoading(true)
    api.get('/house')
      .then(res => {
        setHouse(res.data.house)
        setMembers(res.data.members)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

  const refreshHouse = async () => {
    const res = await api.get('/house')
    setHouse(res.data.house)
    setMembers(res.data.members)
  }

  return (
    <HouseContext.Provider value={{ house, members, loading, setHouse, setMembers, refreshHouse }}>
      {children}
    </HouseContext.Provider>
  )
}

export const useHouse = () => {
  const ctx = useContext(HouseContext)
  if (!ctx) throw new Error('useHouse must be inside HouseProvider')
  return ctx
}