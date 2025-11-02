# Database Schema Plan

## 1. Tables

### users

This table is managed by Supabase auth.

- id UUID PRIMARY KEY DEFAULT gen_random_uuid()
- email VARCHAR(255) UNIQUE NOT NULL
- hashed_password TEXT NOT NULL
- created_at TIMESTAMP WITH TIME ZONE DEFAULT now()

### sports

- id UUID PRIMARY KEY DEFAULT gen_random_uuid()
- code TEXT UNIQUE NOT NULL
- name TEXT NOT NULL
- description TEXT
- consolidated JSONB

### goals

- id UUID PRIMARY KEY DEFAULT gen_random_uuid()
- user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
- sport_id UUID REFERENCES sports(id) ON DELETE CASCADE
- scope_type goal_scope_type NOT NULL
- year INTEGER NOT NULL
- metric_type goal_metric_type NOT NULL
- target_value NUMERIC NOT NULL CHECK (target_value >= 0)
- created_at TIMESTAMP WITH TIME ZONE DEFAULT now()

### goal_history

- id UUID PRIMARY KEY DEFAULT gen_random_uuid()
- goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE
- previous_metric_type goal_metric_type NOT NULL
- previous_target_value NUMERIC NOT NULL CHECK (previous_target_value >= 0)
- changed_at TIMESTAMP WITH TIME ZONE DEFAULT now()

### activities

- id UUID PRIMARY KEY DEFAULT gen_random_uuid()
- user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
- name TEXT NOT NULL
- type TEXT NOT NULL
- sport_type TEXT NOT NULL
- start_date TIMESTAMP WITH TIME ZONE NOT NULL
- start_date_local TIMESTAMP WITH TIME ZONE NOT NULL
- timezone TEXT NOT NULL
- utc_offset INTEGER NOT NULL
- distance NUMERIC NOT NULL CHECK (distance >= 0)
- moving_time INTERVAL NOT NULL
- elapsed_time INTERVAL NOT NULL
- total_elevation_gain NUMERIC NOT NULL CHECK (total_elevation_gain >= 0)
- average_speed NUMERIC NOT NULL CHECK (average_speed >= 0)
- created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
- updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()

### ai_suggestions

- id UUID PRIMARY KEY DEFAULT gen_random_uuid()
- user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
- suggestion_data JSONB NOT NULL
- created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
- updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
- status suggestion_status NOT NULL
- response_time_ms INT NOT NULL CHECK (response_time_ms >= 0)
- error_message TEXT

## 2. Enumerations

```sql
CREATE TYPE goal_scope_type AS ENUM ('global', 'per_sport');
CREATE TYPE goal_metric_type AS ENUM ('distance', 'time', 'elevation_gain');
CREATE TYPE suggestion_status AS ENUM ('pending', 'accepted', 'rejected');
```

## 3. Indexes

- CREATE INDEX idx_activities_user_start_date ON activities (user_id, start_date);
- CREATE INDEX idx_goals_user_year ON goals (user_id, year);
- CREATE INDEX idx_ai_suggestions_user_status_created ON ai_suggestions (user_id, status, created_at);

## 4. Row-Level Security (RLS) Policies

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sports ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_suggestions ENABLE ROW LEVEL SECURITY;

-- Restrict rows to the authenticated user
CREATE POLICY users_isolation ON users FOR ALL USING (id = auth.uid());
CREATE POLICY goals_isolation ON goals FOR ALL USING (user_id = auth.uid());
CREATE POLICY goal_history_isolation ON goal_history FOR ALL USING (
  EXISTS (
    SELECT 1 FROM goals WHERE id = goal_history.goal_id AND user_id = auth.uid()
  )
);
CREATE POLICY activities_isolation ON activities FOR ALL USING (user_id = auth.uid());
CREATE POLICY ai_suggestions_isolation ON ai_suggestions FOR ALL USING (user_id = auth.uid());
```

## 5. Additional Notes

- All primary keys use `UUID` with `DEFAULT gen_random_uuid()` for consistency and uniqueness.
- `ON DELETE CASCADE` on foreign key relationships cleans up dependent records when a user or parent record is removed.
- Check constraints ensure non-negative values for all metric and time-related fields.
- Enums (`goal_scope_type`, `goal_metric_type`, `suggestion_status`) enforce valid domain values.
- Indexes are B-tree by default in PostgreSQL, optimized for equality and range queries on user filters.
- RLS policies ensure each user can only access their own data, protecting privacy and security.
