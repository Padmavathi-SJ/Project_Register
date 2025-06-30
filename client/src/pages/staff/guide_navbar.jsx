import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Home, CheckSquare, FileText, LogOut } from 'lucide-react';
import college_img from "../../assets/college_img.png";
import menu from "../../assets/menu.png";
import wrong from "../../assets/wrong.png";
import instance from '../../utils/axiosInstance';
import { useDispatch } from 'react-redux';
import { removeUser } from '../../store/userSlice';
import { removeTeamMembers } from '../../store/teamSlice';
import { removeTeamStatus } from "../../store/teamStatus";
import { logoutService } from '@/services';

function Guide_navbar({ isOpen, toggleSidebar }) {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const handleLogout = async () => {
    try {
      localStorage.clear();
      await logoutService();
      dispatch(removeUser());
      dispatch(removeTeamMembers());
      dispatch(removeTeamStatus());
      navigate("/auth");
    } catch (error) {
      console.error("Logout failed:", error);
      navigate("/auth");
    }
  };

  const isActive = (path) => {
    const currentPath = location.pathname;

    // For Dashboard, include both /guide and /guide/team-details
    if (path === "") {
      return (
        currentPath === "/guide" ||
        currentPath.startsWith("/guide/team-details")
      );
    }

    return currentPath === `/guide/${path}` || currentPath.startsWith(`/guide/${path}/`);
  };

  const navDiv = (path) =>
    `ml-3 mb-10 flex items-center rounded-lg px-3 py-2 ${isActive(path) ? "bg-purple-400 text-white" : "bg-white"
    } ${isOpen ? "w-52" : "w-12"}`;

  const navIcon = (path) =>
    `${isActive(path) ? "bg-purple-400 text-white" : "bg-transparent bg-white text-gray-600 group-hover:text-purple-600"}`;

  const navText = (path) =>
    `ml-3 text-lg font-medium ${isOpen ? "opacity-100" : "opacity-0 hidden"
    } ${isActive(path) ? "bg-purple-400 text-white" : "text-gray-600 bg-white group-hover:text-purple-600"}`;

  return (
    <div
      className={`fixed top-0 pb-5 left-0 h-screen bg-white flex flex-col py-6 overflow-y-auto shadow-2xl z-50 transition-[width] duration-500 ease-in-out
         ${isOpen ? "w-64" : "w-24"}`}
    >
      <button
        onClick={toggleSidebar}
        className={`relative top-3 w-12 h-10 p-2 bg-white text-black rounded-md transition-all ${isOpen ? "left-48" : "left-5"}`}
      >
        <img
          src={isOpen ? wrong : menu}
          alt="Toggle Sidebar"
          className="w-full h-full object-contain bg-white border-none"
        />
      </button>

      <div className="h-32 bg-white mt-6">
        <img
          src={college_img}
          className={`w-1/2 mx-auto bg-white mb-12 transition-all duration-300 ${isOpen ? "w-1/2" : "w-2/3 mt-7"}`}
          alt="College Logo"
        />
      </div>

      <div className="bg-white px-2">
        <Link to="." className={`${navDiv("")} group`}>
          <Home size={24} className={navIcon("")} />
          <p className={navText("")}>Dashboard</p>
        </Link>

        <Link to="queries" className={`${navDiv("queries")} group`}>
          <CheckSquare size={24} className={navIcon("queries")} />
          <p className={navText("queries")}>Queries</p>
        </Link>

        <Link to="review_progress" className={`${navDiv("review_progress")} group`}>
          <FileText size={24} className={navIcon("review_progress")} />
          <p className={navText("review_progress")}>Review Progress</p>
        </Link>

        <button
          onClick={handleLogout}
          className="ml-3 flex items-center mt-auto mb-5 px-3 py-2 text-gray-600 hover:text-red-500"
        >
          <LogOut size={24} className="mr-5 bg-white rotate-180" />
          <p className={`ml-3 bg-white text-lg transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 hidden"}`}>
            Logout
          </p>
        </button>
      </div>
    </div>
  );
}

export default Guide_navbar;
