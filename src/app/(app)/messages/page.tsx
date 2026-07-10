'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  ChatBubbleLeftRightIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  PaperAirplaneIcon,
  PaperClipIcon,
  FaceSmileIcon,
  PhoneIcon,
  VideoCameraIcon,
  EllipsisVerticalIcon,
  XMarkIcon,
  ArrowLeftIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import PageWrapper from '@/components/PageWrapper';

// ----------------------------------------------------------------
// Types
// ----------------------------------------------------------------

interface Message {
  id: string;
  from: 'me' | 'them';
  text: string;
  time: string;
  date: string;
  read?: boolean;
}

interface Conversation {
  id: number;
  name: string;
  initials: string;
  avatarColor: string;
  department: string;
  role: string;
  online: boolean;
  lastSeen?: string;
  preview: string;
  time: string;
  unread: boolean;
  messages: Message[];
}

interface Employee {
  name: string;
  initials: string;
  avatarColor: string;
  department: string;
}

// ----------------------------------------------------------------
// Placeholder data
// ----------------------------------------------------------------

const AVATAR_COLORS = {
  teal: 'bg-teal-600',
  navy: 'bg-primary',
  gold: 'bg-gold-600',
  pink: 'bg-idc-pink-600',
};

const initialConversations: Conversation[] = [
  {
    id: 1,
    name: 'Nomvula Dlamini',
    initials: 'ND',
    avatarColor: AVATAR_COLORS.teal,
    department: 'Human Resources',
    role: 'HR Manager',
    online: true,
    preview: 'Hi Sipho, your performance review self-assessment is due by...',
    time: '2h ago',
    unread: true,
    messages: [
      { id: '1a', from: 'them', text: 'Hi Sipho, I wanted to remind you that the Q2 performance review cycle has started. Your self-assessment is due by 15 July.', time: '14:30', date: 'Yesterday' },
      { id: '1b', from: 'me', text: "Thanks Nomvula. I've started working on it. Quick question \u2014 should I include the infrastructure audit project in my key achievements?", time: '14:45', date: 'Yesterday' },
      { id: '1c', from: 'them', text: 'Absolutely! That was a significant achievement. Also include the team training sessions you facilitated.', time: '15:10', date: 'Yesterday' },
      { id: '1d', from: 'them', text: 'Hi Sipho, your performance review self-assessment is due by 15 July. Please make sure to complete all sections including the competency ratings.', time: '09:15', date: 'Today' },
      { id: '1e', from: 'me', text: 'Will do. I plan to submit it by end of this week. Is there a template I should follow?', time: '09:30', date: 'Today' },
      { id: '1f', from: 'them', text: 'Yes, you can find the template in the Performance Reviews section. Let me know if you need any help.', time: '10:00', date: 'Today' },
    ],
  },
  {
    id: 2,
    name: 'Thabo Khumalo',
    initials: 'TK',
    avatarColor: AVATAR_COLORS.navy,
    department: 'Operations',
    role: 'Operations Manager',
    online: true,
    preview: 'The SCADA system upgrade is scheduled for next week. Please...',
    time: '5h ago',
    unread: true,
    messages: [
      { id: '2a', from: 'them', text: 'Hi Sipho, the SCADA system upgrade is scheduled for next week. Please ensure all field devices are calibrated before Monday.', time: '08:00', date: 'Today' },
      { id: '2b', from: 'me', text: "Noted, Thabo. I'll coordinate with the field technicians to have everything ready by Friday.", time: '08:25', date: 'Today' },
      { id: '2c', from: 'them', text: 'The SCADA system upgrade is scheduled for next week. Please also prepare a backup of the current configuration files.', time: '11:30', date: 'Today' },
    ],
  },
  {
    id: 3,
    name: 'Pieter van der Merwe',
    initials: 'PM',
    avatarColor: AVATAR_COLORS.gold,
    department: 'Finance',
    role: 'CFO',
    online: false,
    lastSeen: '2h ago',
    preview: 'Budget allocation for Q3 has been finalised. Your department...',
    time: 'Yesterday',
    unread: true,
    messages: [
      { id: '3a', from: 'them', text: 'Good morning Sipho. Budget allocation for Q3 has been finalised. Your department has been allocated R2.4M for infrastructure maintenance.', time: '09:00', date: 'Yesterday' },
      { id: '3b', from: 'me', text: "Thank you Pieter. That's in line with what we projected. I'll prepare the detailed expenditure plan by next week.", time: '09:45', date: 'Yesterday' },
      { id: '3c', from: 'them', text: 'Budget allocation for Q3 has been finalised. Your department should submit the procurement requests by 20 July.', time: '14:00', date: 'Yesterday' },
    ],
  },
  {
    id: 4,
    name: 'Dr. Mbongeni Nkosi',
    initials: 'MN',
    avatarColor: AVATAR_COLORS.pink,
    department: 'Executive',
    role: 'CEO',
    online: false,
    lastSeen: '1h ago',
    preview: "Good work on the infrastructure audit report. I've reviewed...",
    time: 'Yesterday',
    unread: false,
    messages: [
      { id: '4a', from: 'them', text: "Good work on the infrastructure audit report. I've reviewed it and I'm impressed with the thoroughness of the analysis.", time: '10:00', date: 'Yesterday' },
      { id: '4b', from: 'me', text: 'Thank you Dr. Nkosi. The team put a lot of effort into ensuring accuracy. We identified 12 critical areas that need immediate attention.', time: '10:30', date: 'Yesterday' },
      { id: '4c', from: 'them', text: "I noticed that. Let's schedule a meeting to discuss the priority items. Can you prepare a brief presentation for the board?", time: '11:15', date: 'Yesterday' },
      { id: '4d', from: 'me', text: "Of course. I'll have the presentation ready by Thursday. Should I include the cost-benefit analysis as well?", time: '11:45', date: 'Yesterday' },
      { id: '4e', from: 'them', text: 'Yes, that would be excellent. Include projected timelines too. Good work, Sipho.', time: '12:00', date: 'Yesterday' },
    ],
  },
  {
    id: 5,
    name: 'Lindiwe Ngcobo',
    initials: 'LN',
    avatarColor: AVATAR_COLORS.teal,
    department: 'Water Quality',
    role: 'Lab Manager',
    online: true,
    preview: 'The water quality test results from Bergville are ready for...',
    time: '7 Jul',
    unread: false,
    messages: [
      { id: '5a', from: 'them', text: 'Hi Sipho, the water quality test results from Bergville are ready for review. All parameters are within acceptable limits.', time: '11:00', date: '7 Jul' },
      { id: '5b', from: 'me', text: "Great news, Lindiwe. Can you send me the detailed report? I need to include it in the monthly compliance submission.", time: '11:30', date: '7 Jul' },
      { id: '5c', from: 'them', text: "I've uploaded it to the shared drive. The turbidity levels have improved significantly since we replaced the filters last month.", time: '12:00', date: '7 Jul' },
    ],
  },
  {
    id: 6,
    name: 'Johan Pretorius',
    initials: 'JP',
    avatarColor: AVATAR_COLORS.navy,
    department: 'Maintenance',
    role: 'Maintenance Supervisor',
    online: false,
    lastSeen: '3h ago',
    preview: 'Maintenance team availability for the weekend shift has been...',
    time: '6 Jul',
    unread: false,
    messages: [
      { id: '6a', from: 'them', text: 'Sipho, maintenance team availability for the weekend shift has been confirmed. We have 6 technicians on standby.', time: '14:00', date: '6 Jul' },
      { id: '6b', from: 'me', text: "Thanks Johan. Please make sure they have access to the new valve replacement tools. We received them on Wednesday.", time: '14:30', date: '6 Jul' },
      { id: '6c', from: 'them', text: "Will do. I've also scheduled the pump station inspection for Saturday morning. I'll send you the report by Monday.", time: '15:00', date: '6 Jul' },
    ],
  },
  {
    id: 7,
    name: 'HR Department',
    initials: 'HR',
    avatarColor: AVATAR_COLORS.gold,
    department: 'Human Resources',
    role: 'Department',
    online: false,
    lastSeen: 'N/A',
    preview: 'Reminder: Please update your emergency contact details by...',
    time: '5 Jul',
    unread: false,
    messages: [
      { id: '7a', from: 'them', text: 'Dear Staff Member,\n\nThis is a reminder to please update your emergency contact details in the HR portal by 12 July 2025. Accurate records are essential for workplace safety compliance.\n\nThank you,\nHR Department', time: '09:00', date: '5 Jul' },
      { id: '7b', from: 'me', text: "Thank you for the reminder. I've updated my details in the portal.", time: '10:15', date: '5 Jul' },
    ],
  },
  {
    id: 8,
    name: 'Bongani Zulu',
    initials: 'BZ',
    avatarColor: AVATAR_COLORS.pink,
    department: 'ICT',
    role: 'ICT Manager',
    online: false,
    lastSeen: '5h ago',
    preview: 'ICT has deployed the latest system patches. If you experience...',
    time: '3 Jul',
    unread: false,
    messages: [
      { id: '8a', from: 'them', text: 'Hi all, ICT has deployed the latest system patches across all servers. If you experience any issues, please log a ticket on the IT helpdesk.', time: '16:00', date: '3 Jul' },
      { id: '8b', from: 'me', text: "Thanks Bongani. I noticed the ERP system is a bit slow today. Could it be related to the patches?", time: '16:30', date: '3 Jul' },
      { id: '8c', from: 'them', text: "It's possible. We're monitoring performance. The system should stabilise within 24 hours as the indexes rebuild. Let me know if it persists beyond that.", time: '16:45', date: '3 Jul' },
    ],
  },
];

