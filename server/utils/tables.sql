CREATE DATABASE pr_app;
DROP DATABASE pr_app;
USE pr_app;

delete from users;
select * from users;
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  `emailId` VARCHAR(200) NOT NULL,
  `password` VARCHAR(200) DEFAULT NULL,
   role ENUM('staff', 'student', 'editor', 'admin') NOT NULL DEFAULT 'staff',   
   google_id VARCHAR(255) UNIQUE,
   refreshToken VARCHAR(255),
   avatar VARCHAR(255),
   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `reg_num` VARCHAR(200) NOT NULL UNIQUE,
  `name` VARCHAR(200) DEFAULT NULL,
  `dept` VARCHAR(200) DEFAULT NULL,
  `semester` INT DEFAULT NULL,
  `company_name` VARCHAR(300) DEFAULT NULL,
  `company_contact` VARCHAR(50) DEFAULT NULL,
  `company_address` VARCHAR(200) DEFAULT NULL,
  `project_type` VARCHAR(200) DEFAULT NULL,
  `phone_number` VARCHAR(20) DEFAULT NULL,
  `available` TINYINT DEFAULT 1,
  UNIQUE KEY `unique_email` (`emailId`)
);


-- delete from users where id>20;
-- update users set dept="EEE" where id=3;
-- update users set role="admin" where id=20;
-- insert into users (name, emailId, reg_num) values ("KODEESWARAN M","kodeeswaranm2221662@gmail.com","201ec166");

-- select * from users;
-- select *  from teams;
-- select * from team_requests;
-- select * from projects;
-- select * from sub_expert_requests;
-- select * from guide_requests;

-- update guide_requests set status='reject' where from_team_id = 'TEAM-0002';
-- delete from teams;
-- delete from team_requests;
-- delete from projects;
-- delete from guide_requests;
-- delete from sub_expert_requests;
-- delete from guide_requests;
-- delete from queries;
-- delete from weekly_logs_verification;
-- delete from weekly_logs_deadlines;
-- delete from semester_wise_deadline;
-- update users set project_type=null;
-- delete from review_marks_team;
-- delete from review_marks_individual;
-- select * from users;
 
-- update weekly_logs_deadlines set week1="2025-06-11" where team_id="TEAM-0001";
-- select * from semester_wise_deadline;
-- update semester_wise_deadline set week1="2025-06-11" where semester=5;
-- select * from mentors_mentees;
-- select * from mentor_requests;
-- select * from queries;
-- select * from weekly_logs_verification;

-- select * from timeline;
-- delete from timeline;

-- select * from review_marks_team;
-- select *  from review_marks_individual;
-- select * from scheduled_reviews;
-- update scheduled_reviews set review_date="2025-06-12" where review_id=4;
-- update scheduled_reviews set attendance="" where review_id=4;
-- update scheduled_reviews set start_time="03:05:00" where review_id=4;

-- select * from review_requests;
-- select * from users;
-- update users set semester=5 where id=16;
-- update users set project_type = "internal" where id=15;
-- update users set dept = "EEE" where role="student";

-- select * from scheduled_reviews;
-- update scheduled_reviews set review_date="2025-06-21";
-- update scheduled_reviews set start_time="13:45:00";
-- update scheduled_reviews set meeting_link="https://meet.google.com/ied-spbd-osg";

-- delete from review_requests;
-- delete from scheduled_reviews;


-- CREATE TABLE guide_requests (
--   `id` int AUTO_INCREMENT,
--   `from_team_id` VARCHAR(200) NOT NULL,
--   `project_id` VARCHAR(200) NOT NULL,
--   `to_guide_reg_num` VARCHAR(200) NOT NULL,
--   `status` VARCHAR(200) DEFAULT 'interested',
--   `reason` TEXT DEFAULT NULL,
--   `project_name` VARCHAR(500) DEFAULT NULL,
--   `team_semester` INT NOT NULL,
--   PRIMARY KEY (`from_team_id`, `project_id`, `to_guide_reg_num`),
--   INDEX `idx_status` (status)
-- );

delete from timeline;
select * from timeline;

INSERT INTO `timeline` VALUES 
(1,'Team Formation','2025-06-10 00:00:00','2025-06-24 00:00:00',0,NULL),
(2,'Assign Guides and Mentors','2025-06-23 00:00:00','2025-06-27 00:00:00',0,NULL),
(3,'Submit Project Details','2025-06-28 00:00:00','2025-07-10 00:00:00',0,NULL),
(4,'Start Project Development','2025-07-11 00:00:00','2025-07-17 00:00:00',0,NULL),
(5,'Review 1','2025-07-18 00:00:00','2025-07-25 00:00:00',0,NULL),
(6,'Review 2','2025-07-26 00:00:00','2025-08-20 00:00:00',0,NULL),
(7,'Submit Report & PPT','2025-08-21 00:00:00','2025-08-31 00:00:00',0,NULL),
(8,'Optional Review','2025-09-01 00:00:00','2025-09-15 00:00:00',0,NULL);

