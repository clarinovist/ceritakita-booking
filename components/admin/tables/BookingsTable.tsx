import { Booking, FilterStatus, DateRange } from '@/lib/types';
import { useExport } from '../hooks/useExport';
import { formatDate, formatTime } from '@/utils/dateFormatter';

interface BookingsTableProps {
    bookings: Booking[];
    filterStatus: FilterStatus;
    setFilterStatus: (status: FilterStatus) => void;
    setSelectedBooking: (booking: Booking) => void;
    handleUpdateStatus: (bookingId: string, status: Booking['status']) => void;
    handleDeleteBooking: (bookingId: string) => void;
    handleOpenCreateBookingModal: () => void;
    calculateFinance: (b: Booking) => { total: number; paid: number; balance: number; isPaidOff: boolean };
    exportHook: ReturnType<typeof useExport>;
    dateRange: DateRange;
}

export const BookingsTable = ({
    bookings,
    filterStatus,
    setFilterStatus,
    setSelectedBooking,
    handleUpdateStatus,
    handleDeleteBooking,
    handleOpenCreateBookingModal,
    calculateFinance,
    exportHook,
    dateRange
}: BookingsTableProps) => {

    // Helper function to handle "Mark as Completed"
    const handleMarkCompleted = (bookingId: string) => {
        if (confirm("Mark this booking as Completed? This action cannot be undone.")) {
            handleUpdateStatus(bookingId, 'Completed');
        }
    };

    // Helper function to navigate to invoice page
    const handleViewInvoice = (bookingId: string) => {
        window.open(`/admin/invoices/${bookingId}`, '_blank');
    };

    return (
        <div className="bg-white rounded-xl shadow overflow-hidden animate-in fade-in min-h-[500px]">
            <div className="p-4 border-b flex flex-col md:flex-row gap-4 items-center bg-gray-50 justify-between">
                <div className="flex gap-4 items-center flex-wrap">
                    <h3 className="font-bold text-gray-700 flex items-center gap-2">
                        <span>📋</span> All Bookings
                    </h3>
                    <div className="flex bg-white border rounded-lg overflow-hidden text-sm">
                        {(['All', 'Active', 'Canceled', 'Completed'] as const).map(s => (
                            <button
                                key={s}
                                onClick={() => setFilterStatus(s)}
                                className={`px-3 py-1.5 ${filterStatus === s ? 'bg-blue-600 text-white' : 'hover:bg-gray-50 text-gray-600'}`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex gap-3 items-center flex-wrap justify-end">

                    <button
                        onClick={() => exportHook.handleExportBookings(filterStatus, dateRange)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 rounded-lg transition-colors border border-gray-300"
                        title="Export filtered bookings to CSV"
                    >
                        <span>📥</span>
                        <span className="hidden sm:inline">Export</span>
                    </button>
                    <button
                        onClick={handleOpenCreateBookingModal}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
                    >
                        <span>➕</span> <span className="hidden sm:inline">Create</span>
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500">
                        <tr>
                            <th className="px-4 py-3">Date</th>
                            <th className="px-4 py-3">Time</th>
                            <th className="px-4 py-3">Customer</th>
                            <th className="px-4 py-3">Phone</th>
                            <th className="px-4 py-3">Category</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3 text-right">Balance</th>
                            <th className="px-4 py-3">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {bookings.length === 0 && (
                            <tr><td colSpan={8} className="text-center p-8 text-gray-400">No bookings found within this date range.</td></tr>
                        )}
                        {bookings.map(b => {
                            const { balance, isPaidOff } = calculateFinance(b);
                            return (
                                <tr key={b.id} className={`hover:bg-gray-50 ${b.status === 'Rescheduled' ? 'bg-orange-50/30' : ''}`}>
                                    <td className="px-4 py-3">{formatDate(b.booking.date)}</td>
                                    <td className="px-4 py-3 text-gray-600">{formatTime(b.booking.date)}</td>
                                    <td className="px-4 py-3 font-medium">
                                        <div className="flex items-center gap-2">
                                            {b.customer.name}
                                            {b.status === 'Rescheduled' && (
                                                <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border border-orange-200">
                                                    Reschedule
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">{b.customer.whatsapp}</td>
                                    <td className="px-4 py-3">{b.customer.category}</td>
                                    <td className="px-4 py-3">
                                        {/* Disable dropdown for Completed bookings (immutable final state) */}
                                        {b.status === 'Completed' ? (
                                            <span className="text-blue-600 font-bold text-xs bg-blue-50 px-2 py-1 rounded border border-blue-200">
                                                Completed ✓
                                            </span>
                                        ) : (
                                            <select
                                                value={b.status}
                                                onChange={(e) => handleUpdateStatus(b.id, e.target.value as Booking['status'])}
                                                className={`border-none bg-transparent text-xs font-bold focus:ring-0 cursor-pointer
                                          ${b.status === 'Cancelled' ? 'text-red-600' :
                                                        b.status === 'Rescheduled' ? 'text-orange-600' :
                                                            'text-green-600'}`}
                                            >
                                                <option value="Active">Active</option>
                                                <option value="Rescheduled">Rescheduled</option>
                                                <option value="Canceled">Canceled</option>
                                                <option value="Completed">Completed</option>
                                            </select>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        {isPaidOff ? (
                                            <span className="text-green-600 font-bold text-xs bg-green-100 px-2 py-1 rounded">LUNAS</span>
                                        ) : (
                                            <span className="text-red-500 font-medium">Rp {balance.toLocaleString()}</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex gap-2 flex-wrap">
                                            <button onClick={() => setSelectedBooking(b)} className="text-blue-600 hover:text-blue-800 font-medium text-xs border border-blue-200 px-3 py-1 rounded hover:bg-blue-50">
                                                Details
                                            </button>

                                            {/* Mark as Completed button - visible when status is Active/Rescheduled and paid */}
                                            {(b.status === 'Active' || b.status === 'Rescheduled') && isPaidOff && (
                                                <button
                                                    onClick={() => handleMarkCompleted(b.id)}
                                                    className="text-green-600 hover:text-green-800 font-medium text-xs border border-green-200 px-3 py-1 rounded hover:bg-green-50"
                                                >
                                                    Mark Completed
                                                </button>
                                            )}

                                            {/* View Invoice button - visible when paid or completed */}
                                            {(isPaidOff || b.status === 'Completed') && (
                                                <button
                                                    onClick={() => handleViewInvoice(b.id)}
                                                    className="text-purple-600 hover:text-purple-800 font-medium text-xs border border-purple-200 px-3 py-1 rounded hover:bg-purple-50"
                                                >
                                                    Invoice
                                                </button>
                                            )}

                                            {/* Hide delete button for Completed bookings (immutable) */}
                                            {b.status !== 'Completed' && (
                                                <button onClick={() => handleDeleteBooking(b.id)} className="text-red-600 hover:text-red-800 font-medium text-xs border border-red-200 px-3 py-1 rounded hover:bg-red-50">
                                                    Delete
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};