// components/AuthInitializer.js
import { checkAuthUser } from '@/store/userSlice';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';

export default function AuthInitializer({ children }) {
    const dispatch = useDispatch();
    const location = useLocation();
    const [isAuthChecked, setIsAuthChecked] = useState(false);

    useEffect(() => {
        const initializeAuth = async () => {
            try {
                await dispatch(checkAuthUser());
            } catch (error) {
                console.error("Auth check failed:", error);
            } finally {
                setIsAuthChecked(true);
            }
        };
        initializeAuth();
    }, [dispatch]);

    if (!isAuthChecked) {
        return <div className="flex justify-center items-center h-screen">Loading...</div>;
    }

    return children;
}