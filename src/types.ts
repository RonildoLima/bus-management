export interface School {
  name: string;
  students: string[];
}

export interface Student {
  name: string;
  school: string;
}

export interface Bus {
  id: number;
  seats: number;
  schools: string[];
  students: Student[];
}