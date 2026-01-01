import { Lead, LeadStatus, LeadSource } from '@/lib/types';
import { getLeadStatusColor, getLeadSourceIcon } from '@/lib/types/leads';
import { formatDate } from '@/utils/dateFormatter';

interface LeadsTableProps {
  leads: Lead[];
  filterStatus: LeadStatus | 'All';
  setFilterStatus: (status: LeadStatus | 'All') => void;
  filterSource: LeadSource | 'All';
  setFilterSource: (source: LeadSource | 'All') => void;
  onOpenModal: (lead?: Lead) => void;
  onDeleteLead: (id: string) => void;
  onConvertToBooking: (lead: Lead) => void;
  onWhatsApp: (whatsapp: string) => void;
}

export const LeadsTable = ({
  leads,
  filterStatus,
  setFilterStatus,
  filterSource,
  setFilterSource,
  onOpenModal,
  onDeleteLead,
  onConvertToBooking,
  onWhatsApp
}: LeadsTableProps) => {
  // Get unique sources for filter
  const sources = Array.from(new Set(leads.map(l => l.source)));

  return (
    <div className="bg-white rounded-xl shadow overflow-hidden animate-in fade-in min-h-[500px]">
      <div className="p-4 border-b flex gap-4 items-center bg-gray-50 justify-between">
        <div className="flex gap-4 items-center flex-wrap">
          <h3 className="font-bold text-gray-700 flex items-center gap-2">
            <span>🎯</span> All Leads
          </h3>
          
          {/* Status Filter */}
          <div className="flex bg-white border rounded-lg overflow-hidden text-sm">
            {(['All', 'New', 'Contacted', 'Follow Up', 'Won', 'Lost', 'Converted'] as const).map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 ${filterStatus === s ? 'bg-blue-600 text-white' : 'hover:bg-gray-50 text-gray-600'}`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Source Filter */}
          <div className="flex bg-white border rounded-lg overflow-hidden text-sm">
            {(['All', ...sources] as const).map(s => (
              <button
                key={s}
                onClick={() => setFilterSource(s as LeadSource | 'All')}
                className={`px-3 py-1.5 ${filterSource === s ? 'bg-purple-600 text-white' : 'hover:bg-gray-50 text-gray-600'}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => onOpenModal()}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
          >
            <span>➕</span> Add Lead
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">WhatsApp</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Next Follow-up</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {leads.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center p-8 text-gray-400">
                  No leads found.
                </td>
              </tr>
            )}
            {leads.map(lead => (
              <tr key={lead.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">
                  {lead.name}
                  {lead.notes && (
                    <span className="ml-2 text-xs text-gray-400" title={lead.notes}>
                      📝
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => onWhatsApp(lead.whatsapp)}
                    className="text-green-600 hover:text-green-800 font-medium flex items-center gap-1"
                    title="Open WhatsApp"
                  >
                    💬 {lead.whatsapp}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1">
                    <span>{getLeadSourceIcon(lead.source)}</span>
                    {lead.source}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${getLeadStatusColor(lead.status)}`}>
                    {lead.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {formatDate(lead.created_at)}
                </td>
                <td className="px-4 py-3">
                  {lead.next_follow_up ? (
                    <span className="text-orange-600 font-medium">
                      {formatDate(lead.next_follow_up)}
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2 flex-wrap justify-end">
                    {/* Convert to Booking - Only for Won leads without booking */}
                    {lead.status === 'Won' && !lead.booking_id && (
                      <button
                        onClick={() => onConvertToBooking(lead)}
                        className="text-purple-600 hover:text-purple-800 font-medium text-xs border border-purple-200 px-3 py-1 rounded hover:bg-purple-50"
                      >
                        Convert to Booking
                      </button>
                    )}

                    {/* Edit */}
                    <button
                      onClick={() => onOpenModal(lead)}
                      className="text-blue-600 hover:text-blue-800 font-medium text-xs border border-blue-200 px-3 py-1 rounded hover:bg-blue-50"
                    >
                      Edit
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this lead?')) {
                          onDeleteLead(lead.id);
                        }
                      }}
                      className="text-red-600 hover:text-red-800 font-medium text-xs border border-red-200 px-3 py-1 rounded hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};