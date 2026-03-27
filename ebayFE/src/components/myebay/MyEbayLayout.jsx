import useAuthStore from '../../store/useAuthStore';
import MyEbaySidebar from './MyEbaySidebar';

export default function MyEbayLayout({ activeKey, title, description, children }) {
    const { user } = useAuthStore();

    return (
        <div className="min-h-screen bg-[#fafafa] pb-12">
            <div className="mx-auto max-w-[1280px] px-4 py-8 md:px-8 xl:px-4">
                <div className="mb-8">
                    <h1 className="text-[36px] font-black tracking-tight text-gray-900">My eBay</h1>
                    {(title || description) && (
                        <div className="mt-2">
                            {title && <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#3665f3]">{title}</p>}
                            {description && <p className="mt-2 text-sm text-gray-500">{description}</p>}
                        </div>
                    )}
                </div>

                <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
                    <MyEbaySidebar user={user} activeKey={activeKey} />
                    <main className="min-w-0">{children}</main>
                </div>
            </div>
        </div>
    );
}
