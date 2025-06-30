import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import instance from '../../utils/axiosInstance';
import { Bell, Users, Calendar, CheckCircle, Clock, ChevronRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function Staff_dashboard() {
  const [showNotifications, setShowNotifications] = useState(false);
  const [guideRequests, setGuideRequests] = useState([]);
  const [expertRequests, setExpertRequests] = useState([]);
  const [reasonMap, setReasonMap] = useState({});
  const [GuideTeams, setGuideTeams] = useState([]);
  const [SubTeams, setSubTeams] = useState([]);
  const navigatee = useNavigate();
  const [progressMap, setProgressMap] = useState({});
  const navigate = (teamId) => { navigatee(`${teamId}`); };
  const [upcomingGuideReviews, setUpcomingGuideReviews] = useState([]);
  const [upcomingExpertReviews, setUpcomingExpertReviews] = useState([]);
  const [completedReviewMap, setCompletedReviewMap] = useState({});
  const reg_num = useSelector((state) => state.userSlice.auth?.user.reg_num);
  const name = useSelector((state) => state.userSlice.auth?.user.name);

  // Fetch verified weeks for teams
const fetchVerifiedWeeks = async (teams) => {
  if (!Array.isArray(teams)) return [];
  
  return Promise.all(
    teams.map(async (team) => {
      try {
        const res = await instance.get(`/guide/no_of_weeks_verified/${team.from_team_id}`);
        return {
          ...team,
          verifiedWeeks: res.data?.verified_weeks_count || 0
        };
      } catch {
        return { ...team, verifiedWeeks: 0 };
      }
    })
  );
};

  const fetchCompletedReviews = async (teams) => {
    const reviewMap = [];
    for (const team of teams) {
      try {
        const res = await instance.get(`/sub_expert/fetch_completed_reviews/${team.from_team_id}`);
        if (Array.isArray(res.data)) {
          reviewMap[team.from_team_id] = res.data.length;
        } else {
          reviewMap[team.from_team_id] = 0;
        }
      } catch (err) {
        console.error(`Error fetching completed reviews for ${team.from_team_id}:`, err.response?.data || err.message);
        reviewMap[team.from_team_id] = 0;
      }
    }
    setCompletedReviewMap(reviewMap);
  };

  // Fetch progress data ONLY for guide teams, store results in progressMap
  const fetchProgressForTeams = async (teams) => {
    const map = {};
    for (const team of teams) {
      try {
        const res = await instance.get(`/guide/gets_entire_team/${team.from_team_id}`);
        console.log(res.data, "obkobkobk");
        map[team.from_team_id] = res.data || null;
        console.log(` Progress for team ${team.from_team_id}:`, res.data);
      } catch (err) {
        console.error(` Failed to fetch progress for team ${team.from_team_id}:`, err.response?.data || err.message);
        map[team.from_team_id] = null;
      }
    }
    setProgressMap(map);
  };

  useEffect(() => {
    const fetchExtraReviews = async () => {
      try {
        const expertReviewsRes = await instance.get(`/sub_expert/fetch_review_requests/${reg_num}`);
        // console.log(expertReviewsRes, "[[[[[[[[[[[[[[[[[[[[[[[");
        const expertReviews = expertReviewsRes.data.data || [];
        const upcoming = expertReviews.filter(
          (r) =>
            new Date(r.review_date) > new Date() &&
            r.expert_status === "interested"
        );
        setUpcomingExpertReviews(upcoming);
        console.log("Filtered Expert Reviews:", upcoming);
      } catch (error) {
        console.error("Error fetching expert review requests:", error.response?.data || error.message);
      }

      try {
        const guideReviewsRes = await instance.get(`/guide/fetch_review_requests/${reg_num}`);
        const guideReviews = guideReviewsRes.data.data || [];
        const upcoming = guideReviews.filter(
          (r) =>
            new Date(r.review_date) > new Date() &&
            r.guide_status === "interested"
        );
        setUpcomingGuideReviews(upcoming);
        console.log("Filtered Guide Reviews:", upcoming);
      } catch (error) {
        console.error("Error fetching guide upcoming reviews:", error.response?.data || error.message);
      }
    };

    fetchExtraReviews();
  }, [reg_num]);

  // Fetch all required data: requests, guide teams, subexpert teams
  const fetchRequests = async () => {
    try {
      const results = await Promise.allSettled([
        instance.get(`/guide/getrequests/${reg_num}`),
        instance.get(`/sub_expert/getrequests/${reg_num}`),
        instance.get(`/guide/fetch_guiding_teams/${reg_num}`),
        instance.get(`/sub_expert/fetch_teams/${reg_num}`),
      ]);
      const [guideRes, expertRes, guideTeamsRes, subTeamsRes] = results;
      if (guideRes.status === "fulfilled") {
        //setGuideRequests(guideRes.value.data.data);
        setGuideRequests(guideRes.value?.data?.data || []);
      }
      if (expertRes.status === "fulfilled") {
       // setExpertRequests(expertRes.value.data.data);
        setExpertRequests(expertRes.value?.data?.data || []);
      }
      if (guideTeamsRes.status === "fulfilled") {
        const rawGuideTeams = guideTeamsRes.value.data.data;

        // Check if the response is an array
        const validGuideTeams = Array.isArray(rawGuideTeams) ? rawGuideTeams : [];

        const updatedGuideTeams = await fetchVerifiedWeeks(validGuideTeams);
        console.log(updatedGuideTeams, "updatedGuideTeamsupdatedGuideTeamsupdatedGuideTeams");
        setGuideTeams(updatedGuideTeams);

        // Fetch progress ONLY for guide teams
        fetchProgressForTeams(updatedGuideTeams);
      }

      if (subTeamsRes.status === "fulfilled") {
        const rawSubTeams = subTeamsRes.value?.data?.data || [];
        const validSubTeams = Array.isArray(rawSubTeams) ? rawSubTeams : [];
        setSubTeams(validSubTeams);

        fetchCompletedReviews(validSubTeams);
      }

    }catch (error) {
    console.error("Error fetching requests:", error);
    // Set empty arrays to prevent undefined errors
    setGuideRequests([]);
    setExpertRequests([]);
    setGuideTeams([]);
    setSubTeams([]);
  }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAction = async (type, status, team_id, semester) => {
    const reason = reasonMap[`${type}_${team_id}`];
    if (status === "reject" && !reason) {
      alert("Please provide a reason for rejection.");
      return;
    }

    const endpoint =
      type === "guide"
        ? `/guide/accept_reject/${status}/${team_id}/${semester}/${reg_num}`
        : `/sub_expert/accept_reject/${status}/${team_id}/${semester}/${reg_num}`;

    try {
      console.log(endpoint);
      const res = await instance.patch(endpoint, { reason: reason || "accept" });
      console.log(res);
      // alert(res.data.data);
      fetchRequests();
      setReasonMap((prev) => {
        const newMap = { ...prev };
        delete newMap[`${type}_${team_id}`];
        return newMap;
      });
    } catch (error) {
      console.log(error.response?.data);
      alert(error.response?.data || `Error handling ${type} request`);
    }
  };

  const getProgressColor = (verifiedWeeks) => {
    const percentage = (verifiedWeeks / 12) * 100;
    if (percentage >= 80) return "bg-green-500";
    if (percentage >= 60) return "bg-yellow-500";
    if (percentage >= 40) return "bg-orange-500";
    return "bg-red-500";
  };

  // console.log(GuideTeams);


  const renderRequestCard = (req, type) => (
    <div key={`${type}_${req.from_team_id}`} className="bg-gradient-to-r bg-white border-blue-200 rounded-xl p-4 mb-3 hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1 bg-white">
          <div className="flex items-center bg-white gap-2 mb-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${type === 'guide' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
              }`}>
              {type.charAt(0).toUpperCase() + type.slice(1)} Request
            </span>
          </div>
          <p className="font-semibold bg-white text-gray-900 mb-1">
            Team <span className=" bg-white text-blue-600">{req.from_team_id}</span>
          </p>
          <p className="text-gray-700 text-sm mb-3 bg-white">{req.project_name || req.project_id}</p>

          <input
            type="text"
            placeholder="Reason (required if rejecting)"
            value={reasonMap[`${type}_${req.from_team_id}`] || ""}
            onChange={(e) =>
              setReasonMap({
                ...reasonMap,
                [`${type}_${req.from_team_id}`]: e.target.value,
              })
            }
            className="w-full border bg-white border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent mb-3"
          />

          <div className="flex bg-white gap-2">
            <button
              onClick={() => handleAction(type, "accept", req.from_team_id, req.team_semester)}
              className="bg-green-600 group hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-1"
            >
              <CheckCircle className="w-4 group-hover:bg-green-700 bg-green-600 h-4 transition-colors duration-200 " />
              Accept
            </button>
            <button
              onClick={() => handleAction(type, "reject", req.from_team_id, req.team_semester)}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
            >
              Reject
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const totalNotifications = guideRequests.length + expertRequests.length + upcomingGuideReviews.length + upcomingExpertReviews.length;

  return (
    <div className="min-h-screen bg-gradient-to-br">
      {/* Header */}
      <header className=" sticky top-0 z-10  ">
        <div className="max-w-7xl mx-auto px-6 py-4 mb-9 relative">
          {/* Centered Welcome Text */}
          <h1 className="absolute left-1/2 transform -translate-x-1/2 text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-900 bg-clip-text text-transparent">
            Welcome back, {name}!
          </h1>

          {/* Notification Bell on Right */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2">
            <button
              className="relative p-3 hover:bg-white rounded-full transition-colors duration-200 group"
              onClick={() => setShowNotifications(!showNotifications)}
              aria-label="Toggle notifications"
            >
              <Bell className="w-6 h-6 text-gray-700   group-hover:text-blue-600 group-hover:bg-white transition-colors" />
              {totalNotifications > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-6 h-6 flex items-center justify-center rounded-full font-semibold animate-pulse">
                  {totalNotifications}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>


      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Guide Teams - Semester 5 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center bg-white justify-between">
              <div className='bg-white'>
                <p className="text-gray-600 text-sm bg-white font-medium">Guide Teams (S5)</p>
                <p className="text-3xl font-bold bg-white text-gray-900 mt-1">
                  {GuideTeams.filter((team) => team.team_semester === 5).length}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Users className="w-6 h-6 bg-blue-100 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Guide Teams - Semester 7 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center bg-white justify-between">
              <div className='bg-white'>
                <p className="text-gray-600 text-sm bg-white font-medium">Guide Teams (S7)</p>
                <p className="text-3xl font-bold bg-white text-gray-900 mt-1">
                  {GuideTeams.filter((team) => team.team_semester === 7).length}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Users className="w-6 h-6 bg-blue-100 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Expert Teams - Semester 5 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center bg-white justify-between">
              <div className='bg-white'>
                <p className="text-gray-600 bg-white text-sm font-medium">Expert Teams (S5)</p>
                <p className="text-3xl font-bold bg-white text-gray-900 mt-1">
                  {SubTeams.filter((team) => team.team_semester === 5).length}
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <Users className="w-6 h-6 bg-purple-100 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Expert Teams - Semester 7 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex bg-white items-center justify-between">
              <div className='bg-white'>
                <p className="text-gray-600 bg-white text-sm font-medium">Expert Teams (S7)</p>
                <p className="text-3xl bg-white font-bold text-gray-900 mt-1">
                  {SubTeams.filter((team) => team.team_semester === 7).length}
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <Users className="w-6 h-6 bg-purple-100 text-purple-600" />
              </div>
            </div>
          </div>
        </div>


        {/* Notifications Panel */}
        {showNotifications && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-start justify-end pt-20 pr-6">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-md max-h-[80vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="p-2  rounded-full transition-colors duration-200"
                >
                  <X className="w-8 pl-2 pr-2 h-8 rounded-full hover:bg-white text-gray-500" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-96">
                {totalNotifications === 0 ? (
                  <div className="text-center py-8">
                    <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No pending notifications</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {guideRequests.map((req) => renderRequestCard(req, "guide"))}
                    {expertRequests.map((req) => renderRequestCard(req, "expert"))}

                    {upcomingGuideReviews.map((review) => (
                      <div
                        key={`guide_review_${review.request_id}`}
                        onClick={() => navigate("/guide/review_progress")}
                        className="bg-gradient-to-r bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg cursor-pointer hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex bg-blue-50  items-center gap-2 mb-2">
                          <Calendar className="w-4 h-4 bg-blue-50 text-blue-600" />
                          <span className="text-blue-800 font-semibold bg-blue-50  text-sm">Upcoming Guide Review</span>
                        </div>
                        <p className="text-gray-700 bg-blue-50 font-medium">{review.project_name}</p>
                        <p className="text-gray-600 bg-blue-50 text-sm">Team: {review.team_id}</p>
                        <p className="text-gray-500 bg-blue-50 text-xs mt-1">
                          {new Date(review.review_date).toLocaleDateString()}
                        </p>
                        <p className='text-sm text-red-600'>Click here to accept or reject</p>
                      </div>
                    ))}

                    {upcomingExpertReviews.map((review) => (
                      <div
                        key={`expert_review_${review.request_id}`}
                        onClick={() => navigate("/guide/review_progress")}
                        className="bg-gradient-to-r bg-purple50 border-l-4 border-purple-500 p-4 rounded-lg cursor-pointer hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex items-center bg-purple-50 gap-2 mb-2">
                          <Calendar className="w-4 h-4 bg-purple-50 text-purple-600" />
                          <span className="text-purple-800  bg-purple-50 font-semibold text-sm">Upcoming Expert Review</span>
                        </div>
                        <p className="text-gray-700 bg-purple-50  font-medium">{review.project_name}</p>
                        <p className="text-gray-600 bg-purple-50  text-sm">Team: {review.team_id}</p>
                        <p className="text-gray-500 bg-purple-50  text-xs mt-1">
                          {new Date(review.review_date).toLocaleDateString()}
                        </p>
                        <p className='text-sm bg-white text-red-600'>Click here to accept or reject</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Teams Section */}
        <div className="space-y-8">
          {/* Guide Teams */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-5 border-b bg-white border-gray-200">
              <div className="flex bg-white items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-full">
                  <Users className="w-5 h-5 bg-blue-100 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold bg-white text-gray-900">Guide Teams</h2>

              </div>
            </div>

            {GuideTeams.length > 0 ? (
              <div className="overflow-x-auto bg-white">
                <table className="w-full bg-white">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="bg-white px-6 py-4 text-left text-sm font-semibold text-gray-900">Team</th>
                      <th className="bg-white px-6 py-4 text-left text-sm font-semibold text-gray-900">Project</th>
                      <th className="bg-white px-6 py-4 text-left text-sm font-semibold text-gray-900">Semester</th>
                      <th className="bg-white px-6 py-4 text-left text-sm font-semibold text-gray-900">Progress</th>
                      <th className="bg-white px-6 py-4 text-left text-sm font-semibold text-gray-900"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {GuideTeams.map((team, index) => {
                      const teamMembers = progressMap[team.from_team_id];
                      const nextWeek = `week${team.verifiedWeeks + 1}_progress`;
                      const allUpdated = Array.isArray(teamMembers) && teamMembers.length > 0 &&
                        teamMembers.every(member => member[nextWeek] && member[nextWeek].trim() !== '');

                      return (
                        <tr
                          key={team.from_team_id}
                          className="hover:bg-gray-50 cursor-pointer transition-colors duration-200"
                          onClick={() => navigate(`team-details/${team.from_team_id}`)}
                        >
                          <td className="px-6 py-4 bg-white ">
                            <div className="flex bg-white items-center gap-3">
                              <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                                {team.from_team_id}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 bg-white ">
                            <div className="font-medium bg-white  text-gray-900">{team.project_name}</div>
                          </td>
                          <td className="px-6 py-4 bg-white ">
                            <span className=" bg-white text-gray-600">{team.team_semester}</span>
                          </td>
                          <td className="px-6 py-4 bg-white ">
                            <div className="flex bg-white  items-center gap-3">
                              <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-20">
                                <div
                                  className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(team.verifiedWeeks)}`}
                                  style={{ width: `${(team.verifiedWeeks / 12) * 100}%` }}
                                ></div>
                              </div>
                              <span className="text-sm  bg-white font-medium text-gray-900">
                                {team.verifiedWeeks}/12
                              </span>
                              {allUpdated && (
                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                                  Weekly Log Verified
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 bg-white  py-4">
                            <ChevronRight className="w-5 h-5 bg-white  text-gray-400" />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-6 bg-white py-12 text-center">
                <Users className="w-12 h-12 bg-white text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 bg-white">No guide teams found</p>
              </div>
            )}
          </section>

          {/* Subexpert Teams */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-5 border-b bg-white border-gray-200">
              <div className="flex items-center bg-white gap-3">
                <div className="bg-purple-100 p-2 rounded-full">
                  <Users className="w-5 h-5 bg-purple-100 text-purple-600" />
                </div>
                <h2 className="text-xl font-bold bg-white  text-gray-900">Subexpert Teams</h2>
              </div>
            </div>

            {SubTeams.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 bg-white py-4 text-left text-sm font-semibold text-gray-900">Team</th>
                      <th className="px-6 bg-white py-4 text-left text-sm font-semibold text-gray-900">Project</th>
                      <th className="px-6 bg-white py-4 text-left text-sm font-semibold text-gray-900">Semester</th>
                      <th className="px-6 bg-white py-4 text-left text-sm font-semibold text-gray-900">Reviews</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {SubTeams.map((team) => (
                      <tr key={team.from_team_id} className="hover:bg-gray-50 transition-colors duration-200">
                        <td className="px-6 bg-white  py-4">
                          <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium inline-block">
                            {team.from_team_id}
                          </div>
                        </td>
                        <td className="px-6 py-4 bg-white ">
                          <div className="font-medium bg-white  text-gray-900">{team.project_name}</div>
                        </td>
                        <td className="px-6 py-4 bg-white ">
                          <span className=" bg-white text-gray-600">{team.team_semester}</span>
                        </td>
                        <td className="px-6 py-4 bg-white ">
                          <div className="flex items-center bg-white  gap-2">
                            <span className="text-sm font-medium bg-white  text-gray-900">
                              {completedReviewMap[team.from_team_id] || 0}/2
                            </span>
                            <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-16">
                              <div
                                className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${((completedReviewMap[team.from_team_id] || 0) / 2) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-6 py-12 bg-white text-center">
                <Users className="w-12 h-12 text-gray-300 bg-white mx-auto mb-4" />
                <p className="text-gray-500 bg-white">No subexpert teams found</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export default Staff_dashboard;