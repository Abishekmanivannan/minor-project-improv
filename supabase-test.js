const SUPABASE_URL = "https://sgjhltfzviqievbxwzwh.supabase.co";
const SUPABASE_KEY = "sb_publishable_8SNbmgw48YhtOIPHlMaVHw_8d-c0SPp";

if (window.supabase) {
    window.supabaseClient = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );
} else {
    console.error("Supabase script failed to load.");
}