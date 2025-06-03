#!/usr/bin/env node

import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_p29ezkLxYgqh@ep-divine-heart-abzonafv-pooler.eu-west-2.aws.neon.text'
});

async function fixContactLinking() {
  try {
    console.log('🔍 Investigating contact linking issue...\n');
    
    await client.connect();

    // Check if primary_contact_id values exist in contacts table
    console.log('📊 Step 1: Check if primary_contact_id values exist in contacts');
    const orphanedDeals = await client.query(`
      SELECT 
        d.id,
        d.name,
        d.primary_contact_id,
        CASE WHEN c.id IS NULL THEN 'ORPHANED' ELSE 'LINKED' END as link_status
      FROM deals d
      LEFT JOIN contacts c ON d.primary_contact_id = c.id
      WHERE d.primary_contact_id IS NOT NULL
      LIMIT 10;
    `);
    
    console.table(orphanedDeals.rows);

    // Count orphaned vs linked
    const linkStats = await client.query(`
      SELECT 
        COUNT(CASE WHEN c.id IS NULL THEN 1 END) as orphaned_count,
        COUNT(CASE WHEN c.id IS NOT NULL THEN 1 END) as linked_count
      FROM deals d
      LEFT JOIN contacts c ON d.primary_contact_id = c.id
      WHERE d.primary_contact_id IS NOT NULL;
    `);
    
    console.log('\n📈 Link Statistics:');
    console.table(linkStats.rows);

    // If we have orphaned deals, let's fix them by matching email addresses
    const orphanedCount = parseInt(linkStats.rows[0].orphaned_count);
    
    if (orphanedCount > 0) {
      console.log(`\n🔧 Found ${orphanedCount} orphaned deals. Attempting to fix by email matching...`);
      
      // Find deals that can be matched by email
      const matchableDeals = await client.query(`
        SELECT 
          d.id as deal_id,
          d.name as deal_name,
          d.contact_email,
          c.id as contact_id,
          c.email as contact_email,
          c.full_name
        FROM deals d
        LEFT JOIN contacts correct_contact ON d.primary_contact_id = correct_contact.id
        JOIN contacts c ON d.contact_email = c.email
        WHERE d.primary_contact_id IS NOT NULL 
          AND correct_contact.id IS NULL
          AND d.contact_email IS NOT NULL
        LIMIT 20;
      `);
      
      console.log(`\n📋 Found ${matchableDeals.rows.length} deals that can be fixed by email matching:`);
      console.table(matchableDeals.rows);
      
      if (matchableDeals.rows.length > 0) {
        console.log('\n🔄 Fixing contact links...');
        
        let fixedCount = 0;
        for (const match of matchableDeals.rows) {
          try {
            await client.query(`
              UPDATE deals 
              SET primary_contact_id = $1 
              WHERE id = $2;
            `, [match.contact_id, match.deal_id]);
            
            console.log(`  ✅ Fixed: ${match.deal_name} → ${match.full_name}`);
            fixedCount++;
          } catch (error) {
            console.log(`  ❌ Failed to fix ${match.deal_name}: ${error.message}`);
          }
        }
        
        console.log(`\n🎉 Fixed ${fixedCount} contact links!`);
      }
    } else {
      console.log('\n✅ All deals are properly linked to contacts!');
    }

    // Final verification
    console.log('\n📊 Final verification - checking a few fixed deals:');
    const verificationDeals = await client.query(`
      SELECT 
        d.id,
        d.name,
        d.contact_email as deal_contact_email,
        c.email as linked_contact_email,
        c.full_name as linked_contact_name
      FROM deals d
      JOIN contacts c ON d.primary_contact_id = c.id
      WHERE d.primary_contact_id IS NOT NULL
      LIMIT 5;
    `);
    
    console.table(verificationDeals.rows);

  } catch (error) {
    console.error('❌ Fix failed:', error);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

fixContactLinking().catch(console.error); 