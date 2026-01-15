const fs = require('fs');
const data = JSON.parse(fs.readFileSync('backup_cobranca_data_2026-01-10T13-11-51-929Z.json', 'utf8'));

const adrianPayments = data.pagamentos.filter(p => p.cliente_id == 12);
console.log("Payments for ADRIAN (ID 12):");
adrianPayments.forEach(p => {
    console.log(`ID: ${p.id} | MatriculaID: ${p.matricula_id} | Mes: ${p.mes_ref} | Valor: ${p.valor_cobrado} | Status: ${p.status}`);
});
