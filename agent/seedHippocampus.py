#!/usr/bin/env python3
"""
Seed Hippocampus with sample IT support knowledge
Populates 3 namespaces: base_knowledge, completed_issues, user_specific_demo
"""

import sys
import os

# Add agent directory to path
sys.path.insert(0, os.path.dirname(__file__))

try:
    from agent import HippocampusClient
    from hippo_kb_agent import HippocampusKBAgent
except ImportError as e:
    print(f"Error importing modules: {e}")
    sys.exit(1)

def seed_base_knowledge(agent):
    """Seed company-wide IT policies"""
    print("\n📋 Seeding BASE KNOWLEDGE (company-wide)...")

    base_kb = [
        ("password_policy", "Password Reset Policy: All password resets require 2FA verification. Users must provide employee ID and answer security questions. Contact help desk at ext. 1234. Passwords must be 12+ characters with uppercase, lowercase, numbers, and symbols."),

        ("vpn_setup", "VPN Access Setup: Download Cisco AnyConnect from company portal. Use employee credentials to connect to vpn.company.com. Enter 6-digit MFA code from authenticator app. VPN required for all remote access. Available 24/7."),

        ("software_requests", "Software Installation: All software installations require IT portal ticket with software name, business justification, and cost center. Manager approval required. Processing time: 2-3 business days. Only approved software allowed."),

        ("email_troubleshooting", "Email Issues First Steps: 1) Check internet connection 2) Verify credentials 3) Clear Outlook cache (File > Options > Advanced > Outlook Data File Settings) 4) Restart Outlook 5) If mobile, remove and re-add account."),

        ("printer_guide", "Printer Troubleshooting: 1) Verify printer powered on and on network 2) Check print queue 3) Restart print spooler service 4) Remove and re-add printer 5) Update drivers from IT portal. Backup printer in room B-204."),

        ("support_hours", "IT Support Hours: Monday-Friday 7 AM - 7 PM EST. Emergency support 24/7 at ext. 9999. Average response: 15min urgent, 2hr normal. Submit tickets at portal.company.com or support@company.com."),

        ("security_policy", "Security Incident Reporting: CRITICAL - Report security incidents immediately! Suspicious emails, phishing, unauthorized access, lost devices must be reported within 1 hour. Call ext. 8888 or email security@company.com."),
    ]

    count = 0
    for key, content in base_kb:
        if agent.add_base_knowledge(key, content):
            count += 1
            print(f"  ✓ Added: {key}")
        else:
            print(f"  ✗ Failed: {key}")

    print(f"✅ Created {count}/{len(base_kb)} base knowledge entries")
    return count

def seed_completed_issues(agent):
    """Seed past resolved IT tickets"""
    print("\n🔧 Seeding COMPLETED ISSUES (past solutions)...")

    completed = [
        ("outlook_sync_iphone", "Issue: Outlook Not Syncing on iPhone. User reported emails not syncing for 2 days. Solution: 1) Removed account from iPhone Settings > Mail 2) Cleared Outlook app cache 3) Reinstalled Outlook from App Store 4) Re-added account with company credentials 5) Enabled sync for Mail/Calendar/Contacts. Result: Emails syncing properly. Environment: iPhone 13, iOS 17.2"),

        ("slow_computer_cpu", "Issue: Slow Computer Performance - High CPU. User complained of freezing, slow apps, loud fan. Solution: 1) Task Manager showed Windows Search Indexer at 85% CPU 2) Stopped Windows Search service 3) Rebuilt search index (Settings > Search > Advanced > Rebuild) 4) Ran disk cleanup 5) Updated Windows. Result: Performance normal. Environment: Windows 11, Dell Latitude 5520"),

        ("network_drive_access", "Issue: Cannot Access Shared Network Drive. User unable to access S: drive with 'Network path not found' error. Solution: 1) Verified VPN active 2) Checked AD permissions - correct 3) Cleared cached credentials (Control Panel > Credential Manager) 4) Remapped drive using UNC path \\\\fileserver\\shared. Result: Drive accessible. Environment: Windows 10, Remote, Cisco VPN"),

        ("teams_camera_black", "Issue: Microsoft Teams Video Not Working. Camera showing black screen, audio working. Solution: 1) Checked Windows camera permissions - Teams had access 2) Closed all apps using camera 3) Updated camera driver 4) Cleared Teams cache (AppData\\Microsoft\\Teams) 5) Restarted Teams. Result: Camera working after cache clear. Environment: Windows 10, Logitech C920"),

        ("printer_offline", "Issue: Printer Showing Offline. HP printer shows offline despite being powered on and pingable. Solution: 1) Verified printer IP and network 2) Removed printer from Windows 3) Restarted Print Spooler (services.msc) 4) Re-added using IP address 5) Set as default. Result: Printing working. Environment: Windows 11, HP LaserJet Pro M404n"),
    ]

    count = 0
    for issue_id, content in completed:
        if agent.add_completed_issue(issue_id, content):
            count += 1
            print(f"  ✓ Added: {issue_id}")
        else:
            print(f"  ✗ Failed: {issue_id}")

    print(f"✅ Created {count}/{len(completed)} completed issue entries")
    return count