const allEmployees: Employee[] = [
  { name: 'Nomvula Dlamini', initials: 'ND', avatarColor: AVATAR_COLORS.teal, department: 'Human Resources' },
  { name: 'Thabo Khumalo', initials: 'TK', avatarColor: AVATAR_COLORS.navy, department: 'Operations' },
  { name: 'Pieter van der Merwe', initials: 'PM', avatarColor: AVATAR_COLORS.gold, department: 'Finance' },
  { name: 'Dr. Mbongeni Nkosi', initials: 'MN', avatarColor: AVATAR_COLORS.pink, department: 'Executive' },
  { name: 'Lindiwe Ngcobo', initials: 'LN', avatarColor: AVATAR_COLORS.teal, department: 'Water Quality' },
  { name: 'Johan Pretorius', initials: 'JP', avatarColor: AVATAR_COLORS.navy, department: 'Maintenance' },
  { name: 'Bongani Zulu', initials: 'BZ', avatarColor: AVATAR_COLORS.pink, department: 'ICT' },
  { name: 'Zanele Mthembu', initials: 'ZM', avatarColor: AVATAR_COLORS.teal, department: 'Finance' },
  { name: 'Andile Shabalala', initials: 'AS', avatarColor: AVATAR_COLORS.navy, department: 'Operations' },
  { name: 'Fatima Moosa', initials: 'FM', avatarColor: AVATAR_COLORS.gold, department: 'Legal & Compliance' },
  { name: 'David van Wyk', initials: 'DW', avatarColor: AVATAR_COLORS.pink, department: 'Engineering' },
  { name: 'Thembi Ndlovu', initials: 'TN', avatarColor: AVATAR_COLORS.teal, department: 'Customer Services' },
];

