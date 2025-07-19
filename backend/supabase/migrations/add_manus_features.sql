-- Task plans table
CREATE TABLE IF NOT EXISTS task_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID REFERENCES agents(id),
    goal TEXT NOT NULL,
    complexity VARCHAR(20) NOT NULL,
    phases JSONB NOT NULL,
    current_phase INTEGER DEFAULT 1,
    status VARCHAR(20) DEFAULT 'active',
    estimated_total_duration VARCHAR(50),
    success_metrics JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agent memory table  
CREATE TABLE IF NOT EXISTS agent_memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID REFERENCES agents(id),
    phase_id INTEGER,
    memory_type VARCHAR(50) NOT NULL,
    memory_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agent loop events table
CREATE TABLE IF NOT EXISTS agent_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID REFERENCES agents(id),
    event_type VARCHAR(50) NOT NULL,
    event_data JSONB NOT NULL,
    phase_id INTEGER,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tool performance metrics table
CREATE TABLE IF NOT EXISTS tool_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tool_name VARCHAR(100) NOT NULL,
    agent_id UUID REFERENCES agents(id),
    execution_time FLOAT,
    success BOOLEAN,
    error_message TEXT,
    metadata JSONB,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_task_plans_agent_id ON task_plans(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_memory_agent_id ON agent_memory(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_events_agent_id ON agent_events(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_events_timestamp ON agent_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_tool_performance_agent_id ON tool_performance(agent_id);
CREATE INDEX IF NOT EXISTS idx_tool_performance_tool_name ON tool_performance(tool_name);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_task_plans_updated_at BEFORE UPDATE ON task_plans 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_memory_updated_at BEFORE UPDATE ON agent_memory 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

