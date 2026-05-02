import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import TopBar from '../components/TopBar'
import BottomNav from '../components/BottomNav'
import DesktopAppShell from '../components/desktop/DesktopAppShell'
import { chatService } from '../services'
import { useAuth } from '../context/AuthContext'
import { useHouse } from '../context/HouseContext'

const formatChatTime = (date) => {
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
}

const relativeTime = (date) => {
  if (!date) return 'No messages yet'
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function ConversationPill({ active, label, unread, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
        active
          ? 'bg-primary text-on-primary'
          : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
      }`}
    >
      <span>{label}</span>
      {unread > 0 ? (
        <span className={`text-[10px] px-2 py-0.5 rounded-full ${active ? 'bg-white/20 text-on-primary' : 'bg-primary text-on-primary'}`}>
          {unread}
        </span>
      ) : null}
    </button>
  )
}

function MessagesPanel({ messages, meId, conversationType }) {
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3 bg-surface-container-low rounded-2xl border border-outline-variant/15">
      {messages.length === 0 ? (
        <div className="h-full grid place-items-center text-center text-on-surface-variant text-sm px-8">
          No messages yet. Start the conversation.
        </div>
      ) : (
        messages.map(message => {
          const mine = String(message.senderId) === String(meId)
          return (
            <div key={message._id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${mine ? 'bg-primary text-on-primary rounded-br-md' : 'bg-surface-container-lowest text-on-surface rounded-bl-md border border-outline-variant/20'}`}>
                {!mine && conversationType === 'group' ? (
                  <p className="text-[11px] font-bold uppercase tracking-wide text-on-surface-variant mb-1">
                    {message.sender?.displayName || message.sender?.name || 'Member'}
                  </p>
                ) : null}
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
                <p className={`text-[10px] mt-1 ${mine ? 'text-on-primary/80' : 'text-on-surface-variant'}`}>
                  {formatChatTime(message.createdAt)}
                </p>
              </div>
            </div>
          )
        })
      )}
      <div ref={endRef} />
    </div>
  )
}

