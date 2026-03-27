import { Suspense, lazy, useEffect } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import useAuthStore from './store/useAuthStore';

// Layouts
import MainLayout from './components/layouts/MainLayout';
import AuthLayout from './components/layouts/AuthLayout';
import SellerLayout from './components/layouts/SellerLayout';

// Pages (Lazy Loaded)
const HomePage = lazy(() => import('./pages/HomePage'));
const ProductsPage = lazy(() => import('./pages/ProductsPage'));
const ProductDetailsPage = lazy(() => import('./pages/ProductDetailsPage'));
const RelatedItemsPage = lazy(() => import('./pages/RelatedItemsPage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const PaymentSimulationPage = lazy(() => import('./pages/PaymentSimulationPage'));
const OrderSuccessPage = lazy(() => import('./pages/OrderSuccessPage'));
const GuestOrderLookupPage = lazy(() => import('./pages/GuestOrderLookupPage'));
const GuestOrderDetailPage = lazy(() => import('./pages/GuestOrderDetailPage'));
const GuestCasesPage = lazy(() => import('./pages/GuestCasesPage'));
const GuestCaseDetailPage = lazy(() => import('./pages/GuestCaseDetailPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const OrdersPage = lazy(() => import('./pages/OrdersPage'));
const OrderDetailPage = lazy(() => import('./pages/OrderDetailPage'));
const CasesPage = lazy(() => import('./pages/CasesPage'));
const CaseDetailPage = lazy(() => import('./pages/CaseDetailPage'));
const SavedPage = lazy(() => import('./pages/SavedPage'));
const WatchlistPage = lazy(() => import('./pages/WatchlistPage'));

// Seller Pages (Lazy Loaded)
const SellerOverviewPage = lazy(() => import('./pages/seller/SellerOverviewPage'));
const SellerOrdersPage = lazy(() => import('./pages/seller/SellerOrdersPage'));
const SellerOrderDetailPage = lazy(() => import('./pages/seller/SellerOrderDetailPage'));
const SellerCasesQueuePage = lazy(() => import('./pages/seller/SellerCasesQueuePage'));
const SellerCaseDetailPage = lazy(() => import('./pages/seller/SellerCaseDetailPage'));
const SellerListingsPage = lazy(() => import('./pages/seller/SellerListingsPage'));
const SellerCreateListingPage = lazy(() => import('./pages/seller/SellerCreateListingPage'));
const SellerEditListingPage = lazy(() => import('./pages/seller/SellerEditListingPage'));
const SellerInventoryPage = lazy(() => import('./pages/seller/SellerInventoryPage'));
const SellerMarketingPage = lazy(() => import('./pages/seller/SellerMarketingPage'));
const SellerStorePage = lazy(() => import('./pages/seller/SellerStorePage'));
const CouponProductsPage = lazy(() => import('./pages/CouponProductsPage'));

// Auth Pages (Lazy Loaded)
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const VerifyEmailPage = lazy(() => import('./pages/auth/VerifyEmailPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'));
const SecurityMeasurePage = lazy(() => import('./pages/auth/SecurityMeasurePage'));

// Skeleton Loader component
const PageLoader = () => (
  <div className="flex justify-center items-center min-h-[50vh]">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <Suspense fallback={<PageLoader />}><HomePage /></Suspense>,
      },
      {
        path: 'products',
        element: <Suspense fallback={<PageLoader />}><ProductsPage /></Suspense>,
      },
      {
        path: 'products/:id',
        element: <Suspense fallback={<PageLoader />}><ProductDetailsPage /></Suspense>,
      },
      {
        path: 'coupons/:id',
        element: <Suspense fallback={<PageLoader />}><CouponProductsPage /></Suspense>,
      },
      {
        path: 'products/related/:id',
        element: <Suspense fallback={<PageLoader />}><RelatedItemsPage /></Suspense>,
      },
      {
        path: 'cart',
        element: <Suspense fallback={<PageLoader />}><CartPage /></Suspense>,
      },
      {
        path: 'order-success',
        element: <Suspense fallback={<PageLoader />}><OrderSuccessPage /></Suspense>,
      },
      {
        path: 'guest/orders/lookup',
        element: <Suspense fallback={<PageLoader />}><GuestOrderLookupPage /></Suspense>,
      },
      {
        path: 'guest/orders/detail',
        element: <Suspense fallback={<PageLoader />}><GuestOrderDetailPage /></Suspense>,
      },
      {
        path: 'guest/cases',
        element: <Suspense fallback={<PageLoader />}><GuestCasesPage /></Suspense>,
      },
      {
        path: 'guest/cases/:caseKind/:id',
        element: <Suspense fallback={<PageLoader />}><GuestCaseDetailPage /></Suspense>,
      },
      {
        path: 'profile',
        element: <Suspense fallback={<PageLoader />}><ProfilePage /></Suspense>,
      },
      {
        path: 'orders',
        element: <Suspense fallback={<PageLoader />}><OrdersPage /></Suspense>,
      },
      {
        path: 'orders/:id',
        element: <Suspense fallback={<PageLoader />}><OrderDetailPage /></Suspense>,
      },
      {
        path: 'cases',
        element: <Suspense fallback={<PageLoader />}><CasesPage /></Suspense>,
      },
      {
        path: 'cases/:caseKind/:id',
        element: <Suspense fallback={<PageLoader />}><CaseDetailPage /></Suspense>,
      },
      {
        path: 'saved',
        element: <Suspense fallback={<PageLoader />}><SavedPage /></Suspense>,
      },
      {
        path: 'watchlist',
        element: <Suspense fallback={<PageLoader />}><WatchlistPage /></Suspense>,
      },
    ],
  },
  {
    path: '/login',
    element: <AuthLayout />,
    children: [
      {
        index: true,
        element: <Suspense fallback={<PageLoader />}><LoginPage /></Suspense>
      }
    ]
  },
  {
    path: '/checkout',
    element: <Suspense fallback={<PageLoader />}><CheckoutPage /></Suspense>
  },
  {
    path: '/payment/simulate',
    element: <Suspense fallback={<PageLoader />}><PaymentSimulationPage /></Suspense>
  },
  {
    path: '/register',
    element: <AuthLayout />,
    children: [
      {
        index: true,
        element: <Suspense fallback={<PageLoader />}><RegisterPage /></Suspense>
      }
    ]
  },
  {
    path: '/verify-email',
    element: <AuthLayout />,
    children: [
      {
        index: true,
        element: <Suspense fallback={<PageLoader />}><VerifyEmailPage /></Suspense>
      }
    ]
  },
  {
    path: '/forgot-password',
    element: <AuthLayout />,
    children: [
      {
        index: true,
        element: <Suspense fallback={<PageLoader />}><ForgotPasswordPage /></Suspense>
      }
    ]
  },
  {
    path: '/reset-password',
    element: <AuthLayout />,
    children: [
      {
        index: true,
        element: <Suspense fallback={<PageLoader />}><ResetPasswordPage /></Suspense>
      }
    ]
  },
  {
    path: '/verify',
    element: <AuthLayout />,
    children: [
      {
        index: true,
        element: <Suspense fallback={<PageLoader />}><SecurityMeasurePage /></Suspense>
      }
    ]
  },
  {
    path: '/seller',
    element: <SellerLayout />,
    children: [
      {
        index: true,
        element: <Suspense fallback={<PageLoader />}><SellerOverviewPage /></Suspense>
      },
      {
        path: 'orders',
        element: <Suspense fallback={<PageLoader />}><SellerOrdersPage /></Suspense>
      },
      {
        path: 'orders/:orderId',
        element: <Suspense fallback={<PageLoader />}><SellerOrderDetailPage /></Suspense>
      },
      {
        path: 'cases',
        element: <Suspense fallback={<PageLoader />}><SellerCasesQueuePage /></Suspense>
      },
      {
        path: 'cases/:caseKind/:id',
        element: <Suspense fallback={<PageLoader />}><SellerCaseDetailPage /></Suspense>
      },
      {
        path: 'listings',
        element: <Suspense fallback={<PageLoader />}><SellerListingsPage /></Suspense>
      },
      {
        path: 'listings/create',
        element: <Suspense fallback={<PageLoader />}><SellerCreateListingPage /></Suspense>
      },
      {
        path: 'listings/:id/edit',
        element: <Suspense fallback={<PageLoader />}><SellerEditListingPage /></Suspense>
      },
      {
        path: 'inventory',
        element: <Suspense fallback={<PageLoader />}><SellerInventoryPage /></Suspense>
      },
      {
        path: 'marketing',
        element: <Suspense fallback={<PageLoader />}><SellerMarketingPage /></Suspense>
      },
      {
        path: 'store',
        element: <Suspense fallback={<PageLoader />}><SellerStorePage /></Suspense>
      }
    ]
  }
]);

import { Toaster } from 'react-hot-toast';

let hasBootstrappedAuthCheck = false;

export default function App() {
  const { checkAuth, loading } = useAuthStore();

  useEffect(() => {
    if (hasBootstrappedAuthCheck) {
      return;
    }

    hasBootstrappedAuthCheck = true;
    checkAuth();
  }, [checkAuth]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <RouterProvider router={router} />
      <Toaster position="bottom-right" reverseOrder={false} />
    </>
  );
}
