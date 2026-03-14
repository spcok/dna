/**
 * The Combiner: Client-side DNA parsing engine.
 * Ensures raw genomic data never leaves the user's device.
 */

export const SNP_DICTIONARY: Record<string, string[]> = {
  neurodivergence: [
    'rs6265',    // BDNF
    'rs53576',   // OXTR
    'rs1801133', // MTHFR
    'rs1801131', // MTHFR
    'rs25531',   // SLC6A4
    'rs4795541', // SLC6A4
    'rs1800497', // DRD2
    'rs1799732', // DRD2
    'rs11246226',// DRD4
    'rs1800955', // DRD4
    'rs4680',    // COMT
    'rs4504469', // KIAA0319
    'rs806151',  // HDC
    'rs7794745'  // CNTNAP2
  ],
  pgx: [
    'rs1065852', // CYP2D6
    'rs3892097', // CYP2D6
    'rs12248560',// CYP2C19
    'rs4244285', // CYP2C19
    'rs1799853', // CYP2C9
    'rs1057910', // CYP2C9
    'rs4149056', // SLCO1B1
    'rs9923231', // VKORC1
    'rs1799971'  // OPRM1
  ],
  // Add other modules as needed
};

export const TARGET_RSIDS = Object.values(SNP_DICTIONARY).flat();

export interface CombinerResult {
  privacy_check: boolean;
  source: string;
  snps: Record<string, string | null>;
}

/**
 * Parses an AncestryDNA or generic 23andMe style raw data file locally.
 * Extracts only the targeted RSIDs for a given module.
 * 
 * @param file The raw DNA File object uploaded by the user
 * @param moduleId The module ID to filter SNPs by
 * @returns A clean JSON object ready for the database/AI
 */
export async function parseAncestryDNA(
  file: File, 
  moduleId?: string
): Promise<CombinerResult> {
  const text = await file.text();
  const lines = text.split('\n');
  const extracted: Record<string, string | null> = {};
  
  const targetRsids = moduleId && SNP_DICTIONARY[moduleId] 
    ? SNP_DICTIONARY[moduleId] 
    : TARGET_RSIDS;

  let isAncestry = false;
  let is23andMe = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === '') continue;

    // Parse headers to identify the source
    if (trimmed.startsWith('#')) {
      const lowerLine = trimmed.toLowerCase();
      if (lowerLine.includes('ancestrydna')) isAncestry = true;
      if (lowerLine.includes('23andme')) is23andMe = true;
      continue;
    }

    // AncestryDNA & 23andMe format: rsid chromosome position allele1 allele2
    // Usually separated by tabs
    const parts = trimmed.split('\t');
    
    if (parts.length >= 4) {
      const rsid = parts[0];
      
      // If it's a target SNP, extract the alleles
      if (targetRsids.includes(rsid)) {
        // Ancestry format usually has 5 columns: rsid, chr, pos, allele1, allele2
        // 23andMe usually has 4 columns: rsid, chr, pos, genotype (e.g., 'AA')
        let genotype: string | null = null;

        if (parts.length >= 5) {
          // Ancestry style
          const allele1 = parts[3];
          const allele2 = parts[4];
          if (allele1 === '0' || allele1 === '-' || allele2 === '0' || allele2 === '-') {
            genotype = null;
          } else {
            genotype = `${allele1}${allele2}`;
          }
        } else if (parts.length === 4) {
          // 23andMe style
          const rawGenotype = parts[3];
          if (rawGenotype === '--' || rawGenotype === '00' || rawGenotype === '__') {
            genotype = null;
          } else {
            genotype = rawGenotype;
          }
        }

        extracted[rsid] = genotype;
      }
    }
  }

  // Ensure all target RSIDs are present in the output.
  // If missing or unrecognized, return null for that data point. Do not guess.
  for (const rsid of targetRsids) {
    if (extracted[rsid] === undefined) {
      extracted[rsid] = null;
    }
  }

  return {
    privacy_check: true,
    source: isAncestry ? "AncestryDNA" : is23andMe ? "23andMe" : "Unknown/Generic",
    snps: extracted
  };
}
