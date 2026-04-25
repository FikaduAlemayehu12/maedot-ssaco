import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type SiteSettings = {
  logo_url: string | null;
  phone: string;
  motto_en: string;
  motto_am: string;
  org_name_en: string;
  org_name_am: string;
  address: string | null;
  email: string | null;
};

const defaults: SiteSettings = {
  logo_url: null,
  phone: "0903373727",
  motto_en: "Transforming Together",
  motto_am: "በጋራ እንሻገር",
  org_name_en: "Maedot Saving and Credit Cooperative Society",
  org_name_am: "ማዕዶት የገንዘብ ቁጠባና ብድር መሰረታዊ የህብረት ሥራ ማህበር",
  address: null,
  email: null,
};

export const useSiteSettings = () => {
  const [settings, setSettings] = useState<SiteSettings>(defaults);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    supabase
      .from("site_settings")
      .select("logo_url, phone, motto_en, motto_am, org_name_en, org_name_am, address, email")
      .eq("id", 1)
      .maybeSingle()
      .then(({ data }) => {
        if (!mounted) return;
        if (data) setSettings({ ...defaults, ...(data as Partial<SiteSettings>) });
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return { settings, loading };
};
