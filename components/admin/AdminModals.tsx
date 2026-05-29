'use client';

import React from 'react';
import { Service } from '@/lib/types';
import { Photographer } from '@/lib/types';

import { ServiceModal } from './modals/ServiceModal';
import { BookingDetailModal } from './Bookings/modals/BookingDetailModal';
import { RescheduleModal } from './Bookings/modals/RescheduleModal';
import { CreateBookingModal } from './Bookings/modals/CreateBookingModal';
import { LeadModal } from './modals/LeadModal';
import { AddonModal } from './modals/AddonModal';
import { PhotographerModal } from './modals/PhotographerModal';

type BookingHook = any;
type LeadsHook = any;
type ServicesHook = any;
type PhotographersHook = any;
type AddonsHook = any;

interface AdminModalsProps {
    // Bookings
    bookingsHook: BookingHook;
    handleOpenRescheduleModal: (id: string, date: string) => void;
    handleReschedule: (e: React.FormEvent) => Promise<void>;
    handleCreateBooking: (e: React.FormEvent) => Promise<void>;
    handleServiceChange: (id: string) => void;
    toggleBookingAddon: (id: string) => void;
    updateBookingAddonQuantity: (id: string, qty: number) => void;
    calculateBookingTotal: () => number;

    // Leads
    leadsHook: LeadsHook;
    services: Service[];
    photographers: Photographer[];

    // Others
    servicesHook: ServicesHook;
    addonsHook: AddonsHook;
    photographersHook: PhotographersHook;
}

export function AdminModals({
    bookingsHook,
    handleOpenRescheduleModal,
    handleReschedule,
    handleCreateBooking,
    handleServiceChange,
    toggleBookingAddon,
    updateBookingAddonQuantity,
    calculateBookingTotal,
    leadsHook,
    services,
    photographers,
    servicesHook,
    addonsHook,
    photographersHook,
}: AdminModalsProps) {
    return (
        <>
            <LeadModal
                isOpen={leadsHook.isLeadModalOpen}
                onClose={() => leadsHook.setIsLeadModalOpen(false)}
                onSubmit={leadsHook.handleSaveLead}
                formData={leadsHook.leadFormData}
                setFormData={leadsHook.setLeadFormData}
                editingLead={leadsHook.selectedLead}
                services={services}
            />

            <CreateBookingModal
                isOpen={leadsHook.isBookingModalOpen}
                onClose={leadsHook.closeBookingModal}
                onSubmit={leadsHook.handleCreateBookingFromLead}
                formData={leadsHook.bookingFormData}
                setFormData={leadsHook.setBookingFormData}
                services={services}
                photographers={photographers}
                availableAddons={leadsHook.availableBookingAddons}
                selectedAddons={leadsHook.selectedBookingAddons}
                onServiceChange={leadsHook.handleServiceChangeForConversion}
                onToggleAddon={leadsHook.toggleBookingAddonForConversion}
                onUpdateAddonQuantity={leadsHook.updateBookingAddonQuantityForConversion}
                calculateTotal={leadsHook.calculateBookingTotalForConversion}
            />

            <ServiceModal
                isOpen={servicesHook.isServiceModalOpen}
                onClose={() => servicesHook.setIsServiceModalOpen(false)}
                onSubmit={servicesHook.handleSaveService}
                editingService={servicesHook.editingService}
                formData={servicesHook.serviceFormData}
                setFormData={servicesHook.setServiceFormData}
                loading={servicesHook.loading}
                error={servicesHook.error}
            />

            <BookingDetailModal
                booking={bookingsHook.selectedBooking}
                photographers={photographers}
                addons={addonsHook.addons}
                onClose={() => bookingsHook.setSelectedBooking(null)}
                onDelete={bookingsHook.handleDeleteBooking}
                onUpdateStatus={bookingsHook.handleUpdateStatus}
                onUpdate={bookingsHook.handleUpdate}
                onUpdateFinance={bookingsHook.handleUpdateFinance}
                onOpenRescheduleModal={handleOpenRescheduleModal}
                calculateFinance={bookingsHook.calculateFinance}
                getOrReconstructBreakdown={bookingsHook.getOrReconstructBreakdown}
            />

            <RescheduleModal
                isOpen={bookingsHook.isRescheduleModalOpen}
                onClose={() => bookingsHook.setIsRescheduleModalOpen(false)}
                onSubmit={handleReschedule}
                formData={bookingsHook.rescheduleFormData}
                setFormData={bookingsHook.setRescheduleFormData}
            />

            <CreateBookingModal
                isOpen={bookingsHook.isCreateBookingModalOpen}
                onClose={() => bookingsHook.setIsCreateBookingModalOpen(false)}
                onSubmit={handleCreateBooking}
                formData={bookingsHook.bookingFormData}
                setFormData={bookingsHook.setBookingFormData}
                services={services}
                photographers={photographers}
                availableAddons={bookingsHook.availableBookingAddons}
                selectedAddons={bookingsHook.selectedBookingAddons}
                onServiceChange={handleServiceChange}
                onToggleAddon={toggleBookingAddon}
                onUpdateAddonQuantity={updateBookingAddonQuantity}
                calculateTotal={calculateBookingTotal}
            />

            <AddonModal
                isOpen={addonsHook.isAddonModalOpen}
                onClose={() => addonsHook.setIsAddonModalOpen(false)}
                onSubmit={addonsHook.handleSaveAddon}
                editingAddon={addonsHook.editingAddon}
                formData={addonsHook.addonFormData}
                setFormData={addonsHook.setAddonFormData}
                services={services}
            />

            <PhotographerModal
                isOpen={photographersHook.isPhotographerModalOpen}
                onClose={() => photographersHook.setIsPhotographerModalOpen(false)}
                onSubmit={photographersHook.handleSavePhotographer}
                editingPhotographer={photographersHook.editingPhotographer}
                formData={photographersHook.photographerFormData}
                setFormData={photographersHook.setPhotographerFormData}
            />
        </>
    );
}
