const fs = require('fs');
const path = require('path');

const backupFile = path.join(__dirname, '../../backup_cobranca_data_2026-01-10T13-11-51-929Z.json');

try {
    const data = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
    
    console.log('📊 ANÁLISE DE REGISTROS INATIVOS NO BACKUP\n');
    console.log('='.repeat(60));
    
    // Professores inativos
    const inactiveProfessors = data.professores.filter(p => !p.active);
    console.log(`\n👨‍🏫 PROFESSORES INATIVOS: ${inactiveProfessors.length}`);
    if (inactiveProfessors.length > 0) {
        inactiveProfessors.forEach(p => {
            console.log(`  - ID ${p.id}: ${p.nome}`);
        });
    }
    
    // Cursos inativos
    const inactiveCourses = data.cursos.filter(c => !c.active);
    console.log(`\n📚 CURSOS INATIVOS: ${inactiveCourses.length}`);
    if (inactiveCourses.length > 0) {
        inactiveCourses.forEach(c => {
            console.log(`  - ID ${c.id}: ${c.nome}`);
        });
    }
    
    // Clientes inativos
    const inactiveClients = data.clientes.filter(c => !c.active);
    console.log(`\n👥 CLIENTES/ALUNOS INATIVOS: ${inactiveClients.length}`);
    if (inactiveClients.length > 0) {
        console.log('\nLista completa:');
        inactiveClients.forEach(c => {
            console.log(`  - ID ${c.id}: ${c.nome} (WhatsApp: ${c.whatsapp || 'N/A'})`);
        });
    }
    
    // Matrículas inativas
    const inactiveEnrollments = data.matriculas.filter(m => !m.active);
    console.log(`\n📝 MATRÍCULAS INATIVAS: ${inactiveEnrollments.length}`);
    
    console.log('\n' + '='.repeat(60));
    console.log('\n✅ Análise concluída!');
    
} catch (err) {
    console.error('❌ Erro ao ler backup:', err.message);
}
