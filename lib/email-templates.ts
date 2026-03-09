import { DailyReportData, WeeklyReportData, MonthlyReportData } from './report-generator';

const BRAND_COLOR = '#2563eb'; // Blue-600

const BASE_STYLES = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  line-height: 1.6;
  color: #333333;
  margin: 0;
  padding: 0;
  background-color: #f3f4f6;
`;

const CONTAINER_STYLES = `
  max-width: 600px;
  margin: 0 auto;
  background-color: #ffffff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  margin-top: 20px;
  margin-bottom: 20px;
`;

const HEADER_STYLES = `
  background-color: ${BRAND_COLOR};
  color: white;
  padding: 24px;
  text-align: center;
`;

const CONTENT_STYLES = `
  padding: 24px;
`;

const METRIC_GRID_STYLES = `
  display: flex;
  justify-content: space-between;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
`;

const METRIC_CARD_STYLES = `
  flex: 1;
  min-width: 150px;
  background-color: #f8fafc;
  padding: 16px;
  border-radius: 6px;
  text-align: center;
  border: 1px solid #e2e8f0;
`;

const METRIC_LABEL_STYLES = `
  font-size: 12px;
  text-transform: uppercase;
  color: #64748b;
  letter-spacing: 0.05em;
  margin-bottom: 8px;
`;

const METRIC_VALUE_STYLES = `
  font-size: 24px;
  font-weight: bold;
  color: #0f172a;
`;

const TABLE_STYLES = `
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 24px;
  font-size: 14px;
`;

const TH_STYLES = `
  text-align: left;
  padding: 12px;
  border-bottom: 2px solid #e2e8f0;
  color: #64748b;
  font-weight: 600;
`;

const TD_STYLES = `
  padding: 12px;
  border-bottom: 1px solid #e2e8f0;
`;

const SECTION_TITLE_STYLES = `
  font-size: 18px;
  font-weight: bold;
  color: #0f172a;
  margin-top: 32px;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e2e8f0;
`;

const BUTTON_STYLES = `
  display: inline-block;
  background-color: ${BRAND_COLOR};
  color: white;
  padding: 12px 24px;
  text-decoration: none;
  border-radius: 6px;
  font-weight: bold;
  text-align: center;
  margin-top: 24px;
`;

const FOOTER_STYLES = `
  text-align: center;
  padding: 24px;
  color: #64748b;
  font-size: 12px;
  background-color: #f8fafc;
  border-top: 1px solid #e2e8f0;
