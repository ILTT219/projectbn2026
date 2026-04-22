const fs = require('fs');
const https = require('https');

const mermaidCode = `graph TD
    classDef userAction fill:#3b82f6,stroke:#1d4ed8,stroke-width:3px,color:#fff,font-weight:bold,font-size:16px;
    classDef aiEngine fill:#8b5cf6,stroke:#6d28d9,stroke-width:3px,color:#fff,font-weight:bold,font-size:16px;
    classDef dataPool fill:#10b981,stroke:#047857,stroke-width:3px,color:#fff,font-weight:bold;
    classDef filter fill:#f59e0b,stroke:#b45309,stroke-width:3px,color:#fff,font-weight:bold;
    classDef finalResult fill:#ef4444,stroke:#b91c1c,stroke-width:4px,color:#fff,font-weight:bold,font-size:18px;

    User([Hanh vi Nguoi dung]):::userAction --> Action1[Xem San pham X]:::userAction
    Action1 --> SaveHistory[(Luu vao Lich su)]:::dataPool

    SaveHistory --> AI{AI Recommendation Engine}:::aiEngine
    
    AI -->|Slot 60%| Context[San pham Cung Danh muc]:::dataPool
    AI -->|Slot 40%| History[Trich xuat Danh muc Lich su]:::dataPool
    AI -->|Slot Du phong| Fallback[Ban do Van hoa]:::dataPool

    Context --> Pool((Gop Danh sach))
    History --> Pool
    Fallback --> Pool

    Pool --> Sorting[Bo Loc Kep: Danh muc > Luot xem > Danh gia]:::filter
    
    Sorting --> Sort1[1. Ghep nhom Context/History]:::filter
    Sort1 --> Sort2[2. Sap xep Luot xem View_Count]:::filter
    Sort2 --> Sort3[3. So sanh Diem Avg_Rating]:::filter

    Sort3 --> Final[[Hien thi Goi y Ca nhan hoa]]:::finalResult`;

const state = { code: mermaidCode, mermaid: { theme: 'default' } };
const jsonString = JSON.stringify(state);
const encoded = Buffer.from(jsonString).toString('base64');

// Use base64 format instead of pako
const url = 'https://mermaid.ink/img/' + encoded + '?type=png';

console.log("Fetching: " + url);

https.get(url, (res) => {
  if (res.statusCode !== 200) {
     console.error('Error: status code ' + res.statusCode);
     return;
  }
  const path = 'c:\\\\Users\\\\ASUS\\\\web\\\\docs\\\\SoDo_AI_GoiY.png';
  const filePath = fs.createWriteStream(path);
  res.pipe(filePath);
  filePath.on('finish', () => {
    filePath.close();
    console.log('Saved image to', path);
  });
}).on('error', (err) => {
  console.error('Error:', err.message);
});
