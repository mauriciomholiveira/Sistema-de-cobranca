const fs = require('fs');
const data = JSON.parse(fs.readFileSync('backup_cobranca_data_2026-01-10T13-11-51-929Z.json', 'utf8'));

const pagamentos = data.pagamentos || [];
const counts = {};

pagamentos.forEach(p => {
    // Check duplicates based on unique constraint logic: client + month
    const key = `${p.cliente_id}|${p.mes_ref}`;
    if (!counts[key]) counts[key] = { count: 0, ids: [] };
    counts[key].count++;
    counts[key].ids.push(p.id);
});

console.log("Checking for duplicate payments (Same Client + Same Month):");
let found = false;
for (const [key, dataObj] of Object.entries(counts)) {
    if (dataObj.count > 1) {
        found = true;
        const [cliId, mes] = key.split('|');
        const clienteName = data.clientes.find(c => c.id == cliId)?.nome || 'Unknown';
        console.log(`- ${clienteName} (ID ${cliId}) has ${dataObj.count} payments for ${mes}. Payment IDs: ${dataObj.ids.join(', ')}`);
    }
}

if (!found) console.log("No duplicate payments found.");
