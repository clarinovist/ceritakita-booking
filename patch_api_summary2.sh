sed -i 's/\/\/ Only for active\/rescheduled bookings in the period?/\/\/ Dashboard shows CURRENT outstanding for all non-cancelled bookings./' app/api/finance/summary/route.ts
sed -i '/\/\/ Or all time outstanding?/d' app/api/finance/summary/route.ts
sed -i '/\/\/ Usually, dashboard shows CURRENT outstanding./d' app/api/finance/summary/route.ts
