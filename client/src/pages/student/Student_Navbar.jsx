import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Home, Users, FileText, BarChart2, LogOut, MessagesSquare } from 'lucide-react';
import college_img from "../../assets/college_img.png";
import menu from "../../assets/menu.png";
import wrong from "../../assets/wrong.png";
import instance from '../../utils/axiosInstance';
import { useDispatch, useSelector } from 'react-redux';
import { removeUser } from '../../store/userSlice';
import { removeTeamMembers } from '../../store/teamSlice';
import { removeTeamStatus } from "../../store/teamStatus";
import { logoutService } from '@/services';

function Student_navbar({ isOpen, toggleSidebar }) {
  const [team, setTeam] = useState([]);
  const [selectorsLoaded, setSelectorsLoaded] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const userSelector = useSelector((state) => state.userSlice.auth.user || null);
  const teamSelector = useSelector((State) => State.teamSlice.data);
  const teamstatusSelector = useSelector((State) => State.teamStatusSlice);
  const a = userSelector?.guide_reg_num || null;
  const b = userSelector?.sub_expert_reg_num || null;
  // console.log(userSelector);
  // Track when selectors are loaded
  useEffect(() => {
    if (teamSelector !== undefined && teamstatusSelector !== undefined) {
      setSelectorsLoaded(true);
    }
  }, [teamSelector, teamstatusSelector]);
  // console.log(selectorsLoaded);
  const handleLogout = async () => {
    try {
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

  const fetchTeam = async () => {
    try {
      if (!Array.isArray(teamSelector) || teamSelector.length === 0 || !teamSelector[0]?.reg_num) {
        console.error("Team selector or reg_num not available.");
        return;
      }

      const reg_num = teamSelector[0].reg_num;
      const response = await instance.get(`/student/getTeamDetails/${reg_num}`);
      if (response.status === 200) {
        setTeam(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching team details:", error);
    }
  };

  useEffect(() => {
    if (Array.isArray(teamSelector) && teamSelector.length > 0) {
      fetchTeam();
    }
  }, [teamSelector]);

  const isActive = (path) => {
    const currentPath = location.pathname;
    if (path === "") return currentPath === "/student" || currentPath === "/student/invitations";
    return currentPath.endsWith(path) || currentPath === `/student/${path}`;
  };
  // console.log(team.length);
  const hasTeam = team.length > 0;
  const isTeamFullyAssigned = hasTeam && a !== null && b !== null;
  // console.log(a, b, isTeamFullyAssigned);
  const disabledClass = "pointer-events-none opacity-60";

  const navDiv = (path) =>
    `ml-3 mb-10 flex items-center rounded-lg px-3 py-2 ${isActive(path) ? "bg-purple-400 text-white" : "bg-white"} ${isOpen ? "w-52" : "w-12"}`;

  const navIcon = (path) =>
    `${isActive(path) ? "bg-purple-400 text-white" : "bg-transparent bg-white text-gray-600 group-hover:text-purple-600"}`;

  const navText = (path) =>
    `ml-3 text-lg font-medium ${isOpen ? "opacity-100" : "opacity-0 hidden"} ${isActive(path) ? "bg-purple-400 text-white" : "text-gray-600 bg-white group-hover:text-purple-600"}`;

  return (
    <div className={`fixed top-0 pb-5 left-0 h-screen bg-white flex flex-col py-6 overflow-y-auto shadow-2xl z-50 transition-[width] duration-500 ease-in-out ${isOpen ? "w-64" : "w-24"}`}>
      {/* Toggle Button */}
      <button
        onClick={toggleSidebar}
        className={`relative top-3 w-12 h-10 p-2 bg-white text-black rounded-md transition-all ${isOpen ? "left-48" : "left-5"}`}
      >
        <img
          src={isOpen ? wrong : menu}
          alt="Toggle Sidebar"
          className="w-full h-full object-contain bg-white border-none text-red-500"
        />
      </button>

      {/* Logo */}
      <div className="h-32 bg-white mt-6">
        <img
          src={college_img}
          className={`w-1/2 mx-auto bg-white mb-12 transition-all duration-300 ${isOpen ? "w-1/2" : "w-2/3 mt-7"}`}
          alt="College Logo"
        />
      </div>

      <div className="bg-white px-2">
        <Link to="" className={`${navDiv("")} group`}>
          <Home size={24} className={navIcon("")} />
          <p className={navText("")}>Dashboard</p>
        </Link>

        {/* Only render Project Details link after selectors are loaded */}
        {selectorsLoaded && (
          <Link
            to="Project_Details"
            className={`${navDiv("Project_Details")} group ${teamstatusSelector?.projectId ? disabledClass : (!hasTeam ? disabledClass : "")}`}
          >
            <FileText size={24} className={navIcon("Project_Details")} />
            <p className={navText("Project_Details")}>Project Details</p>
          </Link>
        )}

        {/* Other navigation items */}
        {selectorsLoaded && (
          <>
            <Link
              to="queries"
              className={`${navDiv("queries")} group ${!isTeamFullyAssigned ? disabledClass : ""}`}
            >
              <MessagesSquare size={24} className={navIcon("queries")} />
              <p className={navText("queries")}>Queries</p>
            </Link>

            <Link
              to="review"
              className={`${navDiv("review")} group ${!isTeamFullyAssigned ? disabledClass : ""}`}
            >
              <Users size={24} className={navIcon("review")} />
              <p className={navText("review")}>Schedule Review</p>
            </Link>

            <Link
              to="Progress_update"
              className={`${navDiv("Progress_update")} group ${!isTeamFullyAssigned ? disabledClass : ""}`}
            >
              <BarChart2 size={24} className={navIcon("Progress_update")} />
              <p className={navText("Progress_update")}>Progress Update</p>
            </Link>
          </>
        )}

        {/* Logout */}
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

export default Student_navbar;