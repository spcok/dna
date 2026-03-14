/**
 * The Combiner: Client-side DNA parsing engine.
 * Ensures raw genomic data never leaves the user's device.
 */

// A test array of 10 specific RSIDs for the active modules
export const TARGET_RSIDS = [
  'rs4680',    // COMT (Dopamine/Pain/Cognition)
  'rs1800497', // DRD2 (Dopamine receptor/Addiction)
  'rs1801260', // CLOCK (Circadian rhythm/Sleep)
  'rs4988235', // LCT (Lactose tolerance)
  'rs9939609', // FTO (Fat mass/obesity)
  'rs1799971', // OPRM1 (Opioid receptor/Pain sensitivity)
  'rs1815739', // ACTN3 (Muscle fiber type/Athletic performance)
  'rs7412',    // APOE (Alzheimer's/Cardiovascular risk)
  'rs429358',  // APOE (Alzheimer's/Cardiovascular risk)
  'rs6152'     // AR (Androgen receptor/Hair loss)
];

export interface CombinerResult {
  privacy_check: boolean;
  source: string;
  snps: Record<string, string | null>;
}

/**
 * Parses an AncestryDNA or generic 23andMe style raw data file locally.
 * Extracts only the targeted RSIDs.
 * 
 * @param file The raw DNA File object uploaded by the user
 * @param targetRsids Array of RSIDs to extract
 * @returns A clean JSON object ready for the database/AI
 */
export async function parseAncestryDNA(
  file: File, 
  targetRsids: string[] = TARGET_RSIDS
): Promise<CombinerResult> {
  const text = await file.text();
  const lines = text.split('\n');
  const extracted: Record<string, string | null> = {};

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
