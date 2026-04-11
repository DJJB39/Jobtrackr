import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Briefcase } from "lucide-react";

const Privacy = () => (
  <div className="min-h-screen bg-background">
    <header className="glass sticky top-0 z-50 border-b border-border">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-glow">
            <Briefcase className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-display tracking-tight text-foreground">JobTrackr</span>
        </Link>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/" className="gap-1.5">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Link>
        </Button>
      </div>
    </header>

    <main className="mx-auto max-w-3xl px-6 py-16 prose prose-sm dark:prose-invert">
      <h1 className="font-display">Privacy Policy</h1>
      <p className="text-muted-foreground text-sm">Last updated: {new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</p>

      <h2>1. Information We Collect</h2>
      <p>When you create an account we collect your email address and, if you choose Google sign-in, your basic profile information. We also store the job application data you enter (company names, roles, notes, events, and uploaded CVs).</p>

      <h2>2. How We Use Your Data</h2>
      <ul>
        <li>To provide, maintain, and improve the JobTrackr service.</li>
        <li>To send transactional emails such as password resets and optional weekly digests (which you can disable at any time).</li>
        <li>To generate AI-powered suggestions when you explicitly use those features.</li>
      </ul>

      <h2>3. Data Storage & Security</h2>
      <p>Your data is stored in encrypted databases. We use row-level security so that only you can access your own records. We do not sell, rent, or share your personal data with third parties for marketing purposes.</p>

      <h2>4. Cookies</h2>
      <p>We use essential cookies for authentication and session management. We do not use advertising or tracking cookies.</p>

      <h2>5. Third-Party Services</h2>
      <p>We use the following third-party services to operate JobTrackr:</p>
      <ul>
        <li><strong>Authentication & Database</strong> — cloud-hosted infrastructure with encryption at rest.</li>
        <li><strong>AI Features</strong> — prompts are sent to AI model providers when you choose to use AI assist, interview coach, or CV analysis. No data is sent without your action.</li>
        <li><strong>Email</strong> — transactional email delivery for reminders and digests.</li>
      </ul>

      <h2>6. Your Rights</h2>
      <p>You can export or delete all of your data at any time from within the application. If you wish to delete your account entirely, contact us and we will remove all associated data within 30 days.</p>

      <h2>7. Changes to This Policy</h2>
      <p>We may update this policy from time to time. We will notify registered users of any material changes via email.</p>

      <h2>8. Contact</h2>
      <p>If you have questions about this privacy policy, please reach out via the feedback link on the main site.</p>
    </main>
  </div>
);

export default Privacy;
