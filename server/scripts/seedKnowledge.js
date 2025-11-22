require('dotenv').config();
const mongoose = require('mongoose');
const BaseKnowledge = require('../models/BaseKnowledge');
const CompletedIssue = require('../models/CompletedIssue');

async function seedKnowledge() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing data (optional)
    await BaseKnowledge.deleteMany({});
    await CompletedIssue.deleteMany({});
    console.log('Cleared existing knowledge');

    // Seed Base Knowledge (Company-wide IT policies)
    const baseKnowledge = [
      {
        title: 'Password Reset Policy',
        content: 'All password resets require two-factor authentication verification. Users must provide employee ID and answer security questions. Contact IT help desk at extension 1234 or email support@company.com. Passwords must be 12+ characters with uppercase, lowercase, numbers, and symbols.',
        category: 'policy',
        tags: ['password', 'security', 'authentication', '2FA'],
        priority: 10,
        createdBy: 'system',
        isActive: true
      },
      {
        title: 'VPN Access Setup',
        content: 'To set up VPN: 1) Download Cisco AnyConnect from company portal 2) Use your employee credentials 3) Connect to vpn.company.com 4) Enter 6-digit MFA code from authenticator app. VPN is required for all remote access to company resources. Available 24/7.',
        category: 'procedure',
        tags: ['vpn', 'remote-access', 'security', 'cisco'],
        priority: 9,
        createdBy: 'system',
        isActive: true
      },
      {
        title: 'Software Installation Requests',
        content: 'All software installations must be requested through the IT portal. Submit ticket with: software name, business justification, cost center. Approval from manager required. Processing time: 2-3 business days. Only approved software from company catalog allowed.',
        category: 'procedure',
        tags: ['software', 'installation', 'approval', 'policy'],
        priority: 7,
        createdBy: 'system',
        isActive: true
      },
      {
        title: 'Email Issues - First Steps',
        content: 'For email problems: 1) Check internet connection 2) Verify credentials 3) Clear Outlook cache (File > Options > Advanced > Outlook Data File Settings) 4) Restart Outlook 5) If using mobile, remove and re-add account. Most issues resolved by cache clear.',
        category: 'guide',
        tags: ['email', 'outlook', 'troubleshooting'],
        priority: 8,
        createdBy: 'system',
        isActive: true
      },
      {
        title: 'Printer Connectivity Issues',
        content: 'Printer troubleshooting steps: 1) Verify printer is powered on and connected to network 2) Check printer queue (Settings > Devices > Printers) 3) Restart print spooler service 4) Remove and re-add printer 5) Update printer drivers from IT portal. For urgent issues, use backup printer in room B-204.',
        category: 'guide',
        tags: ['printer', 'hardware', 'troubleshooting', 'network'],
        priority: 6,
        createdBy: 'system',
        isActive: true
      },
      {
        title: 'IT Support Hours',
        content: 'IT Help Desk hours: Monday-Friday 7:00 AM - 7:00 PM EST. Emergency support available 24/7 by calling extension 9999. Average response time: 15 minutes for urgent issues, 2 hours for normal priority. Submit tickets at portal.company.com or email support@company.com.',
        category: 'general',
        tags: ['support', 'hours', 'contact', 'help-desk'],
        priority: 5,
        createdBy: 'system',
        isActive: true
      },
      {
        title: 'Security Incident Reporting',
        content: 'CRITICAL: Report security incidents immediately! Suspicious emails, phishing attempts, unauthorized access, lost devices must be reported within 1 hour. Call security hotline: extension 8888 or email security@company.com. Do not click suspicious links or provide credentials.',
        category: 'policy',
        tags: ['security', 'incident', 'phishing', 'emergency'],
        priority: 10,
        createdBy: 'system',
        isActive: true
      }
    ];

    await BaseKnowledge.insertMany(baseKnowledge);
    console.log(`✓ Created ${baseKnowledge.length} base knowledge entries`);

    // Seed Completed Issues (Past resolved tickets)
    const completedIssues = [
      {
        issueTitle: 'Outlook Not Syncing on iPhone',
        issueDescription: 'User reported Outlook mobile app not syncing emails for 2 days. Messages appear on desktop but not mobile device.',
        symptoms: ['email not syncing', 'outlook mobile', 'iphone', 'missing emails'],
        solutionSteps: '1. Removed email account from iPhone (Settings > Mail > Accounts) 2. Cleared Outlook app cache 3. Reinstalled Outlook app from App Store 4. Re-added account using company credentials 5. Enabled sync for Mail, Calendar, Contacts. Issue resolved - emails syncing properly.',
        context: 'Common issue after iOS updates. Cache corruption in mobile app.',
        category: 'software',
        tags: ['outlook', 'mobile', 'iphone', 'sync', 'email'],
        userEnvironment: 'iPhone 13, iOS 17.2, Outlook Mobile',
        effectiveness: 5,
        reportedBy: 'user123',
        timeTaken: 15
      },
      {
        issueTitle: 'Slow Computer Performance - High CPU Usage',
        issueDescription: 'User complained computer running extremely slow, applications freezing, fan running loudly.',
        symptoms: ['slow performance', 'high cpu', 'freezing', 'loud fan'],
        solutionSteps: '1. Checked Task Manager - found Windows Search Indexer using 85% CPU 2. Stopped Windows Search service 3. Rebuilt search index (Settings > Search > Advanced Indexer Settings > Rebuild) 4. Ran disk cleanup and removed temp files 5. Updated Windows. Performance back to normal.',
        context: 'Corrupted search index causing high CPU usage. Common after Windows updates.',
        category: 'hardware',
        tags: ['performance', 'cpu', 'windows', 'slow', 'indexer'],
        userEnvironment: 'Windows 11, Dell Latitude 5520, 16GB RAM',
        effectiveness: 5,
        reportedBy: 'user456',
        timeTaken: 25
      },
      {
        issueTitle: 'Cannot Access Shared Network Drive',
        issueDescription: 'User unable to access department shared drive (S: drive). Error message: "Network path not found".',
        symptoms: ['network drive', 'access denied', 'shared drive', 'cannot connect'],
        solutionSteps: '1. Verified VPN connection active 2. Checked user permissions in Active Directory - permissions were correct 3. Cleared cached credentials (Control Panel > Credential Manager) 4. Remapped network drive using UNC path \\\\fileserver\\shared 5. Drive accessible after credential refresh.',
        context: 'Cached credentials expired. Requires VPN connection for remote access.',
        category: 'network',
        tags: ['network-drive', 'vpn', 'permissions', 'file-server'],
        userEnvironment: 'Windows 10, Remote User, Cisco VPN',
        effectiveness: 4,
        reportedBy: 'user789',
        timeTaken: 20
      },
      {
        issueTitle: 'Microsoft Teams Video Not Working',
        issueDescription: 'Camera showing black screen in Teams calls. Audio working fine but video not displaying.',
        symptoms: ['teams video', 'camera not working', 'black screen', 'webcam'],
        solutionSteps: '1. Checked camera permissions in Windows Settings - Teams had access 2. Closed all apps using camera 3. Updated camera driver from Device Manager 4. Cleared Teams cache (AppData\\Microsoft\\Teams) 5. Restarted Teams. Camera working after cache clear.',
        context: 'Teams cache corruption. Camera was functional in other apps.',
        category: 'software',
        tags: ['teams', 'camera', 'video', 'webcam', 'cache'],
        userEnvironment: 'Windows 10, Logitech C920 Webcam, Teams Desktop App',
        effectiveness: 5,
        reportedBy: 'user234',
        timeTaken: 10
      },
      {
        issueTitle: 'Printer Showing Offline Despite Being Powered On',
        issueDescription: 'HP printer shows as offline in Windows. Printer is on, connected to network, and responds to ping.',
        symptoms: ['printer offline', 'cannot print', 'printer status', 'hp printer'],
        solutionSteps: '1. Verified printer IP address and network connection 2. Removed printer from Windows 3. Restarted Print Spooler service (services.msc) 4. Re-added printer using IP address (Add Printer > IP address) 5. Set as default printer. Printing working.',
        context: 'Print spooler service had stalled. IP-based installation more reliable than auto-discovery.',
        category: 'hardware',
        tags: ['printer', 'offline', 'hp', 'network-printer', 'spooler'],
        userEnvironment: 'Windows 11, HP LaserJet Pro M404n, Network Printer',
        effectiveness: 5,
        reportedBy: 'user567',
        timeTaken: 18
      }
    ];

    await CompletedIssue.insertMany(completedIssues);
    console.log(`✓ Created ${completedIssues.length} completed issue entries`);

    console.log('\\n✅ Knowledge base seeded successfully!');
    console.log('\\nSummary:');
    console.log(`- Base Knowledge: ${baseKnowledge.length} entries`);
    console.log(`- Completed Issues: ${completedIssues.length} entries`);
    console.log('\\nThe AI agent now has knowledge to reference!');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding knowledge:', error);
    process.exit(1);
  }
}

seedKnowledge();
