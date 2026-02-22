
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const filePath = '/Users/iwan/programing/pos/stock.xlsx';
console.log('Reading file:', filePath);

if (!fs.existsSync(filePath)) {
  console.error('File not found:', filePath);
  process.exit(1);
}

try {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Get headers (first row)
  const headers = [];
  const range = XLSX.utils.decode_range(worksheet['!ref']);
  
  for(let C = range.s.c; C <= range.e.c; ++C) {
    const cell = worksheet[XLSX.utils.encode_cell({c:C, r:R=range.s.r})];
    let hdr = "UNKNOWN " + C; // Default
    if(cell && cell.t) hdr = XLSX.utils.format_cell(cell);
    headers.push(hdr);
  }
  
  console.log('Headers:', headers);
  
  // Get first 20 rows of data
  // range.s.r + 1 to skip header? No, keeping raw for inspection
  const jsonOptions = { header: headers, range: range.s.r };
  const data = XLSX.utils.sheet_to_json(worksheet, jsonOptions).slice(0, 20);
  console.log('Sample Data:', JSON.stringify(data, null, 2));

  // Check for data in columns > 3
  let hasRightSideData = false;
  
  for(let R = range.s.r; R <= range.e.r; ++R) {
    for(let C = 4; C <= range.e.c; ++C) {
      const cell = worksheet[XLSX.utils.encode_cell({c:C, r:R})];
      if (cell && cell.v) {
        hasRightSideData = true;
        console.log(`Found data at ${XLSX.utils.encode_cell({c:C, r:R})}: ${cell.v}`);
        if(hasRightSideData) break; 
      }
    }
    if(hasRightSideData && R > range.s.r + 20) break; 
  }
  
  if (!hasRightSideData) {
      console.log('No data found in columns E and beyond (indexes 4+). Assuming single column list.');
  } else {
      console.log('Detected side-by-side data.');
  }
  
} catch (error) {
  console.error('Error reading file:', error);
}
