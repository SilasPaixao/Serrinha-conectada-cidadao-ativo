export const normalizeCategory = (cat: string): string => {
  if (!cat) return cat;
  const lowerCat = cat.toLowerCase();
  if (lowerCat.includes('iluminação pública')) return 'Iluminação Pública';
  if (lowerCat.includes('buracos')) return 'Buracos em Vias';
  if (lowerCat.includes('limpeza urbana') || lowerCat.includes('lixo')) return 'Limpeza Urbana';
  if (lowerCat.includes('esgoto') || lowerCat.includes('drenagem')) return 'Esgoto/Drenagem';
  return cat; // Keep original if no match, but it won't be filterable via dropdown
};
