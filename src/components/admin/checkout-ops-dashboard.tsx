"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Copy,
  CreditCard,
  Landmark,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  TicketPercent,
} from "lucide-react";

import {
  createCheckoutAccessCodeAction,
  updateCheckoutAccessCodeAction,
  upsertCheckoutPlanAction,
  upsertCheckoutPromoCodeAction,
} from "../../../app/admin/checkout/actions";
import { SectionCard } from "@/components/admin/section-card";
import {
  formatUsdFromCents,
  type CheckoutPaymentMethodType,
  type CheckoutPlanId,
} from "@/lib/checkout/constants";

type AdminPlan = {
  id: CheckoutPlanId;
  name: string;
  monthly_price_cents: number;
  monthly_hours: number;
  description: string;
  included_features: string[];
  sort_order: number;
  active: boolean;
  badge: string | null;
};

type AdminAccessCode = {
  id: string;
  label: string | null;
  code: string | null;
  active: boolean;
  starts_at: string | null;
  expires_at: string | null;
  max_uses: number | null;
  use_count: number;
  last_used_at: string | null;
  student_first_name: string | null;
  student_last_name: string | null;
  parent_contact_name: string | null;
  parent_contact_email: string | null;
  approved_plan_id: CheckoutPlanId | null;
  allowed_payment_methods: CheckoutPaymentMethodType[] | null;
  internal_note: string | null;
  created_by_email: string | null;
  default_promo_code_id: string | null;
  default_promo_code_code: string | null;
  created_at: string;
  updated_at: string;
};

type AdminPromoCode = {
  id: string;
  code: string;
  discount_type: "percentage" | "fixed_amount";
  percentage_off: number | null;
  amount_off_cents: number | null;
  active: boolean;
  starts_at: string | null;
  expires_at: string | null;
  max_redemptions: number | null;
  redemption_count: number;
  applies_to_plans: string[] | null;
  can_combine_with_access_code: boolean;
  assigned_contact_email: string | null;
  internal_note: string | null;
  stripe_coupon_id: string | null;
  stripe_promotion_code_id: string | null;
  created_at: string;
  updated_at: string;
};

type CheckoutOpsDashboardProps = {
  plans: AdminPlan[];
  accessCodes: AdminAccessCode[];
  promoCodes: AdminPromoCode[];
};

type StatusTone = "active" | "warning" | "muted" | "danger";
type AccessCodeStatus = "active" | "used" | "expired" | "disabled";
type PromoCodeStatus = "active" | "expired" | "disabled" | "maxed";
type AccessPaymentPolicy = "both" | "ach" | "card";

type NoticeState =
  | {
      tone: "success" | "error";
      message: string;
    }
  | null;

type AccessCodeFormState = {
  id?: string;
  label: string;
  active: boolean;
  startsAt: string;
  expiresAt: string;
  maxUses: string;
  studentFirstName: string;
  studentLastName: string;
  parentContactName: string;
  parentContactEmail: string;
  approvedPlanId: CheckoutPlanId;
  allowedPaymentPolicy: AccessPaymentPolicy;
  internalNote: string;
  defaultPromoCodeId: string;
};

type PromoCodeFormState = {
  id?: string;
  code: string;
  discountType: "percentage" | "fixed_amount";
  percentageOff: string;
  amountOffCents: string;
  active: boolean;
  startsAt: string;
  expiresAt: string;
  maxRedemptions: string;
  appliesToPlans: CheckoutPlanId[];
  canCombineWithAccessCode: boolean;
  assignedContactEmail: string;
  internalNote: string;
  stripeCouponId: string;
  stripePromotionCodeId: string;
};

type PlanFormState = {
  id: CheckoutPlanId;
  name: string;
  monthlyPriceCents: string;
  monthlyHours: string;
  description: string;
  includedFeatures: string;
  sortOrder: string;
  badge: string;
  active: boolean;
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

// These helpers keep the modal defaults stable and readable for the operations team.
function toDateTimeLocalValue(date: Date) {
  const timezoneOffsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - timezoneOffsetMs).toISOString().slice(0, 16);
}

function getDefaultExpirationValue(daysFromNow: number) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  date.setHours(23, 59, 0, 0);

  return toDateTimeLocalValue(date);
}

