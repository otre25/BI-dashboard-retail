// Supabase Configuration
// This is a placeholder - you'll need to create a Supabase project at https://supabase.com

export const supabaseConfig = {
  // Replace with your Supabase project URL
  url: import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co',

  // Replace with your Supabase anon/public key
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key-here',
};

// Database tables structure (for reference)
export const DATABASE_SCHEMA = {
  tables: {
    users: `
      CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        role TEXT CHECK (role IN ('admin', 'manager', 'viewer')) NOT NULL DEFAULT 'viewer',
        company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
        avatar_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        last_login TIMESTAMP WITH TIME ZONE
      );
    `,

    companies: `
      CREATE TABLE companies (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name TEXT NOT NULL,
        industry TEXT NOT NULL,
        currency TEXT DEFAULT 'EUR',
        timezone TEXT DEFAULT 'Europe/Rome',
        fiscal_year_start TEXT DEFAULT '01-01',
        default_date_range INTEGER DEFAULT 30,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `,

    budgets: `
      CREATE TABLE budgets (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        category TEXT CHECK (category IN ('advertising', 'operations', 'salaries', 'other')) NOT NULL,
        amount DECIMAL(15, 2) NOT NULL,
        period TEXT CHECK (period IN ('monthly', 'quarterly', 'yearly')) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        currency TEXT DEFAULT 'EUR',
        created_by UUID REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `,

    budget_allocations: `
      CREATE TABLE budget_allocations (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        budget_id UUID REFERENCES budgets(id) ON DELETE CASCADE,
        channel TEXT,
        store_id TEXT,
        allocated DECIMAL(15, 2) NOT NULL,
        spent DECIMAL(15, 2) DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `,

    budget_alerts: `
      CREATE TABLE budget_alerts (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        budget_id UUID REFERENCES budgets(id) ON DELETE CASCADE,
        type TEXT CHECK (type IN ('warning', 'danger', 'exceeded')) NOT NULL,
        threshold INTEGER NOT NULL,
        message TEXT NOT NULL,
        triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        acknowledged BOOLEAN DEFAULT FALSE
      );
    `,

    oauth_connections: `
      CREATE TABLE oauth_connections (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
        provider TEXT CHECK (provider IN ('meta', 'google', 'tiktok')) NOT NULL,
        access_token TEXT NOT NULL,
        refresh_token TEXT,
        expires_at TIMESTAMP WITH TIME ZONE,
        scope TEXT,
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(company_id, provider)
      );
    `,

    data_sources: `
      CREATE TABLE data_sources (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
        type TEXT CHECK (type IN ('airtable', 'notion', 'googlesheets', 'excel')) NOT NULL,
        name TEXT NOT NULL,
        enabled BOOLEAN DEFAULT TRUE,
        credentials JSONB NOT NULL,
        mappings JSONB DEFAULT '[]',
        last_sync TIMESTAMP WITH TIME ZONE,
        sync_interval INTEGER,
        auto_sync BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `,
  },

  // Row Level Security (RLS) policies
  policies: {
    users: `
      -- Users can only see users from their own company
      CREATE POLICY users_company_isolation ON users
        FOR SELECT
        USING (company_id = auth.jwt() ->> 'company_id');

      -- Only admins can insert/update/delete users
      CREATE POLICY users_admin_only ON users
        FOR ALL
        USING (
          EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role = 'admin'
            AND company_id = users.company_id
          )
        );
    `,

    budgets: `
      -- Users can only see budgets from their own company
      CREATE POLICY budgets_company_isolation ON budgets
        FOR SELECT
        USING (company_id = auth.jwt() ->> 'company_id');

      -- Only admins and managers can create/edit budgets
      CREATE POLICY budgets_manager_access ON budgets
        FOR ALL
        USING (
          EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role IN ('admin', 'manager')
            AND company_id = budgets.company_id
          )
        );
    `,
  },
};

// Setup instructions
export const SETUP_INSTRUCTIONS = `
# Supabase Setup Instructions

1. Create a new project at https://supabase.com
2. Go to Project Settings → API
3. Copy your project URL and anon key
4. Create a .env file in the project root with:
   VITE_SUPABASE_URL=your-project-url
   VITE_SUPABASE_ANON_KEY=your-anon-key

5. Run the SQL commands in the SQL Editor:
   - Execute all CREATE TABLE statements
   - Enable Row Level Security (RLS) on all tables
   - Apply the RLS policies

6. Configure OAuth providers:
   - Meta: https://supabase.com/docs/guides/auth/social-login/auth-meta
   - Google: https://supabase.com/docs/guides/auth/social-login/auth-google
`;
