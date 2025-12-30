-- Multi-tenant core tables, RLS, and audit protections
-- Safe to run multiple times.

-- Tenants and memberships
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  mission_config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tenant_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, user_id)
);

-- Core returns tables
ALTER TABLE public.returns
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id),
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS condition TEXT,
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS brand TEXT,
  ADD COLUMN IF NOT EXISTS price_suggested NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS routed_channel TEXT,
  ADD COLUMN IF NOT EXISTS batch_id UUID;

ALTER TABLE public.purchase_orders
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);

ALTER TABLE public.returns
  ALTER COLUMN user_id SET DEFAULT auth.uid();

ALTER TABLE public.purchase_orders
  ALTER COLUMN user_id SET DEFAULT auth.uid();

CREATE TABLE IF NOT EXISTS public.return_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id UUID NOT NULL REFERENCES public.returns(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  storage_bucket TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ai_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id UUID NOT NULL REFERENCES public.returns(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  rationale TEXT NOT NULL,
  confidence NUMERIC(4,3) NOT NULL,
  resale_channel TEXT,
  suggested_price NUMERIC(12,2),
  notes TEXT,
  fairness_checks JSONB DEFAULT '{}'::jsonb,
  model_version TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.resale_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id UUID NOT NULL REFERENCES public.returns(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  channel TEXT NOT NULL,
  external_listing_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.refund_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id UUID NOT NULL REFERENCES public.returns(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  stripe_refund_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  amount NUMERIC(12,2),
  currency TEXT DEFAULT 'USD',
  idempotency_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (idempotency_key)
);

CREATE TABLE IF NOT EXISTS public.return_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Supplier intelligence and forecasts
ALTER TABLE public.suppliers
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id),
  ADD COLUMN IF NOT EXISTS vendor_code TEXT,
  ADD COLUMN IF NOT EXISTS contact_email TEXT;

CREATE TABLE IF NOT EXISTS public.supplier_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  return_rate NUMERIC(6,3),
  defect_proxy NUMERIC(6,3),
  sla_proxy NUMERIC(6,3),
  reliability_score NUMERIC(6,3),
  period_start DATE,
  period_end DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  sku TEXT NOT NULL,
  predicted_quantity INTEGER NOT NULL,
  confidence NUMERIC(4,3),
  trend_analysis TEXT,
  inputs JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sustainability_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  return_id UUID REFERENCES public.returns(id) ON DELETE SET NULL,
  diversion_rate NUMERIC(6,3),
  carbon_kg NUMERIC(12,3),
  waste_kg NUMERIC(12,3),
  water_liters NUMERIC(12,3),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Append-only audit log
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.prevent_audit_log_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'audit_log is append-only';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_log_immutable ON public.audit_log;
CREATE TRIGGER audit_log_immutable
BEFORE UPDATE OR DELETE ON public.audit_log
FOR EACH ROW EXECUTE PROCEDURE public.prevent_audit_log_mutation();

-- Membership helpers
CREATE OR REPLACE FUNCTION public.is_tenant_member(check_tenant UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.tenant_memberships tm
    WHERE tm.tenant_id = check_tenant
      AND tm.user_id = auth.uid()
      AND tm.status = 'active'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_tenant_admin(check_tenant UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.tenant_memberships tm
    WHERE tm.tenant_id = check_tenant
      AND tm.user_id = auth.uid()
      AND tm.status = 'active'
      AND tm.role IN ('admin', 'owner')
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Enable RLS
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.return_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resale_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refund_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.return_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sustainability_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Tenant policies
DROP POLICY IF EXISTS tenants_select ON public.tenants;
CREATE POLICY tenants_select ON public.tenants
  FOR SELECT USING (public.is_tenant_member(id));

DROP POLICY IF EXISTS tenants_update ON public.tenants;
CREATE POLICY tenants_update ON public.tenants
  FOR UPDATE USING (public.is_tenant_admin(id));

DROP POLICY IF EXISTS tenants_insert ON public.tenants;
CREATE POLICY tenants_insert ON public.tenants
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Membership policies
DROP POLICY IF EXISTS memberships_select ON public.tenant_memberships;
CREATE POLICY memberships_select ON public.tenant_memberships
  FOR SELECT USING (public.is_tenant_member(tenant_id));

DROP POLICY IF EXISTS memberships_insert ON public.tenant_memberships;
CREATE POLICY memberships_insert ON public.tenant_memberships
  FOR INSERT WITH CHECK (public.is_tenant_admin(tenant_id));

DROP POLICY IF EXISTS memberships_update ON public.tenant_memberships;
CREATE POLICY memberships_update ON public.tenant_memberships
  FOR UPDATE USING (public.is_tenant_admin(tenant_id));

-- Returns policies
DROP POLICY IF EXISTS returns_select ON public.returns;
CREATE POLICY returns_select ON public.returns
  FOR SELECT USING (public.is_tenant_member(tenant_id));

DROP POLICY IF EXISTS returns_insert ON public.returns;
CREATE POLICY returns_insert ON public.returns
  FOR INSERT WITH CHECK (public.is_tenant_member(tenant_id));

DROP POLICY IF EXISTS returns_update ON public.returns;
CREATE POLICY returns_update ON public.returns
  FOR UPDATE USING (public.is_tenant_member(tenant_id));

-- Shared policies pattern
DO $$
BEGIN
  EXECUTE 'DROP POLICY IF EXISTS return_images_select ON public.return_images';
  EXECUTE 'CREATE POLICY return_images_select ON public.return_images FOR SELECT USING (public.is_tenant_member(tenant_id))';
  EXECUTE 'DROP POLICY IF EXISTS return_images_insert ON public.return_images';
  EXECUTE 'CREATE POLICY return_images_insert ON public.return_images FOR INSERT WITH CHECK (public.is_tenant_member(tenant_id))';
  EXECUTE 'DROP POLICY IF EXISTS return_images_update ON public.return_images';
  EXECUTE 'CREATE POLICY return_images_update ON public.return_images FOR UPDATE USING (public.is_tenant_member(tenant_id))';

  EXECUTE 'DROP POLICY IF EXISTS ai_decisions_select ON public.ai_decisions';
  EXECUTE 'CREATE POLICY ai_decisions_select ON public.ai_decisions FOR SELECT USING (public.is_tenant_member(tenant_id))';
  EXECUTE 'DROP POLICY IF EXISTS ai_decisions_insert ON public.ai_decisions';
  EXECUTE 'CREATE POLICY ai_decisions_insert ON public.ai_decisions FOR INSERT WITH CHECK (public.is_tenant_member(tenant_id))';

  EXECUTE 'DROP POLICY IF EXISTS resale_actions_select ON public.resale_actions';
  EXECUTE 'CREATE POLICY resale_actions_select ON public.resale_actions FOR SELECT USING (public.is_tenant_member(tenant_id))';
  EXECUTE 'DROP POLICY IF EXISTS resale_actions_insert ON public.resale_actions';
  EXECUTE 'CREATE POLICY resale_actions_insert ON public.resale_actions FOR INSERT WITH CHECK (public.is_tenant_member(tenant_id))';
  EXECUTE 'DROP POLICY IF EXISTS resale_actions_update ON public.resale_actions';
  EXECUTE 'CREATE POLICY resale_actions_update ON public.resale_actions FOR UPDATE USING (public.is_tenant_member(tenant_id))';

  EXECUTE 'DROP POLICY IF EXISTS refund_actions_select ON public.refund_actions';
  EXECUTE 'CREATE POLICY refund_actions_select ON public.refund_actions FOR SELECT USING (public.is_tenant_member(tenant_id))';
  EXECUTE 'DROP POLICY IF EXISTS refund_actions_insert ON public.refund_actions';
  EXECUTE 'CREATE POLICY refund_actions_insert ON public.refund_actions FOR INSERT WITH CHECK (public.is_tenant_member(tenant_id))';
  EXECUTE 'DROP POLICY IF EXISTS refund_actions_update ON public.refund_actions';
  EXECUTE 'CREATE POLICY refund_actions_update ON public.refund_actions FOR UPDATE USING (public.is_tenant_member(tenant_id))';

  EXECUTE 'DROP POLICY IF EXISTS return_batches_select ON public.return_batches';
  EXECUTE 'CREATE POLICY return_batches_select ON public.return_batches FOR SELECT USING (public.is_tenant_member(tenant_id))';
  EXECUTE 'DROP POLICY IF EXISTS return_batches_insert ON public.return_batches';
  EXECUTE 'CREATE POLICY return_batches_insert ON public.return_batches FOR INSERT WITH CHECK (public.is_tenant_member(tenant_id))';
  EXECUTE 'DROP POLICY IF EXISTS return_batches_update ON public.return_batches';
  EXECUTE 'CREATE POLICY return_batches_update ON public.return_batches FOR UPDATE USING (public.is_tenant_member(tenant_id))';

  EXECUTE 'DROP POLICY IF EXISTS purchase_orders_select ON public.purchase_orders';
  EXECUTE 'CREATE POLICY purchase_orders_select ON public.purchase_orders FOR SELECT USING (public.is_tenant_member(tenant_id))';
  EXECUTE 'DROP POLICY IF EXISTS purchase_orders_insert ON public.purchase_orders';
  EXECUTE 'CREATE POLICY purchase_orders_insert ON public.purchase_orders FOR INSERT WITH CHECK (public.is_tenant_member(tenant_id))';
  EXECUTE 'DROP POLICY IF EXISTS purchase_orders_update ON public.purchase_orders';
  EXECUTE 'CREATE POLICY purchase_orders_update ON public.purchase_orders FOR UPDATE USING (public.is_tenant_member(tenant_id))';

  EXECUTE 'DROP POLICY IF EXISTS suppliers_select ON public.suppliers';
  EXECUTE 'CREATE POLICY suppliers_select ON public.suppliers FOR SELECT USING (public.is_tenant_member(tenant_id))';
  EXECUTE 'DROP POLICY IF EXISTS suppliers_insert ON public.suppliers';
  EXECUTE 'CREATE POLICY suppliers_insert ON public.suppliers FOR INSERT WITH CHECK (public.is_tenant_member(tenant_id))';
  EXECUTE 'DROP POLICY IF EXISTS suppliers_update ON public.suppliers';
  EXECUTE 'CREATE POLICY suppliers_update ON public.suppliers FOR UPDATE USING (public.is_tenant_member(tenant_id))';

  EXECUTE 'DROP POLICY IF EXISTS supplier_metrics_select ON public.supplier_metrics';
  EXECUTE 'CREATE POLICY supplier_metrics_select ON public.supplier_metrics FOR SELECT USING (public.is_tenant_member(tenant_id))';
  EXECUTE 'DROP POLICY IF EXISTS supplier_metrics_insert ON public.supplier_metrics';
  EXECUTE 'CREATE POLICY supplier_metrics_insert ON public.supplier_metrics FOR INSERT WITH CHECK (public.is_tenant_member(tenant_id))';

  EXECUTE 'DROP POLICY IF EXISTS forecasts_select ON public.forecasts';
  EXECUTE 'CREATE POLICY forecasts_select ON public.forecasts FOR SELECT USING (public.is_tenant_member(tenant_id))';
  EXECUTE 'DROP POLICY IF EXISTS forecasts_insert ON public.forecasts';
  EXECUTE 'CREATE POLICY forecasts_insert ON public.forecasts FOR INSERT WITH CHECK (public.is_tenant_member(tenant_id))';

  EXECUTE 'DROP POLICY IF EXISTS sustainability_metrics_select ON public.sustainability_metrics';
  EXECUTE 'CREATE POLICY sustainability_metrics_select ON public.sustainability_metrics FOR SELECT USING (public.is_tenant_member(tenant_id))';
  EXECUTE 'DROP POLICY IF EXISTS sustainability_metrics_insert ON public.sustainability_metrics';
  EXECUTE 'CREATE POLICY sustainability_metrics_insert ON public.sustainability_metrics FOR INSERT WITH CHECK (public.is_tenant_member(tenant_id))';

  EXECUTE 'DROP POLICY IF EXISTS audit_log_select ON public.audit_log';
  EXECUTE 'CREATE POLICY audit_log_select ON public.audit_log FOR SELECT USING (public.is_tenant_member(tenant_id))';
  EXECUTE 'DROP POLICY IF EXISTS audit_log_insert ON public.audit_log';
  EXECUTE 'CREATE POLICY audit_log_insert ON public.audit_log FOR INSERT WITH CHECK (public.is_tenant_member(tenant_id))';
END $$;