CREATE TABLE guide_requests (
  `from_team_id` VARCHAR(200) NOT NULL,
  `project_id` VARCHAR(200) NOT NULL,
  `to_guide_reg_num` VARCHAR(200) NOT NULL,
  `status` VARCHAR(200) DEFAULT 'interested',
  `reason` TEXT DEFAULT NULL,
  `project_name` VARCHAR(500) DEFAULT NULL,
  `team_semester` INT NOT NULL,
  PRIMARY KEY (`from_team_id`, `project_id`, `to_guide_reg_num`),
  INDEX `idx_status` (status)
);

CREATE TABLE `project_completion_files` (
  `id` int NOT NULL AUTO_INCREMENT,
  `reg_num` varchar(255) NOT NULL,
  `team_id` int NOT NULL,
  `project_id` int NOT NULL,
  `outcome` varchar(255) DEFAULT NULL,
  `report` varchar(255) DEFAULT NULL,
  `ppt` varchar(255) DEFAULT NULL,
  `file_classification` varchar(100) not null,
  `uploaded_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_team_id` (`team_id`),
  INDEX `idx_project_id` (`project_id`)
);

CREATE TABLE `projects` (
  `project_id` varchar(50) NOT NULL,
  `team_id` VARCHAR(200) NOT NULL,
  `project_name` varchar(500) DEFAULT NULL,
  `cluster` varchar(100) DEFAULT NULL,
  `description` text,
  `outcome` text,
  `hard_soft` varchar(50) NOT NULL,
  `project_type` varchar(50) DEFAULT NULL,
  `tl_reg_num` VARCHAR(20) DEFAULT NULL,
  `posted_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`project_id`),
  UNIQUE KEY `unique_project_name` (`project_name`)
);

CREATE TABLE team_requests (
  team_id varchar(20),
  name varchar(255) DEFAULT NULL,
  emailId varchar(255) DEFAULT NULL,
  reg_num varchar(255) DEFAULT NULL,
  dept varchar(255) DEFAULT NULL,
  from_reg_num varchar(255) NOT NULL,
  to_reg_num varchar(255) NOT NULL,
  status varchar(255) DEFAULT 'interested',
  reason TEXT DEFAULT NULL,
  team_conformed int DEFAULT '0',
  UNIQUE KEY unique_request (from_reg_num,to_reg_num),
  PRIMARY KEY (from_reg_num, to_reg_num)
);

CREATE TABLE `queries` (
  `query_id` int NOT NULL AUTO_INCREMENT,
  `team_id` varchar(200) DEFAULT NULL,
  `project_id` varchar(200) DEFAULT NULL,
  `project_name` varchar(200) DEFAULT NULL,
  `team_member` varchar(200) DEFAULT NULL,
  `query` text,
  `reply` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `guide_reg_num` varchar(200) DEFAULT NULL,
  PRIMARY KEY (`query_id`),
  INDEX `team_id` (`team_id`),
  INDEX `project_id` (`project_id`)
);

CREATE TABLE `scheduled_reviews` (
  `review_id` INT NOT NULL AUTO_INCREMENT,
  `project_id` VARCHAR(100) DEFAULT NULL,
  `project_name` VARCHAR(500) DEFAULT NULL,
  `team_lead` VARCHAR(300) DEFAULT NULL,
  `review_date` DATE DEFAULT NULL,
  `review_title` VARCHAR(100) NOT NULL,
  `start_time` TIME DEFAULT NULL,
  `end_time` TIME DEFAULT NULL,
  `venue` varchar(200) DEFAULT NULL,
  `attendance` VARCHAR(255) DEFAULT null,
  `marks` VARCHAR(20) DEFAULT NULL,
  `remarks` VARCHAR(5000) DEFAULT NULL,
  `team_id` VARCHAR(300) DEFAULT NULL,
  `expert_reg_num` varchar(100) not null,
  `guide_reg_num` VARCHAR(100) NOT NULL,
  `meeting_link` varchar(500) default null,
  PRIMARY KEY (`review_id`)
);

CREATE TABLE `sub_expert_requests` (
  `from_team_id` VARCHAR(200) NOT NULL,
  `project_id` VARCHAR(200) NOT NULL,
  `to_expert_reg_num` VARCHAR(200) NOT NULL,
  `status` VARCHAR(200) DEFAULT 'interested',
  `reason` TEXT DEFAULT NULL,
  `project_name` VARCHAR(500) DEFAULT NULL,
  `team_semester` INT NOT NULL,
  PRIMARY KEY (`from_team_id`, `project_id`, `to_expert_reg_num`),
  INDEX `idx_status` (`status`)
);

-- CREATE TABLE `weekly_logs_deadlines` (
--   `team_id` varchar(50) NOT NULL,
--   `project_id` varchar(100) DEFAULT NULL,
--   `week1` date DEFAULT NULL,
--   `week2` date DEFAULT NULL,
--   `week3` date DEFAULT NULL,
--   `week4` date DEFAULT NULL,
--   `week5` date DEFAULT NULL,
--   `week6` date DEFAULT NULL,
--   `week7` date DEFAULT NULL,
--   `week8` date DEFAULT NULL,
--   `week9` date DEFAULT NULL,
--   `week10` date DEFAULT NULL,
--   `week11` date DEFAULT NULL,
--   `week12` date DEFAULT NULL,
--   PRIMARY KEY (team_id, project_id),
--   INDEX idx_team (team_id),
--   INDEX idx_project (project_id)
-- );

CREATE TABLE `weekly_logs_deadlines` (
  `team_id` varchar(50) NOT NULL,
  `project_id` varchar(100) NOT NULL,  -- Changed from DEFAULT NULL to NOT NULL
`semester` INT DEFAULT NULL,
  `week1` date DEFAULT NULL,
  `week2` date DEFAULT NULL,
  `week3` date DEFAULT NULL,
  `week4` date DEFAULT NULL,
  `week5` date DEFAULT NULL,
  `week6` date DEFAULT NULL,
  `week7` date DEFAULT NULL,
  `week8` date DEFAULT NULL,
  `week9` date DEFAULT NULL,
  `week10` date DEFAULT NULL,
  `week11` date DEFAULT NULL,
  `week12` date DEFAULT NULL,
  PRIMARY KEY (team_id, project_id),
  INDEX idx_team (team_id),
  INDEX idx_project (project_id)
);

CREATE TABLE `semester_wise_deadline` (
`semester` INT NOT NULL,
  `week1` date DEFAULT NULL,
  `week2` date DEFAULT NULL,
  `week3` date DEFAULT NULL,
  `week4` date DEFAULT NULL,
  `week5` date DEFAULT NULL,
  `week6` date DEFAULT NULL,
  `week7` date DEFAULT NULL,
  `week8` date DEFAULT NULL,
  `week9` date DEFAULT NULL,
  `week10` date DEFAULT NULL,
  `week11` date DEFAULT NULL,
  `week12` date DEFAULT NULL,
  PRIMARY KEY (semester)
);




CREATE TABLE timeline (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    team_id INT,
    cron_executed boolean default false,
    INDEX index_start_date (start_date),
    INDEX index_end_date (end_date),
    INDEX index_date_range (start_date, end_date)
);

CREATE TABLE weekly_logs_verification (
    team_id VARCHAR(100) NOT NULL,
    week_number INT NOT NULL CHECK (week_number BETWEEN 1 AND 12),
    is_verified BOOLEAN DEFAULT FALSE,
    verified_by VARCHAR(100),
    verified_at DATETIME DEFAULT NULL,
    remarks TEXT,
    status varchar(50) default null,
    reason text default null,
    PRIMARY KEY (team_id, week_number)
);

CREATE TABLE review_requests (
  request_id INT AUTO_INCREMENT PRIMARY KEY,
  team_id VARCHAR(20),
  project_id VARCHAR(50) NOT NULL,
  project_name VARCHAR(100) NOT NULL,
  team_lead VARCHAR(50) NOT NULL,
  review_date DATE DEFAULT NULL,
  review_title VARCHAR(100) NOT NULL,
  start_time TIME DEFAULT NULL,
  end_time TIME DEFAULT NULL,
  guide_status VARCHAR (100) DEFAULT 'interested',
  expert_status VARCHAR(100) default 'interested',
  expert_reg_num varchar(100) NOT NULL,
  guide_reg_num VARCHAR(100) NOT NULL,
  guide_reason text default null,
  expert_reason text default null,
  file text not null,
  temp_meeting_link varchar(500) default null,
  INDEX idx_team_id (team_id),
  INDEX idx_project_id (project_id),
  INDEX idx_review_date (review_date)
);

CREATE TABLE review_marks (
  review_no INT,
  review_date DATE NOT NULL,
  team_id INT,
  guide_literature_survey INT NOT NULL CHECK (guide_literature_survey BETWEEN 0 AND 5),
  expert_literature_survey INT NOT NULL CHECK (expert_literature_survey BETWEEN 0 AND 5),
  guide_aim INT NOT NULL CHECK (guide_aim BETWEEN 0 AND 5),
  expert_aim INT NOT NULL CHECK (expert_aim BETWEEN 0 AND 5),
  guide_scope INT NOT NULL CHECK (guide_scope BETWEEN 0 AND 5),
  expert_scope INT NOT NULL CHECK (expert_scope BETWEEN 0 AND 5),
  guide_need_for_study INT NOT NULL CHECK (guide_need_for_study BETWEEN 0 AND 5),
  expert_need_for_study INT NOT NULL CHECK (expert_need_for_study BETWEEN 0 AND 5),
  guide_proposed_methodology INT NOT NULL CHECK (guide_proposed_methodology BETWEEN 0 AND 10),
  expert_proposed_methodology INT NOT NULL CHECK (expert_proposed_methodology BETWEEN 0 AND 10),
  guide_work_plan INT NOT NULL CHECK (guide_work_plan BETWEEN 0 AND 5),
  expert_work_plan INT NOT NULL CHECK (expert_work_plan BETWEEN 0 AND 5),
  guide_oral_presentation INT NOT NULL CHECK (guide_oral_presentation BETWEEN 0 AND 5),
  expert_oral_presentation INT NOT NULL CHECK (expert_oral_presentation BETWEEN 0 AND 5),
  guide_viva_voce_and_ppt INT NOT NULL CHECK (guide_viva_voce_and_ppt BETWEEN 0 AND 5),
  expert_viva_voce_and_ppt INT NOT NULL CHECK (expert_viva_voce_and_ppt BETWEEN 0 AND 5),
  guide_contributions INT NOT NULL CHECK (guide_contributions BETWEEN 0 AND 5),
  expert_contributions INT NOT NULL CHECK (expert_contributions BETWEEN 0 AND 5),
  guide_remarks TEXT NOT NULL,
  expert_remarks TEXT NOT NULL,
  total_expert_marks INT NOT NULL CHECK (total_expert_marks BETWEEN 0 AND 50),
  total_guide_marks INT NOT NULL CHECK (total_guide_marks BETWEEN 0 AND 50),
  total_marks INT NOT NULL CHECK (total_marks BETWEEN 0 AND 100),
  PRIMARY KEY (review_no, team_id)
);
-- SHOW CREATE TABLE users;

CREATE TABLE teams (
  team_id VARCHAR(20),
  reg_num VARCHAR(255) ,
  is_leader BOOLEAN DEFAULT 0,
  semester INT DEFAULT NULL,
  project_id VARCHAR(250),
  guide_reg_num VARCHAR(500),
  sub_expert_reg_num VARCHAR(500),
  project_picked_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  guide_verified INT DEFAULT 0,
  week1_progress VARCHAR(200),
  week2_progress VARCHAR(200),
  week3_progress VARCHAR(200),
  week4_progress VARCHAR(200),
  week5_progress VARCHAR(200),
  week6_progress VARCHAR(200),
  week7_progress VARCHAR(200),
  week8_progress VARCHAR(200),
  week9_progress VARCHAR(200),
  week10_progress VARCHAR(200),
  week11_progress VARCHAR(200),
  week12_progress VARCHAR(200),
  PRIMARY KEY (team_id, reg_num),
  FOREIGN KEY (reg_num) REFERENCES users(reg_num)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE TABLE mentor_requests (
  `from_team_id` VARCHAR(200) NOT NULL,
  `project_id` VARCHAR(200) NOT NULL,
  `mentor_reg_num` VARCHAR(200) NOT NULL,
  `status` VARCHAR(200) DEFAULT 'interested',
  `reason` TEXT DEFAULT NULL,
  `project_name` VARCHAR(500) DEFAULT NULL,
  `team_semester` INT NOT NULL,
  PRIMARY KEY (`from_team_id`, `project_id`, `mentor_reg_num`),
  INDEX `idx_status` (`status`)
);

CREATE TABLE mentors_mentees (
    mentee_name VARCHAR(100) NOT NULL,
    mentee_reg_num VARCHAR(100) NOT NULL,
    mentee_emailId VARCHAR(100) NOT NULL,
    mentee_sem INT NOT NULL,
    mentor_name VARCHAR(100) NOT NULL,
    mentor_reg_num VARCHAR(100),
    mentor_emailId VARCHAR(100),
    PRIMARY KEY (mentee_reg_num)
);

select * from  review_marks_team ;
CREATE TABLE review_marks_team (
  review_no INT AUTO_INCREMENT,
  review_title VARCHAR(100) not null,
  review_date DATE NOT NULL,
  team_id varchar(20),
  guide_literature_survey INT  NULL CHECK (guide_literature_survey BETWEEN 0 AND 5),
  expert_literature_survey INT  NULL CHECK (expert_literature_survey BETWEEN 0 AND 5),
  guide_aim INT DEFAULT NULL CHECK (guide_aim BETWEEN 0 AND 5),
  expert_aim INT DEFAULT NULL CHECK (expert_aim BETWEEN 0 AND 5),
  guide_scope INT DEFAULT NULL CHECK (guide_scope BETWEEN 0 AND 5),
  expert_scope INT DEFAULT NULL CHECK (expert_scope BETWEEN 0 AND 5),
  guide_need_for_study INT DEFAULT NULL CHECK (guide_need_for_study BETWEEN 0 AND 5),
  expert_need_for_study INT DEFAULT NULL CHECK (expert_need_for_study BETWEEN 0 AND 5),
  guide_proposed_methodology INT DEFAULT NULL CHECK (guide_proposed_methodology BETWEEN 0 AND 10),
  expert_proposed_methodology INT DEFAULT NULL CHECK (expert_proposed_methodology BETWEEN 0 AND 10),
  guide_work_plan INT DEFAULT NULL CHECK (guide_work_plan BETWEEN 0 AND 5),
  expert_work_plan INT DEFAULT NULL CHECK (expert_work_plan BETWEEN 0 AND 5),
  total_guide_marks INT DEFAULT NULL CHECK (total_guide_marks BETWEEN 0 AND 50),
  total_expert_marks INT DEFAULT NULL CHECK (total_expert_marks BETWEEN 0 AND 50),
  total_marks INT DEFAULT NULL CHECK (total_marks BETWEEN 0 AND 100),
  guide_remarks text default null,
  expert_remarks text default null,
  guide_reg_num varchar(100) default null,
  expert_reg_num varchar(100) default null,
  PRIMARY KEY (review_no, team_id)
);

CREATE TABLE review_marks_individual (
  review_no INT AUTO_INCREMENT,
  review_title varchar(100) not null,
  review_date DATE NOT NULL,
  team_id varchar(20),
  student_reg_num VARCHAR(20) NOT NULL,
  guide_oral_presentation INT  NULL CHECK (guide_oral_presentation BETWEEN 0 AND 5),
  expert_oral_presentation INT  NULL CHECK (expert_oral_presentation BETWEEN 0 AND 5),
  guide_viva_voce_and_ppt INT  NULL CHECK (guide_viva_voce_and_ppt BETWEEN 0 AND 5),
  expert_viva_voce_and_ppt INT  NULL CHECK (expert_viva_voce_and_ppt BETWEEN 0 AND 5),
  guide_contributions INT  NULL CHECK (guide_contributions BETWEEN 0 AND 5),
  expert_contributions INT  NULL CHECK (expert_contributions BETWEEN 0 AND 5),
  total_expert_marks INT  NULL CHECK (total_expert_marks BETWEEN 0 AND 50),
  total_guide_marks INT  NULL CHECK (total_guide_marks BETWEEN 0 AND 50),
  total_marks INT  NULL CHECK (total_marks BETWEEN 0 AND 100),
  guide_remarks text default null,
  expert_remarks text default null,
  guide_reg_num varchar(100) default null,
  expert_reg_num varchar(100) default null,
  PRIMARY KEY (review_no, student_reg_num)
);

CREATE TABLE optional_review_requests (
  request_id INT AUTO_INCREMENT PRIMARY KEY,
  team_id VARCHAR(100) NOT NULL,
  project_id VARCHAR(100) NOT NULL,
  team_lead VARCHAR(100) NOT NULL,
  review_date DATE NOT NULL,
  start_time TIME NOT NULL,
  reason text not null,
  mentor_reg_num VARCHAR(100) NOT NULL,
  status VARCHAR(100) DEFAULT NULL,
  file text not null
);

CREATE TABLE challenge_review_requests (
  request_id INT AUTO_INCREMENT PRIMARY KEY,
  team_id VARCHAR(100) NOT NULL,
  project_id VARCHAR(100) NOT NULL,
  team_lead VARCHAR(100) NOT NULL,
  review_date DATE NOT NULL,
  start_time TIME NOT NULL,
  reason text not null,
  temp_expert VARCHAR(100) NOT NULL,
  temp_guide VARCHAR(100) NOT NULL,
  status VARCHAR(100) DEFAULT NULL,
  file text not null
);



