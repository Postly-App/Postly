import PricingClient from "./PricingClient";

export default function PricingPage() {
  // Server-side : on lit les Price IDs depuis les env vars
  // et on les passe au composant client
  const priceIds = {
    proMonthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID ?? "",
    proYearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID ?? "",
    agencyMonthly: process.env.STRIPE_AGENCY_MONTHLY_PRICE_ID ?? "",
    agencyYearly: process.env.STRIPE_AGENCY_YEARLY_PRICE_ID ?? "",
  };

  return <PricingClient priceIds={priceIds} />;
}
