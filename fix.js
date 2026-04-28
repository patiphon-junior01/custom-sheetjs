const fs = require('fs');
const lines = fs.readFileSync('src/pages/CustomSheetDemoPage.tsx', 'utf8').split('\n');
const start = lines.findIndex(l => l.includes('} Enter...'));
const end = lines.findIndex(l => l.includes('PAGE COMPONENT'));
const repaired = [
  ...lines.slice(0, start),
  "        <Tag onClick={showInput} style={{ background: '#fafafa', borderStyle: 'dashed', cursor: 'pointer', margin: 0 }}>",
  "          <PlusOutlined /> New Tag",
  "        </Tag>",
  "      )}",
  "    </div>",
  "  );",
  "}",
  "",
  "/* =========================================================================",
  ...lines.slice(end)
].join('\n');
fs.writeFileSync('src/pages/CustomSheetDemoPage.tsx', repaired);
