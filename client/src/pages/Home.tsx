import { useState } from "react";
import { Login } from "@/components/Login";
import { Dashboard } from "@/components/Dashboard";
import { AnimatePresence, motion } from "framer-motion";
import { StudentData } from "@/lib/student";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<StudentData | undefined>(undefined);

  const handleLogin = (userData: StudentData) => {
      setUser(userData);
      setIsLoggedIn(true);
  };

  const handleLogout = () => {
      setUser(undefined);
      setIsLoggedIn(false);
  };

  return (
    <AnimatePresence mode="wait">
      {!isLoggedIn ? (
        <motion.div
          key="login"
          exit={{ opacity: 0, scale: 1.1, filter: "blur(20px)" }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <Login onLogin={handleLogin} />
        </motion.div>
      ) : (
        <motion.div
          key="dashboard"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Dashboard onLogout={handleLogout} currentUser={user} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
