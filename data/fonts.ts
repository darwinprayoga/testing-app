export type FontFamily = {
  name: string;
  value: string;
};

export type FontSize = {
  name: string;
  value: string;
  size: number;
};

export const availableFonts: FontFamily[] = [
  { name: "Source Sans Pro", value: "'Source Sans Pro', sans-serif" },
  { name: "Poppins", value: "'Poppins', sans-serif" },
  { name: "Montserrat", value: "'Montserrat', sans-serif" },
  { name: "Inter", value: "'Inter', sans-serif" },
  { name: "Roboto", value: "'Roboto', sans-serif" },
  { name: "Open Sans", value: "'Open Sans', sans-serif" },
  { name: "Lato", value: "'Lato', sans-serif" },
  { name: "Raleway", value: "'Raleway', sans-serif" },
  { name: "Ubuntu", value: "'Ubuntu', sans-serif" },
  { name: "Playfair Display", value: "'Playfair Display', serif" },
  { name: "Merriweather", value: "'Merriweather', serif" },
  { name: "Nunito", value: "'Nunito', sans-serif" },
];

export const availableSizes: FontSize[] = [
  { name: "Extra Small", value: "xs", size: 12 },
  { name: "Small", value: "sm", size: 14 },
  { name: "Medium", value: "md", size: 16 },
  { name: "Large", value: "lg", size: 18 },
  { name: "Extra Large", value: "xl", size: 20 },
  { name: "2XL", value: "2xl", size: 24 },
];
