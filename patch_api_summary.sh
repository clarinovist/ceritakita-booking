sed -i 's/if (booking.status === '"'"'Active'"'"' || booking.status === '"'"'Rescheduled'"'"') {/if (booking.status !== '"'"'Cancelled'"'"') {/' app/api/finance/summary/route.ts
sed -i 's/const paid = booking.finance.payments.reduce((s, p) => s + p.amount, 0);/const paid = (booking.finance.payments || []).reduce((s, p) => s + (p.amount || 0), 0);/' app/api/finance/summary/route.ts
sed -i 's/const remaining = booking.finance.total_price - paid;/const remaining = Math.max(0, booking.finance.total_price - paid);/' app/api/finance/summary/route.ts
sed -i '/if (remaining > 0) {/,/}/ {
    s/if (remaining > 0) {//
    s/outstandingRevenue += remaining;/outstandingRevenue += remaining;/
    s/}//
}' app/api/finance/summary/route.ts
