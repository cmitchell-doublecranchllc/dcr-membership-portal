import { readFileSync } from 'fs';
import mysql from 'mysql2/promise';

const contractText = readFileSync('./server/contracts/riding-lesson-agreement.txt', 'utf-8');

const connection = await mysql.createConnection(process.env.DATABASE_URL);

try {
  await connection.execute(
    'UPDATE contracts SET content = ? WHERE id = 1',
    [contractText]
  );
  console.log('✅ Successfully updated Riding Lesson Agreement content');
} catch (error) {
  console.error('❌ Error updating contract:', error);
} finally {
  await connection.end();
}
