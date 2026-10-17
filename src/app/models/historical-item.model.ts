export interface HistoricalItem {
  name: string;
  years: string;
  imagePath: string;
  description: string;
  details: string[];
  references: { [key: string]: string };
}