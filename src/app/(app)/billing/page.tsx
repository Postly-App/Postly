import BillingClient from "./BillingClient";

export default function BillingPage() {
  const priceIds = {
    proMonthly:     process.env.STRIPE_PRO_MONTHLY_PRICE_ID     ?? "",
    proYearly:      process.env.STRIPE_PRO_YEARLY_PRICE_ID      ?? "",
    agencyMonthly:  process.env.STRIPE_AGENCY_MONTHLY_PRICE_ID  ?? "",
    agencyYearly:   process.env.STRIPE_AGENCY_YEARLY_PRICE_ID   ?? "",
  };

  return <BillingClient priceIds={priceIds} />;
}
