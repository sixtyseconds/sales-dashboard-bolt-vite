import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL, 
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function checkUsers() {
  try {
    const { data: users, error } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_name, is_admin')
      .limit(10);
    
    if (error) throw error;
    
    console.log('=== EXISTING USERS IN SUPABASE ===');
    if (users && users.length > 0) {
      users.forEach((user, i) => {
        console.log(`${i+1}. ${user.email} (${user.first_name} ${user.last_name}) - Admin: ${user.is_admin}`);
      });
      console.log('\n✅ Found users! You can try logging in with one of these email addresses.');
      console.log('💡 If you don\'t know the password, you can use the "Forgot Password" link on the login page.');
    } else {
      console.log('❌ No users found in the database.');
      console.log('🚀 You need to create an account first by going to /auth/signup');
    }
  } catch (error) {
    console.error('❌ Error checking users:', error.message);
  }
}

checkUsers(); 