function formatDate(value: string | null) {
  if (!value) {
    return "No date";
  }

  return dateFormatter.format(new Date(value));
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "Not yet";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function getPlanLabel(planId: CheckoutPlanId | null, plans: AdminPlan[]) {
  if (!planId) {
    return "All approved plans";
  }

  return plans.find((plan) => plan.id === planId)?.name ?? planId;
}

function getAllowedPaymentPolicy(
  allowedPaymentMethods: CheckoutPaymentMethodType[] | null,
): AccessPaymentPolicy {
  const methods = new Set(allowedPaymentMethods ?? ["ach", "card"]);

  if (methods.has("ach") && methods.has("card")) {
    return "both";
  }

  return methods.has("card") ? "card" : "ach";
}

function getAllowedPaymentMethods(
  policy: AccessPaymentPolicy,
): CheckoutPaymentMethodType[] {
  if (policy === "ach") {
    return ["ach"];
  }

  if (policy === "card") {
    return ["card"];
  }

  return ["ach", "card"];
}

function buildAccessCodeLabel(
  form: Pick<
    AccessCodeFormState,
    "label" | "studentFirstName" | "studentLastName" | "parentContactName" | "approvedPlanId"
  >,
  plans: AdminPlan[],
) {
  if (form.label.trim()) {
    return form.label.trim();
  }

  const studentName = [form.studentFirstName, form.studentLastName]
    .map((value) => value.trim())
    .filter(Boolean)
    .join(" ");

  if (studentName && form.parentContactName.trim()) {
    return `${studentName} · ${form.parentContactName.trim()}`;
  }

  if (studentName) {
    return studentName;
  }

  if (form.parentContactName.trim()) {
    return `${form.parentContactName.trim()} · ${getPlanLabel(form.approvedPlanId, plans)}`;
  }

  return getPlanLabel(form.approvedPlanId, plans);
}

function getAccessCodeStatus(accessCode: AdminAccessCode): AccessCodeStatus {
  if (!accessCode.active) {
    return "disabled";
  }

  if (accessCode.expires_at && new Date(accessCode.expires_at).getTime() < Date.now()) {
    return "expired";
  }

  if (accessCode.max_uses !== null && accessCode.use_count >= accessCode.max_uses) {
    return "used";
  }

  return "active";
}

function getPromoCodeStatus(promoCode: AdminPromoCode): PromoCodeStatus {
  if (!promoCode.active) {
    return "disabled";
  }

  if (promoCode.expires_at && new Date(promoCode.expires_at).getTime() < Date.now()) {
    return "expired";
  }

  if (
    promoCode.max_redemptions !== null &&
    promoCode.redemption_count >= promoCode.max_redemptions
  ) {
    return "maxed";
  }

  return "active";
}

function getStatusTone(status: AccessCodeStatus | PromoCodeStatus): StatusTone {
  switch (status) {
    case "active":
      return "active";
    case "used":
    case "expired":
    case "maxed":
      return "warning";
    case "disabled":
      return "danger";
    default:
      return "muted";
  }
}

function getStatusClasses(tone: StatusTone) {
  if (tone === "active") {
    return "border-emerald-500/25 bg-emerald-500/10 text-emerald-200";
  }

  if (tone === "warning") {
    return "border-amber-500/25 bg-amber-500/10 text-amber-200";
  }

  if (tone === "danger") {
    return "border-rose-500/25 bg-rose-500/10 text-rose-200";
  }

  return "border-border/70 bg-background/70 text-muted-foreground";
}

function formatPromoValue(promoCode: AdminPromoCode) {
  if (promoCode.discount_type === "percentage") {
    return `${promoCode.percentage_off ?? 0}% off`;
  }

  return `${formatUsdFromCents(promoCode.amount_off_cents ?? 0)} off`;
}

function createEmptyAccessCodeForm(): AccessCodeFormState {
  return {
    label: "",
    active: true,
    startsAt: "",
    expiresAt: getDefaultExpirationValue(14),
    maxUses: "1",
    studentFirstName: "",
    studentLastName: "",
    parentContactName: "",
    parentContactEmail: "",
    approvedPlanId: "core",
    allowedPaymentPolicy: "both",
    internalNote: "",
    defaultPromoCodeId: "",
  };
}

function createEmptyPromoCodeForm(): PromoCodeFormState {
  return {
    code: "",
    discountType: "percentage",
    percentageOff: "",
    amountOffCents: "",
    active: true,
    startsAt: "",
    expiresAt: "",
    maxRedemptions: "",
    appliesToPlans: [],
    canCombineWithAccessCode: true,
    assignedContactEmail: "",
    internalNote: "",
    stripeCouponId: "",
    stripePromotionCodeId: "",
  };
}

function mapAccessCodeToForm(accessCode: AdminAccessCode): AccessCodeFormState {
  return {
    id: accessCode.id,
    label: accessCode.label ?? "",
    active: accessCode.active,
    startsAt: accessCode.starts_at ? accessCode.starts_at.slice(0, 16) : "",
    expiresAt: accessCode.expires_at ? accessCode.expires_at.slice(0, 16) : "",
    maxUses: accessCode.max_uses === null ? "" : String(accessCode.max_uses),
    studentFirstName: accessCode.student_first_name ?? "",
    studentLastName: accessCode.student_last_name ?? "",
    parentContactName: accessCode.parent_contact_name ?? "",
    parentContactEmail: accessCode.parent_contact_email ?? "",
    approvedPlanId: accessCode.approved_plan_id ?? "core",
    allowedPaymentPolicy: getAllowedPaymentPolicy(accessCode.allowed_payment_methods),
    internalNote: accessCode.internal_note ?? "",
    defaultPromoCodeId: accessCode.default_promo_code_id ?? "",
  };
}

function mapPromoCodeToForm(promoCode: AdminPromoCode): PromoCodeFormState {
  return {
    id: promoCode.id,
    code: promoCode.code,
    discountType: promoCode.discount_type,
    percentageOff:
      promoCode.percentage_off === null ? "" : String(promoCode.percentage_off),
    amountOffCents:
      promoCode.amount_off_cents === null ? "" : String(promoCode.amount_off_cents),
    active: promoCode.active,
    startsAt: promoCode.starts_at ? promoCode.starts_at.slice(0, 16) : "",
    expiresAt: promoCode.expires_at ? promoCode.expires_at.slice(0, 16) : "",
    maxRedemptions:
      promoCode.max_redemptions === null ? "" : String(promoCode.max_redemptions),
    appliesToPlans: (promoCode.applies_to_plans ?? []).filter(
      (planId): planId is CheckoutPlanId =>
        planId === "light" || planId === "core" || planId === "intensive",
    ),
    canCombineWithAccessCode: promoCode.can_combine_with_access_code,
    assignedContactEmail: promoCode.assigned_contact_email ?? "",
    internalNote: promoCode.internal_note ?? "",
    stripeCouponId: promoCode.stripe_coupon_id ?? "",
    stripePromotionCodeId: promoCode.stripe_promotion_code_id ?? "",
  };
}

function mapPlanToForm(plan: AdminPlan): PlanFormState {
  return {
    id: plan.id,
    name: plan.name,
    monthlyPriceCents: String(plan.monthly_price_cents),
    monthlyHours: String(plan.monthly_hours),
    description: plan.description,
    includedFeatures: plan.included_features.join("\n"),
    sortOrder: String(plan.sort_order),
    badge: plan.badge ?? "",
    active: plan.active,
  };
}

function ModalShell({
  title,
  description,
  onClose,
  children,
}: {
  title: string;
  description: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4">
      <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[2rem] border border-border/70 bg-background p-6 shadow-[0_40px_120px_-48px_rgba(15,23,42,0.85)] sm:p-7">
        <div className="flex items-start justify-between gap-4 border-b border-border/70 pb-5">
          <div>
            <p className="workspace-eyebrow">Admin</p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{title}</h3>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          </div>
          <button type="button" className="secondary-button px-4 py-2" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="pt-5">{children}</div>
      </div>
    </div>
  );
}

function StatusPill({ label, tone }: { label: string; tone: StatusTone }) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${getStatusClasses(
        tone,
      )}`}
    >
      {label}
    </span>
  );
}

export function CheckoutOpsDashboard({
  plans,
  accessCodes,
  promoCodes,
}: CheckoutOpsDashboardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [notice, setNotice] = useState<NoticeState>(null);

  const [accessSearch, setAccessSearch] = useState("");
  const [accessStatusFilter, setAccessStatusFilter] = useState<
    "all" | AccessCodeStatus
  >("all");
  const [accessPlanFilter, setAccessPlanFilter] = useState<"all" | CheckoutPlanId>("all");
  const [accessExpirationFilter, setAccessExpirationFilter] = useState<
    "all" | "expiring_soon" | "expired" | "no_expiration"
  >("all");
  const [accessUsageFilter, setAccessUsageFilter] = useState<"all" | "unused" | "used">(
    "all",
  );

  const [promoSearch, setPromoSearch] = useState("");
  const [promoStatusFilter, setPromoStatusFilter] = useState<"all" | PromoCodeStatus>("all");
  const [promoPlanFilter, setPromoPlanFilter] = useState<"all" | CheckoutPlanId>("all");

  const [planForm, setPlanForm] = useState<PlanFormState | null>(null);
  const [accessCodeForm, setAccessCodeForm] = useState<AccessCodeFormState | null>(null);
  const [promoCodeForm, setPromoCodeForm] = useState<PromoCodeFormState | null>(null);

  // Filters stay client-side so the admin can sort through large code lists instantly.
  const filteredAccessCodes = useMemo(() => {
    const query = accessSearch.trim().toLowerCase();

    return accessCodes.filter((accessCode) => {
      const status = getAccessCodeStatus(accessCode);
      const hasQuery =
        !query ||
        [
          accessCode.code ?? "",
          accessCode.label ?? "",
          accessCode.student_first_name ?? "",
          accessCode.student_last_name ?? "",
          accessCode.parent_contact_name ?? "",
          accessCode.parent_contact_email ?? "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);

      const matchesStatus = accessStatusFilter === "all" || status === accessStatusFilter;
      const matchesPlan =
        accessPlanFilter === "all" || accessCode.approved_plan_id === accessPlanFilter;

      const expiresAtMs = accessCode.expires_at
        ? new Date(accessCode.expires_at).getTime()
        : null;
      const daysUntilExpiration =
        expiresAtMs === null
          ? null
          : (expiresAtMs - Date.now()) / (24 * 60 * 60 * 1000);

      const matchesExpiration =
        accessExpirationFilter === "all" ||
        (accessExpirationFilter === "expired" &&
          expiresAtMs !== null &&
          expiresAtMs < Date.now()) ||
        (accessExpirationFilter === "no_expiration" && accessCode.expires_at === null) ||
        (accessExpirationFilter === "expiring_soon" &&
          daysUntilExpiration !== null &&
          daysUntilExpiration >= 0 &&
          daysUntilExpiration <= 7);

      const isUsed =
        accessCode.use_count > 0 ||
        (accessCode.max_uses !== null && accessCode.use_count >= accessCode.max_uses);
      const matchesUsage =
        accessUsageFilter === "all" ||
        (accessUsageFilter === "used" && isUsed) ||
        (accessUsageFilter === "unused" && !isUsed);

      return hasQuery && matchesStatus && matchesPlan && matchesExpiration && matchesUsage;
    });
  }, [
    accessCodes,
    accessExpirationFilter,
    accessPlanFilter,
    accessSearch,
    accessStatusFilter,
    accessUsageFilter,
  ]);

  const filteredPromoCodes = useMemo(() => {
    const query = promoSearch.trim().toLowerCase();

    return promoCodes.filter((promoCode) => {
      const status = getPromoCodeStatus(promoCode);
      const hasQuery =
        !query ||
        [
          promoCode.code,
          promoCode.assigned_contact_email ?? "",
          promoCode.internal_note ?? "",
          promoCode.stripe_coupon_id ?? "",
          promoCode.stripe_promotion_code_id ?? "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);

      const matchesStatus = promoStatusFilter === "all" || status === promoStatusFilter;
      const matchesPlan =
        promoPlanFilter === "all" ||
        !promoCode.applies_to_plans?.length ||
        promoCode.applies_to_plans.includes(promoPlanFilter);

      return hasQuery && matchesStatus && matchesPlan;
    });
  }, [promoCodes, promoPlanFilter, promoSearch, promoStatusFilter]);

  function handleAction(action: () => Promise<{ ok: boolean; message: string; code?: string }>) {
    startTransition(async () => {
      const result = await action();

      if (!result.ok) {
        setNotice({
          tone: "error",
          message: result.message,
        });
        return;
      }

      setNotice({
        tone: "success",
        message: result.code ? `${result.message} ${result.code}` : result.message,
      });
      setPlanForm(null);
      setAccessCodeForm(null);
      setPromoCodeForm(null);
      router.refresh();
    });
  }

  async function handleCopy(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      setNotice({
        tone: "success",
        message: `${label} copied.`,
      });
    } catch {
      setNotice({
        tone: "error",
        message: `Could not copy ${label.toLowerCase()}.`,
      });
    }
  }

  function buildCheckoutLink(accessCode: AdminAccessCode) {
    const params = new URLSearchParams();

    if (accessCode.code) {
      params.set("code", accessCode.code);
    }

    if (accessCode.approved_plan_id) {
      params.set("plan", accessCode.approved_plan_id);
    }

    if (accessCode.default_promo_code_code) {
      params.set("promo", accessCode.default_promo_code_code);
    }

    return `/checkout?${params.toString()}`;
  }

  function openPlanModal(plan: AdminPlan) {
    setPlanForm(mapPlanToForm(plan));
  }

  function openCreateAccessCodeModal() {
    setAccessCodeForm(createEmptyAccessCodeForm());
  }

  function openEditAccessCodeModal(accessCode: AdminAccessCode) {
    setAccessCodeForm(mapAccessCodeToForm(accessCode));
  }

  function openCreatePromoCodeModal() {
    setPromoCodeForm(createEmptyPromoCodeForm());
  }

  function openEditPromoCodeModal(promoCode: AdminPromoCode) {
    setPromoCodeForm(mapPromoCodeToForm(promoCode));
  }

  function submitPlanForm() {
    if (!planForm) {
      return;
    }

    handleAction(() =>
      upsertCheckoutPlanAction({
        id: planForm.id,
        name: planForm.name,
        monthlyPriceCents: Number(planForm.monthlyPriceCents),
        monthlyHours: Number(planForm.monthlyHours),
        description: planForm.description,
        includedFeatures: planForm.includedFeatures
          .split("\n")
          .map((feature) => feature.trim())
          .filter(Boolean),
        sortOrder: Number(planForm.sortOrder),
        badge: planForm.badge.trim() || undefined,
        active: planForm.active,
      }),
    );
  }

  function submitAccessCodeForm() {
    if (!accessCodeForm) {
      return;
    }

    const payload = {
      label: buildAccessCodeLabel(accessCodeForm, plans),
      active: accessCodeForm.active,
      startsAt: accessCodeForm.startsAt || undefined,
      expiresAt: accessCodeForm.expiresAt || undefined,
      maxUses: accessCodeForm.maxUses ? Number(accessCodeForm.maxUses) : null,
      studentFirstName: accessCodeForm.studentFirstName || undefined,
      studentLastName: accessCodeForm.studentLastName || undefined,
      parentContactName: accessCodeForm.parentContactName || undefined,
      parentContactEmail: accessCodeForm.parentContactEmail || undefined,
      approvedPlanId: accessCodeForm.approvedPlanId,
      allowedPaymentMethods: getAllowedPaymentMethods(accessCodeForm.allowedPaymentPolicy),
      internalNote: accessCodeForm.internalNote || undefined,
      defaultPromoCodeId: accessCodeForm.defaultPromoCodeId || null,
      defaultPromoCodeCode:
        promoCodes.find((promoCode) => promoCode.id === accessCodeForm.defaultPromoCodeId)?.code ??
        null,
    };

    if (accessCodeForm.id) {
      handleAction(() =>
        updateCheckoutAccessCodeAction({
          id: accessCodeForm.id!,
          ...payload,
        }),
      );
      return;
    }

    handleAction(() => createCheckoutAccessCodeAction(payload));
  }

  function submitPromoCodeForm() {
    if (!promoCodeForm) {
      return;
    }

    handleAction(() =>
      upsertCheckoutPromoCodeAction({
        id: promoCodeForm.id,
        code: promoCodeForm.code,
        discountType: promoCodeForm.discountType,
        percentageOff: promoCodeForm.percentageOff
          ? Number(promoCodeForm.percentageOff)
          : null,
        amountOffCents: promoCodeForm.amountOffCents
          ? Number(promoCodeForm.amountOffCents)
          : null,
        active: promoCodeForm.active,
        startsAt: promoCodeForm.startsAt || undefined,
        expiresAt: promoCodeForm.expiresAt || undefined,
        maxRedemptions: promoCodeForm.maxRedemptions
          ? Number(promoCodeForm.maxRedemptions)
          : null,
        appliesToPlans: promoCodeForm.appliesToPlans,
        canCombineWithAccessCode: promoCodeForm.canCombineWithAccessCode,
        assignedContactEmail: promoCodeForm.assignedContactEmail || undefined,
        internalNote: promoCodeForm.internalNote || undefined,
        stripeCouponId: promoCodeForm.stripeCouponId || undefined,
        stripePromotionCodeId: promoCodeForm.stripePromotionCodeId || undefined,
      }),
    );
  }

  function disableAccessCode(accessCode: AdminAccessCode) {
    if (!window.confirm(`Disable ${accessCode.code ?? accessCode.label ?? "this access code"}?`)) {
      return;
    }

    handleAction(() =>
      updateCheckoutAccessCodeAction({
        id: accessCode.id,
        label:
          accessCode.label ??
          buildAccessCodeLabel(
            {
              label: "",
              studentFirstName: accessCode.student_first_name ?? "",
              studentLastName: accessCode.student_last_name ?? "",
              parentContactName: accessCode.parent_contact_name ?? "",
              approvedPlanId: accessCode.approved_plan_id ?? "core",
            },
            plans,
          ),
        active: false,
        startsAt: accessCode.starts_at ?? undefined,
        expiresAt: accessCode.expires_at ?? undefined,
        maxUses: accessCode.max_uses,
        studentFirstName: accessCode.student_first_name ?? undefined,
        studentLastName: accessCode.student_last_name ?? undefined,
        parentContactName: accessCode.parent_contact_name ?? undefined,
        parentContactEmail: accessCode.parent_contact_email ?? undefined,
        approvedPlanId: accessCode.approved_plan_id,
        allowedPaymentMethods: accessCode.allowed_payment_methods ?? ["ach", "card"],
        internalNote: accessCode.internal_note ?? undefined,
        defaultPromoCodeId: accessCode.default_promo_code_id,
        defaultPromoCodeCode: accessCode.default_promo_code_code,
      }),
    );
  }

  function disablePromoCode(promoCode: AdminPromoCode) {
    if (!window.confirm(`Disable ${promoCode.code}?`)) {
      return;
    }

    handleAction(() =>
      upsertCheckoutPromoCodeAction({
        id: promoCode.id,
        code: promoCode.code,
        discountType: promoCode.discount_type,
        percentageOff: promoCode.percentage_off,
        amountOffCents: promoCode.amount_off_cents,
        active: false,
        startsAt: promoCode.starts_at ?? undefined,
        expiresAt: promoCode.expires_at ?? undefined,
        maxRedemptions: promoCode.max_redemptions,
        appliesToPlans: (promoCode.applies_to_plans ?? []).filter(
          (planId): planId is "light" | "core" | "intensive" =>
            planId === "light" || planId === "core" || planId === "intensive",
        ),
        canCombineWithAccessCode: promoCode.can_combine_with_access_code,
        assignedContactEmail: promoCode.assigned_contact_email ?? undefined,
        internalNote: promoCode.internal_note ?? undefined,
        stripeCouponId: promoCode.stripe_coupon_id ?? undefined,
        stripePromotionCodeId: promoCode.stripe_promotion_code_id ?? undefined,
      }),
    );
  }

  return (
    <div className="grid gap-6">
      {notice ? (
        <div
          className={`rounded-[1.35rem] border px-5 py-4 text-sm ${
            notice.tone === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
              : "border-rose-500/30 bg-rose-500/10 text-rose-100"
          }`}
        >
          {notice.message}
        </div>
      ) : null}

      <SectionCard
        title="Monthly plans"
        description="These records drive the public pricing page, approval-only checkout, and subscription totals."
      >
        <div className="grid gap-4 xl:grid-cols-3">
          {plans.map((plan) => (
            <article
              key={plan.id}
              className={`rounded-[1.65rem] border p-5 ${
                plan.badge
                  ? "border-primary/40 bg-primary/10 shadow-[0_20px_52px_-40px_rgba(29,78,216,0.45)]"
                  : "border-border/70 bg-background/60"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="record-meta-label">Plan</p>
                  <h3 className="mt-2 text-xl font-semibold text-foreground">{plan.name}</h3>
                </div>
                {plan.badge ? <StatusPill label={plan.badge} tone="active" /> : null}
              </div>
              <p className="mt-4 text-3xl font-semibold tracking-tight text-foreground">
                {formatUsdFromCents(plan.monthly_price_cents)}
                <span className="text-base font-medium text-muted-foreground"> / month</span>
              </p>
              <p className="mt-2 text-sm font-medium text-foreground">
                {plan.monthly_hours} tutoring hours per month
              </p>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                {plan.description}
              </p>
              <ul className="mt-4 grid gap-2 text-sm text-muted-foreground">
                {plan.included_features.slice(0, 4).map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <ShieldCheck className="mt-0.5 h-4 w-4 flex-none text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className="secondary-button mt-5 w-full justify-center px-4 py-3"
                onClick={() => openPlanModal(plan)}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit plan
              </button>
            </article>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="Enrollment access codes"
        description="Generate readable approval codes, tie them to the approved plan, and keep family notes private to the admin team."
        action={
          <button
            type="button"
            className="primary-button px-4 py-2"
            onClick={openCreateAccessCodeModal}
          >
            <Plus className="mr-2 h-4 w-4" />
            Generate access code
          </button>
        }
      >
        <div className="grid gap-3 lg:grid-cols-5">
          <label className="grid gap-2 text-sm font-medium text-foreground lg:col-span-2">
            Search
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={accessSearch}
                onChange={(event) => setAccessSearch(event.target.value)}
                placeholder="Code, student, parent, or email"
                className="w-full rounded-xl border border-border/70 bg-background/70 py-3 pl-11 pr-4 text-sm text-foreground"
              />
            </div>
          </label>
          <label className="grid gap-2 text-sm font-medium text-foreground">
            Status
            <select
              value={accessStatusFilter}
              onChange={(event) =>
                setAccessStatusFilter(event.target.value as typeof accessStatusFilter)
              }
              className="rounded-xl border border-border/70 bg-background/70 px-4 py-3 text-sm text-foreground"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="used">Used</option>
              <option value="expired">Expired</option>
              <option value="disabled">Disabled</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium text-foreground">
            Approved plan
            <select
              value={accessPlanFilter}
              onChange={(event) =>
                setAccessPlanFilter(event.target.value as "all" | CheckoutPlanId)
              }
              className="rounded-xl border border-border/70 bg-background/70 px-4 py-3 text-sm text-foreground"
            >
              <option value="all">All plans</option>
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium text-foreground">
            Usage
            <select
              value={accessUsageFilter}
              onChange={(event) =>
                setAccessUsageFilter(event.target.value as typeof accessUsageFilter)
              }
              className="rounded-xl border border-border/70 bg-background/70 px-4 py-3 text-sm text-foreground"
            >
              <option value="all">All usage</option>
              <option value="unused">Unused</option>
              <option value="used">Used</option>
            </select>
          </label>
        </div>

        <div className="mt-3 grid gap-3 lg:grid-cols-5">
          <label className="grid gap-2 text-sm font-medium text-foreground lg:col-span-2">
            Expiration
            <select
              value={accessExpirationFilter}
              onChange={(event) =>
                setAccessExpirationFilter(event.target.value as typeof accessExpirationFilter)
              }
              className="rounded-xl border border-border/70 bg-background/70 px-4 py-3 text-sm text-foreground"
            >
              <option value="all">All dates</option>
              <option value="expiring_soon">Expiring within 7 days</option>
              <option value="expired">Expired</option>
              <option value="no_expiration">No expiration</option>
            </select>
          </label>
        </div>

        <div className="mt-5 overflow-x-auto rounded-[1.4rem] border border-border/70">
          <table className="min-w-[1040px] w-full border-collapse">
            <thead className="bg-background/85">
              <tr className="text-left text-xs uppercase tracking-[0.18em] text-muted-foreground">
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Family</th>
                <th className="px-4 py-3">Approved plan</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Expiration</th>
                <th className="px-4 py-3">Usage</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Last used</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAccessCodes.map((accessCode, index) => {
                const status = getAccessCodeStatus(accessCode);

                return (
                  <tr
                    key={accessCode.id}
                    className={index % 2 === 0 ? "bg-card/70" : "bg-background/55"}
                  >
                    <td className="px-4 py-4 align-top">
                      <div className="font-medium text-foreground">
                        {accessCode.code ?? "Stored without readable code"}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {accessCode.label ?? "No internal label"}
                      </div>
                    </td>
                    <td className="px-4 py-4 align-top text-sm">
                      <div className="font-medium text-foreground">
                        {[accessCode.student_first_name, accessCode.student_last_name]
                          .filter(Boolean)
                          .join(" ") || "Student name not added"}
                      </div>
                      <div className="mt-1 text-muted-foreground">
                        {accessCode.parent_contact_name ?? "No parent name"}
                      </div>
                      <div className="text-muted-foreground">
                        {accessCode.parent_contact_email ?? "No contact email"}
                      </div>
                    </td>
                    <td className="px-4 py-4 align-top text-sm text-foreground">
                      <div>{getPlanLabel(accessCode.approved_plan_id, plans)}</div>
                      <div className="mt-1 text-muted-foreground">
                        {getAllowedPaymentPolicy(accessCode.allowed_payment_methods) === "both"
                          ? "ACH and card"
                          : getAllowedPaymentPolicy(accessCode.allowed_payment_methods) === "ach"
                            ? "ACH only"
                            : "Card only"}
                      </div>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <StatusPill label={status} tone={getStatusTone(status)} />
                    </td>
                    <td className="px-4 py-4 align-top text-sm text-muted-foreground">
                      {formatDate(accessCode.expires_at)}
                    </td>
                    <td className="px-4 py-4 align-top text-sm text-muted-foreground">
                      {accessCode.use_count}
                      {accessCode.max_uses !== null ? ` / ${accessCode.max_uses}` : " / unlimited"}
                    </td>
                    <td className="px-4 py-4 align-top text-sm text-muted-foreground">
                      <div>{formatDate(accessCode.created_at)}</div>
                      <div className="mt-1 text-xs">
                        {accessCode.created_by_email ?? "Admin account"}
                      </div>
                    </td>
                    <td className="px-4 py-4 align-top text-sm text-muted-foreground">
                      {formatDateTime(accessCode.last_used_at)}
                    </td>
                    <td className="px-4 py-4 align-top">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="secondary-button px-3 py-2 text-xs"
                          disabled={!accessCode.code}
                          onClick={() =>
                            accessCode.code ? handleCopy(accessCode.code, "Access code") : undefined
                          }
                        >
                          <Copy className="mr-1.5 h-3.5 w-3.5" />
                          Copy code
                        </button>
                        <button
                          type="button"
                          className="secondary-button px-3 py-2 text-xs"
                          disabled={!accessCode.code}
                          onClick={() =>
                            accessCode.code
                              ? handleCopy(buildCheckoutLink(accessCode), "Checkout link")
                              : undefined
                          }
                        >
                          <ArrowUpRight className="mr-1.5 h-3.5 w-3.5" />
                          Copy link
                        </button>
                        <button
                          type="button"
                          className="secondary-button px-3 py-2 text-xs"
                          onClick={() => openEditAccessCodeModal(accessCode)}
                        >
                          <Pencil className="mr-1.5 h-3.5 w-3.5" />
                          View or edit
                        </button>
                        <button
                          type="button"
                          className="secondary-button px-3 py-2 text-xs"
                          disabled={!accessCode.active}
                          onClick={() => disableAccessCode(accessCode)}
                        >
                          Disable
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard
        title="Promo codes"
        description="Control founding-family discounts and plan-specific promotions without changing public pricing."
        action={
          <button
            type="button"
            className="primary-button px-4 py-2"
            onClick={openCreatePromoCodeModal}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create promo code
          </button>
        }
      >
        <div className="grid gap-3 lg:grid-cols-3">
          <label className="grid gap-2 text-sm font-medium text-foreground">
            Search
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={promoSearch}
                onChange={(event) => setPromoSearch(event.target.value)}
                placeholder="Code, note, Stripe ID, or email"
                className="w-full rounded-xl border border-border/70 bg-background/70 py-3 pl-11 pr-4 text-sm text-foreground"
              />
            </div>
          </label>
          <label className="grid gap-2 text-sm font-medium text-foreground">
            Status
            <select
              value={promoStatusFilter}
              onChange={(event) =>
                setPromoStatusFilter(event.target.value as typeof promoStatusFilter)
              }
              className="rounded-xl border border-border/70 bg-background/70 px-4 py-3 text-sm text-foreground"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="maxed">Maxed</option>
              <option value="disabled">Disabled</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium text-foreground">
            Applies to
            <select
              value={promoPlanFilter}
              onChange={(event) =>
                setPromoPlanFilter(event.target.value as "all" | CheckoutPlanId)
              }
              className="rounded-xl border border-border/70 bg-background/70 px-4 py-3 text-sm text-foreground"
            >
              <option value="all">All plans</option>
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-5 overflow-x-auto rounded-[1.4rem] border border-border/70">
          <table className="min-w-[980px] w-full border-collapse">
            <thead className="bg-background/85">
              <tr className="text-left text-xs uppercase tracking-[0.18em] text-muted-foreground">
                <th className="px-4 py-3">Promo code</th>
                <th className="px-4 py-3">Discount</th>
                <th className="px-4 py-3">Applies to</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Expiration</th>
                <th className="px-4 py-3">Usage</th>
                <th className="px-4 py-3">Stripe</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPromoCodes.map((promoCode, index) => {
                const status = getPromoCodeStatus(promoCode);

                return (
                  <tr
                    key={promoCode.id}
                    className={index % 2 === 0 ? "bg-card/70" : "bg-background/55"}
                  >
                    <td className="px-4 py-4 align-top">
                      <div className="font-medium text-foreground">{promoCode.code}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {promoCode.assigned_contact_email ?? "No assigned family"}
                      </div>
                    </td>
                    <td className="px-4 py-4 align-top text-sm">
                      <div className="font-medium text-foreground">
                        {formatPromoValue(promoCode)}
                      </div>
                      <div className="mt-1 text-muted-foreground">
                        {promoCode.can_combine_with_access_code
                          ? "Can pair with access code"
                          : "Standalone use only"}
                      </div>
                    </td>
                    <td className="px-4 py-4 align-top text-sm text-muted-foreground">
                      {promoCode.applies_to_plans?.length
                        ? promoCode.applies_to_plans
                            .map((planId) =>
                              getPlanLabel(
                                planId === "light" || planId === "core" || planId === "intensive"
                                  ? planId
                                  : null,
                                plans,
                              ),
                            )
                            .join(", ")
                        : "All monthly plans"}
                    </td>
                    <td className="px-4 py-4 align-top">
                      <StatusPill label={status} tone={getStatusTone(status)} />
                    </td>
                    <td className="px-4 py-4 align-top text-sm text-muted-foreground">
                      {formatDate(promoCode.expires_at)}
                    </td>
                    <td className="px-4 py-4 align-top text-sm text-muted-foreground">
                      {promoCode.redemption_count}
                      {promoCode.max_redemptions !== null
                        ? ` / ${promoCode.max_redemptions}`
                        : " / unlimited"}
                    </td>
                    <td className="px-4 py-4 align-top text-sm text-muted-foreground">
                      <div>{promoCode.stripe_coupon_id ?? "No coupon ID"}</div>
                      <div className="mt-1 text-xs">
                        {promoCode.stripe_promotion_code_id ?? "No promotion code ID"}
                      </div>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="secondary-button px-3 py-2 text-xs"
                          onClick={() => openEditPromoCodeModal(promoCode)}
                        >
                          <Pencil className="mr-1.5 h-3.5 w-3.5" />
                          View or edit
                        </button>
                        <button
                          type="button"
                          className="secondary-button px-3 py-2 text-xs"
                          onClick={() => handleCopy(promoCode.code, "Promo code")}
                        >
                          <Copy className="mr-1.5 h-3.5 w-3.5" />
                          Copy code
                        </button>
                        <button
                          type="button"
                          className="secondary-button px-3 py-2 text-xs"
                          disabled={!promoCode.active}
                          onClick={() => disablePromoCode(promoCode)}
                        >
                          Disable
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {planForm ? (
        <ModalShell
          title={`Edit ${planForm.name}`}
          description="Update the shared plan details that feed pricing, checkout, and subscription totals."
          onClose={() => setPlanForm(null)}
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium text-foreground">
              Plan name
              <input
                value={planForm.name}
                onChange={(event) =>
                  setPlanForm((current) =>
                    current ? { ...current, name: event.target.value } : current,
                  )
                }
                className="rounded-xl border border-border/70 bg-background/70 px-4 py-3 text-foreground"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-foreground">
              Monthly price (cents)
              <input
                type="number"
                min="0"
                value={planForm.monthlyPriceCents}
                onChange={(event) =>
                  setPlanForm((current) =>
                    current ? { ...current, monthlyPriceCents: event.target.value } : current,
                  )
                }
                className="rounded-xl border border-border/70 bg-background/70 px-4 py-3 text-foreground"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-foreground">
              Tutoring hours per month
              <input
                type="number"
                min="0"
                value={planForm.monthlyHours}
                onChange={(event) =>
                  setPlanForm((current) =>
                    current ? { ...current, monthlyHours: event.target.value } : current,
                  )
                }
                className="rounded-xl border border-border/70 bg-background/70 px-4 py-3 text-foreground"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-foreground">
              Badge
              <input
                value={planForm.badge}
                onChange={(event) =>
                  setPlanForm((current) =>
                    current ? { ...current, badge: event.target.value } : current,
                  )
                }
                className="rounded-xl border border-border/70 bg-background/70 px-4 py-3 text-foreground"
              />
            </label>
          </div>
          <label className="mt-4 grid gap-2 text-sm font-medium text-foreground">
            Description
            <textarea
              rows={3}
              value={planForm.description}
              onChange={(event) =>
                setPlanForm((current) =>
                  current ? { ...current, description: event.target.value } : current,
                )
              }
              className="rounded-xl border border-border/70 bg-background/70 px-4 py-3 text-foreground"
            />
          </label>
          <label className="mt-4 grid gap-2 text-sm font-medium text-foreground">
            Included features
            <textarea
              rows={6}
              value={planForm.includedFeatures}
              onChange={(event) =>
                setPlanForm((current) =>
                  current ? { ...current, includedFeatures: event.target.value } : current,
                )
              }
              className="rounded-xl border border-border/70 bg-background/70 px-4 py-3 text-foreground"
            />
          </label>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium text-foreground">
              Sort order
              <input
                type="number"
                value={planForm.sortOrder}
                onChange={(event) =>
                  setPlanForm((current) =>
                    current ? { ...current, sortOrder: event.target.value } : current,
                  )
                }
                className="rounded-xl border border-border/70 bg-background/70 px-4 py-3 text-foreground"
              />
            </label>
            <label className="inline-flex items-center gap-3 rounded-xl border border-border/70 bg-background/70 px-4 py-3 text-sm text-foreground">
              <input
                type="checkbox"
                checked={planForm.active}
                onChange={(event) =>
                  setPlanForm((current) =>
                    current ? { ...current, active: event.target.checked } : current,
                  )
                }
              />
              Plan is active
            </label>
          </div>
          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <button type="button" className="secondary-button px-4 py-2" onClick={() => setPlanForm(null)}>
              Cancel
            </button>
            <button
              type="button"
              className="primary-button px-4 py-2"
              disabled={isPending}
              onClick={submitPlanForm}
            >
              Save plan
            </button>
          </div>
        </ModalShell>
      ) : null}

      {accessCodeForm ? (
        <ModalShell
          title={accessCodeForm.id ? "Edit access code" : "Generate access code"}
          description="Issue approval-only checkout access, control the eligible plan, and keep operational notes attached to the record."
          onClose={() => setAccessCodeForm(null)}
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium text-foreground">
              Student first name
              <input
                value={accessCodeForm.studentFirstName}
                onChange={(event) =>
                  setAccessCodeForm((current) =>
                    current ? { ...current, studentFirstName: event.target.value } : current,
                  )
                }
                className="rounded-xl border border-border/70 bg-background/70 px-4 py-3 text-foreground"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-foreground">
              Student last name
              <input
                value={accessCodeForm.studentLastName}
                onChange={(event) =>
                  setAccessCodeForm((current) =>
                    current ? { ...current, studentLastName: event.target.value } : current,
                  )
                }
                className="rounded-xl border border-border/70 bg-background/70 px-4 py-3 text-foreground"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-foreground">
              Parent or contact name
              <input
                value={accessCodeForm.parentContactName}
                onChange={(event) =>
                  setAccessCodeForm((current) =>
                    current ? { ...current, parentContactName: event.target.value } : current,
                  )
                }
                className="rounded-xl border border-border/70 bg-background/70 px-4 py-3 text-foreground"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-foreground">
              Parent or contact email
              <input
                type="email"
                value={accessCodeForm.parentContactEmail}
                onChange={(event) =>
                  setAccessCodeForm((current) =>
                    current ? { ...current, parentContactEmail: event.target.value } : current,
                  )
                }
                className="rounded-xl border border-border/70 bg-background/70 px-4 py-3 text-foreground"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-foreground">
              Approved plan
              <select
                value={accessCodeForm.approvedPlanId}
                onChange={(event) =>
                  setAccessCodeForm((current) =>
                    current
                      ? {
                          ...current,
                          approvedPlanId: event.target.value as CheckoutPlanId,
                        }
                      : current,
                  )
                }
                className="rounded-xl border border-border/70 bg-background/70 px-4 py-3 text-foreground"
              >
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-medium text-foreground">
              Default promo code
              <select
                value={accessCodeForm.defaultPromoCodeId}
                onChange={(event) =>
                  setAccessCodeForm((current) =>
                    current ? { ...current, defaultPromoCodeId: event.target.value } : current,
                  )
                }
                className="rounded-xl border border-border/70 bg-background/70 px-4 py-3 text-foreground"
              >
                <option value="">No default promo</option>
                {promoCodes.map((promoCode) => (
                  <option key={promoCode.id} value={promoCode.id}>
                    {promoCode.code}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-medium text-foreground">
              Max uses
              <input
                type="number"
                min="1"
                value={accessCodeForm.maxUses}
                onChange={(event) =>
                  setAccessCodeForm((current) =>
                    current ? { ...current, maxUses: event.target.value } : current,
                  )
                }
                className="rounded-xl border border-border/70 bg-background/70 px-4 py-3 text-foreground"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-foreground">
              Expires at
              <input
                type="datetime-local"
                value={accessCodeForm.expiresAt}
                onChange={(event) =>
                  setAccessCodeForm((current) =>
                    current ? { ...current, expiresAt: event.target.value } : current,
                  )
                }
                className="rounded-xl border border-border/70 bg-background/70 px-4 py-3 text-foreground"
              />
            </label>
          </div>

          <div className="mt-4 grid gap-2">
            <p className="text-sm font-medium text-foreground">Allowed payment methods</p>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                {
                  value: "both" as const,
                  title: "ACH and card",
                  description: "Allow either payment method at checkout.",
                  icon: <CreditCard className="h-4 w-4 text-primary" />,
                },
                {
                  value: "ach" as const,
                  title: "ACH only",
                  description: "Keep the family on preferred pricing.",
                  icon: <Landmark className="h-4 w-4 text-primary" />,
                },
                {
                  value: "card" as const,
                  title: "Card only",
                  description: "Allow card checkout only for this approval.",
                  icon: <CreditCard className="h-4 w-4 text-primary" />,
                },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    setAccessCodeForm((current) =>
                      current
                        ? { ...current, allowedPaymentPolicy: option.value }
                        : current,
                    )
                  }
                  className={`rounded-[1.35rem] border p-4 text-left ${
                    accessCodeForm.allowedPaymentPolicy === option.value
                      ? "border-primary/40 bg-primary/10"
                      : "border-border/70 bg-background/55"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {option.icon}
                    <span className="font-medium text-foreground">{option.title}</span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{option.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium text-foreground">
              Internal label
              <input
                value={accessCodeForm.label}
                onChange={(event) =>
                  setAccessCodeForm((current) =>
                    current ? { ...current, label: event.target.value } : current,
                  )
                }
                placeholder="Defaults from family or student name"
                className="rounded-xl border border-border/70 bg-background/70 px-4 py-3 text-foreground"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-foreground">
              Starts at
              <input
                type="datetime-local"
                value={accessCodeForm.startsAt}
                onChange={(event) =>
                  setAccessCodeForm((current) =>
                    current ? { ...current, startsAt: event.target.value } : current,
                  )
                }
                className="rounded-xl border border-border/70 bg-background/70 px-4 py-3 text-foreground"
              />
            </label>
          </div>

          <label className="mt-4 grid gap-2 text-sm font-medium text-foreground">
            Internal note
            <textarea
              rows={4}
              value={accessCodeForm.internalNote}
              onChange={(event) =>
                setAccessCodeForm((current) =>
                  current ? { ...current, internalNote: event.target.value } : current,
                )
              }
              placeholder="Approval context, payment note, or follow-up details"
              className="rounded-xl border border-border/70 bg-background/70 px-4 py-3 text-foreground"
            />
          </label>

          <div className="mt-4 rounded-[1.35rem] border border-border/70 bg-background/60 px-4 py-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">
              {accessCodeForm.id ? "Usage details" : "Generated code preview"}
            </p>
            {accessCodeForm.id ? (
              <div className="mt-2 grid gap-1">
                <p>
                  Usage: {
                    accessCodes.find((entry) => entry.id === accessCodeForm.id)?.use_count ?? 0
                  }{" "}
                  /{" "}
                  {accessCodes.find((entry) => entry.id === accessCodeForm.id)?.max_uses ?? "unlimited"}
                </p>
                <p>
                  Last used:{" "}
                  {formatDateTime(
                    accessCodes.find((entry) => entry.id === accessCodeForm.id)?.last_used_at ?? null,
                  )}
                </p>
              </div>
            ) : (
              <p className="mt-2">
                Codes are generated as readable, non-sequential values such as{" "}
                <span className="font-medium text-foreground">DEEBO-CORE-7M4P</span>.
              </p>
            )}
          </div>

          <label className="mt-4 inline-flex items-center gap-3 rounded-xl border border-border/70 bg-background/70 px-4 py-3 text-sm text-foreground">
            <input
              type="checkbox"
              checked={accessCodeForm.active}
              onChange={(event) =>
                setAccessCodeForm((current) =>
                  current ? { ...current, active: event.target.checked } : current,
                )
              }
            />
            Access code is active
          </label>

          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <button
              type="button"
              className="secondary-button px-4 py-2"
              onClick={() => setAccessCodeForm(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="primary-button px-4 py-2"
              disabled={isPending}
              onClick={submitAccessCodeForm}
            >
              {accessCodeForm.id ? "Save access code" : "Generate access code"}
            </button>
          </div>
        </ModalShell>
      ) : null}

      {promoCodeForm ? (
        <ModalShell
          title={promoCodeForm.id ? "Edit promo code" : "Create promo code"}
          description="Keep founding-family and plan-specific discounts separate from public pricing."
          onClose={() => setPromoCodeForm(null)}
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium text-foreground">
              Promo code
              <input
                value={promoCodeForm.code}
                onChange={(event) =>
                  setPromoCodeForm((current) =>
                    current ? { ...current, code: event.target.value.toUpperCase() } : current,
                  )
                }
                className="rounded-xl border border-border/70 bg-background/70 px-4 py-3 text-foreground"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-foreground">
              Discount type
              <select
                value={promoCodeForm.discountType}
                onChange={(event) =>
                  setPromoCodeForm((current) =>
                    current
                      ? {
                          ...current,
                          discountType: event.target.value as PromoCodeFormState["discountType"],
                        }
                      : current,
                  )
                }
                className="rounded-xl border border-border/70 bg-background/70 px-4 py-3 text-foreground"
              >
                <option value="percentage">Percentage off</option>
                <option value="fixed_amount">Fixed amount off</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm font-medium text-foreground">
              Percentage off
              <input
                type="number"
                min="0"
                max="100"
                disabled={promoCodeForm.discountType !== "percentage"}
                value={promoCodeForm.percentageOff}
                onChange={(event) =>
                  setPromoCodeForm((current) =>
                    current ? { ...current, percentageOff: event.target.value } : current,
                  )
                }
                className="rounded-xl border border-border/70 bg-background/70 px-4 py-3 text-foreground disabled:opacity-50"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-foreground">
              Fixed amount off (cents)
              <input
                type="number"
                min="0"
                disabled={promoCodeForm.discountType !== "fixed_amount"}
                value={promoCodeForm.amountOffCents}
                onChange={(event) =>
                  setPromoCodeForm((current) =>
                    current ? { ...current, amountOffCents: event.target.value } : current,
                  )
                }
                className="rounded-xl border border-border/70 bg-background/70 px-4 py-3 text-foreground disabled:opacity-50"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-foreground">
              Expires at
              <input
                type="datetime-local"
                value={promoCodeForm.expiresAt}
                onChange={(event) =>
                  setPromoCodeForm((current) =>
                    current ? { ...current, expiresAt: event.target.value } : current,
                  )
                }
                className="rounded-xl border border-border/70 bg-background/70 px-4 py-3 text-foreground"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-foreground">
              Max redemptions
              <input
                type="number"
                min="1"
                value={promoCodeForm.maxRedemptions}
                onChange={(event) =>
                  setPromoCodeForm((current) =>
                    current ? { ...current, maxRedemptions: event.target.value } : current,
                  )
                }
                className="rounded-xl border border-border/70 bg-background/70 px-4 py-3 text-foreground"
              />
            </label>
          </div>

          <div className="mt-4 grid gap-2">
            <p className="text-sm font-medium text-foreground">Applies to plans</p>
            <div className="grid gap-3 sm:grid-cols-3">
              {plans.map((plan) => {
                const checked = promoCodeForm.appliesToPlans.includes(plan.id);

                return (
                  <label
                    key={plan.id}
                    className={`rounded-[1.35rem] border p-4 ${
                      checked ? "border-primary/40 bg-primary/10" : "border-border/70 bg-background/55"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(event) =>
                          setPromoCodeForm((current) => {
                            if (!current) {
                              return current;
                            }

                            const nextPlans = event.target.checked
                              ? [...current.appliesToPlans, plan.id]
                              : current.appliesToPlans.filter((planId) => planId !== plan.id);

                            return {
                              ...current,
                              appliesToPlans: nextPlans,
                            };
                          })
                        }
                      />
                      <div>
                        <p className="font-medium text-foreground">{plan.name}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {formatUsdFromCents(plan.monthly_price_cents)}/month
                        </p>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              Leave all three unchecked to apply the promo to every monthly plan.
            </p>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium text-foreground">
              Assigned family email
              <input
                type="email"
                value={promoCodeForm.assignedContactEmail}
                onChange={(event) =>
                  setPromoCodeForm((current) =>
                    current ? { ...current, assignedContactEmail: event.target.value } : current,
                  )
                }
                className="rounded-xl border border-border/70 bg-background/70 px-4 py-3 text-foreground"
              />
            </label>
            <label className="inline-flex items-center gap-3 rounded-xl border border-border/70 bg-background/70 px-4 py-3 text-sm text-foreground">
              <input
                type="checkbox"
                checked={promoCodeForm.canCombineWithAccessCode}
                onChange={(event) =>
                  setPromoCodeForm((current) =>
                    current
                      ? {
                          ...current,
                          canCombineWithAccessCode: event.target.checked,
                        }
                      : current,
                  )
                }
              />
              Can combine with access code approval
            </label>
            <label className="grid gap-2 text-sm font-medium text-foreground">
              Stripe coupon ID
              <input
                value={promoCodeForm.stripeCouponId}
                onChange={(event) =>
                  setPromoCodeForm((current) =>
                    current ? { ...current, stripeCouponId: event.target.value } : current,
                  )
                }
                className="rounded-xl border border-border/70 bg-background/70 px-4 py-3 text-foreground"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-foreground">
              Stripe promotion code ID
              <input
                value={promoCodeForm.stripePromotionCodeId}
                onChange={(event) =>
                  setPromoCodeForm((current) =>
                    current
                      ? { ...current, stripePromotionCodeId: event.target.value }
                      : current,
                  )
                }
                className="rounded-xl border border-border/70 bg-background/70 px-4 py-3 text-foreground"
              />
            </label>
          </div>

          <label className="mt-4 grid gap-2 text-sm font-medium text-foreground">
            Internal note
            <textarea
              rows={4}
              value={promoCodeForm.internalNote}
              onChange={(event) =>
                setPromoCodeForm((current) =>
                  current ? { ...current, internalNote: event.target.value } : current,
                )
              }
              placeholder="Founding-family note, plan restriction, or follow-up detail"
              className="rounded-xl border border-border/70 bg-background/70 px-4 py-3 text-foreground"
            />
          </label>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium text-foreground">
              Starts at
              <input
                type="datetime-local"
                value={promoCodeForm.startsAt}
                onChange={(event) =>
                  setPromoCodeForm((current) =>
                    current ? { ...current, startsAt: event.target.value } : current,
                  )
                }
                className="rounded-xl border border-border/70 bg-background/70 px-4 py-3 text-foreground"
              />
            </label>
            <label className="inline-flex items-center gap-3 rounded-xl border border-border/70 bg-background/70 px-4 py-3 text-sm text-foreground">
              <input
                type="checkbox"
                checked={promoCodeForm.active}
                onChange={(event) =>
                  setPromoCodeForm((current) =>
                    current ? { ...current, active: event.target.checked } : current,
                  )
                }
              />
              Promo code is active
            </label>
          </div>

          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <button
              type="button"
              className="secondary-button px-4 py-2"
              onClick={() => setPromoCodeForm(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="primary-button px-4 py-2"
              disabled={isPending}
              onClick={submitPromoCodeForm}
            >
              {promoCodeForm.id ? "Save promo code" : "Create promo code"}
            </button>
          </div>
        </ModalShell>
      ) : null}
    </div>
  );
}
