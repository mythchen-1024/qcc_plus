package notify

import (
	"context"

	"qcc_plus/internal/store"
)

// Store 定义通知模块所需的最小存储接口。
type Store interface {
	ListEnabledSubscriptionsForEvent(ctx context.Context, accountID, eventType string) ([]store.SubscriptionWithChannel, error)
	InsertNotificationHistory(ctx context.Context, rec store.NotificationHistoryRecord) error
}

// StoreAdapter 将 *store.Store 适配为通知模块使用的接口。
type StoreAdapter struct {
	core *store.Store
}

func NewStoreAdapter(core *store.Store) *StoreAdapter {
	return &StoreAdapter{core: core}
}

func (s *StoreAdapter) ListEnabledSubscriptionsForEvent(ctx context.Context, accountID, eventType string) ([]store.SubscriptionWithChannel, error) {
	return s.core.ListEnabledSubscriptionsForEvent(ctx, accountID, eventType)
}

func (s *StoreAdapter) InsertNotificationHistory(ctx context.Context, rec store.NotificationHistoryRecord) error {
	return s.core.InsertNotificationHistory(ctx, rec)
}
