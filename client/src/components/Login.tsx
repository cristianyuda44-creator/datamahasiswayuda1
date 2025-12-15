import { motion } from "framer-motion";
import { useState } from "react";
import { User, Lock, ArrowRight, Loader2, ShieldCheck, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import bgImage from "@assets/generated_images/cyber_bg.png";
import { STUDENT_DATABASE } from "@/lib/data";

interface LoginProps {
  onLogin: (user: any) => void;
}

export function Login({ onLogin }: LoginProps) {
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Authentication Logic
    setTimeout(() => {
      setLoading(false);
      
      const student = STUDENT_DATABASE.find(s => s.nim === username);
      
      if (student) {
        // Password check: Last 6 digits of NIM
        const expectedPassword = student.nim.slice(-6);
        
        if (password === expectedPassword) {
           onLogin(student);
           toast({
             title: "ACCESS GRANTED",
             description: `Welcome, Agent ${student.name.split(' ')[0]}`,
             className: "bg-green-500/10 border-green-500/50 text-green-500"
           });
        } else {
           toast({
             variant: "destructive",
             title: "ACCESS DENIED",
             description: "Invalid credentials. Security protocols active.",
           });
        }
      } else {
        toast({
          variant: "destructive",
          title: "UNKNOWN ENTITY",
          description: "User identity not found in database.",
        });
      }
    }, 1500);
  };

  return (
    <div className="relative w-full h-screen flex items-center justify-center overflow-hidden bg-background font-sans">
      {/* Cyber Background */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center opacity-40"
        style={{ backgroundImage: `url(${bgImage})` }}
      />
      <div className="absolute inset-0 z-0 bg-black/60 backdrop-blur-[1px]" />
      
      {/* Grid Overlay */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(rgba(0,255,65,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,65,0.03)_1px,transparent_1px)] bg-[size:30px_30px]" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, type: "spring" }}
        className="relative z-10 w-full max-w-md p-1 rounded-xl bg-gradient-to-br from-primary/50 via-transparent to-secondary/50"
      >
        <div className="bg-black/90 p-8 rounded-[10px] border border-white/5 backdrop-blur-xl shadow-2xl relative overflow-hidden">
            {/* Scanline */}
            <div className="absolute inset-0 bg-linear-to-b from-transparent via-primary/5 to-transparent animate-scanline pointer-events-none" />
            
            <div className="text-center mb-8 relative z-10">
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex flex-col items-center"
              >
                <div className="h-16 w-16 mb-4 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center shadow-[0_0_20px_rgba(0,255,255,0.3)]">
                    <ShieldCheck className="h-8 w-8 text-primary" />
                </div>
                <h1 className="text-3xl font-bold text-white tracking-wider font-heading uppercase">
                  Student <span className="text-primary">Academic</span>
                </h1>
                <div className="flex items-center gap-2 mt-2 text-xs font-mono text-primary/70">
                    <Terminal size={12} />
                    <span>SYSTEM_READY</span>
                </div>
              </motion.div>
            </div>

            <form onSubmit={handleLogin} className="space-y-6 relative z-10">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-xs uppercase tracking-widest text-muted-foreground font-mono">Identify (NIM)</Label>
                <div className="relative group">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="username"
                    placeholder="241011..."
                    className="pl-9 bg-white/5 border-white/10 focus:border-primary/50 focus:ring-primary/20 text-white font-mono transition-all"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs uppercase tracking-widest text-muted-foreground font-mono">Access Key (Last 6 Digits)</Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••"
                    className="pl-9 bg-white/5 border-white/10 focus:border-primary/50 focus:ring-primary/20 text-white font-mono transition-all"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 text-sm uppercase tracking-widest font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(0,243,255,0.2)] hover:shadow-[0_0_30px_rgba(0,243,255,0.4)] border border-primary/50"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center font-mono">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> AUTHENTICATING...
                  </span>
                ) : (
                  <span className="flex items-center">
                    Initiate Session <ArrowRight className="ml-2 h-4 w-4" />
                  </span>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
                <div className="inline-flex items-center px-3 py-1 rounded-full border border-white/5 bg-white/5 text-[10px] text-muted-foreground font-mono">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2 animate-pulse" />
                    SECURE CONNECTION ESTABLISHED
                </div>
            </div>
        </div>
      </motion.div>
    </div>
  );
}
