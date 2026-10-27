-- ==============================================================================
-- "SHALL WE PLAY A GAME?" — SUPABASE PRODUCTION DATABASE SCHEMA
-- Ephemeral BaaS Infrastructure with Row-Level Security (RLS) & Realtime Sync
-- ==============================================================================

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Drop existing tables if re-initializing
DROP VIEW IF EXISTS leaderboard_view CASCADE;
DROP TABLE IF EXISTS submissions CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS challenges CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;

-- ------------------------------------------------------------------------------
-- 3. Rooms Table (Multi-tenancy & Access PINs)
-- ------------------------------------------------------------------------------
CREATE TABLE rooms (
    room_code VARCHAR(32) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    duration_minutes INT DEFAULT 90 NOT NULL,
    started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ------------------------------------------------------------------------------
-- 4. Challenges Table (Authoritative Question Matrix)
-- ------------------------------------------------------------------------------
CREATE TABLE challenges (
    id VARCHAR(16) PRIMARY KEY,
    tier VARCHAR(2) NOT NULL,
    tier_name VARCHAR(64) NOT NULL,
    category VARCHAR(64) NOT NULL,
    title VARCHAR(128) NOT NULL,
    points INT NOT NULL,
    answer_hash VARCHAR(64) NOT NULL, -- SHA-256 hex string of normalized answer
    prompt TEXT NOT NULL,
    clue TEXT,
    input_placeholder VARCHAR(64) DEFAULT 'Answer...',
    hints JSONB DEFAULT '[]'::jsonb NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ------------------------------------------------------------------------------
-- 5. Teams Table (Onboarded Participants)
-- ------------------------------------------------------------------------------
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_code VARCHAR(32) NOT NULL REFERENCES rooms(room_code) ON DELETE CASCADE,
    team_name VARCHAR(64) NOT NULL,
    role_tag VARCHAR(32) DEFAULT 'Full-Stack' NOT NULL,
    avatar VARCHAR(64) DEFAULT 'terminal-green' NOT NULL,
    total_score INT DEFAULT 0 NOT NULL,
    challenges_solved INT DEFAULT 0 NOT NULL,
    last_submission_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_team_per_room UNIQUE (room_code, team_name)
);

-- ------------------------------------------------------------------------------
-- 6. Submissions Table (Audited Solves & Scoring Records)
-- ------------------------------------------------------------------------------
CREATE TABLE submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_code VARCHAR(32) NOT NULL REFERENCES rooms(room_code) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    challenge_id VARCHAR(16) NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    points_awarded INT NOT NULL,
    hints_used INT DEFAULT 0 NOT NULL,
    submitted_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_team_challenge UNIQUE (team_id, challenge_id)
);

-- ------------------------------------------------------------------------------
-- 7. Realtime Leaderboard View (Exposed to Projector & Client Dashboards)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE VIEW leaderboard_view AS
SELECT 
    t.id AS team_id,
    t.room_code,
    t.team_name,
    t.role_tag,
    t.avatar,
    t.total_score,
    t.challenges_solved,
    t.last_submission_at,
    DENSE_RANK() OVER (
        PARTITION BY t.room_code 
        ORDER BY t.total_score DESC, t.last_submission_at ASC
    ) AS rank
FROM teams t;

-- ------------------------------------------------------------------------------
-- 8. Row Level Security (RLS) Policies
-- ------------------------------------------------------------------------------
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Rooms: Public can read active rooms (to validate PIN)
CREATE POLICY "Public can view active rooms" 
ON rooms FOR SELECT 
USING (is_active = TRUE);

-- Challenges: Public read access
CREATE POLICY "Public can view challenges" 
ON challenges FOR SELECT 
USING (TRUE);

-- Teams: Public read access within same room; Anyone can register a new team
CREATE POLICY "Public can view teams" 
ON teams FOR SELECT 
USING (TRUE);

CREATE POLICY "Public can register teams" 
ON teams FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM rooms 
        WHERE rooms.room_code = teams.room_code 
          AND rooms.is_active = TRUE
    )
);

CREATE POLICY "Teams can update their own profile" 
ON teams FOR UPDATE 
USING (TRUE);

CREATE POLICY "Public can delete teams" 
ON teams FOR DELETE 
USING (TRUE);

-- Submissions: Public read access for live activity feed
CREATE POLICY "Public can view submissions" 
ON submissions FOR SELECT 
USING (TRUE);

