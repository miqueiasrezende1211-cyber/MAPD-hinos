import hinosData from "./hinos.json";

export type Hino = {
  numero: number;
  titulo: string;
  letra: string;
  tom?: string | null;
  tipo?: string | null;
  possuiCifra?: boolean;
};

export const hinos: Hino[] = hinosData as Hino[];
