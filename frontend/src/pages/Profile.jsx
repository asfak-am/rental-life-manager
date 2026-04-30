import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import TopBar from '../components/TopBar'
import BottomNav from '../components/BottomNav'
import DesktopAppShell from '../components/desktop/DesktopAppShell'
import { useAuth } from '../context/AuthContext'
import { authService } from '../services'
import { houseService } from '../services'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CURRENCY_OPTIONS } from '../utils/currency'

const MAX_IMAGE_INPUT_SIZE = 10 * 1024 * 1024
const CROP_BOX_SIZE = 320
const EXPORT_SIZE = 512

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

const loadImage = (src) => new Promise((resolve, reject) => {
  const img = new Image()
  img.onload = () => resolve(img)
  img.onerror = () => reject(new Error('Failed to load image'))
  img.src = src
})

const buildCroppedAvatar = async (imageSrc, imageState, cropState) => {
  const image = await loadImage(imageSrc)
  const baseScale = Math.max(CROP_BOX_SIZE / image.width, CROP_BOX_SIZE / image.height)
  const displayScale = baseScale * cropState.zoom
  const sourceX = clamp((0 - imageState.x) / displayScale, 0, image.width)
  const sourceY = clamp((0 - imageState.y) / displayScale, 0, image.height)
  const sourceWidth = Math.min(image.width - sourceX, CROP_BOX_SIZE / displayScale)
  const sourceHeight = Math.min(image.height - sourceY, CROP_BOX_SIZE / displayScale)

  const canvas = document.createElement('canvas')
  canvas.width = EXPORT_SIZE
  canvas.height = EXPORT_SIZE

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Image processing unavailable')

  ctx.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, EXPORT_SIZE, EXPORT_SIZE)
  return canvas.toDataURL('image/jpeg', 0.9)
}

