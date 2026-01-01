'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { LeadsTable } from '@/components/admin/tables/LeadsTable';
import { LeadModal } from '@/components/admin/modals/LeadModal';
import { CreateBookingModal } from '@/components/admin/Bookings/modals/CreateBookingModal';
import AdminSidebar from '@/components/AdminSidebar';
import { useServices } from '@/components/admin/hooks/useServices';
import { usePhotographers } from '@/components/admin/hooks/usePhotographers';
import { 
  Lead, 
  LeadFormData, 
  LeadStatus, 
  LeadSource, 
  Service, 
  Photographer, 
  Addon 
} from '@/lib/types';

export default function LeadsPage() {
  const { data: session } = useSession();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filterStatus, setFilterStatus] = useState<LeadStatus | 'All'>('All');
  const [filterSource, setFilterSource] = useState<LeadSource | 'All'>('All');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<LeadFormData>({
    name: '',
    whatsapp: '',
    email: '',
    source: 'Meta Ads',
    status: 'New',
    notes: '',
    assigned_to: '',
    next_follow_up: ''
  });

  // For conversion to booking
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingFormData, setBookingFormData] = useState({
    customer_name: '',
    customer_whatsapp: '',
    service_id: '',
    booking_date: '',
    booking_time: '',
    booking_notes: '',
    location_link: '',
    photographer_id: '',
    dp_amount: 0,
    payment_note: 'DP Awal'
  });
  const [selectedBookingAddons, setSelectedBookingAddons] = useState<Map<string, number>>(new Map());
  const [availableBookingAddons, setAvailableBookingAddons] = useState<Addon[]>([]);
  const [convertingLead, setConvertingLead] = useState<Lead | null>(null);

  const servicesHook = useServices();
  const photographersHook = usePhotographers();

  // Fetch leads on mount
  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const res = await fetch('/api/leads');
      if (res.ok) {
        const data = await res.json();
        setLeads(data);
      }
    } catch (error) {
      console.error('Failed to fetch leads:', error);
      alert('Failed to load leads');
    }
  };

  // Filter leads
  const filteredLeads = leads.filter(lead => {
    if (filterStatus !== 'All' && lead.status !== filterStatus) return false;
    if (filterSource !== 'All' && lead.source !== filterSource) return false;
    return true;
  });

  // Open modal for create or edit
  const handleOpenModal = (lead?: Lead) => {
    if (lead) {
      setSelectedLead(lead);
      setFormData({
        name: lead.name,
        whatsapp: lead.whatsapp,
        email: lead.email || '',
        source: lead.source,
        status: lead.status,
        notes: lead.notes || '',
        assigned_to: lead.assigned_to || '',
        next_follow_up: lead.next_follow_up || ''
      });
    } else {
      setSelectedLead(null);
      setFormData({
        name: '',
        whatsapp: '',
        email: '',
        source: 'Meta Ads',
        status: 'New',
        notes: '',
        assigned_to: '',
        next_follow_up: ''
      });
    }
    setIsModalOpen(true);
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const method = selectedLead ? 'PUT' : 'POST';
      const url = selectedLead ? `/api/leads/${selectedLead.id}` : '/api/leads';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to save lead');
      }

      setIsModalOpen(false);
      fetchLeads();
      alert(selectedLead ? 'Lead updated successfully!' : 'Lead created successfully!');
    } catch (error) {
      console.error('Error saving lead:', error);
      alert(error instanceof Error ? error.message : 'Failed to save lead');
    }
  };

  // Delete lead
  const handleDeleteLead = async (id: string) => {
    try {
      const res = await fetch(`/api/leads/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete lead');
      fetchLeads();
      alert('Lead deleted successfully!');
    } catch (error) {
      console.error('Error deleting lead:', error);
      alert('Failed to delete lead');
    }
  };

  // WhatsApp action
  const handleWhatsApp = (whatsapp: string) => {
    window.open(`https://wa.me/${whatsapp}`, '_blank');
  };

  // Convert to booking
  const handleConvertToBooking = async (lead: Lead) => {
    setConvertingLead(lead);
    
    // Pre-fill booking form with lead data
    setBookingFormData({
      customer_name: lead.name,
      customer_whatsapp: lead.whatsapp,
      service_id: '',
      booking_date: '',
      booking_time: '',
      booking_notes: `Converted from lead: ${lead.id}\n${lead.notes || ''}`,
      location_link: '',
      photographer_id: '',
      dp_amount: 0,
      payment_note: 'DP Awal'
    });
    
    setSelectedBookingAddons(new Map());
    setAvailableBookingAddons([]);
    setIsBookingModalOpen(true);
  };

  // Handle service change for booking
  const handleServiceChange = async (serviceId: string) => {
    setBookingFormData(prev => ({ ...prev, service_id: serviceId }));
    setSelectedBookingAddons(new Map());

    if (!serviceId) {
      setAvailableBookingAddons([]);
      return;
    }

    const selectedService = servicesHook.services.find(s => s.id === serviceId);
    if (selectedService) {
      try {
        const res = await fetch(`/api/addons?active=true&category=${encodeURIComponent(selectedService.name)}`);
        if (res.ok) {
          const data = await res.json();
          setAvailableBookingAddons(data);
        }
      } catch (err) {
        console.error('Failed to fetch add-ons', err);
      }
    }
  };

  // Toggle booking addon
  const toggleBookingAddon = (addonId: string) => {
    setSelectedBookingAddons(prev => {
      const newMap = new Map(prev);
      if (newMap.has(addonId)) {
        newMap.delete(addonId);
      } else {
        newMap.set(addonId, 1);
      }
      return newMap;
    });
  };

  // Update booking addon quantity
  const updateBookingAddonQuantity = (addonId: string, quantity: number) => {
    if (quantity < 1) {
      setSelectedBookingAddons(prev => {
        const newMap = new Map(prev);
        newMap.delete(addonId);
        return newMap;
      });
    } else {
      setSelectedBookingAddons(prev => new Map(prev).set(addonId, quantity));
    }
  };

  // Calculate booking total
  const calculateBookingTotal = () => {
    const service = servicesHook.services.find(s => s.id === bookingFormData.service_id);
    if (!service) return 0;

    const basePrice = service.basePrice - service.discountValue;
    const addonsTotal = Array.from(selectedBookingAddons.entries()).reduce((total, [addonId, quantity]) => {
      const addon = availableBookingAddons.find(a => a.id === addonId);
      return total + (addon ? addon.price * quantity : 0);
    }, 0);

    return basePrice + addonsTotal;
  };

  // Handle create booking
  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!bookingFormData.service_id) {
      alert('Please select a service');
      return;
    }

    try {
      const addonsData = Array.from(selectedBookingAddons.entries()).map(([addonId, quantity]) => {
        const addon = availableBookingAddons.find(a => a.id === addonId);
        return {
          addon_id: addonId,
          addon_name: addon?.name || '',
          quantity,
          price_at_booking: addon?.price || 0
        };
      });

      const selectedService = servicesHook.services.find(s => s.id === bookingFormData.service_id);

      const payload = {
        customer: {
          name: bookingFormData.customer_name,
          whatsapp: bookingFormData.customer_whatsapp,
          category: selectedService?.name || '',
          serviceId: bookingFormData.service_id
        },
        booking: {
          date: `${bookingFormData.booking_date}T${bookingFormData.booking_time}`,
          notes: bookingFormData.booking_notes,
          location_link: bookingFormData.location_link
        },
        finance: {
          total_price: calculateBookingTotal(),
          payments: bookingFormData.dp_amount > 0 ? [{
            date: new Date().toISOString().split('T')[0] ?? '',
            amount: bookingFormData.dp_amount,
            note: bookingFormData.payment_note
          }] : []
        },
        photographer_id: bookingFormData.photographer_id || undefined,
        addons: addonsData.length > 0 ? addonsData : undefined
      };

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create booking');
      }

      const newBooking = await res.json();

      // Update lead to mark as converted
      if (convertingLead) {
        await fetch(`/api/leads/${convertingLead.id}/convert`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ booking_id: newBooking.id })
        });
      }

      setIsBookingModalOpen(false);
      setConvertingLead(null);
      fetchLeads();
      alert('Booking created successfully! Lead has been marked as Converted.');
    } catch (error) {
      console.error('Error creating booking:', error);
      alert(`Failed to create booking: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  if (!session) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar viewMode="leads" setViewMode={() => {}} />
      
      <div className="flex-1 ml-0 md:ml-64 p-6 overflow-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Leads Management</h1>
          <p className="text-gray-600">Manage and track your leads through the sales pipeline</p>
        </div>

        <LeadsTable
          leads={filteredLeads}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          filterSource={filterSource}
          setFilterSource={setFilterSource}
          onOpenModal={handleOpenModal}
          onDeleteLead={handleDeleteLead}
          onConvertToBooking={handleConvertToBooking}
          onWhatsApp={handleWhatsApp}
        />

        {/* Lead Modal */}
        <LeadModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleSubmit}
          formData={formData}
          setFormData={setFormData}
          editingLead={selectedLead}
        />

        {/* Create Booking Modal (for conversion) */}
        <CreateBookingModal
          isOpen={isBookingModalOpen}
          onClose={() => {
            setIsBookingModalOpen(false);
            setConvertingLead(null);
          }}
          onSubmit={handleCreateBooking}
          formData={bookingFormData}
          setFormData={setBookingFormData}
          services={servicesHook.services}
          photographers={photographersHook.photographers}
          availableAddons={availableBookingAddons}
          selectedAddons={selectedBookingAddons}
          onServiceChange={handleServiceChange}
          onToggleAddon={toggleBookingAddon}
          onUpdateAddonQuantity={updateBookingAddonQuantity}
          calculateTotal={calculateBookingTotal}
        />
      </div>
    </div>
  );
}