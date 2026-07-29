CREATE TABLE public.payment_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  currency text NOT NULL DEFAULT 'PKR',
  currency_symbol text NOT NULL DEFAULT 'Rs',
  cod_enabled boolean NOT NULL DEFAULT true,
  cod_charge numeric NOT NULL DEFAULT 0,
  delivery_charge numeric NOT NULL DEFAULT 250,
  free_delivery_above numeric NOT NULL DEFAULT 5000,
  easypaisa_enabled boolean NOT NULL DEFAULT true,
  easypaisa_number text,
  easypaisa_account_name text,
  jazzcash_enabled boolean NOT NULL DEFAULT true,
  jazzcash_number text,
  jazzcash_account_name text,
  bank_enabled boolean NOT NULL DEFAULT true,
  bank_name text,
  bank_account_title text,
  bank_account_number text,
  bank_iban text,
  warranty_months integer NOT NULL DEFAULT 12,
  warranty_note text NOT NULL DEFAULT '1 year warranty, premium gift box & warranty card included with every timepiece.',
  payment_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.payment_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_settings TO authenticated;
GRANT ALL ON public.payment_settings TO service_role;

ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payment_settings public read" ON public.payment_settings FOR SELECT USING (true);
CREATE POLICY "payment_settings admin insert" ON public.payment_settings FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "payment_settings admin update" ON public.payment_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "payment_settings admin delete" ON public.payment_settings FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_payment_settings_updated BEFORE UPDATE ON public.payment_settings FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.payment_settings (
  currency, currency_symbol, cod_enabled, cod_charge, delivery_charge, free_delivery_above,
  easypaisa_enabled, easypaisa_number, easypaisa_account_name,
  jazzcash_enabled, jazzcash_number, jazzcash_account_name,
  bank_enabled, bank_name, bank_account_title, bank_account_number, bank_iban,
  warranty_months, warranty_note, payment_note
) VALUES (
  'PKR', 'Rs', true, 0, 250, 5000,
  true, '0300-1234567', 'Timera Store',
  true, '0300-1234567', 'Timera Store',
  true, 'Meezan Bank', 'Timera Store', '01234567890123', 'PK00MEZN0001234567890123',
  12,
  '1 saal ki warranty, premium gift box aur warranty card har watch ke saath.',
  'Order confirm hone ke baad hamari team WhatsApp/Call par payment aur delivery confirm karegi.'
);