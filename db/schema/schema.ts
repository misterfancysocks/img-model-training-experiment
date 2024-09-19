export interface User {
  id: number;
  name: string;
  age: number;
  gender: string;
  ethnicity: string;
  created_at: string;
  updated_at: string;
}

export interface Photo {
  id: number;
  user_id: number;
  file_path: string;
  is_cropped: boolean;
  is_background_removed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Costume {
  id: number;
  user_id: number; // Added missing field
  name: string;
  description: string | null;
  size?: string; // Made optional
  category?: string; // Made optional
  created_at: string;
  updated_at: string;
}

export interface GeneratedImage {
  id: number;
  user_id: number;
  costume_id: number;
  file_path: string;
  created_at: string;
}

export interface ShootData {
  id?: number;
  name: string;
  costumeGender: 'male' | 'female' | 'neither';
  costume: string;
  backdrop?: string;
  personId?: number;
}

export interface ImageData {
  id?: number;
  shootId: number;
  fileName: string;
  originalUrl: string;
  croppedUrl?: string;
}

export interface PersonData {
  id?: number;
  firstName: string;
  lastName: string;
  ethnicity: 'white' | 'latino' | 'black' | 'asian';
  gender: 'male' | 'female';
  age: number;
}