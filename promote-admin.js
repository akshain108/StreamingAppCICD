db.users.updateOne(
  { email: "testuser@gmail.com" },
  { $set: { role: "admin" } }
)
