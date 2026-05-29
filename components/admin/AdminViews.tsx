'use client';

import React, { useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

// Components
import DashboardMetrics from '../DashboardMetrics';
import CouponManagement from '../CouponManagement';
import SettingsManagement from './SettingsManagement';
import CatalogManagement from './CatalogManagement';
import HomepageCMS from './HomepageCMS';
import AdsPerformance from './AdsPerformance';
import LeadPerformance from './analytics/LeadPerformance';
import { FinanceModule } from './FinanceModule';
import { FreelancerModule } from './FreelancerModule';

// Tables
import { BookingsTable } from './tables/BookingsTable';
import { LeadsTable } from './tables/LeadsTable';
import { LeadsKanban } from './leads/LeadsKanban';

// Types
import { type ViewMode } from '@/lib/types';

interface AdminViewsProps {
    viewMode: ViewMode;
    leadsViewMode: 'table' | 'board';
    bookingsHook: any;
    servicesHook: any;
    photographersHook: any;
    addonsHook: any;
    exportHook: any;
    leadsHook: any;
    adminAnalytics: any;
    handleOpenCreateBookingModal: () => void;
}

export function AdminViews({
    viewMode,
    leadsViewMode,
    bookingsHook,
    servicesHook,
    photographersHook,
    addonsHook,
    exportHook,
    leadsHook,
    adminAnalytics,
    handleOpenCreateBookingModal,
}: AdminViewsProps) {
    const events = useMemo(() =>
        bookingsHook.bookings
            .filter((b: any) => b.status === 'Active' || b.status === 'Rescheduled')
            .map((b: any) => ({
                id: b.id,
                title: `${b.customer.name} (${b.customer.category})`,
                start: b.booking.date,
                backgroundColor: b.customer.category.includes('Outdoor') ? '#10B981' : '#3B82F6',
                extendedProps: { booking: b }
            })),
        [bookingsHook.bookings]
    );

    switch (viewMode) {
        case 'dashboard':
            return (
                <div className="space-y-8 animate-in fade-in">
                    <DashboardMetrics
                        sessionBookings={bookingsHook.bookingsByDateRange}
                        createdBookings={bookingsHook.bookingsByCreatedDate}
                        allBookings={bookingsHook.bookings}
                        dateRange={bookingsHook.dateRange}
                    />
                </div>
            );

        case 'ads':
            return (
                <div className="animate-in fade-in space-y-8">
                    <AdsPerformance
                        bookings={bookingsHook.bookingsByCreatedDate}
                        dateRange={bookingsHook.dateRange}
                    />
                    <LeadPerformance data={adminAnalytics.data as any} />
                </div>
            );

        case 'calendar':
            return (
                <div className="bg-white p-6 rounded-xl shadow-lg h-[700px] animate-in fade-in">
                    <FullCalendar
                        plugins={[dayGridPlugin, interactionPlugin]}
                        initialView="dayGridMonth"
                        events={events}
                        eventClick={(info) => {
                            bookingsHook.setSelectedBooking(info.event.extendedProps.booking);
                        }}
                        height="100%"
                    />
                </div>
            );

        case 'table':
            return (
                <BookingsTable
                    bookings={bookingsHook.filteredBookings}
                    filterStatus={bookingsHook.filterStatus}
                    setFilterStatus={bookingsHook.setFilterStatus}
                    setSelectedBooking={bookingsHook.setSelectedBooking}
                    handleUpdateStatus={bookingsHook.handleUpdateStatus}
                    handleDeleteBooking={bookingsHook.handleDeleteBooking}
                    handleOpenCreateBookingModal={handleOpenCreateBookingModal}
                    calculateFinance={bookingsHook.calculateFinance}
                    exportHook={exportHook}
                    dateRange={bookingsHook.dateRange}
                />
            );

        case 'catalog':
            return (
                <CatalogManagement
                    services={servicesHook.services}
                    handleOpenAddServiceModal={servicesHook.handleOpenAddModal}
                    handleOpenEditServiceModal={servicesHook.handleOpenEditModal}
                    handleDeleteService={servicesHook.handleDeleteService}
                    toggleServiceActive={servicesHook.toggleServiceActive}

                    addons={addonsHook.addons}
                    handleOpenAddAddonModal={addonsHook.handleOpenAddAddonModal}
                    handleOpenEditAddonModal={addonsHook.handleOpenEditAddonModal}
                    handleDeleteAddon={addonsHook.handleDeleteAddon}
                    toggleAddonActive={addonsHook.toggleAddonActive}

                    photographers={photographersHook.photographers}
                    handleOpenAddPhotographerModal={photographersHook.handleOpenAddPhotographerModal}
                    handleOpenEditPhotographerModal={photographersHook.handleOpenEditPhotographerModal}
                    handleDeletePhotographer={photographersHook.handleDeletePhotographer}
                    togglePhotographerActive={photographersHook.togglePhotographerActive}
                />
            );

        case 'coupons':
            return (
                <div className="animate-in fade-in">
                    <CouponManagement />
                </div>
            );

        case 'settings':
            return (
                <div className="animate-in fade-in">
                    <SettingsManagement />
                </div>
            );

        case 'finance':
            return (
                <div className="animate-in fade-in">
                    <FinanceModule />
                </div>
            );

        case 'homepage':
            return (
                <div className="animate-in fade-in">
                    <HomepageCMS />
                </div>
            );

        case 'freelancers':
            return (
                <div className="animate-in fade-in">
                    <FreelancerModule />
                </div>
            );

        case 'leads':
            return (
                <>
                    {leadsViewMode === 'table' ? (
                        <LeadsTable
                            leads={leadsHook.filteredLeads}
                            filterStatus={leadsHook.filterStatus}
                            setFilterStatus={leadsHook.setFilterStatus}
                            filterSource={leadsHook.filterSource}
                            setFilterSource={leadsHook.setFilterSource}
                            filterInterest={leadsHook.filterInterest}
                            setFilterInterest={leadsHook.setFilterInterest}
                            searchQuery={leadsHook.searchQuery}
                            setSearchQuery={leadsHook.setSearchQuery}
                            onOpenModal={leadsHook.handleOpenLeadModal}
                            onDeleteLead={leadsHook.handleDeleteLead}
                            onConvertToBooking={leadsHook.handleConvertToBooking}
                            onWhatsApp={leadsHook.handleWhatsApp}

                            selectedIds={leadsHook.selectedIds}
                            onToggleSelect={leadsHook.handleToggleSelect}
                            onSelectAll={leadsHook.handleSelectAll}
                            onDeselectAll={leadsHook.handleDeselectAll}
                            onBulkUpdateStatus={leadsHook.handleBulkUpdateStatus}
                            onBulkDelete={leadsHook.handleBulkDelete}
                            onBulkWhatsApp={leadsHook.handleBulkWhatsApp}
                            pagination={leadsHook.pagination}
                            onPageChange={leadsHook.setPage}
                            services={servicesHook.services}
                        />
                    ) : (
                        <LeadsKanban
                            leads={leadsHook.filteredLeads}
                            onUpdateStatus={leadsHook.handleUpdateLeadStatus}
                            onOpenModal={leadsHook.handleOpenLeadModal}
                            onWhatsApp={leadsHook.handleWhatsApp}
                        />
                    )}
                </>
            );

        default:
            return null;
    }
}