export default function Messages() {
  const { user } = useAuth()
  const { house } = useHouse()
  const qc = useQueryClient()
  const [text, setText] = useState('')
  const [activeChat, setActiveChat] = useState({ type: 'group', id: 'group', name: 'House Group' })

  const { data: convData } = useQuery({
    queryKey: ['chat-conversations'],
    queryFn: () => chatService.getConversations().then(r => r.data),
    refetchInterval: 8000,
  })

  const conversations = convData?.conversations || []

  useEffect(() => {
    if (conversations.length === 0) return
    const exists = conversations.some(c => c.id === activeChat.id && c.type === activeChat.type)
    if (!exists) {
      const first = conversations[0]
      setActiveChat({ type: first.type, id: first.id, name: first.name })
    }
  }, [activeChat.id, activeChat.type, conversations])

  const activeConversation = useMemo(
    () => conversations.find(c => c.id === activeChat.id && c.type === activeChat.type) || conversations[0],
    [activeChat.id, activeChat.type, conversations],
  )

  useEffect(() => {
    if (activeConversation) {
      setActiveChat({ type: activeConversation.type, id: activeConversation.id, name: activeConversation.name })
    }
  }, [activeConversation?.id, activeConversation?.name, activeConversation?.type])

  const { data: messageData, isLoading: loadingMessages } = useQuery({
    queryKey: ['chat-messages', activeChat.type, activeChat.id],
    queryFn: () =>
      chatService
        .getMessages({
          type: activeChat.type,
          userId: activeChat.type === 'direct' ? activeChat.id : undefined,
        })
        .then(r => r.data),
    enabled: Boolean(activeChat?.id),
    refetchInterval: 3000,
  })

  const messages = messageData?.messages || []

  const sendMutation = useMutation({
    mutationFn: (payload) => chatService.sendMessage(payload),
    onSuccess: () => {
      setText('')
      qc.invalidateQueries(['chat-messages', activeChat.type, activeChat.id])
      qc.invalidateQueries(['chat-conversations'])
    },
  })

  const sendMessage = () => {
    const cleaned = text.trim()
    if (!cleaned) return

    const payload = {
      type: activeChat.type,
      text: cleaned,
      ...(activeChat.type === 'direct' ? { userId: activeChat.id } : {}),
    }

    sendMutation.mutate(payload)
  }

  const directConversations = conversations.filter(c => c.type === 'direct')
  const totalUnread = conversations.reduce((sum, conversation) => sum + (conversation.unreadCount || 0), 0)

  const desktopSidebar = (
    <aside className="col-span-4 bg-surface-container-lowest rounded-3xl border border-outline-variant/15 p-5">
      <h3 className="text-xl font-black tracking-tight">Conversations</h3>
      <p className="text-on-surface-variant text-sm mt-1">Chat with your housemates one-to-one or in group.</p>

      <div className="mt-5 space-y-2">
        {conversations.map(conversation => (
          <button
            key={`${conversation.type}-${conversation.id}`}
            type="button"
            onClick={() => setActiveChat({ type: conversation.type, id: conversation.id, name: conversation.name })}
            className={`w-full text-left rounded-2xl px-4 py-3 transition border ${
              activeChat.type === conversation.type && activeChat.id === conversation.id
                ? 'bg-primary-fixed/20 border-primary-fixed/40'
                : 'bg-surface-container-low border-transparent hover:border-outline-variant/30'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold text-on-surface truncate">{conversation.name}</p>
              {conversation.unreadCount > 0 ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary text-on-primary">
                  {conversation.unreadCount}
                </span>
              ) : null}
            </div>
            <p className="text-xs text-on-surface-variant truncate mt-1">
              {conversation.lastMessage?.text || 'No messages yet'}
            </p>
            <p className="text-[11px] text-outline mt-1">{relativeTime(conversation.lastAt)}</p>
          </button>
        ))}
      </div>
    </aside>
  )

  const desktopChatPane = (
    <section className="col-span-8 bg-surface-container-lowest rounded-3xl border border-outline-variant/15 p-5 flex flex-col min-h-[70vh]">
      <div className="flex items-center justify-between border-b border-outline-variant/15 pb-3 mb-4">
        <div>
          <h3 className="text-xl font-black tracking-tight text-on-surface">{activeChat.name}</h3>
          <p className="text-xs text-on-surface-variant">
            {activeChat.type === 'group' ? 'Everyone in your house' : 'Direct conversation'}
          </p>
        </div>
      </div>

      {loadingMessages ? (
        <div className="flex-1 space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-16 rounded-2xl bg-surface-container animate-pulse" />)}
        </div>
      ) : (
        <MessagesPanel messages={messages} meId={user?._id} conversationType={activeChat.type} />
      )}

      <div className="mt-4 flex items-end gap-3">
        <textarea
          value={text}
          onChange={event => setText(event.target.value)}
          placeholder={activeChat.type === 'group' ? 'Message the house group...' : 'Send a direct message...'}
          rows={2}
          className="flex-1 resize-none rounded-2xl border border-outline-variant/20 bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none focus:border-primary"
          onKeyDown={event => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              sendMessage()
            }
          }}
        />
        <button
          type="button"
          onClick={sendMessage}
          disabled={sendMutation.isPending || !text.trim()}
          className="h-11 px-5 rounded-xl signature-gradient text-white font-semibold disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </section>
  )

  return (
    <>
      <div className="hidden lg:block">
        <DesktopAppShell
          title="Messages"
          subtitle={house ? 'House group and direct chats.' : 'Join a house to start chatting.'}
          searchPlaceholder="Search people..."
          rightActions={(
            <span className="px-4 py-2 rounded-xl bg-primary-fixed/20 text-primary text-sm font-semibold">
              {totalUnread} unread
            </span>
          )}
        >
          <div className="grid grid-cols-12 gap-6">
            {desktopSidebar}
            {desktopChatPane}
          </div>
        </DesktopAppShell>
      </div>

      <div className="lg:hidden bg-surface app-light-gradient font-body text-on-surface min-h-screen pb-32">
        <TopBar />

        <main className="max-w-screen-xl mx-auto px-4 pt-6 space-y-4 pb-32">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Messages</h1>
            <p className="text-sm text-on-surface-variant mt-1">Group and direct chat with your housemates.</p>
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            <ConversationPill
              active={activeChat.type === 'group' && activeChat.id === 'group'}
              label="House Group"
              unread={conversations.find(c => c.id === 'group')?.unreadCount || 0}
              onClick={() => setActiveChat({ type: 'group', id: 'group', name: 'House Group' })}
            />
            {directConversations.map(conversation => (
              <ConversationPill
                key={conversation.id}
                active={activeChat.type === 'direct' && activeChat.id === conversation.id}
                label={conversation.name}
                unread={conversation.unreadCount || 0}
                onClick={() => setActiveChat({ type: 'direct', id: conversation.id, name: conversation.name })}
              />
            ))}
          </div>

          <section className="bg-surface-container-lowest rounded-3xl border border-outline-variant/10 p-4 flex flex-col min-h-[60vh]">
            {loadingMessages ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="h-16 rounded-2xl bg-surface-container animate-pulse" />)}
              </div>
            ) : (
              <MessagesPanel messages={messages} meId={user?._id} conversationType={activeChat.type} />
            )}

            <div className="mt-3 flex items-end gap-2">
              <textarea
                value={text}
                onChange={event => setText(event.target.value)}
                placeholder="Write a message..."
                rows={2}
                className="flex-1 resize-none rounded-2xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface outline-none focus:border-primary"
                onKeyDown={event => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault()
                    sendMessage()
                  }
                }}
              />
              <button
                type="button"
                onClick={sendMessage}
                disabled={sendMutation.isPending || !text.trim()}
                className="h-11 px-4 rounded-xl signature-gradient text-on-primary font-semibold disabled:opacity-60"
              >
                Send
              </button>
            </div>
          </section>
        </main>

        <BottomNav />
      </div>
    </>
  )
}


