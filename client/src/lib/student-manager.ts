import { Student, StudentData } from "./student";

export type SortAlgorithm = 'bubble' | 'selection' | 'insertion' | 'merge' | 'shell';
export type SearchAlgorithm = 'linear' | 'binary' | 'sequential';

export class StudentManager {
  private students: Student[] = [];

  constructor(initialData: StudentData[] = []) {
    this.students = initialData.map(d => new Student(d));
  }

  getStudents(): Student[] {
    return [...this.students];
  }

  // CRUD Operations
  addStudent(data: StudentData): void {
    // Regex Validation for NIM (Example: Must be digits)
    if (!/^\d+$/.test(data.nim)) {
      throw new Error("Format NIM Tidak Valid: Harus berupa angka");
    }
    this.students.push(new Student(data));
  }

  updateStudent(id: string, data: Partial<StudentData>): void {
    const student = this.students.find(s => s.id === id);
    if (!student) throw new Error("Mahasiswa tidak ditemukan");
    
    if (data.name) student.name = data.name;
    if (data.nim) student.nim = data.nim;
    if (data.major) student.major = data.major;
    if (data.gpa) student.gpa = data.gpa;
  }

  deleteStudent(id: string): void {
    this.students = this.students.filter(s => s.id !== id);
  }

  // Sorting Algorithms
  sort(algorithm: SortAlgorithm, key: 'gpa' | 'name' | 'nim', order: 'asc' | 'desc' = 'asc'): { data: Student[], time: number } {
    const start = performance.now();
    let sorted = [...this.students];

    switch (algorithm) {
      case 'bubble':
        sorted = this.bubbleSort(sorted, key, order);
        break;
      case 'selection':
        sorted = this.selectionSort(sorted, key, order);
        break;
      case 'insertion':
        sorted = this.insertionSort(sorted, key, order);
        break;
      case 'merge':
        sorted = this.mergeSort(sorted, key, order);
        break;
      case 'shell':
        sorted = this.shellSort(sorted, key, order);
        break;
    }

    const end = performance.now();
    this.students = sorted; // Update internal state
    return { data: sorted, time: end - start };
  }

  private compare(a: Student, b: Student, key: string, order: 'asc' | 'desc'): number {
    // @ts-ignore
    const valA = a[key];
    // @ts-ignore
    const valB = b[key];
    
    let result = 0;
    if (valA < valB) result = -1;
    if (valA > valB) result = 1;
    
    return order === 'asc' ? result : -result;
  }

  private bubbleSort(arr: Student[], key: string, order: 'asc' | 'desc'): Student[] {
    let n = arr.length;
    for (let i = 0; i < n - 1; i++) {
      for (let j = 0; j < n - i - 1; j++) {
        if (this.compare(arr[j], arr[j + 1], key, order) > 0) {
          [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        }
      }
    }
    return arr;
  }

  private selectionSort(arr: Student[], key: string, order: 'asc' | 'desc'): Student[] {
    let n = arr.length;
    for (let i = 0; i < n - 1; i++) {
      let min_idx = i;
      for (let j = i + 1; j < n; j++) {
        if (this.compare(arr[j], arr[min_idx], key, order) < 0) {
          min_idx = j;
        }
      }
      [arr[i], arr[min_idx]] = [arr[min_idx], arr[i]];
    }
    return arr;
  }

  private insertionSort(arr: Student[], key: string, order: 'asc' | 'desc'): Student[] {
    let n = arr.length;
    for (let i = 1; i < n; i++) {
      let current = arr[i];
      let j = i - 1;
      while (j > -1 && this.compare(arr[j], current, key, order) > 0) {
        arr[j + 1] = arr[j];
        j--;
      }
      arr[j + 1] = current;
    }
    return arr;
  }

  private mergeSort(arr: Student[], key: string, order: 'asc' | 'desc'): Student[] {
    if (arr.length <= 1) return arr;
    const mid = Math.floor(arr.length / 2);
    const left = this.mergeSort(arr.slice(0, mid), key, order);
    const right = this.mergeSort(arr.slice(mid), key, order);
    return this.merge(left, right, key, order);
  }

  private merge(left: Student[], right: Student[], key: string, order: 'asc' | 'desc'): Student[] {
    let resultArray = [], leftIndex = 0, rightIndex = 0;
    while (leftIndex < left.length && rightIndex < right.length) {
      if (this.compare(left[leftIndex], right[rightIndex], key, order) < 0) {
        resultArray.push(left[leftIndex]);
        leftIndex++;
      } else {
        resultArray.push(right[rightIndex]);
        rightIndex++;
      }
    }
    return resultArray.concat(left.slice(leftIndex)).concat(right.slice(rightIndex));
  }

  private shellSort(arr: Student[], key: string, order: 'asc' | 'desc'): Student[] {
    let n = arr.length;
    for (let gap = Math.floor(n / 2); gap > 0; gap = Math.floor(gap / 2)) {
      for (let i = gap; i < n; i++) {
        let temp = arr[i];
        let j;
        for (j = i; j >= gap && this.compare(arr[j - gap], temp, key, order) > 0; j -= gap) {
          arr[j] = arr[j - gap];
        }
        arr[j] = temp;
      }
    }
    return arr;
  }

  // Searching
  search(query: string, algorithm: SearchAlgorithm): { results: Student[], time: number } {
    const start = performance.now();
    let results: Student[] = [];

    if (algorithm === 'linear' || algorithm === 'sequential') {
      results = this.students.filter(s => 
        s.name.toLowerCase().includes(query.toLowerCase()) || 
        s.nim.includes(query)
      );
    } else if (algorithm === 'binary') {
      // Binary search requires sorted array. Sort by Name ascending first.
      const sorted = this.mergeSort([...this.students], 'name', 'asc');
      const index = this.binarySearch(sorted, query);
      if (index !== -1) results = [sorted[index]];
    }

    const end = performance.now();
    return { results, time: end - start };
  }

  private binarySearch(arr: Student[], x: string): number {
    let l = 0, r = arr.length - 1;
    while (l <= r) {
      let m = l + Math.floor((r - l) / 2);
      let res = x.toLowerCase().localeCompare(arr[m].name.toLowerCase());
      if (res === 0) return m;
      if (res > 0) l = m + 1;
      else r = m - 1;
    }
    return -1;
  }

  // File I/O Simulation
  saveToJSON(): string {
    return JSON.stringify(this.students.map(s => s.toJSON()));
  }

  loadFromJSON(json: string): void {
    try {
      const data = JSON.parse(json);
      this.students = data.map((d: StudentData) => new Student(d));
    } catch (e) {
      throw new Error("Gagal membaca file");
    }
  }
}
