import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env
dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
    console.log('Checking disasters table...');

    const { data: disasters, error: dError } = await supabase
        .from('disasters')
        .select('id, name, latitude, longitude, city, state');

    if (dError) {
        console.error('❌ Error fetching disasters:', dError);
    } else if (!disasters || disasters.length === 0) {
        console.log('⚠️ No disasters found in database.');
    } else {
        console.log(`✅ Found ${disasters.length} disasters:`);
        disasters.forEach(d => {
            const hasCoords = d.latitude !== null && d.longitude !== null;
            console.log(`- [${hasCoords ? 'OK' : 'MISSING COORDS'}] ${d.name} (${d.city}, ${d.state}): Lat=${d.latitude}, Lng=${d.longitude} (Type: ${typeof d.latitude})`);
        });
    }

    console.log('\nChecking volunteers table...');
    const { data: volunteers, error: vError } = await supabase
        .from('volunteers')
        .select('id, latitude, longitude');

    if (vError) {
        console.error('❌ Error fetching volunteers:', vError);
    } else if (!volunteers || volunteers.length === 0) {
        console.log('⚠️ No volunteers found in database.');
    } else {
        console.log(`✅ Found ${volunteers.length} volunteers:`);
        volunteers.forEach(v => {
            const hasCoords = v.latitude !== null && v.longitude !== null;
            console.log(`- [${hasCoords ? 'OK' : 'MISSING COORDS'}] ID=${v.id}: Lat=${v.latitude}, Lng=${v.longitude} (Type: ${typeof v.latitude})`);
        });
    }
}

check();
