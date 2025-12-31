'use client';

export const useExport = () => {
    const handleExportBookings = async (filterStatus: string, dateRange: { start: string; end: string }) => {
        try {
            const params = new URLSearchParams({
                status: filterStatus,
                startDate: dateRange.start,
                endDate: dateRange.end
            });

            const response = await fetch(`/api/export/bookings?${params}`);
            if (!response.ok) throw new Error('Export failed');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `ceritakita-bookings-${new Date().toISOString().split('T')[0]}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Export error:', error);
            alert('Failed to export bookings');
        }
    };

    const handleExportFinancial = async (dateRange: { start: string; end: string }) => {
        try {
            const params = new URLSearchParams({
                startDate: dateRange.start,
                endDate: dateRange.end
            });

            const response = await fetch(`/api/export/financial?${params}`);
            if (!response.ok) throw new Error('Export failed');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `ceritakita-financial-report-${new Date().toISOString().split('T')[0]}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Export error:', error);
            alert('Failed to export financial report');
        }
    };

    return {
        handleExportBookings,
        handleExportFinancial
    };
};
