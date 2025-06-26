export interface User {
  name: string;
  age: number;
  height: number;
  weight: number;
  bloodGroup: string;
  ethnicity: string;
  email: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  availability: string[];
  image: string;
  rating: number;
  linkedIn?: string;
}

export interface DiseaseCard {
  id: string;
  name: string;
  icon: string;
  description: string;
}
