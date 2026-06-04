'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search, User, Calendar, Clock,
  Link2, Send, MessageSquare, CheckCheck, Check,
  ShieldAlert, Archive, Inbox, Phone, RefreshCw, Unlink, X, ExternalLink, Copy
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface Conversation {
  id: string;
  contact_id: string;
  status: 'open' | 'pending_human' | 'resolved' | 'archived';
  assigned_to: string | null;
  last_inbound_at: string | null;
  last_outbound_at: string | null;
  last_message_at: string | null;
  booking_id: string | null;
  phone_number: string;
  display_name: string | null;
}

interface Message {
  id: string;
  conversation_id: string;
  contact_id: string;
  direction: 'incoming' | 'outgoing';
  sender_type: 'customer' | 'owner' | 'cs' | 'bot' | 'system';
  message_type: string;
  text: string | null;
  media_url: string | null;
  media_mime_type: string | null;
  status: 'sent' | 'delivered' | 'read' | 'failed' | null;
  wati_timestamp: string;
}

interface Booking {
  id: string;
  created_at: string;
  status: 'Active' | 'Cancelled' | 'Rescheduled' | 'Completed';
  customer: {
    name: string;
    whatsapp: string;
    category: string;
  };
  booking: {
    date: string;
    notes: string;
  };
  finance: {
    total_price: number;
    payments: Array<{
      amount: number;
      date: string;
      note: string;
    }>;
  };
}

