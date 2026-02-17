export default function CSSTest() {
  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-primary">CSS Layout Test</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-card border border-border rounded-sm p-6">
            <h2 className="text-xl font-semibold mb-4 text-foreground">Card 1</h2>
            <p className="text-muted-foreground">This should have proper styling with background and borders.</p>
            <button className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-full hover:opacity-90">
              Primary Button
            </button>
          </div>
          
          <div className="bg-secondary border border-border rounded-sm p-6">
            <h2 className="text-xl font-semibold mb-4 text-secondary-foreground">Card 2</h2>
            <p className="text-muted-foreground">Secondary background with proper text colors.</p>
            <button className="mt-4 px-4 py-2 border border-border text-foreground rounded-full hover:bg-accent">
              Secondary Button
            </button>
          </div>
          
          <div className="bg-accent border border-border rounded-sm p-6">
            <h2 className="text-xl font-semibold mb-4 text-accent-foreground">Card 3</h2>
            <p className="text-muted-foreground">Accent background with proper styling.</p>
            <button className="mt-4 px-4 py-2 bg-destructive text-destructive-foreground rounded-full hover:opacity-90">
              Destructive Button
            </button>
          </div>
        </div>
        
        <div className="bg-muted rounded-sm p-6">
          <h2 className="text-2xl font-bold mb-4 text-foreground">Test Results</h2>
          <ul className="space-y-2 text-muted-foreground">
            <li>✅ If you can see this page with proper styling, CSS is working</li>
            <li>✅ Cards should have backgrounds and borders</li>
            <li>✅ Buttons should have proper colors</li>
            <li>✅ Text should be readable with proper contrast</li>
          </ul>
        </div>

        <div className="mt-8 flex flex-wrap gap-4">
          <div className="theme-admin">
            <div className="w-16 h-16 bg-primary rounded-sm flex items-center justify-center text-primary-foreground font-bold">
              A
            </div>
            <p className="text-sm mt-2 text-center">Admin</p>
          </div>
          
          <div className="theme-hr">
            <div className="w-16 h-16 bg-primary rounded-sm flex items-center justify-center text-primary-foreground font-bold">
              H
            </div>
            <p className="text-sm mt-2 text-center">HR</p>
          </div>
          
          <div className="theme-hiring">
            <div className="w-16 h-16 bg-primary rounded-sm flex items-center justify-center text-primary-foreground font-bold">
              M
            </div>
            <p className="text-sm mt-2 text-center">Manager</p>
          </div>
          
          <div className="theme-recruiter">
            <div className="w-16 h-16 bg-primary rounded-sm flex items-center justify-center text-primary-foreground font-bold">
              R
            </div>
            <p className="text-sm mt-2 text-center">Recruiter</p>
          </div>
          
          <div className="theme-applicant">
            <div className="w-16 h-16 bg-primary rounded-sm flex items-center justify-center text-primary-foreground font-bold">
              P
            </div>
            <p className="text-sm mt-2 text-center">Applicant</p>
          </div>
          
          <div className="theme-executive">
            <div className="w-16 h-16 bg-primary rounded-sm flex items-center justify-center text-primary-foreground font-bold">
              E
            </div>
            <p className="text-sm mt-2 text-center">Executive</p>
          </div>
        </div>
      </div>
    </div>
  );
}
