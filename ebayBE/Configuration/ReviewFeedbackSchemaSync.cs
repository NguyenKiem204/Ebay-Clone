using ebay.Models;
using Microsoft.EntityFrameworkCore;

namespace ebay.Configuration
{
    public static class ReviewFeedbackSchemaSync
    {
        public static async Task EnsureAsync(EbayDbContext context)
        {
            const string sql = """
                ALTER TABLE IF EXISTS reviews
                    ADD COLUMN IF NOT EXISTS order_item_id INT NULL,
                    ADD COLUMN IF NOT EXISTS status VARCHAR(30) NOT NULL DEFAULT 'published',
                    ADD COLUMN IF NOT EXISTS seller_reply TEXT NULL,
                    ADD COLUMN IF NOT EXISTS seller_reply_by_user_id INT NULL,
                    ADD COLUMN IF NOT EXISTS seller_reply_created_at TIMESTAMP NULL,
                    ADD COLUMN IF NOT EXISTS seller_reply_updated_at TIMESTAMP NULL;

                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1
                        FROM information_schema.table_constraints
                        WHERE constraint_name = 'reviews_order_item_id_fkey'
                    ) THEN
                        ALTER TABLE reviews
                            ADD CONSTRAINT reviews_order_item_id_fkey
                            FOREIGN KEY (order_item_id) REFERENCES order_items(id) ON DELETE SET NULL;
                    END IF;
                END $$;

                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1
                        FROM information_schema.table_constraints
                        WHERE constraint_name = 'reviews_seller_reply_by_user_id_fkey'
                    ) THEN
                        ALTER TABLE reviews
                            ADD CONSTRAINT reviews_seller_reply_by_user_id_fkey
                            FOREIGN KEY (seller_reply_by_user_id) REFERENCES users(id) ON DELETE SET NULL;
                    END IF;
                END $$;

                CREATE UNIQUE INDEX IF NOT EXISTS reviews_order_item_id_reviewer_id_key
                    ON reviews(order_item_id, reviewer_id)
                    WHERE order_item_id IS NOT NULL;

                CREATE TABLE IF NOT EXISTS seller_transaction_feedback (
                    id SERIAL PRIMARY KEY,
                    order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
                    order_item_id INT NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
                    seller_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    buyer_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    sentiment VARCHAR(20) NOT NULL,
                    comment TEXT,
                    status VARCHAR(30) NOT NULL DEFAULT 'published',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    CONSTRAINT chk_seller_transaction_feedback_sentiment CHECK (sentiment IN ('positive', 'neutral', 'negative')),
                    CONSTRAINT seller_transaction_feedback_order_item_id_buyer_id_key UNIQUE (order_item_id, buyer_id)
                );

                CREATE INDEX IF NOT EXISTS idx_seller_transaction_feedback_order
                    ON seller_transaction_feedback(order_id);

                CREATE INDEX IF NOT EXISTS idx_seller_transaction_feedback_order_item
                    ON seller_transaction_feedback(order_item_id);

                CREATE INDEX IF NOT EXISTS idx_seller_transaction_feedback_seller
                    ON seller_transaction_feedback(seller_id);

                CREATE INDEX IF NOT EXISTS idx_seller_transaction_feedback_buyer
                    ON seller_transaction_feedback(buyer_id);

                CREATE TABLE IF NOT EXISTS review_helpful_votes (
                    id SERIAL PRIMARY KEY,
                    review_id INT NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
                    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    CONSTRAINT review_helpful_votes_review_id_user_id_key UNIQUE (review_id, user_id)
                );

                CREATE INDEX IF NOT EXISTS idx_review_helpful_votes_review
                    ON review_helpful_votes(review_id);

                CREATE INDEX IF NOT EXISTS idx_review_helpful_votes_user
                    ON review_helpful_votes(user_id);

                CREATE TABLE IF NOT EXISTS review_reports (
                    id SERIAL PRIMARY KEY,
                    review_id INT NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
                    reporter_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    reason VARCHAR(100) NOT NULL,
                    details TEXT NULL,
                    status VARCHAR(30) NOT NULL DEFAULT 'open',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    CONSTRAINT review_reports_review_id_reporter_id_key UNIQUE (review_id, reporter_id)
                );

                CREATE INDEX IF NOT EXISTS idx_review_reports_review
                    ON review_reports(review_id);

                CREATE INDEX IF NOT EXISTS idx_review_reports_reporter
                    ON review_reports(reporter_id);

                ALTER TABLE IF EXISTS notifications
                    DROP CONSTRAINT IF EXISTS chk_notification_type;

                ALTER TABLE IF EXISTS notifications
                    ADD CONSTRAINT chk_notification_type CHECK (
                        type IN (
                            'order',
                            'payment',
                            'shipping',
                            'promotion',
                            'review',
                            'message',
                            'system',
                            'product_review_received',
                            'seller_feedback_received',
                            'seller_reply',
                            'auction_outbid',
                            'auction_won',
                            'auction_lost',
                            'auction_ending_soon',
                            'promotion_created',
                            'promotion_updated',
                            'promotion_ended',
                            'order_cancellation_request',
                            'order_cancellation_resolution',
                            'order_shipped',
                            'order_delivered'
                        )
                    );
                """;

            await context.Database.ExecuteSqlRawAsync(sql);
        }
    }
}
