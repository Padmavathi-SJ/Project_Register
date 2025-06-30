const cron = require("node-cron");
const db = require('../config/db');
const generateWeeklyDeadlines = require("../utils/generateWeeklyDeadlines");
const nodemailer = require("nodemailer");
require("dotenv").config()


// runs every day on midnight 00:00 AM -> to create deadlines for weekly logs (automatic way)
cron.schedule("0 0 * * *", () => {
  console.log("Checking timelines for all teams...");

  //fetches the team with with not null as project_id  and in timeline cron_executed is false
  const timelineQuery = `
    SELECT t.team_id, t.start_date, tr.project_id
    FROM timeline t
    JOIN team_requests tr ON tr.team_id = t.team_id
    WHERE t.name = 'project timeline' AND t.cron_executed = false

  `;

  db.query(timelineQuery, (err, timelines) => {
    if (err) return console.error("Timeline fetch error:", err);
    if (timelines.length === 0) return console.log("No pending timelines.");

    const today = new Date();
    today.setHours(0, 0, 0, 0); // removes the time part

    timelines.forEach(({ team_id, start_date, project_id }) => {
      const start = new Date(start_date);
      start.setHours(0, 0, 0, 0); // remove the time part

      if (today >= start) {
        console.log(`Generating deadlines for team ${team_id}...`);

        const sql = `SELECT guide_reg_num, sub_expert_reg_num FROM team_requests WHERE team_id = ? AND project_id = ?`;
        db.query(sql, [team_id, project_id], (err, result) => {
          if (err) return console.error(`Error checking guide/expert for team ${team_id}:`, err);

          const { guide_reg_num, sub_expert_reg_num } = result[0] || {};
          if (!guide_reg_num || !sub_expert_reg_num) {
            // Send mail
            sendReminderToTeam(team_id);
            return;
          }

          // fetches the conformed and project_inserted teams from team_request that do not appear in the weekly_deadlines_logs
          const deadlines = generateWeeklyDeadlines(start); // week_1 to week_12
          const insertSQL = `
            INSERT INTO weekly_logs_deadlines
              (team_id, project_id, week_1, week_2, week_3, week_4, week_5, week_6,
               week_7, week_8, week_9, week_10, week_11, week_12)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
              week_1 = VALUES(week_1), week_2 = VALUES(week_2), week_3 = VALUES(week_3),
              week_4 = VALUES(week_4), week_5 = VALUES(week_5), week_6 = VALUES(week_6),
              week_7 = VALUES(week_7), week_8 = VALUES(week_8), week_9 = VALUES(week_9),
              week_10 = VALUES(week_10), week_11 = VALUES(week_11), week_12 = VALUES(week_12)
          `;
          db.query(insertSQL, [team_id, project_id, ...deadlines], (err) => {
            if (err) return console.error(`Error inserting deadlines for team ${team_id}:`, err);
            console.log(`Deadlines inserted for team ${team_id}`);

            // Mark timeline as executed
            const updateSQL = `UPDATE timeline SET cron_executed = true WHERE team_id = ? AND name = 'project timeline'`;
            db.query(updateSQL, [team_id], (err) => {
              if (err) console.error(`Error updating timeline for team ${team_id}:`, err);
              else console.log(`Timeline marked executed for team ${team_id}`);
            });
          });
        });
      } else {
        console.log(`Start date not reached for team ${team_id}`);
      }
    });
  });
}, {
  timezone: "Asia/Kolkata"
});


function sendReminderToTeam(team_id) {
  const studentQuery = `SELECT email FROM team_members WHERE team_id = ?`;

  db.query(studentQuery, [team_id], (err, members) => {
    if (err) return console.error(`Error fetching emails for team ${team_id}:`, err);
    if (members.length === 0) return console.log(`No members found for team ${team_id}`);

    const recipientEmails = members.map(m => m.email).join(",");
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'your_email@gmail.com',
        pass: 'your_app_password'
      }
    });

    const mailOptions = {
      from: 'your_email@gmail.com',
      to: recipientEmails,
      subject: 'Action Required: Guide/Expert Not Assigned',
      text: `Dear Team,
      Your team has not been assigned a guide or subject expert yet. Please contact the project coordinator to complete the assignment so weekly log deadlines can be generated.
      Thank you.`
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) return console.error(`Error sending email to team ${team_id}:`, err);
      console.log(`Reminder sent to team ${team_id}:`, info.response);
    });
  });
}


// cron to mark attendence as absent and also as presnt
// Run every 10 minutes
cron.schedule("*/10 * * * *", () => {
  console.log(" Running cron job to mark attendance...");

  // Mark as 'present'
  const markPresentSQL = `
    UPDATE scheduled_reviews 
    SET attendance = 'present' 
    WHERE attendance IS NULL 
      AND end_time IS NOT NULL 
      AND end_time != '' 
      AND end_time != '00:00:00'
  `;

  db.query(markPresentSQL, (err1, result1) => {
    if (err1) {
      console.error("Error marking present:", err1);
    } else {
      console.log("Marked present:", result1.affectedRows);
    }

    // Mark as 'absent'
    const markAbsentSQL = `
      UPDATE scheduled_reviews 
      SET attendance = 'absent' 
      WHERE attendance IS NULL 
        AND (end_time IS NULL OR end_time = '' OR end_time = '00:00:00') 
        AND TIMESTAMP(review_date, start_time) <= NOW() - INTERVAL 3 HOUR
    `;

    db.query(markAbsentSQL, (err2, result2) => {
      if (err2) {
        console.error("Error marking absent:", err2);
      } else {
        console.log("Marked absent:", result2.affectedRows);
      }
    });
  });
});


