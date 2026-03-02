import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://khsapythnppdplqnlmkj.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtoc2FweXRobnBwZHBscW5sbWtqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAwNzYyOTcsImV4cCI6MjA1NTY1MjI5N30.yN-t1KKvH08yaVpZ2cikYlom7fZmf5QoI2yTjc02wJY";

//exp   supabaseAdmin = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtoc2FweXRobnBwZHBscW5sbWtqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDA3NjI5NywiZXhwIjoyMDU1NjUyMjk3fQ.1o-Hq4rIo99uMNoJO7UiT4Sdp3vKGiXul3Wba4Odnds"

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  global: {
    headers: {
      'X-Client-Info': 'demigtools@1.0.0'
    }
  }
});

export default supabase;