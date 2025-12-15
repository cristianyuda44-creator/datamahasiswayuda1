import { motion } from "framer-motion";
import { StudentManager } from "@/lib/student-manager";
import { Student, StudentData } from "@/lib/student";
import { useState, useEffect, useRef } from "react";
import { 
  Plus, Search, Filter, SortAsc, TrendingUp, Users, GraduationCap, 
  Trash2, Edit2, Save, Download, Upload, RefreshCw, X, FileJson
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
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

interface DashboardProps {
  onLogout: () => void;
}

// Initial Data
const MOCK_DATA: StudentData[] = [
  { id: '1', name: "Alex Johnson", nim: "2023001", major: "Computer Science", gpa: 3.8 },
  { id: '2', name: "Sarah Williams", nim: "2023002", major: "Design", gpa: 3.9 },
  { id: '3', name: "Michael Chen", nim: "2023003", major: "Engineering", gpa: 3.5 },
  { id: '4', name: "Emily Davis", nim: "2023004", major: "Business", gpa: 3.2 },
  { id: '5', name: "David Kim", nim: "2023005", major: "Computer Science", gpa: 4.0 },
];

const COMPLEXITIES: Record<string, string> = {
  bubble: 'O(n²)',
  selection: 'O(n²)',
  insertion: 'O(n²)',
  merge: 'O(n log n)',
  shell: 'O(n log² n)',
  linear: 'O(n)',
  binary: 'O(log n)',
};

export function Dashboard({ onLogout }: DashboardProps) {
  const [manager] = useState(new StudentManager(MOCK_DATA));
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
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Chart Data Preparation
  const chartData = students.map(s => ({
    name: s.name.split(' ')[0],
    gpa: s.gpa,
    full: s
  }));

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Top Navigation */}
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="sticky top-0 z-50 glass-panel border-b border-white/20 px-6 py-4 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-xl shadow-lg">
            S
          </div>
          <div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
              Student Manager
            </h1>
            <p className="text-xs text-muted-foreground font-medium">OOP & Algorithms Demo</p>
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
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" /> Import
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
          <div className="hidden md:flex items-center gap-2 bg-secondary/10 px-3 py-1.5 rounded-full border border-secondary/20">
            <Users className="h-4 w-4 text-secondary" />
            <span className="text-sm font-semibold text-secondary-foreground">{students.length} Students</span>
          </div>
          <Button variant="ghost" className="hover:bg-destructive/10 hover:text-destructive" onClick={onLogout}>
            Logout
          </Button>
        </div>
      </motion.header>

      <main className="container mx-auto px-4 pt-8 space-y-8">
        
        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="border-none shadow-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white overflow-hidden relative">
              <div className="absolute right-0 top-0 p-4 opacity-10">
                <GraduationCap size={120} />
              </div>
              <CardHeader>
                <CardTitle className="text-indigo-100">Average GPA</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">
                  {(students.length > 0 ? students.reduce((acc, curr) => acc + curr.gpa, 0) / students.length : 0).toFixed(2)}
                </div>
                <p className="text-indigo-100/80 text-sm mt-2">Class Performance</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="md:col-span-2">
            <Card className="h-full border-none shadow-lg bg-white/50 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-primary">GPA Distribution</CardTitle>
                <Badge variant="outline" className="bg-primary/5 text-primary">Live Data</Badge>
              </CardHeader>
              <CardContent className="h-[120px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <Tooltip 
                      cursor={{fill: 'transparent'}}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Bar dataKey="gpa" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.gpa >= 3.5 ? 'hsl(var(--primary))' : 'hsl(var(--accent))'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Controls Section */}
        <Card className="border-none shadow-md glass-panel">
          <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search name or NIM..." 
                  className="pl-9 bg-white/50"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button size="icon" variant="outline" onClick={() => handleSearch('linear')} title="Linear Search">
                <Search className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="outline" onClick={() => handleSearch('binary')} title="Binary Search (Sorts first)">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
              <Select onValueChange={(v) => handleSort(v, 'gpa')}>
                <SelectTrigger className="w-[140px] bg-white/50">
                  <SortAsc className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Sort GPA" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bubble">Bubble Sort</SelectItem>
                  <SelectItem value="selection">Selection Sort</SelectItem>
                  <SelectItem value="insertion">Insertion Sort</SelectItem>
                  <SelectItem value="merge">Merge Sort</SelectItem>
                  <SelectItem value="shell">Shell Sort</SelectItem>
                </SelectContent>
              </Select>

              <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-md">
                    <Plus className="mr-2 h-4 w-4" /> Add Student
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] glass-panel border-white/50">
                  <DialogHeader>
                    <DialogTitle>Add New Student</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right">Name</Label>
                      <Input id="name" className="col-span-3" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="nim" className="text-right">NIM</Label>
                      <Input id="nim" className="col-span-3" value={formData.nim} onChange={e => setFormData({...formData, nim: e.target.value})} placeholder="Digits only" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="major" className="text-right">Major</Label>
                      <Input id="major" className="col-span-3" value={formData.major} onChange={e => setFormData({...formData, major: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="gpa" className="text-right">GPA</Label>
                      <Input id="gpa" type="number" step="0.01" max="4.0" className="col-span-3" value={formData.gpa} onChange={e => setFormData({...formData, gpa: parseFloat(e.target.value)})} />
                    </div>
                  </div>
                  <Button onClick={handleAdd}>Save Student</Button>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
          {(searchTime !== null || sortTime !== null) && (
            <div className="px-4 pb-2 text-xs text-muted-foreground flex items-center justify-between">
              <div className="flex gap-4">
                {searchTime !== null && <span>Last Search: <span className="font-mono text-primary">{searchTime.toFixed(4)}ms</span></span>}
                {sortTime !== null && <span>Last Sort: <span className="font-mono text-primary">{sortTime.toFixed(4)}ms</span></span>}
              </div>
              {currentAlgo && (
                <div>
                  <Badge variant="outline" className="font-mono text-[10px]">
                    Complexity: {COMPLEXITIES[currentAlgo]}
                  </Badge>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Data Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {students.map((student, idx) => (
            <motion.div
              key={student.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className="overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-300 group bg-white/60 hover:bg-white/80 backdrop-blur-sm">
                <CardHeader className="relative pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors">{student.name}</CardTitle>
                      <p className="text-sm text-muted-foreground font-mono">{student.nim}</p>
                    </div>
                    <Badge variant={student.gpa >= 3.5 ? "default" : "secondary"} className={student.gpa >= 3.5 ? "bg-green-500 hover:bg-green-600" : ""}>
                      {student.gpa.toFixed(2)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <GraduationCap className="mr-2 h-4 w-4" />
                      {student.major}
                    </div>
                    
                    <div className="w-full bg-secondary/20 h-2 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-primary to-accent" 
                        style={{ width: `${(student.gpa / 4) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(student.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
        
        {students.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <p>No students found. Add one to get started!</p>
          </div>
        )}
      </main>
    </div>
  );
}
