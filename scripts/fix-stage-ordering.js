#!/usr/bin/env node

import pkg from 'pg';
const { Client } = pkg;

// Database connection
const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_p29ezkLxYgqh@ep-divine-heart-abzonafv-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require'
});

async function fixStageOrdering() {
  try {
    console.log('🔗 Connecting to database...');
    await client.connect();
    
    // Get current stages
    console.log('\n📊 Current stages:');
    const stagesResult = await client.query(`
      SELECT id, name, order_position
      FROM deal_stages 
      ORDER BY created_at ASC
    `);
    
    stagesResult.rows.forEach(stage => {
      console.log(`  - ${stage.name}: ${stage.order_position || 'null'}`);
    });
    
    // Define the correct order
    const stageOrder = [
      { name: 'SQL', position: 10 },
      { name: 'Opportunity', position: 20 },
      { name: 'Verbal', position: 30 },
      { name: 'Closed Won', position: 40 },
      { name: 'Closed Lost', position: 50 }
    ];
    
    console.log('\n🔄 Updating stage order_position values...');
    
    // Update order_position for each stage
    for (const stageConfig of stageOrder) {
      const updateResult = await client.query(`
        UPDATE deal_stages 
        SET order_position = $1, updated_at = NOW()
        WHERE name = $2
        RETURNING name, order_position
      `, [stageConfig.position, stageConfig.name]);
      
      if (updateResult.rows.length > 0) {
        console.log(`✅ ${updateResult.rows[0].name}: order_position = ${updateResult.rows[0].order_position}`);
      } else {
        console.log(`❌ Stage '${stageConfig.name}' not found`);
      }
    }
    
    // Show final result
    console.log('\n🎯 Final stage order:');
    const finalResult = await client.query(`
      SELECT name, order_position
      FROM deal_stages 
      ORDER BY order_position ASC, created_at ASC
    `);
    
    finalResult.rows.forEach((stage, index) => {
      console.log(`  ${index + 1}. ${stage.name} (order: ${stage.order_position})`);
    });
    
    console.log('\n✅ Stage ordering fixed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing stage ordering:', error);
    throw error;
  } finally {
    await client.end();
    console.log('🔒 Database connection closed');
  }
}

// Run the script
fixStageOrdering().catch(console.error); 