`;

// Helper formatters
const formatMoney = (amount: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);

/**
 * Generate Daily Digest HTML Email
 */
export function buildDailyDigestEmail(data: DailyReportData): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Daily Digest - ${data.date}</title>
    </head>
    <body style="${BASE_STYLES}">
        <div style="${CONTAINER_STYLES}">
            <div style="${HEADER_STYLES}">
                <h1 style="margin:0; font-size:24px;">CeritaKita Daily Digest</h1>
                <p style="margin-top:8px; margin-bottom:0; opacity:0.9;">${data.date}</p>
            </div>
            
            <div style="${CONTENT_STYLES}">
                <!-- Metrics -->
                <div style="${METRIC_GRID_STYLES}">
                    <div style="${METRIC_CARD_STYLES}">
                        <div style="${METRIC_LABEL_STYLES}">Revenue Today</div>
                        <div style="${METRIC_VALUE_STYLES}">${formatMoney(data.metrics.revenueToday)}</div>
                    </div>
                    <div style="${METRIC_CARD_STYLES}">
                        <div style="${METRIC_LABEL_STYLES}">New Bookings</div>
                        <div style="${METRIC_VALUE_STYLES}">${data.metrics.newBookingsCount}</div>
                    </div>
                    <div style="${METRIC_CARD_STYLES}">
                        <div style="${METRIC_LABEL_STYLES}">New Leads</div>
                        <div style="${METRIC_VALUE_STYLES}">${data.metrics.newLeadsCount}</div>
                    </div>
                </div>

                <!-- New Bookings -->
                ${data.newBookings.length > 0 ? `
                    <h2 style="${SECTION_TITLE_STYLES}">New Bookings (${data.newBookings.length})</h2>
                    <table style="${TABLE_STYLES}">
                        <thead>
                            <tr>
                                <th style="${TH_STYLES}">Customer</th>
                                <th style="${TH_STYLES}">Service</th>
                                <th style="${TH_STYLES}">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.newBookings.map(b => `
                                <tr>
                                    <td style="${TD_STYLES}">${b.customer.name}</td>
                                    <td style="${TD_STYLES}">${b.customer.category}</td>
                                    <td style="${TD_STYLES}">${formatMoney(b.finance.total_price)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                ` : `<p>No new bookings today.</p>`}

                <!-- Overdue Follow-ups -->
                ${data.overdueFollowUps.length > 0 ? `
                    <h2 style="${SECTION_TITLE_STYLES}">⚠️ Overdue Follow-ups (${data.overdueFollowUps.length})</h2>
                    <table style="${TABLE_STYLES}">
                        <thead>
                            <tr>
                                <th style="${TH_STYLES}">Lead Name</th>
                                <th style="${TH_STYLES}">Source</th>
                                <th style="${TH_STYLES}">Assigned To</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.overdueFollowUps.map(l => `
                                <tr>
                                    <td style="${TD_STYLES}">${l.name}</td>
                                    <td style="${TD_STYLES}">${l.source}</td>
                                    <td style="${TD_STYLES}">${l.assigned_to || 'Unassigned'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                ` : ''}

                <!-- Upcoming Bookings -->
                ${data.upcomingBookings.length > 0 ? `
                    <h2 style="${SECTION_TITLE_STYLES}">📅 Upcoming Sessions (Next 3 Days)</h2>
                    <table style="${TABLE_STYLES}">
                        <thead>
                            <tr>
                                <th style="${TH_STYLES}">Date</th>
                                <th style="${TH_STYLES}">Customer</th>
                                <th style="${TH_STYLES}">Service</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.upcomingBookings.slice(0, 5).map(b => `
                                <tr>
                                    <td style="${TD_STYLES}">${b.booking.date}</td>
                                    <td style="${TD_STYLES}">${b.customer.name}</td>
                                    <td style="${TD_STYLES}">${b.customer.category}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                ` : ''}

                <div style="text-align: center;">
                    <a href="${process.env.NEXT_PUBLIC_SITE_URL || ''}/admin" style="${BUTTON_STYLES}">View Full Dashboard</a>
                </div>
            </div>
            
            <div style="${FOOTER_STYLES}">
                This is an automated report from CeritaKita Booking System.<br>
                Generated safely via automated cron job.
            </div>
        </div>
    </body>
    </html>
    `;
}

/**
 * Generate Weekly Summary HTML Email
 */
export function buildWeeklySummaryEmail(data: WeeklyReportData): string {
    const growthColor = data.metrics.revenueGrowth >= 0 ? 'color: #059669;' : 'color: #dc2626;';
    const growthSign = data.metrics.revenueGrowth >= 0 ? '+' : '';

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Weekly Summary - ${data.startDate} to ${data.endDate}</title>
    </head>
    <body style="${BASE_STYLES}">
        <div style="${CONTAINER_STYLES}">
            <div style="${HEADER_STYLES}">
                <h1 style="margin:0; font-size:24px;">CeritaKita Weekly Summary</h1>
                <p style="margin-top:8px; margin-bottom:0; opacity:0.9;">${data.startDate} to ${data.endDate}</p>
            </div>
            
            <div style="${CONTENT_STYLES}">
                <!-- Metrics -->
                <div style="${METRIC_GRID_STYLES}">
                    <div style="${METRIC_CARD_STYLES}">
                        <div style="${METRIC_LABEL_STYLES}">Weekly Revenue</div>
                        <div style="${METRIC_VALUE_STYLES}">${formatMoney(data.metrics.revenue)}</div>
                        <div style="font-size: 12px; margin-top: 4px; ${growthColor}">
                            ${growthSign}${data.metrics.revenueGrowth.toFixed(1)}% vs last week
                        </div>
                    </div>
                    <div style="${METRIC_CARD_STYLES}">
                        <div style="${METRIC_LABEL_STYLES}">Total Bookings</div>
                        <div style="${METRIC_VALUE_STYLES}">${data.metrics.bookingsCount}</div>
                    </div>
                </div>
                
                <div style="${METRIC_GRID_STYLES}">
                    <div style="${METRIC_CARD_STYLES}">
                        <div style="${METRIC_LABEL_STYLES}">New Leads</div>
                        <div style="${METRIC_VALUE_STYLES}">${data.metrics.leadsCount}</div>
                    </div>
                    <div style="${METRIC_CARD_STYLES}">
                        <div style="${METRIC_LABEL_STYLES}">Lead Validation</div>
                        <div style="${METRIC_VALUE_STYLES}">${data.metrics.conversionRate.toFixed(1)}%</div>
                    </div>
                </div>

                <!-- Top Services -->
                ${data.topServices.length > 0 ? `
                    <h2 style="${SECTION_TITLE_STYLES}">Top Services</h2>
                    <table style="${TABLE_STYLES}">
                        <thead>
                            <tr>
                                <th style="${TH_STYLES}">Service Category</th>
                                <th style="${TH_STYLES}">Bookings</th>
                                <th style="${TH_STYLES}">Revenue</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.topServices.map(s => `
                                <tr>
                                    <td style="${TD_STYLES}">${s.name}</td>
                                    <td style="${TD_STYLES}">${s.count}</td>
                                    <td style="${TD_STYLES}">${formatMoney(s.revenue)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                ` : `<p>No services booked this week.</p>`}

                <div style="text-align: center;">
                    <a href="${process.env.NEXT_PUBLIC_SITE_URL || ''}/admin" style="${BUTTON_STYLES}">View Full Dashboard</a>
                </div>
            </div>
            
            <div style="${FOOTER_STYLES}">
                CeritaKita Weekly Report
            </div>
        </div>
    </body>
    </html>
    `;
}

/**
 * Generate Monthly P&L HTML Email
 */
export function buildMonthlyReportEmail(data: MonthlyReportData): string {
    const margin = data.metrics.revenue > 0 ? ((data.metrics.netProfit / data.metrics.revenue) * 100).toFixed(1) : '0';
    const profitColor = data.metrics.netProfit >= 0 ? '#059669' : '#dc2626';

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Monthly P&L Report - ${data.month}</title>
    </head>
    <body style="${BASE_STYLES}">
        <div style="${CONTAINER_STYLES}">
            <div style="${HEADER_STYLES}">
                <h1 style="margin:0; font-size:24px;">Monthly P&L Report</h1>
                <p style="margin-top:8px; margin-bottom:0; opacity:0.9;">${data.month}</p>
            </div>
            
            <div style="${CONTENT_STYLES}">
                <!-- Primary Metric -->
                <div style="text-align: center; margin-bottom: 32px; padding: 24px; background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
                    <div style="${METRIC_LABEL_STYLES}">Net Profit</div>
                    <div style="font-size: 36px; font-weight: bold; color: ${profitColor};">
                        ${formatMoney(data.metrics.netProfit)}
                    </div>
                    <div style="font-size: 14px; color: #64748b; margin-top: 8px;">
                        Profit Margin: ${margin}%
                    </div>
                </div>

                <!-- Metrics -->
                <div style="${METRIC_GRID_STYLES}">
                    <div style="${METRIC_CARD_STYLES}">
                        <div style="${METRIC_LABEL_STYLES}">Total Revenue</div>
                        <div style="${METRIC_VALUE_STYLES}">${formatMoney(data.metrics.revenue)}</div>
                    </div>
                    <div style="${METRIC_CARD_STYLES}">
                        <div style="${METRIC_LABEL_STYLES}">Total Expenses</div>
                        <div style="${METRIC_VALUE_STYLES}">${formatMoney(data.metrics.expenses)}</div>
                    </div>
                    <div style="${METRIC_CARD_STYLES}">
                        <div style="${METRIC_LABEL_STYLES}">Cash Position</div>
                        <div style="${METRIC_VALUE_STYLES}">${formatMoney(data.metrics.cashPosition)}</div>
                    </div>
                </div>

                <!-- Breakdown -->
                <h2 style="${SECTION_TITLE_STYLES}">Revenue Breakdown</h2>
                <table style="${TABLE_STYLES}">
                    <tbody>
                        ${data.revenueByCategory.map(r => `
                            <tr>
                                <td style="${TD_STYLES}">${r.category}</td>
                                <td style="${TD_STYLES}; text-align:right; font-weight:bold;">${formatMoney(r.amount)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <h2 style="${SECTION_TITLE_STYLES}">Expense Breakdown</h2>
                <table style="${TABLE_STYLES}">
                    <tbody>
                        ${data.expenseByCategory.map(e => `
                            <tr>
                                <td style="${TD_STYLES}">${e.category}</td>
                                <td style="${TD_STYLES}; text-align:right; font-weight:bold;">${formatMoney(e.amount)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <div style="text-align: center;">
                    <a href="${process.env.NEXT_PUBLIC_SITE_URL || ''}/admin/reports/pnl" style="${BUTTON_STYLES}">View Full P&L Report</a>
                </div>
            </div>
            
            <div style="${FOOTER_STYLES}">
                CeritaKita Monthly Financials
            </div>
        </div>
    </body>
    </html>
    `;
}
