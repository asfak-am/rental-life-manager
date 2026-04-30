import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import api from '../services/api'

const HouseContext = createContext(null)

export function HouseProvider({ children }) {
  const { user } = useAuth()
  const [house, setHouse]     = useState(null)
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user) {
      setHouse(null)
      setMembers([])
      setError(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    api.get('/house')
      .then(res => {
        setHouse(res.data.house)
        setMembers(res.data.members)
      })
      .catch(err => {
        setError(err)
      })
      .finally(() => setLoading(false))
  }, [user])

  const refreshHouse = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/house')
      setHouse(res.data.house)
      setMembers(res.data.members)
      return res
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return (
    <HouseContext.Provider value={{ house, members, loading, error, setHouse, setMembers, refreshHouse }}>
      {children}
    </HouseContext.Provider>
  )
}

export const useHouse = () => {
  const ctx = useContext(HouseContext)
  if (!ctx) throw new Error('useHouse must be inside HouseProvider')
  return ctx
}