
import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';

interface ParsedProduct {
  categoryName: string;
  productName: string;
  size: string;
  color: string;
  price: number;
  stock: number;
}

export const parseStockExcel = (): ParsedProduct[] => {
  const filePath = path.resolve(__dirname, '../../../stock.xlsx'); // Relative to server/src/utils
  
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found at ${filePath}`);
  }

  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  const parsedData: ParsedProduct[] = [];
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
  
  // Scanned columns to avoid re-scanning the same block? 
  // Actually, we can just scan cell by cell.
  
  for(let R = range.s.r; R <= range.e.r; ++R) {
    for(let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = {c:C, r:R};
      const cell = worksheet[XLSX.utils.encode_cell(cellAddress)];
      
      // Check if this cell is the header "KODE NAMA BARANG" (allowing for some whitespace/case var)
      if (cell && cell.v && String(cell.v).trim().toUpperCase().includes('KODE NAMA BARANG')) {
        // FOUND A BLOCK!
        
        // 1. Get Category from the cell above (R-1, C)
        const categoryCellAddress = {c:C, r:R-1};
        const categoryCell = worksheet[XLSX.utils.encode_cell(categoryCellAddress)];
        const categoryName = categoryCell ? String(categoryCell.v).trim() : 'Uncategorized';
        
        // 2. Iterate rows below (R+1 onwards) until valid data ends
        let currentRow = R + 1;
        while (currentRow <= range.e.r) {
          const nameCell = worksheet[XLSX.utils.encode_cell({c:C, r:currentRow})];
          const sizeCell = worksheet[XLSX.utils.encode_cell({c:C+1, r:currentRow})];
          const colorCell = worksheet[XLSX.utils.encode_cell({c:C+2, r:currentRow})];
          const priceCell = worksheet[XLSX.utils.encode_cell({c:C+3, r:currentRow})]; // Shifted +3
          const stockCell = worksheet[XLSX.utils.encode_cell({c:C+4, r:currentRow})]; // Shifted +4
          
          // Stop if name is empty (end of block)
          if (!nameCell || !nameCell.v) {
             break;
          }
          
          // Also stop if we hit another header (unlikely given the loop, but safety check)
           if (String(nameCell.v).trim().toUpperCase().includes('KODE NAMA BARANG')) {
             break;
           }

          const productName = String(nameCell.v).trim();
          const size = sizeCell ? String(sizeCell.v).trim() : '';
          const color = colorCell ? String(colorCell.v).trim() : ''; // New Color Field
          
          // Clean price (remove commas if string, handle number)
          let price = 0;
          if (priceCell && priceCell.v) {
             if (typeof priceCell.v === 'number') {
                 price = priceCell.v;
             } else {
                 price = parseFloat(String(priceCell.v).replace(/,/g, ''));
             }
          }

          let stock = 0;
          if (stockCell && stockCell.v) {
              stock = parseInt(String(stockCell.v));
          }

          parsedData.push({
            categoryName,
            productName,
            size,
            color,
            price,
            stock
          });
          
          currentRow++;
        }
      }
    }
  }
  
  return parsedData;
};
