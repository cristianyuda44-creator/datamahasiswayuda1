import { motion } from "framer-motion";
import { StudentManager } from "@/lib/student-manager";
import { Student, StudentData } from "@/lib/student";
import { useState, useEffect, useRef } from "react";
import { 
  Plus, Search, SortAsc, Users, GraduationCap, 
  Trash2, Download, Upload, RefreshCw, Terminal, Shield, Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  BarChart, Bar, Tooltip, ResponsiveContainer, Cell, XAxis, YAxis
} from 'recharts';
import { STUDENT_DATABASE } from "@/lib/data";

interface DashboardProps {
  onLogout: () => void;
  currentUser?: StudentData;
}

const COMPLEXITIES: Record<string, string> = {
  bubble: 'O(n²)',
  selection: 'O(n²)',
  insertion: 'O(n²)',
  merge: 'O(n log n)',
  shell: 'O(n log² n)',
  linear: 'O(n)',
  binary: 'O(log n)',
};

export function Dashboard({ onLogout, currentUser }: DashboardProps) {
  // Use STUDENT_DATABASE as initial data
  const [manager] = useState(new StudentManager(STUDENT_DATABASE));
  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchTime, setSearchTime] = useState<number | null>(null);
  const [sortTime, setSortTime] = useState<number | null>(null);
  const [currentAlgo, setCurrentAlgo] = useState<string | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Form State
  const [formData, setFormData] = useState<Partial<StudentData>>({
    name: "", nim: "", major: "", gpa: 0
  });

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editGpa, setEditGpa] = useState<number>(0);

  useEffect(() => {
    setStudents(manager.getStudents());
  }, []);

  const refreshData = () => {
    setStudents(manager.getStudents());
  };

  const handleSearch = (algo: 'linear' | 'binary') => {
    const { results, time } = manager.search(searchQuery, algo);
    setStudents(results);
    setSearchTime(time);
    setCurrentAlgo(algo);
    toast({
      title: `Search Complete (${algo})`,
      description: `Found ${results.length} results in ${time.toFixed(4)}ms`,
    });
  };

  const handleSort = (algo: any, key: 'gpa' | 'name') => {
    const { data, time } = manager.sort(algo, key);
    setStudents([...data]); // Force refresh
    setSortTime(time);
    setCurrentAlgo(algo);
    toast({
      title: `Sort Complete (${algo})`,
      description: `Sorted by ${key} in ${time.toFixed(4)}ms`,
    });
  };

  const handleAdd = () => {
    try {
      if (!formData.name || !formData.nim || !formData.major) throw new Error("All fields required");
      
      manager.addStudent({
        id: Math.random().toString(36).substr(2, 9),
        name: formData.name,
        nim: formData.nim,
        major: formData.major,
        gpa: Number(formData.gpa)
      });
      refreshData();
      setIsAddOpen(false);
      setFormData({ name: "", nim: "", major: "", gpa: 0 });
      toast({ title: "Success", description: "Student added successfully" });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    }
  };

  const handleDelete = (id: string) => {
    manager.deleteStudent(id);
    refreshData();
    toast({ title: "Deleted", description: "Student removed from database" });
  };
  
  const startEditing = (student: Student) => {
      setEditingId(student.id);
      setEditGpa(student.gpa);
  };
  
  const saveEdit = (id: string) => {
      manager.updateStudent(id, { gpa: editGpa });
      setEditingId(null);
      refreshData();
      toast({ title: "Updated", description: "GPA updated successfully" });
  };

  const handleExport = () => {
    const json = manager.saveToJSON();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "students.json";
    a.click();
    toast({ title: "Exported", description: "Data downloaded successfully" });
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        manager.loadFromJSON(e.target?.result as string);
        refreshData();
        toast({ title: "Imported", description: "Data loaded successfully" });
      } catch (err) {
        toast({ variant: "destructive", title: "Error", description: "Invalid file format" });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Chart Data Preparation
  const chartData = students.map(s => ({
    name: s.name.split(' ')[0],
    gpa: s.gpa,
    full: s
  }));

  return (
    <div className="min-h-screen bg-background pb-20 font-sans text-foreground">
      {/* Top Navigation */}
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="sticky top-0 z-50 glass-panel border-b border-white/10 px-6 py-4 flex items-center justify-between backdrop-blur-xl"
      >
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-black/50 border border-primary/50 flex items-center justify-center text-primary font-bold shadow-[0_0_15px_rgba(0,255,255,0.2)] relative overflow-hidden group">
            <div className="absolute inset-0 bg-primary/10 group-hover:bg-primary/20 transition-colors" />
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-heading uppercase tracking-wider text-white">
              Student <span className="text-primary drop-shadow-[0_0_8px_rgba(0,255,255,0.5)]">Academic</span>
            </h1>
            <div className="flex items-center gap-2 text-[10px] font-mono text-primary/70">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                SYSTEM_ONLINE
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".json" 
            onChange={handleImport}
          />
          <div className="hidden md:flex gap-2">
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="border-primary/30 hover:bg-primary/10 text-primary font-mono text-xs">
                <Upload className="mr-2 h-3 w-3" /> IMPORT_DATA
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport} className="border-primary/30 hover:bg-primary/10 text-primary font-mono text-xs">
                <Download className="mr-2 h-3 w-3" /> EXPORT_DATA
            </Button>
          </div>
          
          <div className="flex items-center gap-3 pl-4 border-l border-white/10">
              <div className="text-right hidden sm:block">
                  <p className="text-xs text-muted-foreground font-mono">CURRENT_USER</p>
                  <p className="text-sm font-bold text-white">{currentUser?.name || "ADMIN"}</p>
              </div>
              <Button variant="ghost" className="hover:bg-destructive/10 hover:text-destructive border border-transparent hover:border-destructive/30" onClick={onLogout}>
                LOGOUT
              </Button>
          </div>
        </div>
      </motion.header>

      <main className="container mx-auto px-4 pt-8 space-y-8">
        
        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="border border-primary/20 shadow-[0_0_20px_rgba(0,255,255,0.05)] bg-black/40 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground font-mono uppercase">Average GPA</CardTitle>
                <Activity className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-white font-mono tracking-tighter">
                  {(students.length > 0 ? students.reduce((acc, curr) => acc + curr.gpa, 0) / students.length : 0).toFixed(2)}
                </div>
                <div className="h-1 w-full bg-secondary/10 mt-4 rounded-full overflow-hidden">
                    <div className="h-full bg-primary animate-pulse w-2/3" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="md:col-span-2">
            <Card className="h-full border border-primary/20 shadow-[0_0_20px_rgba(0,255,255,0.05)] bg-black/40 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-primary font-mono uppercase text-sm">GPA Distribution_Visualizer</CardTitle>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 font-mono text-[10px]">LIVE_FEED</Badge>
              </CardHeader>
              <CardContent className="h-[120px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <Tooltip 
                      cursor={{fill: 'rgba(255,255,255,0.05)'}}
                      contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#333', color: '#fff', fontFamily: 'monospace' }}
                    />
                    <Bar dataKey="gpa" radius={[2, 2, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.gpa >= 3.0 ? 'hsl(var(--primary))' : 'hsl(var(--secondary))'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Controls Section */}
        <Card className="border border-white/10 bg-black/40 backdrop-blur-md">
          <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-64 group">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                <Input 
                  placeholder="SEARCH_QUERY..." 
                  className="pl-9 bg-black/20 border-white/10 focus:border-primary/50 font-mono text-sm text-white"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button size="icon" variant="outline" onClick={() => handleSearch('linear')} title="Linear Search" className="border-white/10 hover:border-primary/50 hover:bg-primary/10">
                <Terminal className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="outline" onClick={() => handleSearch('binary')} title="Binary Search" className="border-white/10 hover:border-primary/50 hover:bg-primary/10">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
              <Select onValueChange={(v) => handleSort(v, 'gpa')}>
                <SelectTrigger className="w-[140px] bg-black/20 border-white/10 font-mono text-xs">
                  <SortAsc className="mr-2 h-3 w-3" />
                  <SelectValue placeholder="SORT_ALGO" />
                </SelectTrigger>
                <SelectContent className="bg-black/90 border-white/20 text-white">
                  <SelectItem value="bubble">BUBBLE SORT</SelectItem>
                  <SelectItem value="selection">SELECTION SORT</SelectItem>
                  <SelectItem value="insertion">INSERTION SORT</SelectItem>
                  <SelectItem value="merge">MERGE SORT</SelectItem>
                  <SelectItem value="shell">SHELL SORT</SelectItem>
                </SelectContent>
              </Select>

              <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-primary text-black hover:bg-primary/90 font-bold font-mono text-xs tracking-wider">
                    <Plus className="mr-2 h-4 w-4" /> ADD_ENTRY
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] bg-black/90 border-primary/30 text-white backdrop-blur-xl">
                  <DialogHeader>
                    <DialogTitle className="font-mono text-primary">NEW_STUDENT_ENTRY</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right font-mono text-xs text-muted-foreground">NAME</Label>
                      <Input id="name" className="col-span-3 bg-white/5 border-white/10" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="nim" className="text-right font-mono text-xs text-muted-foreground">NIM</Label>
                      <Input id="nim" className="col-span-3 bg-white/5 border-white/10" value={formData.nim} onChange={e => setFormData({...formData, nim: e.target.value})} placeholder="Digits only" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="major" className="text-right font-mono text-xs text-muted-foreground">MAJOR</Label>
                      <Input id="major" className="col-span-3 bg-white/5 border-white/10" value={formData.major} onChange={e => setFormData({...formData, major: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="gpa" className="text-right font-mono text-xs text-muted-foreground">GPA</Label>
                      <Input id="gpa" type="number" step="0.01" max="4.0" className="col-span-3 bg-white/5 border-white/10" value={formData.gpa} onChange={e => setFormData({...formData, gpa: parseFloat(e.target.value)})} />
                    </div>
                  </div>
                  <Button onClick={handleAdd} className="w-full bg-primary text-black hover:bg-primary/90">CONFIRM_ENTRY</Button>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
          {(searchTime !== null || sortTime !== null) && (
            <div className="px-4 pb-2 border-t border-white/5 flex items-center justify-between bg-black/20">
              <div className="flex gap-4 text-[10px] font-mono text-muted-foreground py-1">
                {searchTime !== null && <span>SEARCH_TIME: <span className="text-primary">{searchTime.toFixed(4)}ms</span></span>}
                {sortTime !== null && <span>SORT_TIME: <span className="text-primary">{sortTime.toFixed(4)}ms</span></span>}
              </div>
              {currentAlgo && (
                <Badge variant="outline" className="font-mono text-[10px] border-primary/20 text-primary/70 bg-primary/5 h-5">
                  COMPLEXITY: {COMPLEXITIES[currentAlgo]}
                </Badge>
              )}
            </div>
          )}
        </Card>

        {/* Data Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {students.map((student, idx) => (
            <motion.div
              key={student.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className="overflow-hidden bg-card/40 backdrop-blur-md border border-white/5 hover:border-primary/50 transition-all duration-300 group hover:shadow-[0_0_20px_rgba(0,255,255,0.1)]">
                <CardHeader className="relative pb-2 space-y-0">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <CardTitle className="text-base font-bold text-white group-hover:text-primary transition-colors truncate w-48 font-heading tracking-wide">
                          {student.name}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground font-mono bg-white/5 inline-block px-1 rounded">{student.nim}</p>
                    </div>
                    {editingId === student.id ? (
                        <div className="flex items-center gap-1">
                             <Input 
                                type="number" 
                                className="w-16 h-8 text-xs bg-black/50 border-primary" 
                                value={editGpa} 
                                onChange={(e) => setEditGpa(parseFloat(e.target.value))}
                                step="0.01"
                                max="4.00"
                             />
                             <Button size="icon" className="h-8 w-8 bg-green-500 hover:bg-green-600" onClick={() => saveEdit(student.id)}>
                                 <Upload className="h-3 w-3" />
                             </Button>
                        </div>
                    ) : (
                        <Badge variant="outline" onClick={() => startEditing(student)} className={`cursor-pointer hover:bg-white/10 ${student.gpa >= 3.0 ? "border-green-500/50 text-green-400" : "border-yellow-500/50 text-yellow-400"} font-mono`}>
                          GPA: {student.gpa.toFixed(2)}
                        </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center text-xs text-muted-foreground font-mono">
                      <GraduationCap className="mr-2 h-3 w-3 text-primary/70" />
                      {student.major}
                    </div>
                    
                    <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-primary to-secondary shadow-[0_0_10px_var(--color-primary)]" 
                        style={{ width: `${(student.gpa / 4) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-white/5 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/20 hover:text-destructive text-muted-foreground" onClick={() => handleDelete(student.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
        
        {students.length === 0 && (
          <div className="text-center py-20 text-muted-foreground border border-dashed border-white/10 rounded-xl bg-black/20">
            <p className="font-mono text-sm">DATABASE_EMPTY // NO ENTRIES FOUND</p>
          </div>
        )}
      </main>
    </div>
  );
}
