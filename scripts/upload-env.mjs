import fs from 'fs';
import { execSync } from 'child_process';

const envVars = fs.readFileSync('.env.local', 'utf-8').split('\n');

for (const line of envVars) {
  if (line.trim() && !line.startsWith('#')) {
    const splitIndex = line.indexOf('=');
    if (splitIndex > -1) {
      const key = line.substring(0, splitIndex).trim();
      let value = line.substring(splitIndex + 1).trim();
      // Remover aspas duplas caso existam
      if (value.startsWith('"') && value.endsWith('"')) {
         value = value.substring(1, value.length - 1);
      }
      
      console.log(`Adicionando ${key} para Vercel Production...`);
      try {
        execSync(`npx vercel env rm ${key} production --yes`, { stdio: 'ignore' });
      } catch (e) {} // Ignorar erro se não existir

      try {
        // Enviar o conteúdo usando cmd
        execSync(`cmd.exe /c "echo ${value} | npx vercel env add ${key} production"`);
        console.log(`✅ ${key} adicionada com sucesso.`);
      } catch (err) {
        console.error(`❌ Falha ao adicionar ${key}:`, err.message);
      }
    }
  }
}
console.log('✅ Upload concluído!');
