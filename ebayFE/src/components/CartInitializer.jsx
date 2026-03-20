import { useCart } from '../features/cart/hooks/useCart';

/**
 * Invisible component that activates cart sync globally in MainLayout.
 * By mounting useCart here, the login-sync useEffect runs immediately
 * when the user authenticates — without requiring a visit to /cart.
 */
export default function CartInitializer() {
    useCart(); // triggers the useEffect that fetches the server cart on login
    return null;
}