// ----------------------------------------------------------------
// Component
// ----------------------------------------------------------------

type FilterTab = 'all' | 'unread';

export default function MessagesPage() {
  // -- State --
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [messageInput, setMessageInput] = useState('');
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [mobileThreadOpen, setMobileThreadOpen] = useState(false);

  // Compose modal state
  const [composeRecipients, setComposeRecipients] = useState<Employee[]>([]);
  const [composeRecipientSearch, setComposeRecipientSearch] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [showRecipientDropdown, setShowRecipientDropdown] = useState(false);

  // Refs
  const threadBodyRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const recipientInputRef = useRef<HTMLInputElement>(null);

  // -- Derived data --
  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeConversationId) ?? null,
    [conversations, activeConversationId],
  );

  const unreadCount = useMemo(
    () => conversations.filter((c) => c.unread).length,
    [conversations],
  );

  const filteredConversations = useMemo(() => {
    const normalizedSearch = searchTerm.toLowerCase();
    return conversations.filter((c) => {
      const matchesSearch =
        !searchTerm ||
        c.name.toLowerCase().includes(normalizedSearch) ||
        c.preview.toLowerCase().includes(normalizedSearch);
      const matchesFilter = filterTab === 'all' || (filterTab === 'unread' && c.unread);
      return matchesSearch && matchesFilter;
    });
  }, [conversations, searchTerm, filterTab]);

  const filteredRecipients = useMemo(() => {
    const query = composeRecipientSearch.toLowerCase();
    return allEmployees.filter(
      (emp) =>
        !composeRecipients.some((r) => r.name === emp.name) &&
        (emp.name.toLowerCase().includes(query) || emp.department.toLowerCase().includes(query)),
    );
  }, [composeRecipientSearch, composeRecipients]);

  // Group messages by date for the active conversation
  const groupedMessages = useMemo(() => {
    if (!activeConversation) return [];
    const groups: { date: string; messages: Message[] }[] = [];
    let currentDate = '';
    for (const msg of activeConversation.messages) {
      if (msg.date !== currentDate) {
        currentDate = msg.date;
        groups.push({ date: msg.date, messages: [msg] });
      } else {
        groups[groups.length - 1].messages.push(msg);
      }
    }
    return groups;
  }, [activeConversation]);

  // -- Scroll to bottom when conversation changes or new message --
  useEffect(() => {
    if (threadBodyRef.current) {
      threadBodyRef.current.scrollTop = threadBodyRef.current.scrollHeight;
    }
  }, [activeConversationId, conversations]);

  // -- Handlers --
  const selectConversation = useCallback(
    (id: number) => {
      setActiveConversationId(id);
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, unread: false } : c)),
      );
      setMobileThreadOpen(true);
    },
    [],
  );

  const handleSendMessage = useCallback(() => {
    const text = messageInput.trim();
    if (!text || !activeConversationId) return;

    const newMsg: Message = {
      id: `${activeConversationId}-${Date.now()}`,
      from: 'me',
      text,
      time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      date: 'Today',
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConversationId
          ? {
              ...c,
              messages: [...c.messages, newMsg],
              preview: text.length > 60 ? text.substring(0, 60) + '...' : text,
              time: 'Just now',
            }
          : c,
      ),
    );
    setMessageInput('');
  }, [messageInput, activeConversationId]);

  const handleMessageKeydown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    },
    [handleSendMessage],
  );

  const handleMobileBack = useCallback(() => {
    setMobileThreadOpen(false);
  }, []);

  const openCompose = useCallback(() => {
    setShowComposeModal(true);
    setComposeRecipients([]);
    setComposeRecipientSearch('');
    setComposeSubject('');
    setComposeBody('');
    setShowRecipientDropdown(false);
  }, []);

  const closeCompose = useCallback(() => {
    setShowComposeModal(false);
    setShowRecipientDropdown(false);
  }, []);

  const addRecipient = useCallback((emp: Employee) => {
    setComposeRecipients((prev) => [...prev, emp]);
    setComposeRecipientSearch('');
    setShowRecipientDropdown(false);
    recipientInputRef.current?.focus();
  }, []);

  const removeRecipient = useCallback((name: string) => {
    setComposeRecipients((prev) => prev.filter((r) => r.name !== name));
  }, []);

  const handleSendComposed = useCallback(() => {
    if (composeRecipients.length === 0 || !composeBody.trim()) return;
    closeCompose();
  }, [composeRecipients, composeBody, closeCompose]);

  // -- Action button for PageWrapper --
  const composeButton = (
    <button onClick={openCompose} className="btn-cta inline-flex items-center gap-2">
      <PlusIcon className="w-4 h-4" />
      Compose
    </button>
  );

  // ----------------------------------------------------------------
  // Sub-renders
  // ----------------------------------------------------------------

  /** Conversation list item */
  const renderConvItem = (conv: Conversation) => {
    const isActive = activeConversationId === conv.id;
    return (
      <button
        key={conv.id}
        onClick={() => selectConversation(conv.id)}
        className={`w-full flex items-start gap-3 px-4 py-3.5 text-left transition-colors border-l-[3px] ${
          isActive
            ? 'bg-surface-navy border-l-primary'
            : 'border-l-transparent hover:bg-background'
        }`}
      >
        {/* Avatar */}
        <div className={`relative flex-shrink-0 w-[42px] h-[42px] rounded-full ${conv.avatarColor} text-white flex items-center justify-center font-bold text-[0.813rem]`}>
          {conv.initials}
          {conv.online && (
            <span className="absolute bottom-[1px] right-[1px] w-2.5 h-2.5 bg-success border-2 border-card rounded-full" />
          )}
        </div>

        {/* Body */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <span className={`text-sm truncate ${conv.unread ? 'font-bold text-foreground' : 'font-semibold text-foreground'}`}>
              {conv.name}
            </span>
            <span className="text-[0.688rem] text-muted-foreground whitespace-nowrap ml-2 flex-shrink-0">
              {conv.time}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs truncate flex-1 leading-snug ${conv.unread ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
              {conv.preview}
            </span>
            {conv.unread && (
              <span className="w-2 h-2 min-w-[8px] rounded-full bg-primary flex-shrink-0" />
            )}
          </div>
        </div>
      </button>
    );
  };

  /** Empty thread state */
  const renderEmptyThreadState = () => (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-center">
      <div className="w-[72px] h-[72px] rounded-full bg-surface-navy flex items-center justify-center mb-2">
        <ChatBubbleLeftRightIcon className="w-8 h-8 text-primary" />
      </div>
      <h3 className="text-lg font-bold text-foreground">Select a conversation</h3>
      <p className="text-sm text-muted-foreground max-w-[280px]">
        Choose a conversation from the left panel or compose a new message
      </p>
    </div>
  );

  /** Active thread */
  const renderThread = () => {
    if (!activeConversation) return renderEmptyThreadState();

    return (
      <>
        {/* Thread header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-card border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile back button */}
            <button
              onClick={handleMobileBack}
              className="md:hidden w-8 h-8 rounded-full flex items-center justify-center text-foreground hover:bg-surface-navy transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </button>

            <div className={`w-10 h-10 rounded-full ${activeConversation.avatarColor} text-white flex items-center justify-center font-bold text-[0.813rem]`}>
              {activeConversation.initials}
            </div>
            <div>
              <h3 className="text-[0.938rem] font-bold text-foreground leading-tight">
                {activeConversation.name}
              </h3>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span
                  className={`w-[7px] h-[7px] rounded-full ${
                    activeConversation.online ? 'bg-success' : 'bg-muted-foreground'
                  }`}
                />
                {activeConversation.online
                  ? 'Online'
                  : `Last seen ${activeConversation.lastSeen || 'recently'}`}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:bg-surface-navy hover:text-primary transition-colors" title="Video call">
              <VideoCameraIcon className="w-[18px] h-[18px]" />
            </button>
            <button className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:bg-surface-navy hover:text-primary transition-colors" title="Phone call">
              <PhoneIcon className="w-[18px] h-[18px]" />
            </button>
            <button className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:bg-surface-navy hover:text-primary transition-colors" title="More options">
              <EllipsisVerticalIcon className="w-[18px] h-[18px]" />
            </button>
          </div>
        </div>

        {/* Thread body */}
        <div
          ref={threadBodyRef}
          className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-1"
        >
          {groupedMessages.map((group) => (
            <div key={group.date}>
              {/* Date separator */}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-border" />
                <span className="text-[0.688rem] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                  {group.date}
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Messages */}
              {group.messages.map((msg, idx) => {
                const isSent = msg.from === 'me';
                const isLastInGroup = idx === group.messages.length - 1;
                return (
                  <div
                    key={msg.id}
                    className={`flex mb-1 ${
                      isSent ? 'justify-end pl-16' : 'justify-start pr-16'
                    }`}
                  >
                    <div>
                      <div
                        className={`max-w-[480px] px-4 py-3 text-sm leading-relaxed ${
                          isSent
                            ? 'bg-primary text-primary-foreground rounded-2xl rounded-br-[4px]'
                            : 'bg-card text-foreground border border-border rounded-2xl rounded-bl-[4px]'
                        }`}
                      >
                        {msg.text.split('\n').map((line, i) => (
                          <span key={i}>
                            {line}
                            {i < msg.text.split('\n').length - 1 && <br />}
                          </span>
                        ))}
                      </div>
                      <div className={`flex items-center gap-1.5 mt-1 ${isSent ? 'justify-end' : 'justify-start'}`}>
                        <span className={`text-[0.625rem] ${isSent ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                          {msg.time}
                        </span>
                        {isSent && (
                          <span className={isLastInGroup ? 'text-muted-foreground' : 'text-accent-navy'}>
                            <CheckIcon className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          {/* Typing indicator for first conversation */}
          {activeConversation.id === 1 && (
            <div className="flex items-center gap-2 py-2 mb-1">
              <div className={`w-7 h-7 rounded-full ${activeConversation.avatarColor} text-white flex items-center justify-center font-bold text-[0.625rem]`}>
                {activeConversation.initials}
              </div>
              <div className="flex items-center gap-[3px] px-3 py-2 bg-card border border-border rounded-2xl">
                <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:0s]" />
                <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}
        </div>

        {/* Message input bar */}
        <div className="flex items-end gap-2 px-5 py-3.5 bg-card border-t border-border flex-shrink-0">
          <button className="w-9 h-9 min-w-[36px] rounded-full flex items-center justify-center text-muted-foreground hover:bg-background hover:text-primary transition-colors" title="Attach file">
            <PaperClipIcon className="w-[18px] h-[18px]" />
          </button>
          <div className="flex-1">
            <textarea
              ref={messageInputRef}
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={handleMessageKeydown}
              placeholder="Type a message..."
              rows={1}
              className="w-full px-4 py-2.5 border border-border bg-background rounded-[20px] text-sm text-foreground placeholder:text-muted-foreground resize-none max-h-[120px] leading-snug focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring/40 transition-colors"
            />
          </div>
          <button className="w-9 h-9 min-w-[36px] rounded-full flex items-center justify-center text-muted-foreground hover:bg-background hover:text-primary transition-colors" title="Emoji">
            <FaceSmileIcon className="w-[18px] h-[18px]" />
          </button>
          <button
            onClick={handleSendMessage}
            disabled={!messageInput.trim()}
            className="w-9 h-9 min-w-[36px] rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 disabled:bg-border disabled:cursor-not-allowed transition-all"
            title="Send"
          >
            <PaperAirplaneIcon className="w-[18px] h-[18px]" />
          </button>
        </div>
      </>
    );
  };

  // ----------------------------------------------------------------
  // Compose Modal
  // ----------------------------------------------------------------

  const renderComposeModal = () => {
    if (!showComposeModal) return null;

    return (
      <div
        className="fixed inset-0 bg-foreground/50 backdrop-blur-sm flex items-center justify-center z-50"
        onClick={closeCompose}
      >
        <div
          className="bg-card rounded-card shadow-lg w-[560px] max-w-[95vw] max-h-[85vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-border">
            <h2 className="text-lg font-bold text-foreground">New Message</h2>
            <button
              onClick={closeCompose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-error-bg hover:text-error transition-colors"
            >
              <XMarkIcon className="w-[18px] h-[18px]" />
            </button>
          </div>

          {/* Modal body */}
          <div className="px-6 py-6 flex-1 overflow-y-auto space-y-5">
            {/* To field */}
            <div className="relative">
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                To
              </label>
              <div
                className="flex flex-wrap items-center gap-1.5 p-1.5 border border-border rounded-control bg-card min-h-[42px] cursor-text focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/40 transition-colors"
                onClick={() => recipientInputRef.current?.focus()}
              >
                {composeRecipients.map((r) => (
                  <span
                    key={r.name}
                    className="inline-flex items-center gap-1.5 pl-1 pr-2 py-0.5 bg-surface-navy border border-icon-bg-navy rounded-full text-xs font-semibold text-primary"
                  >
                    <span className={`w-[22px] h-[22px] rounded-full ${r.avatarColor} text-white flex items-center justify-center text-[0.563rem] font-bold`}>
                      {r.initials}
                    </span>
                    {r.name}
                    <button
                      onClick={() => removeRecipient(r.name)}
                      className="w-4 h-4 rounded-full flex items-center justify-center text-primary hover:bg-error-bg hover:text-error transition-colors ml-0.5"
                    >
                      <XMarkIcon className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
                <input
                  ref={recipientInputRef}
                  type="text"
                  value={composeRecipientSearch}
                  onChange={(e) => {
                    setComposeRecipientSearch(e.target.value);
                    setShowRecipientDropdown(true);
                  }}
                  onFocus={() => setShowRecipientDropdown(true)}
                  placeholder={composeRecipients.length === 0 ? 'Search for a recipient...' : ''}
                  className="flex-1 min-w-[120px] border-none outline-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground py-1 px-1.5"
                />
              </div>

              {/* Recipient dropdown */}
              {showRecipientDropdown && filteredRecipients.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-control shadow-md max-h-[200px] overflow-y-auto z-10">
                  {filteredRecipients.map((emp) => (
                    <button
                      key={emp.name}
                      onClick={() => addRecipient(emp)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-surface-navy transition-colors"
                    >
                      <div className={`w-[30px] h-[30px] rounded-full ${emp.avatarColor} text-white flex items-center justify-center font-bold text-[0.625rem] flex-shrink-0`}>
                        {emp.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[0.813rem] font-semibold text-foreground">{emp.name}</div>
                        <div className="text-[0.688rem] text-muted-foreground">{emp.department}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Subject */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Subject <span className="normal-case font-normal tracking-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={composeSubject}
                onChange={(e) => setComposeSubject(e.target.value)}
                placeholder="Message subject..."
                className="w-full px-3.5 py-2.5 border border-border rounded-control text-sm text-foreground bg-card placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring/40 transition-colors"
              />
            </div>

            {/* Message body */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Message
              </label>
              <textarea
                value={composeBody}
                onChange={(e) => setComposeBody(e.target.value)}
                placeholder="Type your message here..."
                className="w-full px-3.5 py-3 border border-border rounded-control text-sm text-foreground bg-card placeholder:text-muted-foreground resize-y min-h-[140px] leading-normal focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring/40 transition-colors"
              />
            </div>

            {/* Attachments upload zone */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Attachments
              </label>
              <div className="border-2 border-dashed border-border rounded-control p-5 text-center cursor-pointer hover:border-primary hover:bg-surface-navy transition-colors">
                <PaperClipIcon className="w-7 h-7 text-muted-foreground mx-auto mb-1.5" />
                <p className="text-xs text-muted-foreground">
                  <span className="font-semibold text-primary">Click to upload</span> or drag and drop
                </p>
                <p className="text-[0.688rem] text-muted-foreground mt-0.5">
                  PDF, DOC, XLS, PNG up to 10MB
                </p>
              </div>
            </div>
          </div>

          {/* Modal footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
            <button onClick={closeCompose} className="btn-secondary inline-flex items-center gap-2">
              Cancel
            </button>
            <button
              onClick={handleSendComposed}
              disabled={composeRecipients.length === 0 || !composeBody.trim()}
              className="btn-cta inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PaperAirplaneIcon className="w-3.5 h-3.5" />
              Send Message
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ----------------------------------------------------------------
  // Main render
  // ----------------------------------------------------------------

  return (
    <PageWrapper
      title="Messages"
      subtitle="Communicate with colleagues, departments, and hiring teams"
      actions={composeButton}
    >
      {/* Messaging container */}
      <div className="enterprise-card overflow-hidden flex" style={{ height: 'calc(100vh - 220px)', minHeight: '500px' }}>

        {/* ====== LEFT PANEL -- Conversation List ====== */}
        <div className={`w-[340px] min-w-[340px] border-r border-border bg-card flex flex-col ${mobileThreadOpen ? 'hidden md:flex' : 'flex'}`}>
          {/* Conversation header */}
          <div className="px-4 pt-5 pb-3 border-b border-border flex-shrink-0">
            {/* Compose button (mobile inline) */}
            <button
              onClick={openCompose}
              className="btn-cta w-full inline-flex items-center justify-center gap-2 mb-3"
            >
              <PlusIcon className="w-4 h-4" />
              <span>Compose</span>
            </button>

            {/* Search */}
            <div className="relative mb-3">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search messages..."
                className="w-full pl-9 pr-3 py-2 border border-border bg-background rounded-control text-[0.813rem] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring/40 transition-colors"
              />
            </div>

            {/* Filter tabs */}
            <div className="flex">
              <button
                onClick={() => setFilterTab('all')}
                className={`flex-1 py-2 text-xs font-semibold uppercase tracking-wider text-center border-b-2 transition-colors ${
                  filterTab === 'all'
                    ? 'text-primary border-b-primary'
                    : 'text-muted-foreground border-b-transparent hover:text-primary'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterTab('unread')}
                className={`flex-1 py-2 text-xs font-semibold uppercase tracking-wider text-center border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
                  filterTab === 'unread'
                    ? 'text-primary border-b-primary'
                    : 'text-muted-foreground border-b-transparent hover:text-primary'
                }`}
              >
                Unread
                {unreadCount > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-[5px] bg-primary text-primary-foreground rounded-full text-[0.625rem] font-bold">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center">
                <MagnifyingGlassIcon className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-40" />
                <p className="text-[0.813rem] text-muted-foreground">No conversations found</p>
              </div>
            ) : (
              filteredConversations.map(renderConvItem)
            )}
          </div>
        </div>

        {/* ====== RIGHT PANEL -- Message Thread ====== */}
        <div className={`flex-1 flex flex-col min-w-0 bg-background ${mobileThreadOpen ? 'flex' : 'hidden md:flex'}`}>
          {renderThread()}
        </div>
      </div>

      {/* Compose modal */}
      {renderComposeModal()}
    </PageWrapper>
  );
}
