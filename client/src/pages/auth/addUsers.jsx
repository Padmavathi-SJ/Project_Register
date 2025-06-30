import CommonForm from "@/components/common-form";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { GraduationCap } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
    updateSignUpFormData,
    registerUser,
    clearError,
    resetSignUpFormData
} from "@/store/userSlice";
import { signUpFormControls } from "@/config";

function AddUsers() {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();
    const {
        signUpFormData,
        loading,
        error
    } = useSelector((state) => state.userSlice);

    const handleSignUpFormChange = (updatedData) => {
        dispatch(updateSignUpFormData(updatedData));
    };

    const handleRegisterUser = async (event) => {
        event.preventDefault();
        try {
            const result = await dispatch(registerUser(signUpFormData));
            if (result.success) {
                // Redirect to the previous location or default route
                const from = location.state?.from?.pathname || getDefaultRoute(result.data.user.role);
                navigate(from, { replace: true });
            }
        } catch (error) {
            console.error("Registration failed:", error);
        }
    };

    function checkIfSignUpFormIsValid() {
        return (
            signUpFormData &&
            signUpFormData.name !== "" &&
            signUpFormData.emailId !== "" &&
            signUpFormData.password !== ""
        );
    }

    // Clear any existing errors when component mounts
    useEffect(() => {
        dispatch(clearError());
        // Reset form data when component unmounts
        return () => {
            dispatch(resetSignUpFormData());
        };
    }, [dispatch]);

    return (
        <div className="flex flex-col min-h-screen">
            <header className="px-4 lg:px-6 h-14 flex items-center border-b">
                <Link to={"/"} className="flex items-center justify-center">
                    <GraduationCap className="h-8 w-8 mr-4" />
                    <span className="font-extrabold text-xl">PROJECT REGISTER</span>
                </Link>
            </header>
            <div className="flex items-center justify-center min-h-screen bg-background">
                <Card className="p-6 space-y-4 w-full max-w-md">
                    <CardHeader>
                        <CardTitle>Add New User</CardTitle>
                        <CardDescription>
                            Enter user details
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {error && (
                            <div className="text-red-500 text-sm mb-4">
                                {error.message || "Registration failed"}
                            </div>
                        )}
                        <CommonForm
                            formControls={signUpFormControls}
                            buttonText={loading ? "Registering..." : "Sign Up"}
                            formData={signUpFormData}
                            setFormData={handleSignUpFormChange}
                            isButtonDisabled={!checkIfSignUpFormIsValid() || loading}
                            handleSubmit={handleRegisterUser}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default AddUsers;