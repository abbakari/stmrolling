// Discount calculation utility based on category and brand combinations
// Converted from PHP getCategoryDiscount() function

export interface DiscountCalculationInput {
  category: string;
  brand: string;
}

export function getCategoryDiscount(input: DiscountCalculationInput): number {
  const { category, brand } = input;
  let discount = 1; // Default no discount

  // Convert to uppercase for case-insensitive comparison (like PHP strcasecmp)
  const categoryUpper = category.toUpperCase();
  const brandUpper = brand.toUpperCase();

  // P4X4 Category
  if (categoryUpper === "P4X4" && brandUpper === "BF GOODRICH") {
    discount = 1 - 0.2277;
  } else if (categoryUpper === "P4X4" && brandUpper === "GITI") {
    discount = 1 - 0.0933;
  } else if (categoryUpper === "P4X4" && brandUpper === "MICHELIN") {
    discount = 1 - 0.1829;
  }
  
  // TBR Category
  else if (categoryUpper === "TBR" && brandUpper === "AEOLUS") {
    discount = 1 - 0.0004;
  } else if (categoryUpper === "TBR" && brandUpper === "BF GOODRICH") {
    discount = 1 - 0.1761;
  } else if (categoryUpper === "TBR" && brandUpper === "MICHELIN") {
    discount = 1 - 0.1126;
  } else if (categoryUpper === "TBR" && brandUpper === "GITI") {
    discount = 1 - 0.0076;
  } else if (categoryUpper === "TBR" && brandUpper === "ADVANCE") {
    discount = 1 - 0.0013;
  } else if (categoryUpper === "TBR" && brandUpper === "TIGAR") {
    discount = 1 - 0.1429;
  } else if (categoryUpper === "TBR" && brandUpper === "BRIDGESTONE") {
    discount = 1 - 0.302;
  }
  
  // AGR Category
  else if (categoryUpper === "AGR" && brandUpper === "PETLAS") {
    discount = 1 - 0.0308;
  } else if (categoryUpper === "AGR" && brandUpper === "MICHELIN") {
    discount = 1 - 0.0755;
  } else if (categoryUpper === "AGR" && brandUpper === "BKT") {
    discount = 1 - 0.1000;
  }
  
  // SPR Category (Spare Parts)
  else if (categoryUpper === "SPR" && brandUpper === "BPW") {
    discount = 1 - 0.0360;
  } else if (categoryUpper === "SPR" && brandUpper === "WABCO") {
    discount = 1 - 0.0416;
  } else if (categoryUpper === "SPR" && brandUpper === "3M") {
    discount = 1 - 0.0263;
  } else if (categoryUpper === "SPR" && brandUpper === "TEXTAR") {
    discount = 1 - 0.0394;
  } else if (categoryUpper === "SPR" && brandUpper === "CONTITECH") {
    discount = 1 - 0.0426;
  } else if (categoryUpper === "SPR" && brandUpper === "DON") {
    discount = 1 - 0.0409;
  } else if (categoryUpper === "SPR" && brandUpper === "DONALDSON") {
    discount = 1 - 0.0300;
  } else if (categoryUpper === "SPR" && brandUpper === "VARTA") {
    discount = 1 - 0.0429;
  } else if (categoryUpper === "SPR" && brandUpper === "VBG") {
    discount = 1 - 0.0235;
  } else if (categoryUpper === "SPR" && brandUpper === "JOST") {
    discount = 1 - 0.0608;
  } else if (categoryUpper === "SPR" && brandUpper === "MANN FILTER") {
    discount = 1 - 0.0356;
  } else if (categoryUpper === "SPR" && brandUpper === "NISSHINBO") {
    discount = 1 - 0.0625;
  } else if (categoryUpper === "SPR" && brandUpper === "HELLA") {
    discount = 1 - 0.0381;
  } else if (categoryUpper === "SPR" && brandUpper === "SACH") {
    discount = 1 - 0.0497;
  } else if (categoryUpper === "SPR" && brandUpper === "WAIKAR") {
    discount = 1 - 0.0302;
  } else if (categoryUpper === "SPR" && brandUpper === "MYERS") {
    discount = 1 - 0.0300;
  } else if (categoryUpper === "SPR" && brandUpper === "TANK FITTINGS") {
    discount = 1 - 0.0391;
  } else if (categoryUpper === "SPR" && brandUpper === "TYRE ACCESSORIES AND SPARES") {
    discount = 1 - 0.0227;
  } else if (categoryUpper === "SPR" && brandUpper === "CORGHI") {
    discount = 1 - 0.0189;
  } else if (categoryUpper === "SPR" && brandUpper === "FRONIUS") {
    discount = 1 - 0.0500;
  } else if (categoryUpper === "SPR" && brandUpper === "KAHVECI OTOMOTIV") {
    discount = 1 - 0.0481;
  } else if (categoryUpper === "SPR" && brandUpper === "ZECA") {
    discount = 1 - 0.0037;
  } else if (categoryUpper === "SPR" && brandUpper === "FINI") {
    discount = 1 - 0.0240;
  } else if (categoryUpper === "SPR" && brandUpper === "JMC") {
    discount = 1 - 0.0500;
  }
  
  // IND Category
  else if (categoryUpper === "IND" && brandUpper === "ADVANCE") {
    discount = 1 - 0.0169;
  } else if (categoryUpper === "IND" && brandUpper === "CAMSO") {
    discount = 1 - 0.0179;
  } else if (categoryUpper === "IND" && brandUpper === "MICHELIN") {
    discount = 1 - 0.0476;
  } else if (categoryUpper === "IND" && brandUpper === "PETLAS") {
    discount = 1 - 0.2000;
  }
  
  // OTR Category
  else if (categoryUpper === "OTR" && brandUpper === "ADVANCE") {
    discount = 1 - 0.0030;
  } else if (categoryUpper === "OTR" && brandUpper === "MICHELIN") {
    discount = 1 - 0.0329;
  } else if (categoryUpper === "OTR" && brandUpper === "TECHKING") {
    discount = 1 - 0.0037;
  }
  
  // Service Categories
  else if (categoryUpper === "SERVICES") {
    discount = 1 - 0.0021;
  } else if (categoryUpper === "TRL-SER") {
    discount = 1 - 0.002;
  }
  
  // HDE Services Category
  else if (categoryUpper === "HDE SERVICES" && brandUpper === "HELI") {
    discount = 1 - 0.0048;
  } else if (categoryUpper === "HDE SERVICES" && brandUpper === "JMC") {
    discount = 1 - 0.0072;
  } else if (categoryUpper === "HDE SERVICES" && brandUpper === "GB POWER") {
    discount = 1 - 0.0026;
  } else if (categoryUpper === "HDE SERVICES" && brandUpper === "GAITHER TOOL") {
    discount = 1 - 0.0254;
  }
  
  // HDE Category
  else if (categoryUpper === "HDE" && brandUpper === "GB POWER") {
    discount = 1 - 0.0056;
  } else if (categoryUpper === "HDE" && brandUpper === "HELI") {
    discount = 1 - 0.0006;
  }
  
  // GEP Category
  else if (categoryUpper === "GEP" && brandUpper === "CORGHI") {
    discount = 1 - 0.0098;
  } else if (categoryUpper === "GEP" && brandUpper === "HELI") {
    discount = 1 - 0.0046;
  } else if (categoryUpper === "GEP" && brandUpper === "FINI") {
    discount = 1 - 0.0090;
  } else if (categoryUpper === "GEP" && brandUpper === "COMBIJET") {
    discount = 1 - 0.0500;
  } else if (categoryUpper === "GEP" && brandUpper === "GB POWER") {
    discount = 1 - 0.0104;
  }

  return discount;
}

// Helper function to calculate discount percentage for display
export function getDiscountPercentage(input: DiscountCalculationInput): number {
  const discountMultiplier = getCategoryDiscount(input);
  return Math.round((1 - discountMultiplier) * 10000) / 100; // Convert to percentage with 2 decimals
}

// Helper function to apply discount to an amount
export function applyDiscount(amount: number, input: DiscountCalculationInput): number {
  const discountMultiplier = getCategoryDiscount(input);
  return Math.round(amount * discountMultiplier * 100) / 100; // Round to 2 decimal places
}

// Helper function to get the discount amount
export function getDiscountAmount(amount: number, input: DiscountCalculationInput): number {
  const discountMultiplier = getCategoryDiscount(input);
  return Math.round(amount * (1 - discountMultiplier) * 100) / 100; // Round to 2 decimal places
}
