import { motion } from "framer-motion";
import { StudentManager, SortAlgorithm, SearchAlgorithm } from "@/lib/student-manager";
import { Student, StudentData } from "@/lib/student";
import { useState, useEffect, useRef } from "react";
import { 
  Plus, Search, GraduationCap, 
  Trash2, Download, Upload, Terminal, 
  LayoutDashboard, Settings, LogOut, Edit
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  BarChart, Bar, Tooltip, ResponsiveContainer, Cell, XAxis, YAxis, CartesianGrid
} from 'recharts';

interface DashboardProps {
  onLogout: () => void;
  currentUser?: StudentData;
  initialData: StudentData[];
  onDataUpdate: (data: StudentData[]) => void;
}

const COMPLEXITIES: Record<string, string> = {
  bubble: 'O(n²) - Quadratic',
  selection: 'O(n²) - Quadratic',
  insertion: 'O(n²) - Quadratic',
  merge: 'O(n log n) - Logarithmic',
  shell: 'O(n log² n)',
  linear: 'O(n) - Linear',
  sequential: 'O(n) - Linear',
  binary: 'O(log n) - Logarithmic',
};

export function Dashboard({ onLogout, currentUser, initialData, onDataUpdate }: DashboardProps) {
  const [manager] = useState(new StudentManager(initialData));
  const [students, setStudents] = useState<Student[]>([]);
  
  // Controls
  const [sortAlgo, setSortAlgo] = useState<SortAlgorithm>('bubble');
  const [sortBy, setSortBy] = useState<'name'|'gpa'|'nim'>('name');
  const [sortOrder, setSortOrder] = useState<'asc'|'desc'>('asc');
  const [searchAlgo, setSearchAlgo] = useState<SearchAlgorithm>('linear');
  const [searchQuery, setSearchQuery] = useState("");
  
  const [timeComplexity, setTimeComplexity] = useState<string>("");
  const [executionTime, setExecutionTime] = useState<number | null>(null);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState<Partial<StudentData>>({
    name: "", nim: "", major: "", gpa: 0
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editGpa, setEditGpa] = useState<number>(0);

  useEffect(() => {
    setStudents(manager.getStudents());
  }, []);

  const refreshData = () => {
    const currentStudents = manager.getStudents();
    setStudents(currentStudents);
    onDataUpdate(currentStudents); // Sync with parent state
  };

  // Combined Search & Sort Handler
  useEffect(() => {
    const { results, time: sTime } = manager.search(searchQuery, searchAlgo);
    const { data, time: sortTime } = manager.sort(sortAlgo, sortBy, sortOrder);
    
    // Use the sorted order but filter based on search results presence
    // This logic ensures we respect both sort and search
    // Actually simpler: Sort the search results
    
    // Better Approach:
    // 1. If searching, search first from all data
    // 2. Then sort the search results
    
    // However, manager.sort operates on the internal state which might be what we want to display
    // Let's rely on manager state for now as it modifies internal array
    
    if (searchQuery) {
       // Search modifies return but not necessarily internal order permanently for sort?
       // Let's filter manually on the sorted full list to keep UI consistent
       const final = data.filter(s => 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        s.nim.includes(searchQuery)
       );
       setStudents(final);
       setExecutionTime(sTime + sortTime);
       setTimeComplexity(`Sort: ${COMPLEXITIES[sortAlgo]} | Search: ${COMPLEXITIES[searchAlgo]}`);
    } else {
       setStudents(data);
       setExecutionTime(sortTime);
       setTimeComplexity(`Sort: ${COMPLEXITIES[sortAlgo]}`);
    }

  }, [sortAlgo, sortBy, sortOrder, searchQuery, searchAlgo, manager]);

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
      
      // Force UI refresh with current sort settings
      const { data } = manager.sort(sortAlgo, sortBy, sortOrder);
      setStudents(data);
      
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
    const { data } = manager.sort(sortAlgo, sortBy, sortOrder);
    setStudents(data);
    toast({ title: "Dihapus", description: "Data mahasiswa dihapus" });
  };
  
  const startEditing = (student: Student) => {
      setEditingId(student.id);
      setEditGpa(student.gpa);
  };
  
  const saveEdit = (id: string) => {
      manager.updateStudent(id, { gpa: editGpa });
      setEditingId(null);
      refreshData();
      const { data } = manager.sort(sortAlgo, sortBy, sortOrder);
      setStudents(data);
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

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const chartData = students.map(s => ({
    name: s.name.split(' ')[0],
    gpa: s.gpa,
  }));

  const averageGPA = students.length > 0 
    ? (students.reduce((acc, curr) => acc + curr.gpa, 0) / students.length).toFixed(2) 
    : "0.00";

  return (
    <div className="flex min-h-screen bg-[#0f1115] font-sans text-white overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className="w-64 border-r border-white/5 bg-[#0f1115] flex flex-col fixed h-full z-20">
        <div className="p-6 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.5)]">
            <GraduationCap className="text-white h-6 w-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-none tracking-wide text-white">
              STUDENT
            </h1>
            <span className="text-cyan-400 text-sm font-mono tracking-widest">ACADEMIC</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          <Button onClick={() => scrollToSection('dashboard-section')} variant="ghost" className="w-full justify-start gap-3 text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 hover:text-cyan-300">
            <LayoutDashboard size={18} /> DASHBOARD
          </Button>
          <Button onClick={() => scrollToSection('students-section')} variant="ghost" className="w-full justify-start gap-3 text-gray-400 hover:bg-white/5 hover:text-white">
            <Terminal size={18} /> MAHASISWA
          </Button>
          <Button onClick={() => scrollToSection('settings-section')} variant="ghost" className="w-full justify-start gap-3 text-gray-400 hover:bg-white/5 hover:text-white">
            <Settings size={18} /> PENGATURAN
          </Button>
        </nav>

        <div className="p-4 border-t border-white/5">
          <Button 
            variant="outline" 
            className="w-full justify-start gap-3 border-red-500/20 text-red-500 hover:bg-red-500/10 hover:text-red-400"
            onClick={onLogout}
          >
            <LogOut size={18} /> LOGOUT SYSTEM
          </Button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 ml-64 p-8 overflow-y-auto h-screen relative scroll-smooth">
        {/* Background Grid */}
        <div className="fixed inset-0 z-0 pointer-events-none bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] ml-64" />

        <div className="relative z-10 max-w-7xl mx-auto space-y-8">
          
          {/* DASHBOARD SECTION */}
          <section id="dashboard-section" className="scroll-mt-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* CHART */}
              <Card className="lg:col-span-2 border border-white/10 bg-[#15171e]/80 backdrop-blur-sm shadow-xl h-[450px]">
                <CardContent className="p-6 h-full flex flex-col">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-heading font-bold text-lg text-white uppercase tracking-wide">
                      STATISTIK IPK MAHASISWA
                    </h3>
                    <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 font-mono px-3 py-1">
                      RATA-RATA: {averageGPA}
                    </Badge>
                  </div>
                  <div className="flex-1 w-full min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} barSize={20}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                        <XAxis dataKey="name" stroke="#ffffff50" fontSize={10} tickLine={false} axisLine={false} interval={0} angle={-45} textAnchor="end" height={60} />
                        <YAxis stroke="#ffffff50" fontSize={10} tickLine={false} axisLine={false} domain={[0, 4]} />
                        <Tooltip 
                          cursor={{fill: '#ffffff05'}}
                          contentStyle={{ backgroundColor: '#0f1115', border: '1px solid #333', color: '#fff', fontSize: '12px' }}
                        />
                        <Bar dataKey="gpa" radius={[4, 4, 0, 0]}>
                          {chartData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={entry.gpa >= 3.5 ? '#06b6d4' : (entry.gpa >= 3.0 ? '#3b82f6' : '#8b5cf6')} 
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* SUMMARY CARDS */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-heading font-bold text-lg text-cyan-400 uppercase tracking-wide">RINGKASAN</h3>
                </div>
                
                <Card className="border border-white/10 bg-[#1a1d26] shadow-lg group hover:border-cyan-500/30 transition-colors">
                  <CardContent className="p-5">
                    <p className="text-xs text-gray-400 font-mono mb-1 uppercase">TOTAL MAHASISWA</p>
                    <p className="text-3xl font-bold text-white">{students.length}</p>
                  </CardContent>
                </Card>

                <Card className="border border-white/10 bg-[#1a1d26] shadow-lg group hover:border-purple-500/30 transition-colors">
                  <CardContent className="p-5">
                    <p className="text-xs text-gray-400 font-mono mb-1 uppercase">RATA-RATA IPK</p>
                    <p className="text-3xl font-bold text-purple-400">{averageGPA}</p>
                  </CardContent>
                </Card>

                <Card className="border border-white/10 bg-[#1a1d26] shadow-lg group hover:border-green-500/30 transition-colors">
                  <CardContent className="p-5">
                    <p className="text-xs text-gray-400 font-mono mb-1 uppercase">CUMLAUDE (&gt; 3.5)</p>
                    <p className="text-3xl font-bold text-cyan-400">{students.filter(s => s.gpa > 3.5).length}</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          {/* ALGORITHM CONFIG PANEL & SETTINGS */}
          <section id="settings-section" className="scroll-mt-8">
            <div className="flex items-center gap-3 mb-4">
               <div className="w-1 h-8 bg-cyan-500 rounded-full box-shadow-[0_0_10px_#06b6d4]" />
               <h2 className="text-2xl font-bold font-heading text-white uppercase tracking-wider">CONFIG & DATA</h2>
            </div>

            <Card className="border border-white/10 bg-[#15171e] shadow-xl">
               <div className="border-b border-white/5 px-6 py-3 flex justify-between items-center bg-white/[0.02]">
                  <div className="flex items-center gap-2 text-cyan-400 font-bold font-mono text-sm">
                     <Terminal size={14} /> ALGORITHM CONFIG
                  </div>
                  <div className="text-[10px] font-mono text-gray-500">
                     {timeComplexity && `Time Complexity: ${timeComplexity}`}
                     {executionTime !== null && ` | Exec Time: ${executionTime.toFixed(4)}ms`}
                  </div>
               </div>
               <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4 items-end">
                     
                     <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-mono text-gray-500">SORT ALGO</Label>
                        <Select value={sortAlgo} onValueChange={(v: any) => setSortAlgo(v)}>
                           <SelectTrigger className="bg-[#0f1115] border-white/10 text-xs h-10">
                              <SelectValue />
                           </SelectTrigger>
                           <SelectContent className="bg-[#0f1115] border-white/10 text-white">
                              <SelectItem value="bubble">Bubble Sort</SelectItem>
                              <SelectItem value="selection">Selection Sort</SelectItem>
                              <SelectItem value="insertion">Insertion Sort</SelectItem>
                              <SelectItem value="merge">Merge Sort</SelectItem>
                              <SelectItem value="shell">Shell Sort</SelectItem>
                           </SelectContent>
                        </Select>
                     </div>

                     <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-mono text-gray-500">SORT BY</Label>
                        <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                           <SelectTrigger className="bg-[#0f1115] border-white/10 text-xs h-10">
                              <SelectValue />
                           </SelectTrigger>
                           <SelectContent className="bg-[#0f1115] border-white/10 text-white">
                              <SelectItem value="name">Nama</SelectItem>
                              <SelectItem value="gpa">IPK</SelectItem>
                              <SelectItem value="nim">NIM</SelectItem>
                           </SelectContent>
                        </Select>
                     </div>

                     <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-mono text-gray-500">SORT ORDER</Label>
                        <Select value={sortOrder} onValueChange={(v: any) => setSortOrder(v)}>
                           <SelectTrigger className="bg-[#0f1115] border-white/10 text-xs h-10">
                              <SelectValue />
                           </SelectTrigger>
                           <SelectContent className="bg-[#0f1115] border-white/10 text-white">
                              <SelectItem value="asc">Ascending (A-Z)</SelectItem>
                              <SelectItem value="desc">Descending (Z-A)</SelectItem>
                           </SelectContent>
                        </Select>
                     </div>

                     <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-mono text-gray-500">SEARCH ALGO</Label>
                        <Select value={searchAlgo} onValueChange={(v: any) => setSearchAlgo(v)}>
                           <SelectTrigger className="bg-[#0f1115] border-white/10 text-xs h-10">
                              <SelectValue />
                           </SelectTrigger>
                           <SelectContent className="bg-[#0f1115] border-white/10 text-white">
                              <SelectItem value="linear">Linear Search</SelectItem>
                              <SelectItem value="binary">Binary Search</SelectItem>
                              <SelectItem value="sequential">Sequential Search</SelectItem>
                           </SelectContent>
                        </Select>
                     </div>

                     <div className="lg:col-span-2 flex gap-3">
                        <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleImport} />
                        <Button 
                          variant="outline" 
                          onClick={handleExport} 
                          className="flex-1 h-10 bg-[#0f1115] border-cyan-500/30 text-cyan-500 text-xs font-medium hover:bg-cyan-500/10 hover:text-cyan-400 hover:border-cyan-500/60 transition-all"
                        >
                           <Download size={14} className="mr-2" /> Export JSON
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => fileInputRef.current?.click()} 
                          className="flex-1 h-10 bg-[#0f1115] border-purple-500/30 text-purple-500 text-xs font-medium hover:bg-purple-500/10 hover:text-purple-400 hover:border-purple-500/60 transition-all"
                        >
                           <Upload size={14} className="mr-2" /> Import JSON
                        </Button>
                     </div>

                  </div>
               </CardContent>
            </Card>
          </section>

          {/* STUDENTS SECTION */}
          <section id="students-section" className="scroll-mt-8">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-4">
               <div className="relative w-full md:w-96">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <Input 
                     placeholder="Cari Nama atau NIM..." 
                     className="pl-10 bg-[#15171e] border-white/10 text-white focus:border-cyan-500/50"
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                  />
               </div>
               
               <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold tracking-wide shadow-[0_0_15px_rgba(6,182,212,0.4)]">
                       <Plus size={16} className="mr-2" /> TAMBAH MAHASISWA
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-[#15171e] border-white/10 text-white">
                    <DialogHeader>
                      <DialogTitle>Tambah Mahasiswa Baru</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">Nama</Label>
                        <Input id="name" className="col-span-3 bg-white/5 border-white/10" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="nim" className="text-right">NIM</Label>
                        <Input id="nim" className="col-span-3 bg-white/5 border-white/10" value={formData.nim} onChange={e => setFormData({...formData, nim: e.target.value})} />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="major" className="text-right">Jurusan</Label>
                        <Input id="major" className="col-span-3 bg-white/5 border-white/10" value={formData.major} onChange={e => setFormData({...formData, major: e.target.value})} />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="gpa" className="text-right">IPK</Label>
                        <Input id="gpa" type="number" step="0.01" max="4.0" className="col-span-3 bg-white/5 border-white/10" value={formData.gpa} onChange={e => setFormData({...formData, gpa: parseFloat(e.target.value)})} />
                      </div>
                    </div>
                    <Button onClick={handleAdd} className="bg-cyan-500 text-black hover:bg-cyan-600 w-full">Simpan Data</Button>
                  </DialogContent>
               </Dialog>
            </div>

            {/* TABLE */}
            <div className="rounded-lg border border-white/10 bg-[#15171e] overflow-hidden shadow-xl">
               <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-white/5 text-gray-400 font-mono border-b border-white/10">
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
                        <tr key={student.id} className="hover:bg-white/[0.02] transition-colors group">
                           <td className="px-6 py-4 font-medium text-white">{student.name}</td>
                           <td className="px-6 py-4 font-mono text-gray-400">{student.nim}</td>
                           <td className="px-6 py-4 text-gray-400">{student.major}</td>
                           <td className="px-6 py-4 text-center">
                              {editingId === student.id ? (
                                 <div className="flex items-center justify-center gap-2">
                                    <Input 
                                       type="number" 
                                       className="w-16 h-8 text-center bg-black/50 border-cyan-500 text-white text-xs" 
                                       value={editGpa} 
                                       onChange={(e) => setEditGpa(parseFloat(e.target.value))}
                                       step="0.01" max="4.00" autoFocus
                                    />
                                    <Button size="icon" className="h-8 w-8 bg-cyan-500 hover:bg-cyan-600 text-black" onClick={() => saveEdit(student.id)}>
                                       <Upload size={12} />
                                    </Button>
                                 </div>
                              ) : (
                                 <Badge 
                                    variant="outline" 
                                    className={`cursor-pointer hover:bg-white/10 ${student.gpa >= 3.5 ? "border-cyan-500/50 text-cyan-400" : (student.gpa >= 3.0 ? "border-blue-500/50 text-blue-400" : "border-purple-500/50 text-purple-400")} font-mono`}
                                 >
                                    {student.gpa.toFixed(2)}
                                 </Badge>
                              )}
                           </td>
                           <td className="px-6 py-4 w-48">
                              <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                                 <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(student.gpa / 4) * 100}%` }}
                                    className={`h-full ${student.gpa >= 3.5 ? 'bg-cyan-400' : (student.gpa >= 3.0 ? 'bg-blue-500' : 'bg-purple-500')}`}
                                 />
                              </div>
                           </td>
                           <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 text-gray-500 hover:text-cyan-400 hover:bg-cyan-500/10" 
                                  onClick={() => startEditing(student)}
                                  title="Edit Data"
                                >
                                   <Edit size={14} />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 text-gray-500 hover:text-red-500 hover:bg-red-500/10" 
                                  onClick={() => handleDelete(student.id)}
                                  title="Hapus Data"
                                >
                                   <Trash2 size={14} />
                                </Button>
                              </div>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
               {students.length === 0 && (
                  <div className="p-12 text-center text-gray-500 font-mono text-sm">
                     NO DATA FOUND IN CURRENT VIEW
                  </div>
               )}
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}
