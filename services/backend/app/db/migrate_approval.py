"""
Auto-migration for Photographer role, approval_status, and auth_provider fields.
"""

import os
import sqlite3

def run_approval_migrations():
    db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "snapfind_local.db")
    if not os.path.exists(db_path):
        return

    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    try:
        c.execute("PRAGMA table_info(photographers)")
        cols = [r[1] for r in c.fetchall()]

        new_cols = [
            ("role", 'VARCHAR(32) DEFAULT "photographer" NOT NULL'),
            ("approval_status", 'VARCHAR(32) DEFAULT "pending" NOT NULL'),
            ("auth_provider", 'VARCHAR(32) DEFAULT "email" NOT NULL'),
            ("google_id", "VARCHAR(128)"),
            ("avatar_url", "VARCHAR(512)"),
            ("approved_by", "VARCHAR(64)"),
            ("approved_at", "TIMESTAMP"),
            ("rejection_reason", "TEXT")
        ]

        for col_name, col_def in new_cols:
            if col_name not in cols:
                c.execute(f"ALTER TABLE photographers ADD COLUMN {col_name} {col_def}")

        # Ensure demo, default, and initial admin photographers have approved status and super_admin role
        c.execute("UPDATE photographers SET approval_status = 'approved' WHERE approval_status = 'pending' AND (email IN ('photographer@example.com', 'demo@snapfind.ai', 'rajjebas789@gmail.com') OR id = 'p_001')")
        c.execute("UPDATE photographers SET role = 'super_admin' WHERE email IN ('photographer@example.com', 'demo@snapfind.ai', 'rajjebas789@gmail.com') OR id = 'p_001'")
        
        superadmin_email = os.getenv("SUPERADMIN_EMAIL", "").lower().strip()
        if superadmin_email:
            c.execute("UPDATE photographers SET role = 'super_admin', approval_status = 'approved' WHERE email = ?", (superadmin_email,))

        conn.commit()
    except Exception as e:
        print(f"[Migration] Approval migration error: {e}")
    finally:
        conn.close()
