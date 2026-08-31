const { query, queryOne, transaction } = require('./db');

function parseDate(s) {
  const [y, m, d] = String(s).split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function formatDate(dt) {
  return dt.toISOString().slice(0, 10);
}

function addDays(dateStr, days) {
  const d = parseDate(dateStr);
  d.setUTCDate(d.getUTCDate() + days);
  return formatDate(d);
}

function addMonths(dateStr, months) {
  const d = parseDate(dateStr);
  d.setUTCMonth(d.getUTCMonth() + months);
  return formatDate(d);
}

function advance(dateStr, rule, interval) {
  if (rule === 'daily') return addDays(dateStr, interval);
  if (rule === 'weekly') return addDays(dateStr, interval * 7);
  if (rule === 'monthly') return addMonths(dateStr, interval);
  return dateStr;
}

function computeNextAt(dueDate, rule, interval) {
  if (!rule || rule === 'none') return null;
  const base = dueDate || formatDate(new Date());
  const next = advance(base, rule, Number(interval) || 1);
  return next + ' 00:00:00';
}

async function checkRecurring() {
  const due = await query(
    `SELECT t.*, b.project_id, c.id AS column_id
     FROM tasks t
     JOIN boards b ON b.id = t.board_id
     JOIN columns c ON c.id = t.column_id
     WHERE t.recurrence_rule <> 'none' AND t.recurrence_next_at IS NOT NULL AND t.recurrence_next_at <= NOW()
     ORDER BY t.recurrence_next_at ASC
     LIMIT 50`
  );
  const todayStr = formatDate(new Date());
  let spawned = 0;
  for (const src of due) {
    try {
      const rule = src.recurrence_rule;
      const interval = src.recurrence_interval || 1;
      const endStr = src.recurrence_end_date ? String(src.recurrence_end_date).slice(0, 10) : null;
      let current = String(src.recurrence_next_at).slice(0, 10);
      let last = current;
      let stop = false;

      while (current <= todayStr) {
        if (endStr && current > endStr) { stop = true; break; }
        const dup = await queryOne(
          `SELECT id FROM tasks WHERE board_id = ? AND title = ? AND due_date = ? AND recurrence_rule <> 'none' LIMIT 1`,
          [src.board_id, src.title, current]
        );
        if (!dup) {
          await transaction(async (conn) => {
            const pos = await conn.query('SELECT COALESCE(MAX(position), -1) + 1 AS p FROM tasks WHERE column_id = ?', [src.column_id]);
            const r = await conn.query(
              `INSERT INTO tasks (board_id, column_id, title, description, priority, due_date, position, assignee_id, created_by,
                 recurrence_rule, recurrence_interval, recurrence_next_at, recurrence_end_date)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [src.board_id, src.column_id, src.title, src.description, src.priority, current, pos[0].p, src.assignee_id, src.created_by,
               rule, interval, null, src.recurrence_end_date]
            );
            const newId = Number(r.insertId);
            const tags = await conn.query('SELECT tag_id FROM task_tags WHERE task_id = ?', [src.id]);
            for (const tt of tags) {
              await conn.query('INSERT IGNORE INTO task_tags (task_id, tag_id) VALUES (?, ?)', [newId, tt.tag_id]);
            }
          });
          spawned++;
        }
        last = current;
        current = advance(current, rule, interval);
      }

      if (stop || (endStr && last > endStr)) {
        await query('UPDATE tasks SET recurrence_next_at = NULL WHERE id = ?', [src.id]);
      } else {
        await query('UPDATE tasks SET recurrence_next_at = ? WHERE id = ?', [last + ' 00:00:00', src.id]);
      }
    } catch (e) {
      console.error('recurring fout:', e.message);
    }
  }
  return spawned;
}

module.exports = { checkRecurring, computeNextAt, advance, formatDate };