export function WhatsAppWorkspace() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [customerBookings, setCustomerBookings] = useState<Booking[]>([]);
  const [allBookings, setAllBookings] = useState<Booking[]>([]);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'pending_human' | 'resolved'>('all');
  const [bookingSearchQuery, setBookingSearchQuery] = useState('');

  // Inputs & Loading
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoadingConvs, setIsLoadingConvs] = useState(false);
  const [isLoadingMsgs, setIsLoadingMsgs] = useState(false);

  // Toast, Modal, and Confirmation States
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [bookingToConfirmLink, setBookingToConfirmLink] = useState<Booking | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Show non-blocking toast helper
  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
  }, []);

  // Auto-clear toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Fetch Conversations list
  const fetchConversations = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoadingConvs(true);
    try {
      const res = await fetch(`/api/admin/whatsapp/conversations?status=${statusFilter}&search=${encodeURIComponent(searchTerm)}`);
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    } finally {
      if (showLoading) setIsLoadingConvs(false);
    }
  }, [statusFilter, searchTerm]);

  // Fetch Messages for selected conversation
  const fetchMessages = useCallback(async (convId: string) => {
    setIsLoadingMsgs(true);
    try {
      const res = await fetch(`/api/admin/whatsapp/conversations/${convId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data || []);
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      setIsLoadingMsgs(false);
    }
  }, []);

  // Fetch bookings for Customer 360 panel
  const fetchAllBookings = useCallback(async () => {
    try {
      const res = await fetch('/api/bookings');
      if (res.ok) {
        const data = await res.json();
        setAllBookings(data || []);
      }
    } catch (err) {
      console.error('Failed to fetch all bookings:', err);
    }
  }, []);

  // Poll for new messages/conversations every 10 seconds
  useEffect(() => {
    fetchConversations(true);
    fetchAllBookings();

    const interval = setInterval(() => {
      fetchConversations(false);
      if (selectedConversation) {
        // Poll messages silently
        fetch(`/api/admin/whatsapp/conversations/${selectedConversation.id}/messages`)
          .then(res => {
            if (res.ok) return res.json();
          })
          .then(data => {
            if (data) setMessages(data);
          })
          .catch(err => console.error('Polled messages error:', err));
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [searchTerm, statusFilter, fetchConversations, fetchAllBookings, selectedConversation]);

  // Handle conversation selection change
  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);

      // Filter bookings belonging to this customer
      const phoneDigits = selectedConversation.phone_number.replace(/\D/g, '');
      const filtered = allBookings.filter(b => {
        const bPhoneDigits = b.customer.whatsapp.replace(/\D/g, '');
        return bPhoneDigits.includes(phoneDigits) || phoneDigits.includes(bPhoneDigits);
      });
      setCustomerBookings(filtered);
    } else {
      setMessages([]);
      setCustomerBookings([]);
    }
  }, [selectedConversation, allBookings, fetchMessages]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message handler
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConversation || !replyText.trim() || isSending) return;

    setIsSending(true);
    const textToSend = replyText.trim();
    setReplyText(''); // Clear input instantly for better UX

    try {
      const res = await fetch(`/api/admin/whatsapp/conversations/${selectedConversation.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToSend })
      });

      if (res.ok) {
        // Reload messages to show sent message
        await fetchMessages(selectedConversation.id);
        fetchConversations(false);
      } else {
        showToast('Gagal mengirim pesan. Silakan coba lagi.', 'error');
        setReplyText(textToSend); // Restore text
      }
    } catch (err) {
      console.error('Error sending message:', err);
      showToast('Gagal mengirim pesan.', 'error');
      setReplyText(textToSend);
    } finally {
      setIsSending(false);
    }
  };

  // Update conversation status (Open / Resolved / Archived)
  const handleUpdateStatus = async (convId: string, newStatus: 'open' | 'resolved' | 'archived') => {
    try {
      const res = await fetch(`/api/admin/whatsapp/conversations/${convId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        if (selectedConversation?.id === convId) {
          setSelectedConversation(prev => prev ? { ...prev, status: newStatus } : null);
        }
        fetchConversations(false);
        showToast(`Status percakapan diubah menjadi ${newStatus === 'resolved' ? 'Selesai' : newStatus === 'open' ? 'Buka' : 'Arsip'}`);
      }
    } catch (err) {
      console.error('Failed to update status:', err);
      showToast('Gagal memperbarui status.', 'error');
    }
  };

  // Link booking handler
  const handleLinkBooking = async (bookingId: string | null) => {
    if (!selectedConversation) return;

    try {
      const res = await fetch(`/api/admin/whatsapp/conversations/${selectedConversation.id}/link-booking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId })
      });

      if (res.ok) {
        setSelectedConversation(prev => prev ? { ...prev, booking_id: bookingId } : null);
        fetchAllBookings();
        showToast(bookingId ? 'Booking berhasil ditautkan!' : 'Booking berhasil dilepas!');
      } else {
        const errData = await res.json().catch(() => ({}));
        showToast(errData.error || 'Gagal mengubah tautan booking.', 'error');
      }
    } catch (err) {
      console.error('Failed to link booking:', err);
      showToast('Gagal menghubungkan ke server.', 'error');
    }
  };

  // Copy payment reminder template
  const copyPaymentReminder = (b: Booking) => {
    const total = b.finance.total_price;
    const paid = b.finance.payments.reduce((sum, p) => sum + p.amount, 0);
    const sisa = total - paid;
    const message = `Halo Kak ${b.customer.name}, sekadar mengingatkan untuk sisa pembayaran booking #${b.id} (${b.customer.category}) sebesar Rp ${sisa.toLocaleString('id-ID')} dapat ditransfer ke rekening CeritaKita ya. Terima kasih!`;

    navigator.clipboard.writeText(message)
      .then(() => showToast('Pengingat pembayaran disalin ke clipboard!'))
      .catch(() => showToast('Gagal menyalin ke clipboard.', 'error'));
  };

  // Calculation helper for payment summary
  const getBookingPaymentInfo = (b: Booking) => {
    const total = b.finance.total_price;
    const paid = b.finance.payments.reduce((sum, p) => sum + p.amount, 0);
    const sisa = total - paid;
    let statusLabel = 'Belum Bayar';
    let statusClass = 'bg-rose-100 text-rose-800 border-rose-200';
    if (sisa <= 0) {
      statusLabel = 'Lunas';
      statusClass = 'bg-emerald-100 text-emerald-800 border-emerald-200';
    } else if (paid > 0) {
      statusLabel = 'DP';
      statusClass = 'bg-amber-100 text-amber-850 border-amber-200';
    }
    return { total, paid, sisa, statusLabel, statusClass };
  };

  // Format Helper
  const formatMsgTime = (isoString: string) => {
    try {
      return format(new Date(isoString), 'HH:mm');
    } catch {
      return '';
    }
  };

  const formatRelativeDay = (isoString: string | null) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return format(date, 'd MMM yy, HH:mm', { locale: id });
    } catch {
      return '';
    }
  };

  // Calculate stats for customer
  const totalPaid = customerBookings.reduce((sum, b) => {
    const paidAmount = b.finance.payments.reduce((pSum, p) => pSum + p.amount, 0);
    return sum + paidAmount;
  }, 0);

  const matchedLinkedBooking = allBookings.find(b => b.id === selectedConversation?.booking_id);

  // Search bookings for link options
  const searchResults = bookingSearchQuery.trim()
    ? allBookings.filter(b =>
        b.customer.name.toLowerCase().includes(bookingSearchQuery.toLowerCase()) ||
        b.id.toLowerCase().includes(bookingSearchQuery.toLowerCase()) ||
        b.customer.whatsapp.includes(bookingSearchQuery)
      ).slice(0, 5)
    : [];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden flex h-[calc(100vh-140px)] animate-in fade-in duration-300">

      {/* ── Left Pane: Conversation List ── */}
      <div className="w-1/4 min-w-[280px] border-r border-slate-100 flex flex-col bg-slate-50/50">

        {/* Header & Search */}
        <div className="p-4 border-b border-slate-100 bg-white space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <MessageSquare className="text-blue-600 w-5 h-5" />
              WhatsApp Inbox
            </h2>
            <button
              onClick={() => fetchConversations(true)}
              className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-lg transition"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Cari nomor/nama..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50 focus:bg-white transition"
            />
          </div>

          {/* Filters Tab */}
          <div className="flex gap-1.5 p-0.5 bg-slate-100 rounded-lg text-xs font-semibold">
            {(['all', 'open', 'pending_human', 'resolved'] as const).map((filter) => {
              const label = filter === 'all' ? 'Semua' : filter === 'open' ? 'Buka' : filter === 'pending_human' ? 'Perlu CS' : 'Selesai';
              const isActive = statusFilter === filter;
              return (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`flex-1 py-1.5 rounded-md transition text-center ${
                    isActive ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Conversations Scroll View */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100/60 custom-scrollbar">
          {isLoadingConvs ? (
            <div className="p-8 text-center text-slate-400 text-sm flex flex-col items-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
              Memuat percakapan...
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm flex flex-col items-center gap-2">
              <Inbox className="w-8 h-8 text-slate-300" />
              Tidak ada percakapan
            </div>
          ) : (
            conversations.map((conv) => {
              const isSelected = selectedConversation?.id === conv.id;
              return (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv)}
                  className={`w-full text-left p-4 transition-all duration-200 flex flex-col gap-1 border-l-4 ${
                    isSelected
                      ? 'bg-blue-50/40 border-blue-600 bg-white'
                      : 'border-transparent hover:bg-slate-100/50 bg-white'
                  }`}
                >
                  <div className="flex justify-between items-start w-full">
                    <span className="font-semibold text-slate-800 text-sm truncate max-w-[150px]">
                      {conv.display_name || conv.phone_number}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {formatRelativeDay(conv.last_message_at).split(',')[0]}
                    </span>
                  </div>

                  <div className="flex justify-between items-center w-full mt-1">
                    <span className="text-xs text-slate-500 truncate max-w-[170px]">
                      {conv.phone_number}
                    </span>

                    {/* Status Pill */}
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      conv.status === 'pending_human'
                        ? 'bg-amber-100 text-amber-800'
                        : conv.status === 'open'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {conv.status === 'pending_human' ? 'Perlu CS' : conv.status === 'open' ? 'Buka' : 'Selesai'}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── Middle Pane: Chat Window ── */}
      <div className="flex-1 flex flex-col bg-slate-50">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="px-6 py-4 bg-white border-b border-slate-100 flex items-center justify-between shadow-sm relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold shadow-inner">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">
                    {selectedConversation.display_name || selectedConversation.phone_number}
                  </h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" />
                    {selectedConversation.phone_number}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {matchedLinkedBooking && (
                  <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold border border-blue-100">
                    <Link2 className="w-3.5 h-3.5" />
                    Taut: {matchedLinkedBooking.id}
                  </div>
                )}

                {selectedConversation.status !== 'resolved' ? (
                  <button
                    onClick={() => handleUpdateStatus(selectedConversation.id, 'resolved')}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-850 rounded-xl text-xs font-bold transition"
                  >
                    <Archive className="w-4 h-4" />
                    Tandai Selesai
                  </button>
                ) : (
                  <button
                    onClick={() => handleUpdateStatus(selectedConversation.id, 'open')}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition"
                  >
                    <Inbox className="w-4 h-4" />
                    Buka Kembali
                  </button>
                )}
              </div>
            </div>

            {/* Bubble Messages Container */}
            <div
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-slate-50"
            >
              {isLoadingMsgs ? (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                  <RefreshCw className="w-5 h-5 animate-spin mr-2 text-blue-500" />
                  Memuat riwayat chat...
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm gap-2">
                  <MessageSquare className="w-8 h-8 text-slate-300" />
                  Belum ada pesan terkirim
                </div>
              ) : (
                messages.map((msg) => {
                  const isCustomer = msg.direction === 'incoming';
                  return (
                    <div
                      key={msg.id}
                      className={`flex w-full ${isCustomer ? 'justify-start' : 'justify-end'}`}
                    >
                      <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm relative ${
                        isCustomer
                          ? 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
                          : 'bg-blue-600 text-white rounded-tr-none'
                      }`}>

                        {/* Message Text */}
                        <p className="text-sm whitespace-pre-wrap leading-relaxed break-words">
                          {msg.text}
                        </p>

                        {/* Timestamp & Status Icon */}
                        <div className={`flex items-center justify-end gap-1 mt-1 text-[9px] ${
                          isCustomer ? 'text-slate-400' : 'text-blue-200'
                        }`}>
                          <span>{formatMsgTime(msg.wati_timestamp)}</span>
                          {!isCustomer && (
                            msg.status === 'read' ? (
                              <CheckCheck className="w-3 h-3 text-blue-300" />
                            ) : msg.status === 'failed' ? (
                              <ShieldAlert className="w-3 h-3 text-red-300" />
                            ) : (
                              <Check className="w-3 h-3 text-blue-200" />
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input Box */}
            <div className="p-4 bg-white border-t border-slate-100">
              <form onSubmit={handleSendMessage} className="flex gap-3">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Tulis balasan pesan WhatsApp..."
                  rows={2}
                  className="flex-1 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none bg-slate-50 focus:bg-white transition"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                />
                <button
                  type="submit"
                  disabled={isSending || !replyText.trim()}
                  className="px-5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl flex items-center justify-center transition active:scale-95 shadow-md shadow-blue-500/20 shrink-0"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
            <Inbox className="w-12 h-12 text-slate-350 mb-3" />
            <p className="text-base font-semibold text-slate-600">Pilih Percakapan</p>
            <p className="text-sm text-slate-450 mt-1">Pilih salah satu nomor di panel kiri untuk mulai membalas pesan.</p>
          </div>
        )}
      </div>

      {/* ── Right Pane: Customer 360 (Only visible when conversation is active) ── */}
      {selectedConversation && (
        <div className="w-1/3 min-w-[320px] max-w-[400px] border-l border-slate-100 flex flex-col bg-white overflow-y-auto custom-scrollbar p-6 space-y-6">

          {/* Customer Profile Section */}
          <div className="text-center pb-6 border-b border-slate-100">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold mx-auto mb-3 shadow-inner">
              <User className="w-8 h-8" />
            </div>
            <h4 className="font-bold text-slate-800 text-lg">
              {selectedConversation.display_name || 'Customer'}
            </h4>
            <p className="text-sm text-slate-500 mt-0.5">{selectedConversation.phone_number}</p>
          </div>

          {/* Finance & Transaction Summary */}
          <div>
            <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Ringkasan Transaksi</h5>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <span className="text-[10px] font-semibold text-slate-500 block">Total Booking</span>
                <span className="text-lg font-bold text-slate-800">{customerBookings.length}x</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <span className="text-[10px] font-semibold text-slate-500 block">Dana Masuk</span>
                <span className="text-sm font-bold text-emerald-600 block mt-1">
                  Rp {totalPaid.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </div>

          {/* Linked Booking details */}
          <div>
            <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Booking Ditautkan</h5>
            {matchedLinkedBooking ? (
              (() => {
                const { total, paid, sisa, statusLabel, statusClass } = getBookingPaymentInfo(matchedLinkedBooking);
                return (
                  <div className="bg-blue-50/40 border border-blue-150 rounded-2xl p-5 space-y-4 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-100/30 rounded-full -mr-8 -mt-8 pointer-events-none" />

                    <div className="flex justify-between items-start relative z-10">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-blue-800 bg-blue-100 px-2.5 py-0.5 rounded-lg border border-blue-200">
                            #{matchedLinkedBooking.id}
                          </span>
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-lg border uppercase tracking-wider ${statusClass}`}>
                            {statusLabel}
                          </span>
                        </div>
                        <span className="block text-slate-800 font-extrabold text-base mt-2">
                          {matchedLinkedBooking.customer.category}
                        </span>
                      </div>

                      <button
                        onClick={() => handleLinkBooking(null)}
                        className="text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl p-1.5 transition duration-200 border border-transparent hover:border-red-100"
                        title="Lepas tautan booking"
                      >
                        <Unlink className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs text-slate-650 border-t border-slate-100 pt-3">
                      <div className="flex items-center gap-2 font-medium">
                        <Calendar className="w-4 h-4 text-blue-500 shrink-0" />
                        {matchedLinkedBooking.booking.date.split('T')[0]}
                      </div>
                      <div className="flex items-center gap-2 font-medium">
                        <Clock className="w-4 h-4 text-blue-500 shrink-0" />
                        {matchedLinkedBooking.booking.date.split('T')[1]?.substring(0, 5) || ''}
                      </div>
                    </div>

                    {/* Financial Summary Breakdown */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-blue-50/50 text-xs space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Total Harga:</span>
                        <span className="font-bold text-slate-800">Rp {total.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Telah Dibayar:</span>
                        <span className="font-bold text-emerald-600">Rp {paid.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between items-center border-t border-slate-200/40 pt-2 font-bold">
                        <span className="text-slate-600">Sisa Tagihan:</span>
                        <span className={sisa > 0 ? 'text-amber-600' : 'text-slate-800'}>
                          Rp {sisa.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => copyPaymentReminder(matchedLinkedBooking)}
                        className="flex-1 py-2 px-3 bg-white hover:bg-slate-55 text-slate-700 hover:text-slate-900 border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                        title="Salin pesan pengingat pembayaran ke WhatsApp"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        Salin Pengingat
                      </button>
                      <button
                        onClick={() => window.open(`/admin/invoices/${matchedLinkedBooking.id}`, '_blank')}
                        className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border border-transparent hover:border-slate-200 active:scale-95"
                        title="Buka invoice di tab baru"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => setIsLinkModalOpen(true)}
                      className="w-full py-1.5 text-center text-blue-600 hover:text-blue-800 hover:underline text-[11px] font-bold transition"
                    >
                      Ubah Tautan Booking
                    </button>
                  </div>
                );
              })()
            ) : (
              <div className="space-y-4">
                <div className="text-xs text-slate-400 border border-dashed border-slate-250 rounded-2xl p-6 text-center bg-slate-50/30">
                  <p>Belum ada booking yang ditautkan ke chat ini.</p>
                  <button
                    onClick={() => setIsLinkModalOpen(true)}
                    className="mt-3 w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-md shadow-blue-500/10 active:scale-95"
                  >
                    <Link2 className="w-4 h-4" />
                    Hubungkan ke Booking
                  </button>
                </div>

                {/* Suggested Booking (Level 2) */}
                {(() => {
                  const suggested = customerBookings.find(b => b.status === 'Active') || customerBookings[0];
                  if (!suggested) return null;
                  const { sisa, statusLabel, statusClass } = getBookingPaymentInfo(suggested);
                  return (
                    <div className="border border-amber-250 bg-amber-50/20 rounded-2xl p-4 space-y-3 animate-in fade-in duration-300">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-800">
                        <CheckCheck className="w-3.5 h-3.5 text-amber-600 animate-pulse animate-duration-1000" />
                        Saran Booking (No WA Cocok)
                      </div>
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              #{suggested.id}
                            </span>
                            <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border uppercase tracking-wider ${statusClass}`}>
                              {statusLabel}
                            </span>
                          </div>
                          <span className="block text-slate-800 font-extrabold text-sm mt-1.5">
                            {suggested.customer.category}
                          </span>
                          <span className="block text-[10px] text-slate-500">
                            {suggested.booking.date.split('T')[0]} · Rp {sisa.toLocaleString('id-ID')} sisa
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleLinkBooking(suggested.id)}
                        className="w-full py-2 bg-amber-500 hover:bg-amber-600 active:bg-amber-750 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 shadow-sm active:scale-95"
                      >
                        <Link2 className="w-3.5 h-3.5" />
                        Tautkan Booking Ini
                      </button>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Bookings History list */}
          <div>
            <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Histori Booking Kontak</h5>
            {customerBookings.length > 0 ? (
              <div className="space-y-2">
                {customerBookings.map((b) => {
                  const { sisa } = getBookingPaymentInfo(b);
                  return (
                    <div
                      key={b.id}
                      onClick={async () => {
                        if (selectedConversation.booking_id === b.id) return;
                        if (selectedConversation.booking_id) {
                          setBookingToConfirmLink(b);
                        } else {
                          await handleLinkBooking(b.id);
                        }
                      }}
                      className={`p-3 border rounded-xl cursor-pointer transition text-xs flex justify-between items-center ${
                        selectedConversation.booking_id === b.id
                          ? 'border-blue-500 bg-blue-50/10 cursor-default'
                          : 'border-slate-100 hover:border-blue-300 hover:bg-blue-50/5'
                      }`}
                    >
                      <div>
                        <span className="font-semibold text-slate-700 block">{b.customer.category}</span>
                        <span className="text-slate-400 text-[10px]">{b.booking.date.split('T')[0]} - #{b.id}</span>
                        {sisa > 0 && (
                          <span className="block text-[9px] text-amber-600 font-medium">Sisa: Rp {sisa.toLocaleString('id-ID')}</span>
                        )}
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        b.status === 'Completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : b.status === 'Cancelled'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {b.status === 'Completed' ? 'Selesai' : b.status === 'Cancelled' ? 'Batal' : 'Aktif'}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center">Tidak ada histori booking.</p>
            )}
          </div>

        </div>
      )}

      {/* ── LINK BOOKING MODAL DIALOG ── */}
      {isLinkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 flex flex-col max-h-[85vh] animate-in scale-in duration-200">

            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Link2 className="w-5 h-5 text-blue-600" />
                Cari & Tautkan Booking
              </h3>
              <button
                onClick={() => {
                  setIsLinkModalOpen(false);
                  setBookingSearchQuery('');
                }}
                className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input Box */}
            <div className="p-4 border-b border-slate-50 bg-slate-50/50">
              <div className="relative">
                <Search className="absolute left-3.5 top-3 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Cari Booking ID, nama customer, atau nomor WhatsApp..."
                  value={bookingSearchQuery}
                  onChange={(e) => setBookingSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white shadow-sm transition"
                  autoFocus
                />
              </div>
            </div>

            {/* Results Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar min-h-[250px]">
              {bookingSearchQuery.trim() === '' ? (
                <div className="text-center py-10 text-slate-400 text-sm">
                  <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  Ketik nama customer atau ID Booking untuk mulai mencari
                </div>
              ) : searchResults.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-sm">
                  Tidak ditemukan booking yang cocok untuk &quot;{bookingSearchQuery}&quot;
                </div>
              ) : (
                searchResults.map(b => {
                  const { total, sisa, statusLabel, statusClass } = getBookingPaymentInfo(b);
                  return (
                    <div
                      key={b.id}
                      className="border border-slate-100 rounded-2xl p-4 hover:border-blue-300 hover:bg-blue-50/5 transition flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-in fade-in duration-200"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                            #{b.id}
                          </span>
                          <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border uppercase tracking-wider ${statusClass}`}>
                            {statusLabel}
                          </span>
                        </div>
                        <span className="block font-bold text-slate-800 text-sm">{b.customer.name}</span>
                        <span className="block text-slate-500 text-xs">{b.customer.category} · {b.booking.date.split('T')[0]}</span>
                        <span className="block text-[11px] text-slate-650 font-medium">
                          Total: Rp {total.toLocaleString('id-ID')} · Sisa: <span className={sisa > 0 ? 'text-amber-600 font-semibold' : 'text-slate-650'}>Rp {sisa.toLocaleString('id-ID')}</span>
                        </span>
                      </div>

                      <button
                        onClick={async () => {
                          if (!selectedConversation) return;
                          if (selectedConversation.booking_id === b.id) {
                            showToast('Booking ini sudah ditautkan.', 'error');
                            return;
                          }
                          if (selectedConversation.booking_id) {
                            setBookingToConfirmLink(b);
                          } else {
                            await handleLinkBooking(b.id);
                            setIsLinkModalOpen(false);
                            setBookingSearchQuery('');
                          }
                        }}
                        className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95 shrink-0 self-end md:self-center"
                      >
                        <Link2 className="w-3.5 h-3.5" />
                        Tautkan
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── OVERWRITE CONFIRMATION DIALOG ── */}
      {bookingToConfirmLink && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border border-slate-100 animate-in scale-in duration-150 space-y-4">
            <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-500 animate-bounce" />
              Ganti Tautan Booking?
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Percakapan ini sudah tertaut dengan booking <strong className="text-slate-800">#{selectedConversation?.booking_id}</strong>.
              Apakah Anda yakin ingin menggantinya dengan booking <strong className="text-slate-800">#{bookingToConfirmLink.id}</strong> ({bookingToConfirmLink.customer.name})?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setBookingToConfirmLink(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
              >
                Batal
              </button>
              <button
                onClick={async () => {
                  const targetId = bookingToConfirmLink.id;
                  setBookingToConfirmLink(null);
                  await handleLinkBooking(targetId);
                  setIsLinkModalOpen(false);
                  setBookingSearchQuery('');
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-blue-500/10 active:scale-95"
              >
                Ya, Ganti
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── NON-BLOCKING TOAST NOTIFICATION SYSTEM ── */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[70] px-4 py-3 rounded-2xl shadow-xl border text-sm font-semibold flex items-center gap-2.5 animate-in slide-in-from-bottom-5 duration-300 ${
          toast.type === 'success'
            ? 'bg-emerald-50 border-emerald-250 text-emerald-800'
            : 'bg-rose-50 border-rose-250 text-rose-800'
        }`}>
          {toast.type === 'success' ? (
            <CheckCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

    </div>
  );
}
export default WhatsAppWorkspace;
