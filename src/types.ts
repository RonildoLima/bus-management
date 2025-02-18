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
  name: string; // A propriedade 'name' já está correta
  seats: number;
  schools: string[];
  students: Student[];
}