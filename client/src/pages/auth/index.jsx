// import CommonForm from "@/components/common-form";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { signInFormControls, signUpFormControls } from "@/config";
// import { GraduationCap } from "lucide-react";
// import { useEffect, useState } from "react";
// import { Link, useLocation, useNavigate } from "react-router-dom";
// import { useDispatch, useSelector } from "react-redux";
// import {
//   updateSignInFormData,
//   updateSignUpFormData,
//   loginUser,
//   registerUser,
//   clearError,
//   resetSignInFormData,
//   resetSignUpFormData
// } from "@/store/userSlice";

// function AuthPage() {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const [activeTab, setActiveTab] = useState("signin");
//   const dispatch = useDispatch();
//   const {
//     signInFormData,
//     signUpFormData,
//     loading,
//     error
//   } = useSelector((state) => state.userSlice);

//   function handleTabChange(value) {
//     setActiveTab(value);
//     // Clear errors when switching tabs
//     dispatch(clearError());
//   }

//   // Update form data in Redux store
//   const handleSignInFormChange = (updatedData) => {
//     dispatch(updateSignInFormData(updatedData));
//   };

//   const handleSignUpFormChange = (updatedData) => {
//     dispatch(updateSignUpFormData(updatedData));
//   };

//   const handleLoginUser = async (event) => {
//     event.preventDefault();
//     try {
//       const result = await dispatch(loginUser(signInFormData));
//       if (result.success) {
//         // Redirect to the previous location or default route
//         const from = location.state?.from?.pathname || getDefaultRoute(result.data.user.role);
//         navigate(from, { replace: true });
//       }
//     } catch (error) {
//       console.error("Login failed:", error);
//     }
//   };

//   const handleRegisterUser = async (event) => {
//     event.preventDefault();
//     try {
//       const result = await dispatch(registerUser(signUpFormData));
//       if (result.success) {
//         // Redirect to the previous location or default route
//         const from = location.state?.from?.pathname || getDefaultRoute(result.data.user.role);
//         navigate(from, { replace: true });
//       }
//     } catch (error) {
//       console.error("Registration failed:", error);
//     }
//   };

//   function checkIfSignInFormIsValid() {
//     return (
//       signInFormData &&
//       signInFormData.emailId !== "" &&
//       signInFormData.password !== ""
//     );
//   }

//   function checkIfSignUpFormIsValid() {
//     return (
//       signUpFormData &&
//       signUpFormData.name !== "" &&
//       signUpFormData.emailId !== "" &&
//       signUpFormData.password !== ""
//     );
//   }

//   // Clear any existing errors when component mounts
//   useEffect(() => {
//     dispatch(clearError());
//     // Reset form data when component unmounts
//     return () => {
//       dispatch(resetSignInFormData());
//       dispatch(resetSignUpFormData());
//     };
//   }, [dispatch]);

//   return (
//     <div className="flex flex-col min-h-screen">
//       <header className="px-4 lg:px-6 h-14 flex items-center border-b">
//         <Link to={"/"} className="flex items-center justify-center">
//           <GraduationCap className="h-8 w-8 mr-4" />
//           <span className="font-extrabold text-xl">PROJECT REGISTER</span>
//         </Link>
//       </header>
//       <div className="flex items-center justify-center min-h-screen bg-background">
//         <Tabs
//           value={activeTab}
//           defaultValue="signin"
//           onValueChange={handleTabChange}
//           className="w-full max-w-md"
//         >
//           <TabsList className="grid w-full grid-cols-2">
//             <TabsTrigger value="signin">Sign In</TabsTrigger>
//             <TabsTrigger value="signup">Sign Up</TabsTrigger>
//           </TabsList>
//           <TabsContent value="signin">
//             <Card className="p-6 space-y-4">
//               <CardHeader>
//                 <CardTitle>Sign in to your account</CardTitle>
//                 <CardDescription>
//                   Enter your email and password to access your account
//                 </CardDescription>
//               </CardHeader>
//               <CardContent className="space-y-2">
//                 {error && (
//                   <div className="text-red-500 text-sm mb-4">
//                     {error.message || "Login failed"}
//                   </div>
//                 )}
//                 <CommonForm
//                   formControls={signInFormControls}
//                   buttonText={loading ? "Signing In..." : "Sign In"}
//                   formData={signInFormData}
//                   setFormData={handleSignInFormChange}
//                   isButtonDisabled={!checkIfSignInFormIsValid() || loading}
//                   handleSubmit={handleLoginUser}
//                 />
//               </CardContent>
//             </Card>
//           </TabsContent>
//           <TabsContent value="signup">
//             <Card className="p-6 space-y-4">
//               <CardHeader>
//                 <CardTitle>Create a new account</CardTitle>
//                 <CardDescription>
//                   Enter your details to get started
//                 </CardDescription>
//               </CardHeader>
//               <CardContent className="space-y-2">
//                 {error && (
//                   <div className="text-red-500 text-sm mb-4">
//                     {error.message || "Registration failed"}
//                   </div>
//                 )}
//                 <CommonForm
//                   formControls={signUpFormControls}
//                   buttonText={loading ? "Registering..." : "Sign Up"}
//                   formData={signUpFormData}
//                   setFormData={handleSignUpFormChange}
//                   isButtonDisabled={!checkIfSignUpFormIsValid() || loading}
//                   handleSubmit={handleRegisterUser}
//                 />
//               </CardContent>
//             </Card>
//           </TabsContent>
//         </Tabs>
//       </div>
//     </div>
//   );
// }

// export default AuthPage;




/////////////////////////////



import CommonForm from "@/components/common-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { signInFormControls } from "@/config";
import { GraduationCap } from "lucide-react";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  updateSignInFormData, loginUser,
  clearError
} from "@/store/userSlice";

function AuthPage() {
  const dispatch = useDispatch();
  const { signInFormData, loading, error } = useSelector((state) => state.userSlice);

  // Update form data in Redux store
  const handleFormChange = (updatedData) => {
    dispatch(updateSignInFormData(updatedData));
  };

  // Handle login submission
  const handleLoginUser = (event) => {
    event.preventDefault();
    dispatch(loginUser(signInFormData));
  };

  function checkIfSignInFormIsValid() {
    return (
      signInFormData &&
      signInFormData.emailId !== "" &&
      signInFormData.password !== ""
    );
  }

  const handleGoogleLogin = () => {
    console.log("Google login clicked");
    window.location.href = 'http://localhost:5000/api/auth/google';
  };

  // Clear any existing errors when component mounts
  useEffect(() => {
    dispatch(clearError());
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
            <CardTitle>Sign in to your account</CardTitle>
            <CardDescription>
              Enter your email and password to access your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="text-red-500 text-sm mb-4">
                {error.message || "Login failed"}
              </div>
            )}

            <CommonForm
              formControls={signInFormControls}
              buttonText={loading ? "Signing In..." : "Sign In"}
              formData={signInFormData}
              setFormData={handleFormChange}
              isButtonDisabled={!checkIfSignInFormIsValid() || loading}
              handleSubmit={handleLoginUser}
            />

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
              type="button"
            >
              <svg
                className="w-4 h-4 mr-2"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 488 512"
              >
                <path
                  fill="currentColor"
                  d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
                />
              </svg>
              Continue with Google
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default AuthPage;