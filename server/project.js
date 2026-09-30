export default function ({
  db,
  router,
  run,
  get,
  all,
  id,
  now,
  text,
  choice,
  required,
  fail,
  publish,
}) {
  db.exec(`CREATE TABLE IF NOT EXISTS tickets(id TEXT PRIMARY KEY,owner TEXT REFERENCES users(id),subject TEXT,status TEXT DEFAULT 'open',created_at TEXT);
 CREATE TABLE IF NOT EXISTS messages(id INTEGER PRIMARY KEY,ticket TEXT REFERENCES tickets(id),author TEXT REFERENCES users(id),body TEXT,created_at TEXT);`);
  const ticket = (req) => {
    const t = required(get("SELECT * FROM tickets WHERE id=?", req.params.id));
    if (t.owner !== req.user.id && req.user.id !== "demo")
      fail(404, "Talep bulunamadı");
    return t;
  };
  router.get("/tickets", (req, res) =>
    res.json(
      req.user.id === "demo"
        ? all("SELECT * FROM tickets ORDER BY created_at DESC")
        : all(
            "SELECT * FROM tickets WHERE owner=? ORDER BY created_at DESC",
            req.user.id,
          ),
    ),
  );
  router.post("/tickets", (req, res) => {
    const tid = id();
    run(
      "INSERT INTO tickets(id,owner,subject,created_at) VALUES(?,?,?,?)",
      tid,
      req.user.id,
      text(req.body.subject),
      now(),
    );
    res.status(201).json({ id: tid });
  });
  router.get("/tickets/:id/messages", (req, res) => {
    ticket(req);
    res.json(
      all(
        "SELECT m.*,u.name FROM messages m JOIN users u ON u.id=m.author WHERE ticket=? AND m.id>? ORDER BY m.id",
        req.params.id,
        Math.max(0, Number(req.query.after) || 0),
      ),
    );
  });
  router.post("/tickets/:id/messages", (req, res) => {
    const t = ticket(req);
    if (t.status === "closed") fail(409, "Kapalı talebe mesaj gönderilemez");
    const mid = Number(
      run(
        "INSERT INTO messages(ticket,author,body,created_at) VALUES(?,?,?,?)",
        t.id,
        req.user.id,
        text(req.body.body, 4000),
        now(),
      ).lastInsertRowid,
    );
    publish("message", { ticket: t.id, id: mid }, t.owner);
    if (t.owner !== "demo")
      publish("message", { ticket: t.id, id: mid }, "demo");
    res.status(201).json({ id: mid });
  });
  router.patch("/tickets/:id", (req, res) => {
    ticket(req);
    if (req.user.id !== "demo") fail(403, "Temsilci rolü gerekli");
    run(
      "UPDATE tickets SET status=? WHERE id=?",
      choice(req.body.status, ["open", "pending", "closed"]),
      req.params.id,
    );
    res.json({ ok: true });
  });
}
