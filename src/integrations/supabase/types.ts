export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      analytics_events: {
        Row: {
          created_at: string
          currency: string
          event_name: string
          id: string
          metadata: Json
          order_number: string | null
          page_path: string | null
          product_id: string | null
          product_name: string | null
          product_slug: string | null
          referrer: string | null
          session_id: string | null
          user_agent: string | null
          value: number | null
        }
        Insert: {
          created_at?: string
          currency?: string
          event_name: string
          id?: string
          metadata?: Json
          order_number?: string | null
          page_path?: string | null
          product_id?: string | null
          product_name?: string | null
          product_slug?: string | null
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          value?: number | null
        }
        Update: {
          created_at?: string
          currency?: string
          event_name?: string
          id?: string
          metadata?: Json
          order_number?: string | null
          page_path?: string | null
          product_id?: string | null
          product_name?: string | null
          product_slug?: string | null
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          value?: number | null
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author: string
          category: string
          content: string | null
          created_at: string
          excerpt: string | null
          id: string
          image_url: string | null
          published: boolean
          published_at: string
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          author?: string
          category?: string
          content?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          image_url?: string | null
          published?: boolean
          published_at?: string
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          author?: string
          category?: string
          content?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          image_url?: string | null
          published?: boolean
          published_at?: string
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      collections: {
        Row: {
          active: boolean
          created_at: string
          id: string
          image_url: string | null
          name: string
          slug: string
          sort_order: number
          tagline: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          image_url?: string | null
          name: string
          slug: string
          sort_order?: number
          tagline?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          image_url?: string | null
          name?: string
          slug?: string
          sort_order?: number
          tagline?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      coupons: {
        Row: {
          active: boolean
          code: string
          created_at: string
          description: string | null
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          min_order: number
          updated_at: string
          usage_limit: number | null
          used_count: number
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          min_order?: number
          updated_at?: string
          usage_limit?: number | null
          used_count?: number
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          min_order?: number
          updated_at?: string
          usage_limit?: number | null
          used_count?: number
        }
        Relationships: []
      }
      deals: {
        Row: {
          active: boolean
          badge: string | null
          code: string | null
          created_at: string
          cta_href: string | null
          cta_label: string | null
          description: string | null
          discount_percent: number
          ends_at: string | null
          id: string
          image_url: string | null
          slug: string | null
          sort_order: number
          starts_at: string | null
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          badge?: string | null
          code?: string | null
          created_at?: string
          cta_href?: string | null
          cta_label?: string | null
          description?: string | null
          discount_percent?: number
          ends_at?: string | null
          id?: string
          image_url?: string | null
          slug?: string | null
          sort_order?: number
          starts_at?: string | null
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          badge?: string | null
          code?: string | null
          created_at?: string
          cta_href?: string | null
          cta_label?: string | null
          description?: string | null
          discount_percent?: number
          ends_at?: string | null
          id?: string
          image_url?: string | null
          slug?: string | null
          sort_order?: number
          starts_at?: string | null
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      faqs: {
        Row: {
          active: boolean
          answer: string
          category: string | null
          created_at: string
          id: string
          question: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          answer: string
          category?: string | null
          created_at?: string
          id?: string
          question: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          answer?: string
          category?: string | null
          created_at?: string
          id?: string
          question?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      hero_slides: {
        Row: {
          active: boolean
          created_at: string
          cta_href: string | null
          cta_label: string | null
          description: string | null
          eyebrow: string | null
          id: string
          image_url: string
          sort_order: number
          title: string
          title_accent: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          cta_href?: string | null
          cta_label?: string | null
          description?: string | null
          eyebrow?: string | null
          id?: string
          image_url: string
          sort_order?: number
          title: string
          title_accent?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          cta_href?: string | null
          cta_label?: string | null
          description?: string | null
          eyebrow?: string | null
          id?: string
          image_url?: string
          sort_order?: number
          title?: string
          title_accent?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          coupon_code: string | null
          courier: string | null
          created_at: string
          customer_email: string
          customer_name: string
          customer_phone: string | null
          discount: number
          estimated_delivery: string | null
          id: string
          items: Json
          notes: string | null
          order_number: string
          shipping: number
          shipping_address: string | null
          status: string
          status_history: Json
          subtotal: number
          total: number
          tracking_number: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          coupon_code?: string | null
          courier?: string | null
          created_at?: string
          customer_email: string
          customer_name: string
          customer_phone?: string | null
          discount?: number
          estimated_delivery?: string | null
          id?: string
          items?: Json
          notes?: string | null
          order_number: string
          shipping?: number
          shipping_address?: string | null
          status?: string
          status_history?: Json
          subtotal?: number
          total?: number
          tracking_number?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          coupon_code?: string | null
          courier?: string | null
          created_at?: string
          customer_email?: string
          customer_name?: string
          customer_phone?: string | null
          discount?: number
          estimated_delivery?: string | null
          id?: string
          items?: Json
          notes?: string | null
          order_number?: string
          shipping?: number
          shipping_address?: string | null
          status?: string
          status_history?: Json
          subtotal?: number
          total?: number
          tracking_number?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      payment_settings: {
        Row: {
          bank_account_number: string | null
          bank_account_title: string | null
          bank_enabled: boolean
          bank_iban: string | null
          bank_name: string | null
          cod_charge: number
          cod_enabled: boolean
          created_at: string
          currency: string
          currency_symbol: string
          delivery_charge: number
          easypaisa_account_name: string | null
          easypaisa_enabled: boolean
          easypaisa_number: string | null
          free_delivery_above: number
          id: string
          jazzcash_account_name: string | null
          jazzcash_enabled: boolean
          jazzcash_number: string | null
          payment_note: string | null
          updated_at: string
          warranty_months: number
          warranty_note: string
        }
        Insert: {
          bank_account_number?: string | null
          bank_account_title?: string | null
          bank_enabled?: boolean
          bank_iban?: string | null
          bank_name?: string | null
          cod_charge?: number
          cod_enabled?: boolean
          created_at?: string
          currency?: string
          currency_symbol?: string
          delivery_charge?: number
          easypaisa_account_name?: string | null
          easypaisa_enabled?: boolean
          easypaisa_number?: string | null
          free_delivery_above?: number
          id?: string
          jazzcash_account_name?: string | null
          jazzcash_enabled?: boolean
          jazzcash_number?: string | null
          payment_note?: string | null
          updated_at?: string
          warranty_months?: number
          warranty_note?: string
        }
        Update: {
          bank_account_number?: string | null
          bank_account_title?: string | null
          bank_enabled?: boolean
          bank_iban?: string | null
          bank_name?: string | null
          cod_charge?: number
          cod_enabled?: boolean
          created_at?: string
          currency?: string
          currency_symbol?: string
          delivery_charge?: number
          easypaisa_account_name?: string | null
          easypaisa_enabled?: boolean
          easypaisa_number?: string | null
          free_delivery_above?: number
          id?: string
          jazzcash_account_name?: string | null
          jazzcash_enabled?: boolean
          jazzcash_number?: string | null
          payment_note?: string | null
          updated_at?: string
          warranty_months?: number
          warranty_note?: string
        }
        Relationships: []
      }
      popups: {
        Row: {
          active: boolean
          badge: string | null
          coupon_code: string | null
          created_at: string
          cta_href: string | null
          cta_label: string | null
          delay_seconds: number
          ends_at: string | null
          frequency: string
          id: string
          image_url: string | null
          message: string | null
          sort_order: number
          starts_at: string | null
          title: string
          trigger_type: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          badge?: string | null
          coupon_code?: string | null
          created_at?: string
          cta_href?: string | null
          cta_label?: string | null
          delay_seconds?: number
          ends_at?: string | null
          frequency?: string
          id?: string
          image_url?: string | null
          message?: string | null
          sort_order?: number
          starts_at?: string | null
          title: string
          trigger_type?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          badge?: string | null
          coupon_code?: string | null
          created_at?: string
          cta_href?: string | null
          cta_label?: string | null
          delay_seconds?: number
          ends_at?: string | null
          frequency?: string
          id?: string
          image_url?: string | null
          message?: string | null
          sort_order?: number
          starts_at?: string | null
          title?: string
          trigger_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          active: boolean
          badge: string | null
          brand: string
          case_material: string
          category: string | null
          collection: string
          colors: Json
          compare_at: number | null
          created_at: string
          deal_id: string | null
          description: string
          featured: boolean
          features: Json
          gallery: Json
          id: string
          image_url: string
          movement: string
          name: string
          price: number
          rating: number
          reviews: number
          sale_price: number | null
          seo_description: string | null
          seo_keywords: string | null
          seo_title: string | null
          sizes: Json
          slug: string
          sort_order: number
          stock: number
          strap: string
          updated_at: string
          water_resistance: string
        }
        Insert: {
          active?: boolean
          badge?: string | null
          brand?: string
          case_material?: string
          category?: string | null
          collection?: string
          colors?: Json
          compare_at?: number | null
          created_at?: string
          deal_id?: string | null
          description?: string
          featured?: boolean
          features?: Json
          gallery?: Json
          id?: string
          image_url: string
          movement?: string
          name: string
          price?: number
          rating?: number
          reviews?: number
          sale_price?: number | null
          seo_description?: string | null
          seo_keywords?: string | null
          seo_title?: string | null
          sizes?: Json
          slug: string
          sort_order?: number
          stock?: number
          strap?: string
          updated_at?: string
          water_resistance?: string
        }
        Update: {
          active?: boolean
          badge?: string | null
          brand?: string
          case_material?: string
          category?: string | null
          collection?: string
          colors?: Json
          compare_at?: number | null
          created_at?: string
          deal_id?: string | null
          description?: string
          featured?: boolean
          features?: Json
          gallery?: Json
          id?: string
          image_url?: string
          movement?: string
          name?: string
          price?: number
          rating?: number
          reviews?: number
          sale_price?: number | null
          seo_description?: string | null
          seo_keywords?: string | null
          seo_title?: string | null
          sizes?: Json
          slug?: string
          sort_order?: number
          stock?: number
          strap?: string
          updated_at?: string
          water_resistance?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          city: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          postal_code: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          postal_code?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          postal_code?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          approved: boolean
          body: string | null
          created_at: string
          customer_name: string
          customer_role: string | null
          featured: boolean
          id: string
          product_id: string | null
          rating: number
          title: string | null
          updated_at: string
        }
        Insert: {
          approved?: boolean
          body?: string | null
          created_at?: string
          customer_name: string
          customer_role?: string | null
          featured?: boolean
          id?: string
          product_id?: string | null
          rating?: number
          title?: string | null
          updated_at?: string
        }
        Update: {
          approved?: boolean
          body?: string | null
          created_at?: string
          customer_name?: string
          customer_role?: string | null
          featured?: boolean
          id?: string
          product_id?: string | null
          rating?: number
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          address: string | null
          brand_name: string
          brand_suffix: string | null
          brand_tagline: string | null
          contact_email: string | null
          contact_hours: string | null
          contact_phone: string | null
          created_at: string
          facebook_url: string | null
          feature_cta_href: string | null
          feature_cta_label: string | null
          feature_description: string | null
          feature_enabled: boolean
          feature_ends_at: string | null
          feature_eyebrow: string | null
          feature_image_url: string | null
          feature_title: string | null
          feature_title_accent: string | null
          featured_in: Json
          footer_links: Json
          google_ads_purchase_label: string | null
          google_tag_id: string | null
          id: string
          instagram_url: string | null
          logo_url: string | null
          marquee_enabled: boolean
          marquee_items: Json
          meta_pixel_id: string | null
          nav_links: Json
          tiktok_url: string | null
          tracking_enabled: boolean
          updated_at: string
          warranty_years: number
          whatsapp_number: string | null
          youtube_url: string | null
        }
        Insert: {
          address?: string | null
          brand_name?: string
          brand_suffix?: string | null
          brand_tagline?: string | null
          contact_email?: string | null
          contact_hours?: string | null
          contact_phone?: string | null
          created_at?: string
          facebook_url?: string | null
          feature_cta_href?: string | null
          feature_cta_label?: string | null
          feature_description?: string | null
          feature_enabled?: boolean
          feature_ends_at?: string | null
          feature_eyebrow?: string | null
          feature_image_url?: string | null
          feature_title?: string | null
          feature_title_accent?: string | null
          featured_in?: Json
          footer_links?: Json
          google_ads_purchase_label?: string | null
          google_tag_id?: string | null
          id?: string
          instagram_url?: string | null
          logo_url?: string | null
          marquee_enabled?: boolean
          marquee_items?: Json
          meta_pixel_id?: string | null
          nav_links?: Json
          tiktok_url?: string | null
          tracking_enabled?: boolean
          updated_at?: string
          warranty_years?: number
          whatsapp_number?: string | null
          youtube_url?: string | null
        }
        Update: {
          address?: string | null
          brand_name?: string
          brand_suffix?: string | null
          brand_tagline?: string | null
          contact_email?: string | null
          contact_hours?: string | null
          contact_phone?: string | null
          created_at?: string
          facebook_url?: string | null
          feature_cta_href?: string | null
          feature_cta_label?: string | null
          feature_description?: string | null
          feature_enabled?: boolean
          feature_ends_at?: string | null
          feature_eyebrow?: string | null
          feature_image_url?: string | null
          feature_title?: string | null
          feature_title_accent?: string | null
          featured_in?: Json
          footer_links?: Json
          google_ads_purchase_label?: string | null
          google_tag_id?: string | null
          id?: string
          instagram_url?: string | null
          logo_url?: string | null
          marquee_enabled?: boolean
          marquee_items?: Json
          meta_pixel_id?: string | null
          nav_links?: Json
          tiktok_url?: string | null
          tracking_enabled?: boolean
          updated_at?: string
          warranty_years?: number
          whatsapp_number?: string | null
          youtube_url?: string | null
        }
        Relationships: []
      }
      trust_sections: {
        Row: {
          active: boolean
          body: string | null
          bullets: Json
          created_at: string
          group_name: string
          heading: string
          icon: string | null
          id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          body?: string | null
          bullets?: Json
          created_at?: string
          group_name?: string
          heading: string
          icon?: string | null
          id?: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          body?: string | null
          bullets?: Json
          created_at?: string
          group_name?: string
          heading?: string
          icon?: string | null
          id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      payment_settings_public: {
        Row: {
          bank_enabled: boolean | null
          cod_charge: number | null
          cod_enabled: boolean | null
          created_at: string | null
          currency: string | null
          currency_symbol: string | null
          delivery_charge: number | null
          easypaisa_enabled: boolean | null
          free_delivery_above: number | null
          id: string | null
          jazzcash_enabled: boolean | null
          payment_note: string | null
          warranty_months: number | null
          warranty_note: string | null
        }
        Insert: {
          bank_enabled?: boolean | null
          cod_charge?: number | null
          cod_enabled?: boolean | null
          created_at?: string | null
          currency?: string | null
          currency_symbol?: string | null
          delivery_charge?: number | null
          easypaisa_enabled?: boolean | null
          free_delivery_above?: number | null
          id?: string | null
          jazzcash_enabled?: boolean | null
          payment_note?: string | null
          warranty_months?: number | null
          warranty_note?: string | null
        }
        Update: {
          bank_enabled?: boolean | null
          cod_charge?: number | null
          cod_enabled?: boolean | null
          created_at?: string | null
          currency?: string | null
          currency_symbol?: string | null
          delivery_charge?: number | null
          easypaisa_enabled?: boolean | null
          free_delivery_above?: number | null
          id?: string | null
          jazzcash_enabled?: boolean | null
          payment_note?: string | null
          warranty_months?: number | null
          warranty_note?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      slugify: { Args: { _input: string }; Returns: string }
      unaccent_fallback: { Args: { _input: string }; Returns: string }
    }
    Enums: {
      app_role: "admin" | "staff" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "staff", "user"],
    },
  },
} as const
