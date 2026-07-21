const dns = require("dns");

dns.lookup("db.pkmeidrvhzbhgorlpkln.supabase.co", (err, address, family) => {
  console.log("lookup:", { err, address, family });
});

dns.resolve4("db.pkmeidrvhzbhgorlpkln.supabase.co", (err, addresses) => {
  console.log("resolve4:", { err, addresses });
});

dns.resolve6("db.pkmeidrvhzbhgorlpkln.supabase.co", (err, addresses) => {
  console.log("resolve6:", { err, addresses });
});