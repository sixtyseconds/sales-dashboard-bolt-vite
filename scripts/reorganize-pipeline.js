#!/usr/bin/env node

import pkg from 'pg';
const { Client } = pkg;

// Database connection
const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_p29ezkLxYgqh@ep-divine-heart-abzonafv-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require'
});

async function reorganizePipeline() {
  try {
    console.log('🔗 Connecting to database...');
    await client.connect();
    
    // Step 1: Check table structure first
    console.log('\n🔍 Checking deal_stages table structure...');
    const tableStructure = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'deal_stages'
      ORDER BY ordinal_position
    `);
    
    console.log('Table columns:');
    tableStructure.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type})`);
    });
    
    // Step 2: Get current stages
    console.log('\n📊 Current pipeline stages:');
    const stagesResult = await client.query(`
      SELECT id, name, default_probability, order_position, created_at
      FROM deal_stages 
      ORDER BY order_position ASC, created_at ASC
    `);
    
    stagesResult.rows.forEach(stage => {
      console.log(`  - ${stage.name} (${stage.id}) - Order: ${stage.order_position || 'null'}`);
    });
    
    // Find MQL and SQL stage IDs
    const mqlStage = stagesResult.rows.find(s => s.name === 'MQL');
    const sqlStage = stagesResult.rows.find(s => s.name === 'SQL');
    const closedWonStage = stagesResult.rows.find(s => s.name === 'Closed Won');
    const closedLostStage = stagesResult.rows.find(s => s.name === 'Closed Lost');
    
    if (!mqlStage) {
      console.log('✅ MQL stage not found - may already be removed');
      
      // Just do the reordering
      await reorderStages();
      return;
    }
    
    if (!sqlStage) {
      console.error('❌ SQL stage not found - cannot proceed');
      return;
    }
    
    console.log(`\n🔍 Found stages:`);
    console.log(`  - MQL: ${mqlStage.id}`);
    console.log(`  - SQL: ${sqlStage.id}`);
    console.log(`  - Closed Won: ${closedWonStage?.id || 'Not found'}`);
    console.log(`  - Closed Lost: ${closedLostStage?.id || 'Not found'}`);
    
    // Step 3: Check for deals in MQL stage
    const mqlDealsResult = await client.query(`
      SELECT COUNT(*) as count, 
             STRING_AGG(name, ', ') as deal_names
      FROM deals 
      WHERE stage_id = $1 AND status = 'active'
    `, [mqlStage.id]);
    
    const mqlDealsCount = parseInt(mqlDealsResult.rows[0].count);
    const mqlDealNames = mqlDealsResult.rows[0].deal_names;
    
    console.log(`\n📋 Found ${mqlDealsCount} deals in MQL stage`);
    if (mqlDealsCount > 0) {
      console.log(`  Deals: ${mqlDealNames}`);
    }
    
    // Step 4: Move MQL deals to SQL stage
    if (mqlDealsCount > 0) {
      console.log(`\n🔄 Moving ${mqlDealsCount} deals from MQL to SQL...`);
      
      const moveResult = await client.query(`
        UPDATE deals 
        SET stage_id = $1, 
            updated_at = NOW(), 
            stage_changed_at = NOW()
        WHERE stage_id = $2 AND status = 'active'
        RETURNING id, name
      `, [sqlStage.id, mqlStage.id]);
      
      console.log(`✅ Moved ${moveResult.rows.length} deals to SQL stage:`);
      moveResult.rows.forEach(deal => {
        console.log(`  - ${deal.name} (${deal.id})`);
      });
    }
    
    // Step 5: Clean up deal_stage_history records for MQL stage
    console.log(`\n🧹 Cleaning up stage history records for MQL stage...`);
    
    const historyCleanupResult = await client.query(`
      DELETE FROM deal_stage_history 
      WHERE stage_id = $1
      RETURNING id
    `, [mqlStage.id]);
    
    console.log(`✅ Deleted ${historyCleanupResult.rows.length} stage history records`);
    
    // Step 6: Delete MQL stage
    console.log(`\n🗑️  Deleting MQL stage...`);
    
    const deleteResult = await client.query(`
      DELETE FROM deal_stages 
      WHERE id = $1 
      RETURNING name
    `, [mqlStage.id]);
    
    if (deleteResult.rows.length > 0) {
      console.log(`✅ Successfully deleted ${deleteResult.rows[0].name} stage`);
    }
    
    // Step 7: Reorder stages
    await reorderStages();
    
  } catch (error) {
    console.error('❌ Error reorganizing pipeline:', error);
    throw error;
  } finally {
    await client.end();
    console.log('🔒 Database connection closed');
  }
}

async function reorderStages() {
  console.log(`\n🔀 Reordering pipeline stages...`);
  
  // Define the new order - Closed Won and Closed Lost at the end
  const stageOrder = [
    { name: 'SQL', position: 10 },
    { name: 'Opportunity', position: 20 },
    { name: 'Verbal', position: 30 },
    { name: 'Closed Won', position: 40 },
    { name: 'Closed Lost', position: 50 }
  ];
  
  // Update order_position for each stage
  for (const stageConfig of stageOrder) {
    const updateResult = await client.query(`
      UPDATE deal_stages 
      SET order_position = $1, updated_at = NOW()
      WHERE name = $2
      RETURNING name, order_position
    `, [stageConfig.position, stageConfig.name]);
    
    if (updateResult.rows.length > 0) {
      console.log(`  - ${updateResult.rows[0].name}: order_position = ${updateResult.rows[0].order_position}`);
    }
  }
  
  // Show final pipeline structure
  console.log(`\n🎯 Final pipeline structure:`);
  const finalStagesResult = await client.query(`
    SELECT name, color, default_probability, order_position,
           (SELECT COUNT(*) FROM deals WHERE stage_id = deal_stages.id AND status = 'active') as deal_count
    FROM deal_stages 
    ORDER BY order_position ASC, created_at ASC
  `);
  
  finalStagesResult.rows.forEach((stage, index) => {
    console.log(`  ${index + 1}. ${stage.name} (${stage.deal_count} deals) - Order: ${stage.order_position}`);
  });
  
  console.log(`\n✅ Pipeline reorganization complete!`);
  console.log(`\nSummary:`);
  console.log(`  - Removed MQL stage and cleaned up history`);
  console.log(`  - Moved deals from MQL to SQL`);
  console.log(`  - Reordered stages with Closed Won/Lost at the end`);
  console.log(`  - New order: SQL → Opportunity → Verbal → Closed Won → Closed Lost`);
}

// Run the script
reorganizePipeline().catch(console.error); 