CREATE POLICY "Public can create submissions" 
ON submissions FOR INSERT 
WITH CHECK (TRUE);

CREATE POLICY "Public can delete submissions" 
ON submissions FOR DELETE 
USING (TRUE);

-- ------------------------------------------------------------------------------
-- 9. Anti-Cheat & Atomic Submission Stored Procedure
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION submit_challenge_answer(
    p_room_code VARCHAR(32),
    p_team_id UUID,
    p_challenge_id VARCHAR(16),
    p_answer_hash VARCHAR(64),
    p_hints_used INT DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_room_active BOOLEAN;
    v_target_hash VARCHAR(64);
    v_base_points INT;
    v_penalty_pct NUMERIC := 0.0;
    v_final_points INT;
    v_already_solved BOOLEAN;
    v_last_attempt TIMESTAMPTZ;
    v_new_total INT;
    v_new_solved INT;
BEGIN
    -- 1. Verify Room is Active
    SELECT is_active INTO v_room_active 
    FROM rooms 
    WHERE room_code = p_room_code;
    
    IF v_room_active IS NULL OR NOT v_room_active THEN
        RETURN jsonb_build_object(
            'success', FALSE, 
            'error', 'ROOM_INACTIVE_OR_INVALID',
            'message', 'The event room is closed or does not exist.'
        );
    END IF;

    -- 2. Anti-Brute-Force Rate Limiting (3-second throttle)
    SELECT last_submission_at INTO v_last_attempt 
    FROM teams 
    WHERE id = p_team_id;

    IF v_last_attempt IS NOT NULL AND (NOW() - v_last_attempt) < INTERVAL '3 seconds' THEN
        RETURN jsonb_build_object(
            'success', FALSE, 
            'error', 'RATE_LIMITED',
            'message', 'Rate limit exceeded: Please wait 3 seconds before next submission.'
        );
    END IF;

    -- Update last attempt timestamp immediately
    UPDATE teams SET last_submission_at = NOW() WHERE id = p_team_id;

    -- 3. Check for Duplicate Solve
    SELECT EXISTS (
        SELECT 1 FROM submissions 
        WHERE team_id = p_team_id AND challenge_id = p_challenge_id
    ) INTO v_already_solved;

    IF v_already_solved THEN
        RETURN jsonb_build_object(
            'success', FALSE, 
            'error', 'ALREADY_SOLVED',
            'message', 'Your team has already solved this challenge!'
        );
    END IF;

    -- 4. Retrieve Challenge Data & Hash
    SELECT points, answer_hash INTO v_base_points, v_target_hash 
    FROM challenges 
    WHERE id = p_challenge_id;

    IF v_target_hash IS NULL THEN
        RETURN jsonb_build_object(
            'success', FALSE, 
            'error', 'CHALLENGE_NOT_FOUND',
            'message', 'Challenge ID does not exist.'
        );
    END IF;

    -- 5. Compare Hashes (Case-insensitive hex match)
    IF LOWER(p_answer_hash) <> LOWER(v_target_hash) THEN
        RETURN jsonb_build_object(
            'success', FALSE, 
            'error', 'INCORRECT_ANSWER',
            'message', 'Incorrect submission. Access denied by W.O.P.R.'
        );
    END IF;

    -- 6. Calculate Deductions (Hint 1 = 10%, Hint 2 = 25%, Both = 35%)
    IF p_hints_used = 1 THEN
        v_penalty_pct := 0.10;
    ELSIF p_hints_used >= 2 THEN
        v_penalty_pct := 0.35;
    END IF;

    v_final_points := GREATEST(10, ROUND(v_base_points * (1.0 - v_penalty_pct)));

    -- 7. Record Submission
    INSERT INTO submissions (room_code, team_id, challenge_id, points_awarded, hints_used, submitted_at)
    VALUES (p_room_code, p_team_id, p_challenge_id, v_final_points, p_hints_used, NOW());

    -- 8. Update Team Aggregates
    UPDATE teams 
    SET 
        total_score = total_score + v_final_points,
        challenges_solved = challenges_solved + 1,
        last_submission_at = NOW()
    WHERE id = p_team_id
    RETURNING total_score, challenges_solved INTO v_new_total, v_new_solved;

    -- 9. Return Success Payload
    RETURN jsonb_build_object(
        'success', TRUE,
        'challenge_id', p_challenge_id,
        'points_awarded', v_final_points,
        'total_score', v_new_total,
        'challenges_solved', v_new_solved,
        'message', 'AUTHENTICATION GRANTED // SOLVE CONFIRMED'
    );
END;
$$;

-- ------------------------------------------------------------------------------
-- 10. Operator Reset Stored Procedure
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION reset_room_data(
    p_room_code VARCHAR(32) DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_target_room VARCHAR(32);
    v_submissions_deleted INT := 0;
    v_teams_deleted INT := 0;
BEGIN
    v_target_room := COALESCE(NULLIF(TRIM(p_room_code), ''), 'DEFCON-1983');

    IF UPPER(v_target_room) = 'ALL' THEN
        WITH deleted_subs AS (
            DELETE FROM submissions RETURNING id
        )
        SELECT COUNT(*) INTO v_submissions_deleted FROM deleted_subs;

        WITH deleted_teams AS (
            DELETE FROM teams RETURNING id
        )
        SELECT COUNT(*) INTO v_teams_deleted FROM deleted_teams;
    ELSE
        WITH deleted_subs AS (
            DELETE FROM submissions 
            WHERE room_code = v_target_room
            RETURNING id
        )
        SELECT COUNT(*) INTO v_submissions_deleted FROM deleted_subs;

        WITH deleted_teams AS (
            DELETE FROM teams 
            WHERE room_code = v_target_room
            RETURNING id
        )
        SELECT COUNT(*) INTO v_teams_deleted FROM deleted_teams;
    END IF;

    RETURN jsonb_build_object(
        'success', TRUE,
        'room_code', v_target_room,
        'teams_deleted', v_teams_deleted,
        'submissions_deleted', v_submissions_deleted,
        'message', format('Room %s reset: %s teams and %s submissions removed.', v_target_room, v_teams_deleted, v_submissions_deleted)
    );
END;
$$;

GRANT EXECUTE ON FUNCTION reset_room_data(VARCHAR) TO anon, authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 11. Enable Supabase Realtime Subscriptions
-- ------------------------------------------------------------------------------
DO $$
BEGIN
  -- Ensure publication exists
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;

  -- Add teams table if not already present in publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'teams'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE teams;
  END IF;

  -- Add submissions table if not already present in publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'submissions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE submissions;
  END IF;
END $$;


-- ------------------------------------------------------------------------------
-- 11. Initial Seed Data (Default Room & 10 Challenges)
-- ------------------------------------------------------------------------------
INSERT INTO rooms (room_code, name, is_active, duration_minutes)
VALUES 
    ('DEFCON-193', 'W.O.P.R. Live Hackathon', TRUE, 90),
    ('DEFCON-1983', 'W.O.P.R. Global Simulation', TRUE, 90)
ON CONFLICT (room_code) DO NOTHING;


INSERT INTO challenges (id, tier, tier_name, category, title, points, answer_hash, prompt, clue, input_placeholder, hints)
VALUES
(
    'CHAL-01',
    'A',
    'Tier A: Web Scavenger & OSINT',
    'DOM & Elements',
    'Ghost in the DOM',
    100,
    '8937c905c3fff1b71bef90820a542a89aff496b4c6a59496b009d1448d564992',
    'A rogue W.O.P.R. systems engineer left a clandestine debug marker embedded directly inside the document object model of this application. Inspect the page markup using browser DevTools or the embedded Terminal Simulator.',
    'Inspect the HTML source code or open the W.O.P.R. Terminal DOM tab.',
    'FLAG{...}',
    '[{"id": 1, "penaltyPct": 10, "text": "Check HTML comments near the main container element or footer in the source."}, {"id": 2, "penaltyPct": 25, "text": "Search the Elements panel or DOM Inspector for SECRET_FLAG."}]'::jsonb
),
(
    'CHAL-02',
    'A',
    'Tier A: Web Scavenger & OSINT',
    'Web Security & Crawlers',
    'Robots & Disallowed Vectors',
    150,
    'f5fa62cfa32620be876f5fa094cf3d9bce88983fc9cea32bff8d769f7b4cbdd6',
    'Before automated web scrapers index search engines, they query standard compliance directives to determine forbidden sectors. Check the host crawler policy to locate the hidden perimeter flag.',
    'Direct your browser to /robots.txt or type "cat /robots.txt" in the W.O.P.R. Console.',
    'FLAG{...}',
    '[{"id": 1, "penaltyPct": 10, "text": "Every compliant web server hosts a plain text file at the root path detailing crawler permissions."}, {"id": 2, "penaltyPct": 25, "text": "Check the last Disallow directive or read the notice in /robots.txt."}]'::jsonb
),
(
    'CHAL-03',
    'A',
    'Tier A: Web Scavenger & OSINT',
    'HTTP Telemetry',
    'The Secret Header',
    175,
    '129a1e533ccacf4309657b9d6502cae8ba9287b212f58ed12e2a9a2ab668d3d5',
    'When our simulated internal auth handshake initiates, the server attaches a non-standard military response header: X-WOPR-DEFCON-KEY. Inspect the simulated network traffic on /api/v1/auth/handshake to retrieve the key.',
    'Open the W.O.P.R. Terminal Simulator -> Network tab, or run "curl /api/v1/auth/handshake" in the terminal.',
    'JOSHUA-XXXX-DEFCON-X',
    '[{"id": 1, "penaltyPct": 10, "text": "The custom header begins with X-WOPR-DEFCON-KEY."}, {"id": 2, "penaltyPct": 25, "text": "Format: JOSHUA-1983-DEFCON-1. Check the simulated headers table in the Network tab."}]'::jsonb
),
(
    'CHAL-04',
    'B',
    'Tier B: Tech Trivia & Architecture',
    'POSIX & Systems',
    'POSIX Signal Mastery',
    125,
    '71757acbda69de04e219cf2cc4c27facceb4179313526d105e680aa0afb8009e',
    'When a systems engineer triggers [Ctrl] + [C] in a standard POSIX shell (bash/zsh), which asynchronous inter-process termination signal name is sent to the foreground process group?',
    'Provide the standard uppercase signal name (e.g. SIGKILL, SIGHUP, SIGTERM, ...).',
    'SIG...',
    '[{"id": 1, "penaltyPct": 10, "text": "It has signal integer number 2 on standard Linux x86/ARM."}, {"id": 2, "penaltyPct": 25, "text": "The signal stands for Signal Interrupt."}]'::jsonb
),
(
    'CHAL-05',
    'B',
    'Tier B: Tech Trivia & Architecture',
    'Distributed Systems',
    'The CAP Conundrum',
    150,
    '84810bfea2375dab1b1c8417b8eed248488f55b002f091f4d4ef37dffca3b307',
    'According to Eric Brewers CAP Theorem, a distributed data store can guarantee at most two of three properties during network partitioning. When an active network partition occurs, systems like Apache Cassandra or Amazon Dynamo configured for high availability choose Availability over Consistency. What is the standard 2-letter classification for this architectural posture?',
    'Enter the 2-letter uppercase acronym (e.g., CP, CA, or AP).',
    'XX',
    '[{"id": 1, "penaltyPct": 10, "text": "Partition tolerance (P) is mandatory on real networks. Which property did the system preserve?"}, {"id": 2, "penaltyPct": 25, "text": "Availability (A) + Partition Tolerance (P)."}]'::jsonb
),
(
    'CHAL-06',
    'B',
    'Tier B: Tech Trivia & Architecture',
    'Regex & Network Logs',
    'The Regex Network Hunter',
    150,
    '2534c564adcb9b4274f7694696cc7691b63533367ea690dd5d44b9ddb6f9d066',
    'An anomalous telemetry record appeared in the W.O.P.R. gateway logs: "2026-10-22T06:14:02.812Z [ROUTER-CORE] Ingress packet dropped from 172.16.4.99; Internal default gateway route assigned to 31 30 2e 32 34 30 2e 31 36 2e 31 via interface vlan100; MAC 00:1A:2B:3C:4D:5E". What is the IP address of the internal default gateway in this log message?',
    'The IP address is listed in the log message in hexadecimal format. Extract the exact IPv4 address matching the gateway clause with hexdump in the terminal.',
    'XXX.XXX.XXX.XXX',
    '[{"id": 1, "penaltyPct": 10, "text": "Look closely at the clause Internal default gateway route assigned to ..."}, {"id": 2, "penaltyPct": 25, "text": "It belongs to the private RFC 1918 Class A 10.x.x.x block."}]'::jsonb
),
(
    'CHAL-07',
    'B',
    'Tier B: Tech Trivia & Architecture',
    'RFC & Protocols',
    'Rate Limit Standards',
    100,
    '2d1007980f49215311f7f1012e84f99b801eb5daeca04dedea3ada41cc45353b',
    'Under RFC 6585 (Additional HTTP Status Codes), what 3-digit HTTP status code must an API gateway return when a client has exceeded its allotted request quota ("Too Many Requests")?',
    'Enter the 3-digit numeric HTTP status code.',
    '4XX',
    '[{"id": 1, "penaltyPct": 10, "text": "It is in the 4xx Client Error series."}, {"id": 2, "penaltyPct": 25, "text": "It is exactly 429."}]'::jsonb
),
(
    'CHAL-08',
    'C',
    'Tier C: Code-Breaking & Cryptography',
    'Ciphers & Cryptanalysis',
    'Caesar of the Mainframe',
    200,
    '7852c608776bcb23d270a3f2439255d6d4862206d03caaaa568912cd208c64dd',
    'Intercepted encrypted broadcast from Joshuas primary communications relay: "JUB-JBHYQ-LBH-YVXR-GB-CYNL-N-TNZR". Cryptanalysis indicates a classical ROT13 (Caesar cipher shifted 13 positions). Decode the transmission.',
    'Preserve hyphens. You can use the terminal command "rot13 <string>" in the W.O.P.R. console.',
    'XXX-XXXXX-XXX-XXXX-XX-XXXX-X-XXXX',
    '[{"id": 1, "penaltyPct": 10, "text": "Rotating J by 13 gives W (10 + 13 = 23 -> W). First word is WHO."}, {"id": 2, "penaltyPct": 25, "text": "The decoded phrase is WHO-WOULD-YOU-LIKE-TO-PLAY-A-GAME."}]'::jsonb
),
(
    'CHAL-09',
    'C',
    'Tier C: Code-Breaking & Cryptography',
    'Multi-Stage Decoding',
    'The Layered Capsule',
    250,
    'ad81339fd2ed2d3099869eda8ee8bf832a5c96187a416790850a6316aa4aa7f4',
    'A critical system payload was multi-tier encapsulated for transmission: "5530684254457767563055675545784257534242494564425455552f". Convert this Hex byte string to ASCII text. The resulting text is a Base64-encoded string. Decode that Base64 string to extract the original clearance sentence (including punctuation).',
    'Stage 1: Hex -> ASCII (yields Base64). Stage 2: Base64 -> Plaintext string.',
    'Clearance phrase...',
    '[{"id": 1, "penaltyPct": 10, "text": "Hex 5530... in ASCII starts with U0hBTEwgV0Ug..."}, {"id": 2, "penaltyPct": 25, "text": "It is the iconic inquiry from the W.O.P.R. computer: SHALL WE PLAY A GAME?"}]'::jsonb
),
(
    'CHAL-10',
    'C',
    'Tier C: Code-Breaking & Cryptography',
    'Debugging & Logic Verification',
    'The Off-By-One Quantum Gate',
    300,
    '73475cb40a568e8da8a045ced110137e159f890ac4da883b6b17dc651b3a8049',
    'A missile silo consensus module crashes with NaN due to an off-by-one bug in this JavaScript logic: "function calculateQuantumChecksum(matrix) { let total = 0; for (let i = 0; i <= matrix.length; i++) { total += matrix[i] * (i + 1); } return total; }". When you fix the off-by-one loop condition so it iterates only over valid elements (i < matrix.length), what is the exact return value of calculateQuantumChecksum([2, 4, 4, 5])?',
    'Calculate (2*1) + (4*2) + (4*3) + (5*4).',
    'Numeric result',
    '[{"id": 1, "penaltyPct": 10, "text": "Multiply each element by its 1-based index: 2*1=2, 4*2=8, 4*3=12, 5*4=20."}, {"id": 2, "penaltyPct": 25, "text": "Sum: 2 + 8 + 12 + 20 = 42."}]'::jsonb
)
ON CONFLICT (id) DO UPDATE 
SET points = EXCLUDED.points, 
    answer_hash = EXCLUDED.answer_hash, 
    prompt = EXCLUDED.prompt, 
    clue = EXCLUDED.clue, 
    hints = EXCLUDED.hints;
