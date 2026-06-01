import { AdminShell } from "@/components/admin/admin-shell";
import { SectionCard } from "@/components/admin/section-card";
import { formatUsdFromCents } from "@/lib/checkout/constants";
import {
  listCheckoutAccessCodes,
  listCheckoutPlans,
  listCheckoutPromoCodes,
} from "@/lib/checkout/service";
import { requireAcademyAdminUser } from "@/lib/auth/academy-admin";
import {
  createCheckoutAccessCodeAction,
  updateCheckoutAccessCodeAction,
  upsertCheckoutPlanAction,
  upsertCheckoutPromoCodeAction,
} from "./actions";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function formatOptionalDate(value: string | null) {
  if (!value) {
    return "No date";
  }

  return dateFormatter.format(new Date(value));
}

export default async function AcademyAdminCheckoutPage() {
  const user = await requireAcademyAdminUser();
  const [plans, accessCodes, promoCodes] = await Promise.all([
    listCheckoutPlans(),
    listCheckoutAccessCodes(),
    listCheckoutPromoCodes(),
  ]);

  return (
    <AdminShell
      title="Checkout management"
      subtitle="Manage plan content, enrollment access codes, and promo codes for the gated Academy checkout flow."
      userEmail={user.email ?? "Signed-in admin"}
    >
      <div className="grid gap-6">
        <SectionCard
          title="Plans"
          description="These records drive the public pricing and checkout plan selection."
        >
          <div className="grid gap-5">
            {plans.map((plan) => (
              <form key={plan.id} action={upsertCheckoutPlanAction} className="rounded-[1.5rem] border border-border/70 bg-background/50 p-5">
                <input type="hidden" name="id" value={plan.id} />
                <div className="grid gap-4 lg:grid-cols-2">
                  <label className="grid gap-2 text-sm font-medium text-foreground">
                    Plan name
                    <input
                      name="name"
                      defaultValue={plan.name}
                      className="rounded-xl border border-border/70 bg-background/70 px-4 py-3 font-normal text-foreground"
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-medium text-foreground">
                    Monthly price (cents)
                    <input
                      type="number"
                      name="monthly_price_cents"
                      min="0"
                      defaultValue={plan.monthly_price_cents}
                      className="rounded-xl border border-border/70 bg-background/70 px-4 py-3 font-normal text-foreground"
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-medium text-foreground">
                    Badge
                    <input
                      name="badge"
                      defaultValue={plan.badge ?? ""}
                      className="rounded-xl border border-border/70 bg-background/70 px-4 py-3 font-normal text-foreground"
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-medium text-foreground">
                    Sort order
                    <input
                      type="number"
                      name="sort_order"
                      defaultValue={plan.sort_order}
                      className="rounded-xl border border-border/70 bg-background/70 px-4 py-3 font-normal text-foreground"
                    />
                  </label>
                </div>
                <label className="mt-4 grid gap-2 text-sm font-medium text-foreground">
                  Description
                  <textarea
                    name="description"
                    defaultValue={plan.description}
                    rows={3}
                    className="rounded-xl border border-border/70 bg-background/70 px-4 py-3 font-normal text-foreground"
                  />
                </label>
                <label className="mt-4 grid gap-2 text-sm font-medium text-foreground">
                  Included features (one per line)
                  <textarea
                    name="included_features"
                    defaultValue={plan.included_features.join("\n")}
                    rows={5}
                    className="rounded-xl border border-border/70 bg-background/70 px-4 py-3 font-normal text-foreground"
                  />
                </label>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                    <input type="checkbox" name="active" defaultChecked={plan.active} />
                    Plan is active
                  </label>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">
                      Public ACH price: {formatUsdFromCents(plan.monthly_price_cents)}/month
                    </span>
                    <button type="submit" className="primary-button">
                      Save plan
                    </button>
                  </div>
                </div>
              </form>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Access codes"
          description="Access codes gate checkout. Code values are hashed before storage, so entered codes cannot be recovered later from the database."
        >
          <form action={createCheckoutAccessCodeAction} className="rounded-[1.5rem] border border-border/70 bg-background/50 p-5">
            <h4 className="text-lg font-semibold text-foreground">Create access code</h4>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium text-foreground">
                Label
                <input name="label" className="rounded-xl border border-border/70 bg-background/70 px-4 py-3 font-normal text-foreground" />
              </label>
              <label className="grid gap-2 text-sm font-medium text-foreground">
                Plaintext code to hash
                <input name="code" className="rounded-xl border border-border/70 bg-background/70 px-4 py-3 font-normal text-foreground" />
              </label>
              <label className="grid gap-2 text-sm font-medium text-foreground">
                Starts at
                <input type="datetime-local" name="starts_at" className="rounded-xl border border-border/70 bg-background/70 px-4 py-3 font-normal text-foreground" />
              </label>
              <label className="grid gap-2 text-sm font-medium text-foreground">
                Expires at
                <input type="datetime-local" name="expires_at" className="rounded-xl border border-border/70 bg-background/70 px-4 py-3 font-normal text-foreground" />
              </label>
              <label className="grid gap-2 text-sm font-medium text-foreground">
                Max uses
                <input type="number" min="0" name="max_uses" className="rounded-xl border border-border/70 bg-background/70 px-4 py-3 font-normal text-foreground" />
              </label>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <input type="checkbox" name="active" defaultChecked />
                Code is active
              </label>
              <button type="submit" className="primary-button">
                Create access code
              </button>
            </div>
          </form>

          <div className="mt-5 grid gap-4">
            {accessCodes.map((accessCode) => (
              <form key={accessCode.id} action={updateCheckoutAccessCodeAction} className="rounded-[1.5rem] border border-border/70 bg-background/50 p-5">
                <input type="hidden" name="id" value={accessCode.id} />
                <div className="grid gap-4 lg:grid-cols-2">
                  <label className="grid gap-2 text-sm font-medium text-foreground">
                    Label
                    <input
                      name="label"
                      defaultValue={accessCode.label ?? ""}
                      className="rounded-xl border border-border/70 bg-background/70 px-4 py-3 font-normal text-foreground"
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-medium text-foreground">
                    Max uses
                    <input
                      type="number"
                      min="0"
                      name="max_uses"
                      defaultValue={accessCode.max_uses ?? ""}
                      className="rounded-xl border border-border/70 bg-background/70 px-4 py-3 font-normal text-foreground"
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-medium text-foreground">
                    Starts at
                    <input
                      type="datetime-local"
                      name="starts_at"
                      defaultValue={accessCode.starts_at ? accessCode.starts_at.slice(0, 16) : ""}
                      className="rounded-xl border border-border/70 bg-background/70 px-4 py-3 font-normal text-foreground"
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-medium text-foreground">
                    Expires at
                    <input
                      type="datetime-local"
                      name="expires_at"
                      defaultValue={accessCode.expires_at ? accessCode.expires_at.slice(0, 16) : ""}
                      className="rounded-xl border border-border/70 bg-background/70 px-4 py-3 font-normal text-foreground"
                    />
                  </label>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-sm text-muted-foreground">
                    Uses: {accessCode.use_count}
                    {accessCode.max_uses !== null ? ` / ${accessCode.max_uses}` : " / unlimited"} ·
                    Active window: {formatOptionalDate(accessCode.starts_at)} to {formatOptionalDate(accessCode.expires_at)}
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                      <input type="checkbox" name="active" defaultChecked={accessCode.active} />
                      Active
                    </label>
                    <button type="submit" className="primary-button">
                      Save access code
                    </button>
                  </div>
                </div>
              </form>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Promo codes"
          description="Promo calculations stay server-side. Use this section to create or update percentage and fixed-amount discounts."
        >
          <form action={upsertCheckoutPromoCodeAction} className="rounded-[1.5rem] border border-border/70 bg-background/50 p-5">
            <h4 className="text-lg font-semibold text-foreground">Create promo code</h4>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium text-foreground">
                Code
                <input name="code" className="rounded-xl border border-border/70 bg-background/70 px-4 py-3 font-normal text-foreground" />
              </label>
              <label className="grid gap-2 text-sm font-medium text-foreground">
                Discount type
                <select name="discount_type" className="rounded-xl border border-border/70 bg-background/70 px-4 py-3 font-normal text-foreground">
                  <option value="percentage">Percentage</option>
                  <option value="fixed_amount">Fixed amount</option>
                </select>
              </label>
              <label className="grid gap-2 text-sm font-medium text-foreground">
                Percentage off
                <input type="number" min="0" max="100" name="percentage_off" className="rounded-xl border border-border/70 bg-background/70 px-4 py-3 font-normal text-foreground" />
              </label>
              <label className="grid gap-2 text-sm font-medium text-foreground">
                Amount off (cents)
                <input type="number" min="0" name="amount_off_cents" className="rounded-xl border border-border/70 bg-background/70 px-4 py-3 font-normal text-foreground" />
              </label>
              <label className="grid gap-2 text-sm font-medium text-foreground">
                Starts at
                <input type="datetime-local" name="starts_at" className="rounded-xl border border-border/70 bg-background/70 px-4 py-3 font-normal text-foreground" />
              </label>
              <label className="grid gap-2 text-sm font-medium text-foreground">
                Expires at
                <input type="datetime-local" name="expires_at" className="rounded-xl border border-border/70 bg-background/70 px-4 py-3 font-normal text-foreground" />
              </label>
              <label className="grid gap-2 text-sm font-medium text-foreground">
                Max redemptions
                <input type="number" min="0" name="max_redemptions" className="rounded-xl border border-border/70 bg-background/70 px-4 py-3 font-normal text-foreground" />
              </label>
            </div>
            <label className="mt-4 grid gap-2 text-sm font-medium text-foreground">
              Applies to plans (optional, one plan id per line)
              <textarea
                name="applies_to_plans"
                rows={3}
                placeholder="light&#10;support"
                className="rounded-xl border border-border/70 bg-background/70 px-4 py-3 font-normal text-foreground"
              />
            </label>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <input type="checkbox" name="active" defaultChecked />
                Promo is active
              </label>
              <button type="submit" className="primary-button">
                Create promo code
              </button>
            </div>
          </form>

          <div className="mt-5 grid gap-4">
            {promoCodes.map((promoCode) => (
              <form key={promoCode.id} action={upsertCheckoutPromoCodeAction} className="rounded-[1.5rem] border border-border/70 bg-background/50 p-5">
                <input type="hidden" name="id" value={promoCode.id} />
                <div className="grid gap-4 lg:grid-cols-2">
                  <label className="grid gap-2 text-sm font-medium text-foreground">
                    Code
                    <input
                      name="code"
                      defaultValue={promoCode.code}
                      className="rounded-xl border border-border/70 bg-background/70 px-4 py-3 font-normal text-foreground"
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-medium text-foreground">
                    Discount type
                    <select
                      name="discount_type"
                      defaultValue={promoCode.discount_type}
                      className="rounded-xl border border-border/70 bg-background/70 px-4 py-3 font-normal text-foreground"
                    >
                      <option value="percentage">Percentage</option>
                      <option value="fixed_amount">Fixed amount</option>
                    </select>
                  </label>
                  <label className="grid gap-2 text-sm font-medium text-foreground">
                    Percentage off
                    <input
                      type="number"
                      min="0"
                      max="100"
                      name="percentage_off"
                      defaultValue={promoCode.percentage_off ?? ""}
                      className="rounded-xl border border-border/70 bg-background/70 px-4 py-3 font-normal text-foreground"
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-medium text-foreground">
                    Amount off (cents)
                    <input
                      type="number"
                      min="0"
                      name="amount_off_cents"
                      defaultValue={promoCode.amount_off_cents ?? ""}
                      className="rounded-xl border border-border/70 bg-background/70 px-4 py-3 font-normal text-foreground"
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-medium text-foreground">
                    Starts at
                    <input
                      type="datetime-local"
                      name="starts_at"
                      defaultValue={promoCode.starts_at ? promoCode.starts_at.slice(0, 16) : ""}
                      className="rounded-xl border border-border/70 bg-background/70 px-4 py-3 font-normal text-foreground"
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-medium text-foreground">
                    Expires at
                    <input
                      type="datetime-local"
                      name="expires_at"
                      defaultValue={promoCode.expires_at ? promoCode.expires_at.slice(0, 16) : ""}
                      className="rounded-xl border border-border/70 bg-background/70 px-4 py-3 font-normal text-foreground"
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-medium text-foreground">
                    Max redemptions
                    <input
                      type="number"
                      min="0"
                      name="max_redemptions"
                      defaultValue={promoCode.max_redemptions ?? ""}
                      className="rounded-xl border border-border/70 bg-background/70 px-4 py-3 font-normal text-foreground"
                    />
                  </label>
                </div>
                <label className="mt-4 grid gap-2 text-sm font-medium text-foreground">
                  Applies to plans (optional, one plan id per line)
                  <textarea
                    name="applies_to_plans"
                    rows={3}
                    defaultValue={promoCode.applies_to_plans?.join("\n") ?? ""}
                    className="rounded-xl border border-border/70 bg-background/70 px-4 py-3 font-normal text-foreground"
                  />
                </label>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-sm text-muted-foreground">
                    Redemptions: {promoCode.redemption_count}
                    {promoCode.max_redemptions !== null
                      ? ` / ${promoCode.max_redemptions}`
                      : " / unlimited"}
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                      <input type="checkbox" name="active" defaultChecked={promoCode.active} />
                      Active
                    </label>
                    <button type="submit" className="primary-button">
                      Save promo code
                    </button>
                  </div>
                </div>
              </form>
            ))}
          </div>
        </SectionCard>
      </div>
    </AdminShell>
  );
}
