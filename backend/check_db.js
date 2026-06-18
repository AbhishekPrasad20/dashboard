const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:Abhi1234!@localhost:5432/postgres' });
async function run() {
  await client.connect();
  try {
    const res = await client.query("SELECT status FROM projects");
    console.log('projects statuses:', res.rows.map(r => r.status));
  } catch (e) {
    console.error('projects error:', e.message);
  }
  try {
    const res2 = await client.query("SELECT * FROM project_status_history");
    console.log('project_status_history:', res2.rows);
    const res3 = await client.query("SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE pg_type.typname = 'prop_state'");
    console.log('prop_state enum:', res3.rows.map(r => r.enumlabel));
    const res4 = await client.query("SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE pg_type.typname = 'lead_state'");
    console.log('lead_state enum:', res4.rows.map(r => r.enumlabel));
  } catch (e) {
    console.error('enum error:', e.message);
  }
  await client.end();
}
run().catch(console.error);
