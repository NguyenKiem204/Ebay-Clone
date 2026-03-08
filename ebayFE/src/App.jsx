import { Suspense, lazy, useEffect } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import useAuthStore from './store/useAuthStore';

// ... (layouts and pages imports remain the same)

// Layouts
import MainLayout from './components/layouts/MainLayout';
import AuthLayout from './components/layouts/AuthLayout';
import SellerLayout from './components/layouts/SellerLayout';

// Pages (Lazy Loaded)
const HomePage = lazy(() => import('./pages/HomePage'));
const ProductsPage = lazy(() => import('./pages/ProductsPage'));
const ProductDetailsPage = lazy(() => import('./pages/ProductDetailsPage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const OrderSuccessPage = lazy(() => import('./pages/OrderSuccessPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const OrdersPage = lazy(() => import('./pages/OrdersPage'));

// Seller Pages (Lazy Loaded)
const SellerOverviewPage = lazy(() => import('./pages/seller/SellerOverviewPage'));
const SellerOrdersPage = lazy(() => import('./pages/seller/SellerOrdersPage'));
const SellerListingsPage = lazy(() => import('./pages/seller/SellerListingsPage'));
const SellerCreateListingPage = lazy(() => import('./pages/seller/SellerCreateListingPage'));
const SellerInventoryPage = lazy(() => import('./pages/seller/SellerInventoryPage'));
const SellerMarketingPage = lazy(() => import('./pages/seller/SellerMarketingPage'));
const SellerStorePage = lazy(() => import('./pages/seller/SellerStorePage'));

// Auth Pages (Lazy Loaded)
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const VerifyEmailPage = lazy(() => import('./pages/auth/VerifyEmailPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'));

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
        path: 'cart',
        element: <Suspense fallback={<PageLoader />}><CartPage /></Suspense>,
      },
      {
        path: 'checkout',
        element: <Suspense fallback={<PageLoader />}><CheckoutPage /></Suspense>,
      },
      {
        path: 'order-success',
        element: <Suspense fallback={<PageLoader />}><OrderSuccessPage /></Suspense>,
      },
      {
        path: 'profile',
        element: <Suspense fallback={<PageLoader />}><ProfilePage /></Suspense>,
      },
      {
        path: 'orders',
        element: <Suspense fallback={<PageLoader />}><OrdersPage /></Suspense>,
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
        path: 'listings',
        element: <Suspense fallback={<PageLoader />}><SellerListingsPage /></Suspense>
      },
      {
        path: 'listings/create',
        element: <Suspense fallback={<PageLoader />}><SellerCreateListingPage /></Suspense>
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

export default function App() {
  const { checkAuth, loading } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return <RouterProvider router={router} />;
}
