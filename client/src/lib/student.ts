
export interface StudentData {
  id: string;
  name: string;
  nim: string;
  major: string;
  gpa: number;
}

export class Student {
  private _id: string;
  private _name: string;
  private _nim: string;
  private _major: string;
  private _gpa: number;

  constructor(data: StudentData) {
    this._id = data.id;
    this._name = data.name;
    this._nim = data.nim;
    this._major = data.major;
    this._gpa = data.gpa;
  }

  // Getters (Encapsulation)
  get id() { return this._id; }
  get name() { return this._name; }
  get nim() { return this._nim; }
  get major() { return this._major; }
  get gpa() { return this._gpa; }

  // Setters
  set name(val: string) { this._name = val; }
  set nim(val: string) { this._nim = val; }
  set major(val: string) { this._major = val; }
  set gpa(val: number) { this._gpa = val; }

  toJSON(): StudentData {
    return {
      id: this._id,
      name: this._name,
      nim: this._nim,
      major: this._major,
      gpa: this._gpa
    };
  }
}