export default function Profile() {
  const { user, updateUser } = useAuth()
  const [saving, setSaving] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '')
  const [cropOpen, setCropOpen] = useState(false)
  const [cropSourceUrl, setCropSourceUrl] = useState('')
  const [cropFileName, setCropFileName] = useState('')
  const [cropImageSize, setCropImageSize] = useState({ width: 0, height: 0 })
  const [cropImageState, setCropImageState] = useState({ x: 0, y: 0 })
  const [cropZoom, setCropZoom] = useState(1)
  const [cropping, setCropping] = useState(false)
  const cropDragRef = useRef(null)

  const defaultName = user?.name || ''
  const defaultDisplayName = user?.displayName || user?.name || ''
  const initials = useMemo(() => {
    const source = defaultDisplayName || defaultName || 'RL'
    return source
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }, [defaultDisplayName, defaultName])

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      name: defaultName,
      displayName: defaultDisplayName,
      bio: user?.bio || '',
      currency: user?.currency || 'LKR',
    },
  })

  useEffect(() => () => {
    if (cropSourceUrl) URL.revokeObjectURL(cropSourceUrl)
  }, [cropSourceUrl])

  const getDisplayMetrics = (zoomValue = cropZoom, size = cropImageSize) => {
    if (!size.width || !size.height) {
      return { displayedWidth: 0, displayedHeight: 0, baseScale: 1, displayScale: 1 }
    }

    const baseScale = Math.max(CROP_BOX_SIZE / size.width, CROP_BOX_SIZE / size.height)
    const displayScale = baseScale * zoomValue
    return {
      baseScale,
      displayScale,
      displayedWidth: size.width * displayScale,
      displayedHeight: size.height * displayScale,
    }
  }

  const clampCropPosition = (nextPosition, zoomValue = cropZoom, size = cropImageSize) => {
    const { displayedWidth, displayedHeight } = getDisplayMetrics(zoomValue, size)
    const minX = Math.min(0, CROP_BOX_SIZE - displayedWidth)
    const minY = Math.min(0, CROP_BOX_SIZE - displayedHeight)

    return {
      x: clamp(nextPosition.x, minX, 0),
      y: clamp(nextPosition.y, minY, 0),
    }
  }

  const onSelectAvatar = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file')
      return
    }
    if (file.size > MAX_IMAGE_INPUT_SIZE) {
      toast.error('Please choose an image under 10MB')
      return
    }

    try {
      const objectUrl = URL.createObjectURL(file)
      const image = await loadImage(objectUrl)
      const baseScale = Math.max(CROP_BOX_SIZE / image.width, CROP_BOX_SIZE / image.height)
      const displayedWidth = image.width * baseScale
      const displayedHeight = image.height * baseScale

      setCropSourceUrl(objectUrl)
      setCropFileName(file.name)
      setCropImageSize({ width: image.width, height: image.height })
      setCropZoom(1)
      setCropImageState({
        x: (CROP_BOX_SIZE - displayedWidth) / 2,
        y: (CROP_BOX_SIZE - displayedHeight) / 2,
      })
      setCropOpen(true)
    } catch {
      toast.error('Failed to process image')
    }
  }

  const closeCrop = () => {
    if (cropSourceUrl) URL.revokeObjectURL(cropSourceUrl)
    setCropOpen(false)
    setCropSourceUrl('')
    setCropFileName('')
    setCropImageSize({ width: 0, height: 0 })
    setCropImageState({ x: 0, y: 0 })
    setCropZoom(1)
  }

  const confirmCrop = async () => {
    if (!cropSourceUrl) return
    setCropping(true)
    try {
      const cropped = await buildCroppedAvatar(cropSourceUrl, cropImageState, { zoom: cropZoom })
      setAvatarPreview(cropped)
      toast.success('Image cropped and ready')
      closeCrop()
    } catch {
      toast.error('Failed to crop image')
    } finally {
      setCropping(false)
    }
  }

  const onSubmit = async (data) => {
    setSaving(true)
    try {
      const payload = {
        name: data.name,
        displayName: data.displayName,
        bio: data.bio,
        currency: data.currency,
        avatar: avatarPreview || '',
      }
      const res = await authService.updateProfile(payload)
      updateUser(res.data.user)
      toast.success('Profile updated')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  const profileForm = (
    <>
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <section className="bg-white rounded-3xl border border-slate-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="relative">
            <div className="w-28 h-28 rounded-full bg-[#ecebff] border border-[#d8d3ff] overflow-hidden flex items-center justify-center">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Profile avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-black text-[#5f52f2]">{initials}</span>
              )}
            </div>
            <label className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full signature-gradient text-white grid place-items-center cursor-pointer shadow-lg">
              <span className="material-symbols-outlined text-[18px]">photo_camera</span>
              <input type="file" accept="image/*" className="hidden" onChange={onSelectAvatar} />
            </label>
          </div>

          <div className="space-y-2 flex-1">
            <h3 className="text-2xl font-black tracking-tight text-slate-900">Profile Photo</h3>
            <p className="text-sm text-slate-500">Upload a clear profile picture to help housemates recognize you.</p>
            {avatarPreview ? (
              <button
                type="button"
                className="text-sm font-semibold text-red-600 hover:underline"
                onClick={() => setAvatarPreview('')}
              >
                Remove photo
              </button>
            ) : null}
          </div>
        </div>
      </section>

      <section className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
        <h3 className="text-2xl font-black tracking-tight text-slate-900">Personal Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">Full Name</label>
            <input
              type="text"
              className="w-full rounded-xl border border-slate-200 bg-[#f7f8fb] px-4 py-3 text-slate-900 outline-none focus:border-[#bdb8ff]"
              {...register('name', { required: 'Name is required' })}
            />
            {errors.name ? <p className="text-xs text-red-600 mt-1">{errors.name.message}</p> : null}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">Display Name</label>
            <input
              type="text"
              className="w-full rounded-xl border border-slate-200 bg-[#f7f8fb] px-4 py-3 text-slate-900 outline-none focus:border-[#bdb8ff]"
              {...register('displayName', { required: 'Display name is required' })}
            />
            {errors.displayName ? <p className="text-xs text-red-600 mt-1">{errors.displayName.message}</p> : null}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">Bio</label>
          <textarea
            rows={4}
            className="w-full rounded-xl border border-slate-200 bg-[#f7f8fb] px-4 py-3 text-slate-900 outline-none focus:border-[#bdb8ff] resize-none"
            placeholder="Tell your housemates a little about you"
            {...register('bio')}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">Email</label>
          <input
            type="email"
            value={user?.email || ''}
            disabled
            className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-slate-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">Preferred Currency</label>
          <select
            className="w-full rounded-xl border border-slate-200 bg-[#f7f8fb] px-4 py-3 text-slate-900 outline-none focus:border-[#bdb8ff]"
            {...register('currency')}
          >
            {CURRENCY_OPTIONS.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
      </section>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-3 rounded-xl signature-gradient text-white font-semibold disabled:opacity-60"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>

    {cropOpen && (
      <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl overflow-hidden border border-slate-200">
          <div className="flex items-start justify-between gap-4 p-5 border-b border-slate-200">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400 font-semibold">Crop Profile Photo</p>
              <h3 className="text-2xl font-black tracking-tight mt-1">Adjust the image</h3>
              <p className="text-sm text-slate-500 mt-1">Drag to reposition and use zoom to frame your avatar.</p>
            </div>
            <button type="button" onClick={closeCrop} className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>

          <div className="p-5 space-y-5">
            <div
              className="relative mx-auto rounded-[28px] overflow-hidden border border-slate-200 bg-slate-100 select-none touch-none"
              style={{ width: CROP_BOX_SIZE, height: CROP_BOX_SIZE }}
              onPointerDown={(event) => {
                event.currentTarget.setPointerCapture(event.pointerId)
                cropDragRef.current = {
                  pointerId: event.pointerId,
                  startX: event.clientX,
                  startY: event.clientY,
                  originX: cropImageState.x,
                  originY: cropImageState.y,
                }
              }}
              onPointerMove={(event) => {
                if (!cropDragRef.current || cropDragRef.current.pointerId !== event.pointerId) return
                const deltaX = event.clientX - cropDragRef.current.startX
                const deltaY = event.clientY - cropDragRef.current.startY
                const nextPosition = clampCropPosition({
                  x: cropDragRef.current.originX + deltaX,
                  y: cropDragRef.current.originY + deltaY,
                })
                setCropImageState(nextPosition)
              }}
              onPointerUp={() => { cropDragRef.current = null }}
              onPointerCancel={() => { cropDragRef.current = null }}
            >
              {cropSourceUrl ? (
                <img
                  src={cropSourceUrl}
                  alt="Crop preview"
                  draggable={false}
                  style={{
                    position: 'absolute',
                    left: `${cropImageState.x}px`,
                    top: `${cropImageState.y}px`,
                    width: `${getDisplayMetrics().displayedWidth}px`,
                    height: `${getDisplayMetrics().displayedHeight}px`,
                    maxWidth: 'none',
                    maxHeight: 'none',
                    objectFit: 'cover',
                    userSelect: 'none',
                  }}
                />
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500">Zoom</label>
              <input
                type="range"
                min="1"
                max="2.8"
                step="0.01"
                value={cropZoom}
                onChange={(event) => {
                  const nextZoom = Number(event.target.value)
                  setCropZoom(nextZoom)
                  setCropImageState(prev => clampCropPosition(prev, nextZoom))
                }}
                className="w-full accent-[#5f52f2]"
              />
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <p className="text-xs text-slate-500 truncate">{cropFileName}</p>
              <div className="flex items-center gap-3">
                <button type="button" onClick={closeCrop} className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white font-semibold text-slate-700">
                  Cancel
                </button>
                <button type="button" onClick={confirmCrop} disabled={cropping} className="px-5 py-2.5 rounded-xl signature-gradient text-white font-semibold disabled:opacity-60">
                  {cropping ? 'Applying...' : 'Use Photo'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  )

  // --- Embedded Settings ---
  const qc = useQueryClient()
  const { data: rentStatus } = useQuery({ queryKey: ['rent-status'], queryFn: () => houseService.getRentStatus().then(r => r.data), enabled: !!user })
  const [monthlyRentInputLocal, setMonthlyRentInputLocal] = useState('')
  const updateRentMutation = useMutation({ mutationFn: (value) => houseService.updateRentConfig(value), onSuccess: () => { toast.success('Monthly rent updated'); qc.invalidateQueries(['rent-status']); qc.invalidateQueries(['house']) }, onError: () => toast.error('Failed to update monthly rent') })

  const notificationPrefs = user?.notifications || { expense: true, task: true, payment: true }
  const toggleNotification = async (key, enabled) => {
    try {
      const res = await authService.updateProfile({ notifications: { ...(user.notifications || {}), [key]: enabled } })
      // update user state via context
      // updateUser is available from useAuth
      updateUser(res.data.user)
      toast.success('Notification settings updated')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update notification settings')
    }
  }

  return (
    <>
      <div className="hidden lg:block">
        <DesktopAppShell
          title="Profile"
          subtitle="Manage your personal details and profile picture."
          searchPlaceholder="Search settings..."
        >
          {profileForm}

          <section className="mt-8 space-y-6">
            <h3 className="text-2xl font-black">Settings</h3>
            <div className="bg-white rounded-3xl border border-slate-200 p-6">
              <h4 className="font-semibold">Notification Preferences</h4>
              <div className="mt-4 grid grid-cols-1 gap-3">
                {[
                  { key: 'expense', label: 'Expense alerts', sub: 'When a new expense is added' },
                  { key: 'task', label: 'Chore reminders', sub: 'When tasks are assigned or due' },
                  { key: 'payment', label: 'Payment reminders', sub: 'When someone settles a debt' },
                ].map(({ key, label, sub }) => (
                  <div key={key} className="flex items-center justify-between p-4 rounded-xl bg-surface-container-lowest">
                    <div>
                      <p className="font-semibold">{label}</p>
                      <p className="text-xs text-slate-500">{sub}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked={notificationPrefs[key]} onChange={(e) => toggleNotification(key, e.target.checked)} />
                      <div className="w-11 h-6 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:bg-primary transition-colors" />
                      <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5" />
                    </label>
                  </div>
                ))}
              </div>

              {user && (
                <div className="mt-6">
                  <h4 className="font-semibold">Monthly Rent (Admins only)</h4>
                  <div className="mt-3 flex gap-3">
                    <input type="number" min="0" value={monthlyRentInputLocal} onChange={e => setMonthlyRentInputLocal(e.target.value)} placeholder={`${rentStatus?.totalRentAmount || ''}`} className="flex-1 rounded-xl border border-slate-200 px-4 py-3" />
                    <button onClick={() => updateRentMutation.mutate(Number(monthlyRentInputLocal || rentStatus?.totalRentAmount || 0))} disabled={updateRentMutation.isPending} className="px-5 py-3 signature-gradient text-white rounded-xl">{updateRentMutation.isPending ? 'Saving...' : 'Save'}</button>
                  </div>
                </div>
              )}
            </div>
          </section>
        </DesktopAppShell>
      </div>

      <div className="lg:hidden bg-surface app-light-gradient font-body text-on-surface min-h-screen pb-32">
        <TopBar />
        <main className="max-w-screen-xl mx-auto px-6 pt-6 pb-32 space-y-5">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Profile</h1>
            <p className="text-on-surface-variant mt-1">Manage your personal details and profile picture.</p>
          </div>
          {profileForm}

          {/* Embedded settings for mobile */}
          <section className="mt-6 space-y-4">
            <h3 className="text-2xl font-black">Settings</h3>
            <div className="bg-surface-container-lowest rounded-2xl p-4">
              <h4 className="font-semibold">Notification Preferences</h4>
              <div className="mt-3 space-y-3">
                {[
                  { key: 'expense', label: 'Expense alerts', sub: 'When a new expense is added' },
                  { key: 'task', label: 'Chore reminders', sub: 'When tasks are assigned or due' },
                  { key: 'payment', label: 'Payment reminders', sub: 'When someone settles a debt' },
                ].map(({ key, label, sub }) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{label}</p>
                      <p className="text-xs text-on-surface-variant">{sub}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked={notificationPrefs[key]} onChange={(e) => toggleNotification(key, e.target.checked)} />
                      <div className="w-11 h-6 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:bg-primary transition-colors" />
                      <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5" />
                    </label>
                  </div>
                ))}
              </div>

              {user && (
                <div className="mt-4">
                  <h4 className="font-semibold">Monthly Rent (Admins only)</h4>
                  <div className="mt-3 flex gap-3">
                    <input type="number" min="0" value={monthlyRentInputLocal} onChange={e => setMonthlyRentInputLocal(e.target.value)} placeholder={`${rentStatus?.totalRentAmount || ''}`} className="flex-1 rounded-xl border border-slate-200 px-4 py-3" />
                    <button onClick={() => updateRentMutation.mutate(Number(monthlyRentInputLocal || rentStatus?.totalRentAmount || 0))} disabled={updateRentMutation.isPending} className="px-5 py-3 signature-gradient text-white rounded-xl">{updateRentMutation.isPending ? 'Saving...' : 'Save'}</button>
                  </div>
                </div>
              )}
            </div>
          </section>
        </main>
        <BottomNav />
      </div>
    </>
  )
}


