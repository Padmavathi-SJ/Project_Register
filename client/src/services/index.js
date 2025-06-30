import axiosInstance from "@/api/axiosInstance";

export async function registerService(formData) {
  try {
    const { data } = await axiosInstance.post("/api/auth/register", {
      ...formData,
      role: "staff",
    }, { withCredentials: true });
    console.log(data.data.user, "registerService services.js");
    return data.data.user;
  } catch (error) {
    console.log("error", error.response ? error.response.data : error.message);
  }
}

export async function loginService(formData) {
  const { data } = await axiosInstance.post("/api/auth/login", formData, { withCredentials: true });
  console.log(data);
  return data;
}
export async function logoutService() {
  const { data } = await axiosInstance.post("/api/auth/logout", { withCredentials: true });
}
export async function checkAuthService() {
  const { data } = await axiosInstance.get("/api/auth/protected", { withCredentials: true });
  console.log(data.data.user, "checkAuthService services.js");
  // return data.data.user;
  return { success: true, data: data.data.user };
}
