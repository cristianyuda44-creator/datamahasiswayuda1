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
      title: `Pencarian Selesai (${algo})`,
      description: `Ditemukan ${results.length} hasil dalam ${time.toFixed(4)}ms`,
    });
  };

  const handleSort = (algo: any, key: 'gpa' | 'name') => {
    const { data, time } = manager.sort(algo, key);
    setStudents([...data]); // Force refresh
    setSortTime(time);
    setCurrentAlgo(algo);
    toast({
      title: `Pengurutan Selesai (${algo})`,
      description: `Diurutkan berdasarkan ${key} dalam ${time.toFixed(4)}ms`,
    });
  };

  const handleAdd = () => {
    try {
      if (!formData.name || !formData.nim || !formData.major) throw new Error("Semua kolom harus diisi");
      
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
      toast({ title: "Berhasil", description: "Mahasiswa berhasil ditambahkan" });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Gagal", description: e.message });
    }
  };

  const handleDelete = (id: string) => {
    manager.deleteStudent(id);
    refreshData();
    toast({ title: "Dihapus", description: "Data mahasiswa dihapus dari database" });
  };
  
  const startEditing = (student: Student) => {
      setEditingId(student.id);
      setEditGpa(student.gpa);
  };
  
  const saveEdit = (id: string) => {
      manager.updateStudent(id, { gpa: editGpa });
      setEditingId(null);
      refreshData();
      toast({ title: "Diperbarui", description: "IPK berhasil diperbarui" });
  };

  const handleExport = () => {
    const json = manager.saveToJSON();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "data_mahasiswa.json";
    a.click();
    toast({ title: "Ekspor Berhasil", description: "Data berhasil diunduh" });
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        manager.loadFromJSON(e.target?.result as string);
        refreshData();
        toast({ title: "Impor Berhasil", description: "Data berhasil dimuat" });
      } catch (err) {
        toast({ variant: "destructive", title: "Gagal", description: "Format file tidak valid" });
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
                SISTEM ONLINE
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
                <Upload className="mr-2 h-3 w-3" /> IMPOR DATA
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport} className="border-primary/30 hover:bg-primary/10 text-primary font-mono text-xs">
                <Download className="mr-2 h-3 w-3" /> EKSPOR DATA
            </Button>
          </div>
          
          <div className="flex items-center gap-3 pl-4 border-l border-white/10">
              <div className="text-right hidden sm:block">
                  <p className="text-xs text-muted-foreground font-mono">PENGGUNA</p>
                  <p className="text-sm font-bold text-white">{currentUser?.name || "ADMIN"}</p>
              </div>
              <Button variant="ghost" className="hover:bg-destructive/10 hover:text-destructive border border-transparent hover:border-destructive/30" onClick={onLogout}>
                KELUAR
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
                <CardTitle className="text-sm font-medium text-muted-foreground font-mono uppercase">Rata-rata IPK</CardTitle>
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
                <CardTitle className="text-primary font-mono uppercase text-sm">Visualisasi Distribusi IPK</CardTitle>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 font-mono text-[10px]">LIVE FEED</Badge>
              </CardHeader>
              <CardContent className="h-[120px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <Tooltip 
                      cursor={{fill: 'rgba(255,255,255,0.05)'}}
                      contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#333', color: '#fff', fontFamily: 'monospace' }}
                    />
                    <Bar dataKey="gpa" radius={[2, 2, 0, 0]} isAnimationActive={true}>
                      {chartData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.gpa >= 3.0 ? '#00ffd5' : '#ff00ff'} 
                          stroke="#ffffff"
                          strokeWidth={1}
                          strokeOpacity={0.2}
                        />
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
                  placeholder="CARI DATA..." 
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
                  <SelectValue placeholder="URUTKAN" />
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
                    <Plus className="mr-2 h-4 w-4" /> TAMBAH DATA
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] bg-black/90 border-primary/30 text-white backdrop-blur-xl">
                  <DialogHeader>
                    <DialogTitle className="font-mono text-primary">ENTRI MAHASISWA BARU</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right font-mono text-xs text-muted-foreground">NAMA</Label>
                      <Input id="name" className="col-span-3 bg-white/5 border-white/10" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="nim" className="text-right font-mono text-xs text-muted-foreground">NIM</Label>
                      <Input id="nim" className="col-span-3 bg-white/5 border-white/10" value={formData.nim} onChange={e => setFormData({...formData, nim: e.target.value})} placeholder="Hanya angka" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="major" className="text-right font-mono text-xs text-muted-foreground">JURUSAN</Label>
                      <Input id="major" className="col-span-3 bg-white/5 border-white/10" value={formData.major} onChange={e => setFormData({...formData, major: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="gpa" className="text-right font-mono text-xs text-muted-foreground">IPK</Label>
                      <Input id="gpa" type="number" step="0.01" max="4.0" className="col-span-3 bg-white/5 border-white/10" value={formData.gpa} onChange={e => setFormData({...formData, gpa: parseFloat(e.target.value)})} />
                    </div>
                  </div>
                  <Button onClick={handleAdd} className="w-full bg-primary text-black hover:bg-primary/90">KONFIRMASI</Button>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
          {(searchTime !== null || sortTime !== null) && (
            <div className="px-4 pb-2 border-t border-white/5 flex items-center justify-between bg-black/20">
              <div className="flex gap-4 text-[10px] font-mono text-muted-foreground py-1">
                {searchTime !== null && <span>WAKTU PENCARIAN: <span className="text-primary">{searchTime.toFixed(4)}ms</span></span>}
                {sortTime !== null && <span>WAKTU SORTING: <span className="text-primary">{sortTime.toFixed(4)}ms</span></span>}
              </div>
              {currentAlgo && (
                <Badge variant="outline" className="font-mono text-[10px] border-primary/20 text-primary/70 bg-primary/5 h-5">
                  KOMPLEKSITAS: {COMPLEXITIES[currentAlgo]}
                </Badge>
              )}
            </div>
          )}
        </Card>

        {/* Data Grid Table */}
        <div className="rounded-md border border-white/10 overflow-hidden bg-black/40 backdrop-blur-sm shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-primary/10 text-primary font-mono border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 font-bold tracking-wider">Mahasiswa</th>
                  <th className="px-6 py-4 font-bold tracking-wider">NIM</th>
                  <th className="px-6 py-4 font-bold tracking-wider">Jurusan</th>
                  <th className="px-6 py-4 font-bold tracking-wider text-center">IPK</th>
                  <th className="px-6 py-4 font-bold tracking-wider text-center">Visual</th>
                  <th className="px-6 py-4 font-bold tracking-wider text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4 font-medium text-white font-heading tracking-wide">
                      {student.name}
                    </td>
                    <td className="px-6 py-4 font-mono text-muted-foreground">
                      {student.nim}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {student.major}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {editingId === student.id ? (
                        <div className="flex items-center justify-center gap-2">
                           <Input 
                              type="number" 
                              className="w-20 h-8 text-center bg-black/50 border-primary text-white" 
                              value={editGpa} 
                              onChange={(e) => setEditGpa(parseFloat(e.target.value))}
                              step="0.01"
                              max="4.00"
                              autoFocus
                           />
                           <Button size="icon" className="h-8 w-8 bg-green-500 hover:bg-green-600 text-black" onClick={() => saveEdit(student.id)}>
                               <Upload className="h-3 w-3" />
                           </Button>
                        </div>
                      ) : (
                        <Badge 
                          variant="outline" 
                          onClick={() => startEditing(student)} 
                          className={`cursor-pointer hover:bg-white/10 transition-colors ${student.gpa >= 3.0 ? "border-green-500/50 text-green-400" : "border-pink-500/50 text-pink-400"} font-mono text-xs py-1 px-3`}
                        >
                          {student.gpa.toFixed(2)}
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 w-48">
                      <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(student.gpa / 4) * 100}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className={`h-full shadow-[0_0_10px_currentColor] ${student.gpa >= 3.0 ? 'bg-green-400 text-green-400' : 'bg-pink-500 text-pink-500'}`}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-50 group-hover:opacity-100" 
                        onClick={() => handleDelete(student.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {students.length === 0 && (
            <div className="text-center py-12 text-muted-foreground font-mono text-sm">
              DATABASE_KOSONG // TIDAK ADA DATA DITEMUKAN
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