def seed_user_specific(agent, username="demo"):
    """Seed user-specific knowledge"""
    print(f"\n👤 Seeding USER SPECIFIC KNOWLEDGE (user: {username})...")

    user_kb = [
        ("system_info", f"User {username} system: macOS Sonoma 14.2, MacBook Pro 2021 M1, 16GB RAM. Software: Office 365, Slack, Zoom, Chrome. Peripherals: LG Monitor, Logitech MX Master mouse."),

        ("preferences", f"User {username} preferences: Prefers detailed step-by-step instructions. Technical level: Intermediate. Likes visual guides when available. Best contact: Email during work hours."),

        ("common_issues", f"User {username} recurring issues: 1) VPN disconnects frequently when on home WiFi - usually fixed by router restart 2) Outlook calendar sync delays - monthly cache clear helps 3) Dual monitor setup issues after macOS updates"),

        ("past_tickets", f"User {username} ticket history: ticket_001 (VPN issues - resolved with new config), ticket_042 (printer setup - HP driver installed), ticket_089 (password reset - completed with 2FA)"),
    ]

    count = 0
    for key, content in user_kb:
        if agent.add_user_knowledge(username, key, content):
            count += 1
            print(f"  ✓ Added: {key}")
        else:
            print(f"  ✗ Failed: {key}")

    print(f"✅ Created {count}/{len(user_kb)} user-specific entries for {username}")
    return count

def main():
    print("="*60)
    print("Seeding Hippocampus Knowledge Base")
    print("="*60)

    try:
        # Initialize Hippocampus client and agent
        print("\n🔌 Connecting to Hippocampus on localhost:6379...")
        hippo_client = HippocampusClient(host="localhost", port=6379)
        agent = HippocampusKBAgent(hippo_client=hippo_client)
        print("✓ Connected to Hippocampus")

        # Seed all knowledge bases
        base_count = seed_base_knowledge(agent)
        comp_count = seed_completed_issues(agent)
        user_count = seed_user_specific(agent, username="demo")

        # Summary
        print("\n" + "="*60)
        print("✅ Hippocampus Seeding Complete!")
        print("="*60)
        print(f"\nSummary:")
        print(f"  📋 Base Knowledge:       {base_count} entries")
        print(f"  🔧 Completed Issues:     {comp_count} entries")
        print(f"  👤 User Specific (demo): {user_count} entries")
        print(f"\nTotal: {base_count + comp_count + user_count} entries loaded")
        print("\nHippocampus Namespaces:")
        print("  - base_knowledge/")
        print("  - completed_issues/")
        print("  - user_specific_demo/")
        print("\nThe AI agent can now query these Hippocampus KBs! 🎉")

    except Exception as e:
        print(f"\n❌ Error seeding Hippocampus: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
