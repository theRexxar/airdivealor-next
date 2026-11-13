CREATE TABLE `enquiries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`status` enum('new','contacted','confirmed','cancelled') NOT NULL DEFAULT 'new',
	`lang` enum('en','id') NOT NULL,
	`currency` enum('IDR','USD') NOT NULL,
	`package_id` varchar(60) NOT NULL,
	`package_name` json NOT NULL,
	`price_idr` int NOT NULL,
	`usd_rate` int NOT NULL DEFAULT 0,
	`deposit_percent` int NOT NULL,
	`arrival` varchar(10) NOT NULL,
	`divers` int NOT NULL,
	`cert` varchar(40) NOT NULL,
	`camera` boolean NOT NULL DEFAULT false,
	`name` varchar(100) NOT NULL,
	`email` varchar(200) NOT NULL,
	`phone` varchar(30) NOT NULL DEFAULT '',
	`message` text NOT NULL,
	`notes` text NOT NULL,
	`ip` varchar(64),
	`user_agent` varchar(255),
	`team_email` enum('pending','sent','failed','not_configured') NOT NULL DEFAULT 'pending',
	`team_email_to` varchar(200) NOT NULL DEFAULT '',
	`team_email_id` varchar(200),
	`team_email_error` varchar(500),
	`team_email_at` datetime,
	`customer_email` enum('pending','sent','failed','not_configured') NOT NULL DEFAULT 'pending',
	`customer_email_id` varchar(200),
	`customer_email_error` varchar(500),
	`customer_email_at` datetime,
	`updated_by` int,
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `enquiries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `enquiries` ADD CONSTRAINT `enquiries_updated_by_users_id_fk` FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `enquiries_created_idx` ON `enquiries` (`created_at`);--> statement-breakpoint
CREATE INDEX `enquiries_status_idx` ON `enquiries` (`status`);