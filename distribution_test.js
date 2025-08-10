// Test the new distribution logic
function distributeQuantityEqually(quantity) {
  const baseAmount = Math.floor(quantity / 12);
  const remainder = quantity % 12;

  // Start with base amount for all months
  const distribution = new Array(12).fill(baseAmount);

  // First fill January to December
  for (let i = 0; i < remainder && i < 12; i++) {
    distribution[i] += 1; // Jan (0) to Dec (11)
  }

  // If still have remainder after filling Jan-Dec, continue backward from Dec
  if (remainder > 12) {
    const extraRemainder = remainder - 12;
    for (let i = 0; i < extraRemainder; i++) {
      const monthIndex = 11 - i; // Start from December (11) and go backwards
      distribution[monthIndex] += 1;
    }
  }

  return distribution;
}

// Test cases
console.log("Testing distribution logic:");
console.log("13 items:", distributeQuantityEqually(13));
console.log("25 items:", distributeQuantityEqually(25)); 
console.log("12 items:", distributeQuantityEqually(12));
console.log("1 item:", distributeQuantityEqually(1));

// Expected results:
// 13 items should be: [2,1,1,1,1,1,1,1,1,1,1,1] (Jan gets 2, rest get 1)
// 25 items should be: [3,2,2,2,2,2,2,2,2,2,2,2] (Jan gets 3, rest get 2) 
// 12 items should be: [1,1,1,1,1,1,1,1,1,1,1,1] (all equal)
// 1 item should be: [1,0,0,0,0,0,0,0,0,0,0,0] (Jan gets 1)
