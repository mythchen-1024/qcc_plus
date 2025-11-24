package notify

// 仅供文档化参考的建表语句，实际迁移在 internal/store/migration.go 中执行。
const (
	DDLNotificationChannels = `CREATE TABLE IF NOT EXISTS notification_channels (
		id VARCHAR(64) PRIMARY KEY,
		account_id VARCHAR(64) NOT NULL,
		channel_type VARCHAR(64) NOT NULL,
		name VARCHAR(255),
		config JSON,
		enabled BOOLEAN DEFAULT TRUE,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
		KEY idx_notification_channels_account (account_id)
	)`

	DDLNotificationSubscriptions = `CREATE TABLE IF NOT EXISTS notification_subscriptions (
		id VARCHAR(64) PRIMARY KEY,
		account_id VARCHAR(64) NOT NULL,
		channel_id VARCHAR(64) NOT NULL,
		event_type VARCHAR(128) NOT NULL,
		enabled BOOLEAN DEFAULT TRUE,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
		UNIQUE KEY uniq_subscription (account_id, channel_id, event_type),
		KEY idx_subscription_account_event (account_id, event_type)
	)`

	DDLNotificationHistory = `CREATE TABLE IF NOT EXISTS notification_history (
		id VARCHAR(64) PRIMARY KEY,
		account_id VARCHAR(64) NOT NULL,
		channel_id VARCHAR(64) NOT NULL,
		event_type VARCHAR(128) NOT NULL,
		title VARCHAR(255),
		content TEXT,
		status VARCHAR(32) NOT NULL,
		error TEXT,
		sent_at TIMESTAMP NULL,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		KEY idx_history_account_event (account_id, event_type),
        KEY idx_history_channel (channel_id)
	)`
)
