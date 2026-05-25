sed -i 's/\/\/ Calculate outstanding balance for REALIZED REVENUE only/\/\/ Calculate outstanding balance for all non-cancelled bookings in the period/' components/DashboardMetrics.tsx
sed -i '/\/\/ This tracks how much of the completed sessions'"'"' value hasn'"'"'t been paid yet/d' components/DashboardMetrics.tsx
sed -i '/\/\/ FIX: Calculate per booking to avoid negative outstanding (overpayments) reducing the total debt/d' components/DashboardMetrics.tsx
