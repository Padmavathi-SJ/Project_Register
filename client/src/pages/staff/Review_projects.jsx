import React, { useEffect, useState } from 'react';
import instance from '../../utils/axiosInstance';
import { useSelector } from 'react-redux';

function ReviewProjects() {
  const guideRegNum = useSelector((state) => state.userSlice.auth?.user.reg_num);

  const [guideReviewRequests, setGuideReviewRequests] = useState([]);
  const [expertReviewRequests, setExpertReviewRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [guideTeams, setGuideTeams] = useState([]);
  const [expertTeams, setExpertTeams] = useState([]);
  const [acceptingRequestId, setAcceptingRequestId] = useState(null);
  const [meetingLink, setMeetingLink] = useState('');
  const [rejectingRequestId, setRejectingRequestId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  // Separate upcoming reviews for guide and expert roles
  const [guideUpcomingReviews, setGuideUpcomingReviews] = useState({});
  const [expertUpcomingReviews, setExpertUpcomingReviews] = useState({});
  console.log(guideUpcomingReviews);

  // States for meeting end time functionality
  const [clickedMeetings, setClickedMeetings] = useState(new Set());
  const [endTimes, setEndTimes] = useState({});
  const [submittingEndTime, setSubmittingEndTime] = useState(null);
  const [markedEndTimes, setMarkedEndTimes] = useState({});

  // New states for marks functionality
  const [showMarksModal, setShowMarksModal] = useState(false);
  const [currentReviewForMarks, setCurrentReviewForMarks] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [teamMarks, setTeamMarks] = useState({
    literature_survey: "",
    aim: "",
    scope: "",
    need_for_study: "",
    proposed_methodology: "",
    work_plan: "",
    remarks: ""
  });
  const [individualMarks, setIndividualMarks] = useState({});

  const [submittingMarks, setSubmittingMarks] = useState(false);
  const [marksAlreadyEntered, setMarksAlreadyEntered] = useState({});

  const fetchReviewRequests = async () => {
    try {
      setLoading(true);
      setError(null);

      const [guideRes, expertRes] = await Promise.all([
        instance.get(`/guide/fetch_review_requests/${guideRegNum}`),
        instance.get(`/sub_expert/fetch_review_requests/${guideRegNum}`)
      ]);
      // console.log(guideRes, "GuideRes", expertRes, "expertRes");
      setGuideReviewRequests(guideRes.data.data);
      setExpertReviewRequests(expertRes.data.data);
    } catch (err) {
      setError('Failed to fetch review requests');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Check if marks are already entered for a review
  const checkMarksStatus = async (reviewId) => {
    try {
      const response = await instance.get(`/marks/check_status/${reviewId}`);
      if (response.data.marks_entered) {
        setMarksAlreadyEntered(prev => ({
          ...prev,
          [reviewId]: true
        }));
      }
    } catch (error) {
      console.log(`Error checking marks status for review ${reviewId}:`, error);
    }
  };

  // Fetch team members for marks entry
  const fetchTeamMembers = async (teamId) => {
    try {
      const response = await instance.get(`/admin/get_team_members/${teamId}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching team members:', error);
      return [];
    }
  };


  // Fetch upcoming reviews for guide teams
  const fetchGuideUpcomingReviews = async (teams) => {
    const reviewMap = {};
    for (const team of teams) {
      try {
        // console.log(team, "team", "fetchGuideUpcomingReviews");
        const teamId = team.team_id || team.from_team_id;
        const res = await instance.get(`/guide/fetch_upcoming_reviews/${guideRegNum}`);
        console.log(res.data.data, "/guide/fetch_upcoming_reviews/");
        reviewMap[teamId] = res.data.data;

        // Check end time status and marks status for each review
        for (const review of res.data) {
          checkEndTimeStatus(review.review_id || review.id);
          checkMarksStatus(review.review_id || review.id);
        }
      } catch (error) {
        console.log(`No upcoming guide reviews for team ${guideRegNum}`, error);
      }
    }
    setGuideUpcomingReviews(reviewMap);
  };

  // Fetch upcoming reviews for expert teams
  const fetchExpertUpcomingReviews = async (teams) => {
    const reviewMap = {};
    // console.log(teams, "here");
    for (const team of teams) {
      try {
        // console.log(team, "team1");
        const teamId = team.team_id || team.from_team_id;
        const res = await instance.get(`/sub_expert/fetch_upcoming_reviews/${guideRegNum}`);
        console.log(res.data);
        reviewMap[teamId] = res.data;

        // Check end time status and marks status for each review
        for (const review of res.data) {
          checkEndTimeStatus(review.review_id || review.id);
          checkMarksStatus(review.review_id || review.id);
        }
      } catch (error) {
        console.log(`No upcoming expert reviews for team ${team.team_id || team.from_team_id}`, error.response.data.error.message);
      }
    }
    setExpertUpcomingReviews(reviewMap);
  };

  // Fetch guide teams using the corrected API
  useEffect(() => {
    const fetchGuideRequests = async () => {
      try {
        console.log("fetchGuideRequests");
        const res = await instance.get(`/guide/fetch_guiding_teams/${guideRegNum}`);
        console.log(res);
        let teamsList = Array.isArray(res.data.data) && res.data.data.length > 0 ? res.data.data : [];
        console.log(teamsList);
        setExpertTeams(teamsList);
        // console.log(teamsList, "data");
        fetchGuideUpcomingReviews(teamsList);
      } catch (error) {
        console.log(error);
      }
    };

    if (guideRegNum) {
      fetchGuideRequests();
    }
  }, [guideRegNum]);

  // Fetch expert teams
  useEffect(() => {
    const fetchExpertRequests = async () => {
      try {
        const res = await instance.get(`/sub_expert/fetch_teams/${guideRegNum}`);
        let teamsList = Array.isArray(res.data) && res.data.length > 0 ? res.data : [];

        setExpertTeams(teamsList);
        // console.log(teamsList, "data");
        fetchExpertUpcomingReviews(teamsList);
      } catch (error) {
        console.log(error, "adadadadadadadadad");
      }
    };

    if (guideRegNum) {
      fetchExpertRequests();
    }
  }, [guideRegNum]);

  useEffect(() => {
    if (guideRegNum) fetchReviewRequests();
  }, [guideRegNum]);

  const handleReviewAction = async (request, status, isGuide) => {
    try {
      setLoading(true);
      setError(null);

      const {
        request_id,
        project_id,
        project_name,
        team_lead,
        review_date,
        start_time,
        review_title,
        team_id,
      } = request;

      const url = isGuide
        ? `/guide/add_review_details/${request_id}/${status}/${guideRegNum}/${team_id}`
        : `/sub_expert/add_review_details/${request_id}/${status}/${guideRegNum}/${team_id}`;

      const body = {
        project_id,
        project_name,
        team_lead,
        review_date: new Date(review_date).toISOString().slice(0, 10),
        start_time,
        review_title,
        reason: status === 'reject' ? rejectReason : '',
        ...(status === 'accept' && !isGuide ? { temp_meeting_link: meetingLink } : {}),
      };

      const res = await instance.post(url, body);
      alert(res.data);
      setRejectingRequestId(null);
      setAcceptingRequestId(null);
      setRejectReason('');
      setMeetingLink('');
      await fetchReviewRequests();
    } catch (err) {
      setError(`Failed to ${status} the request`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle meeting link click
  const handleMeetingLinkClick = (reviewKey) => {
    setClickedMeetings(prev => new Set([...prev, reviewKey]));
  };

  // Check if end time is already marked for a review
  const checkEndTimeStatus = async (reviewId) => {
    try {
      const response = await instance.get(`/expert/reivew/check_attendance/marked/${reviewId}`);
      if (response.data !== 'end time not marked yet!') {
        setMarkedEndTimes(prev => ({
          ...prev,
          [reviewId]: response.data
        }));
      }
    } catch (error) {
      console.log(`Error checking end time status for review ${reviewId}:`, error);
    }
  };

  // Handle end time submission - Same API for both guide and expert
  const handleEndTimeSubmit = async (review) => {
    const reviewKey = review.key;
    const endTime = endTimes[reviewKey];

    if (!endTime || !endTime.match(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/)) {
      alert('Please enter a valid end time in HH:MM:SS format');
      return;
    }

    try {
      setSubmittingEndTime(reviewKey);

      // Using same API endpoint for both guide and expert roles
      const response = await instance.patch(`/sub_expert/mark_end_time/${review.review_id || review.id}`, {
        project_id: review.project_id,
        "end_time": endTime,
        reviewer_reg_num: guideRegNum
      });

      alert('Mark end time updated!');

      // Update the markedEndTimes state to reflect the newly marked time
      setMarkedEndTimes(prev => ({
        ...prev,
        [review.review_id || review.id]: endTime
      }));

      // Clear the end time input and remove from clicked meetings
      setEndTimes(prev => {
        const newEndTimes = { ...prev };
        delete newEndTimes[reviewKey];
        return newEndTimes;
      });

      setClickedMeetings(prev => {
        const newSet = new Set(prev);
        newSet.delete(reviewKey);
        return newSet;
      });

    } catch (error) {
      alert('Failed to mark end time. Please try again.');
      console.error('Error marking end time:', error);
    } finally {
      setSubmittingEndTime(null);
    }
  };

  // Handle opening marks modal
  const handleOpenMarksModal = async (review) => {
    setCurrentReviewForMarks(review);
    setShowMarksModal(true);

    // Fetch team members
    const members = await fetchTeamMembers(review.team_id);
    setTeamMembers(members);

    // Initialize individual marks
    const initialMarks = {};
    members.forEach(member => {
      initialMarks[member.reg_num || member.id] = '';
    });
    setIndividualMarks(initialMarks);
    setTeamMarks('');
  };

  // Handle marks submission
  const handleMarksSubmit = async () => {
    const requiredFields = [
      "literature_survey",
      "aim",
      "scope",
      "need_for_study",
      "proposed_methodology",
      "work_plan"
    ];

    // Validate team-level marks
    for (const field of requiredFields) {
      if (!teamMarks[field] || teamMarks[field].toString().trim() === "") {
        alert(`Please enter marks for ${field.replace(/_/g, ' ')}`);
        return;
      }
    }

    // Validate individual marks
    for (const member of teamMembers) {
      const memberId = member.reg_num || member.id;
      const marks = individualMarks[memberId];
      if (
        !marks ||
        marks.oral_presentation === "" ||
        marks.viva_voce_and_ppt === "" ||
        marks.contributions === ""
      ) {
        alert(`Please fill in all marks for ${member.name || member.student_name}`);
        return;
      }
    }

    try {
      setSubmittingMarks(true);

      const { review_title, review_date, team_id } = currentReviewForMarks;

      //  Get role of the logged-in guide
      const roleRes = await instance.get(`/user/getRole_guide_or_expert/${guideRegNum}/${team_id}`);
      console.log(roleRes, "3611111111");
      const role = roleRes.data.data.role; // 'guide' or 'sub_expert'

      const rolePrefix = role === 'guide' ? 'guide_' : 'expert_';
      const totalKey = role === 'guide' ? 'total_guide_marks' : 'total_expert_marks';

      // Prepare team payload
      const teamPayload = {
        review_title,
        review_date,
        team_id,
        [`${rolePrefix}remarks`]: teamMarks.remarks || ""
      };
      console.log(teamPayload, "teamPayload");
      requiredFields.forEach(field => {
        teamPayload[`${rolePrefix}${field}`] = Number(teamMarks[field]);
      });

      const teamApiUrl = `/${role}/review/add_team_marks/${guideRegNum}`;
      const teamApiCall = instance.post(teamApiUrl, teamPayload);

      // Prepare individual requests
      const individualRequests = Object.entries(individualMarks).map(([reg_num, markSet]) => {
        const oral = Number(markSet.oral_presentation || 0);
        const ppt = Number(markSet.viva_voce_and_ppt || 0);
        const contrib = Number(markSet.contributions || 0);
        const total = oral + ppt + contrib;

        const individualPayload = {
          team_id,
          review_title,
          review_date,
          [`${rolePrefix}oral_presentation`]: oral,
          [`${rolePrefix}viva_voce_and_ppt`]: ppt,
          [`${rolePrefix}contributions`]: contrib,
          [totalKey]: total,
          [`${rolePrefix}remarks`]: markSet.remarks || "",
        };

        const url = `/${role}/review/add_marks_to_individual/${guideRegNum}/${reg_num}`;
        return instance.post(url, individualPayload);
      });

      // Send all requests
      await Promise.all([teamApiCall, ...individualRequests]);

      //  Cleanup
      alert("Marks submitted successfully!");
      setMarksAlreadyEntered(prev => ({
        ...prev,
        [currentReviewForMarks.review_id || currentReviewForMarks.id]: true
      }));
      setShowMarksModal(false);
      setCurrentReviewForMarks(null);
      setTeamMembers([]);
      setTeamMarks({
        literature_survey: "",
        aim: "",
        scope: "",
        need_for_study: "",
        proposed_methodology: "",
        work_plan: "",
        remarks: ""
      });
      setIndividualMarks({});

    } catch (error) {
      alert("Failed to submit marks. Please try again.");
      console.error("Error submitting marks:", error);
    } finally {
      setSubmittingMarks(false);
    }
  };


  const renderReviewRequests = (requests, title, isGuide) => (
    <div className="mb-10">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>

      {requests.length === 0 && <p>No requests found.</p>}

      {requests.map((req) => {
        const isRejecting = rejectingRequestId === req.request_id;
        const isAccepting = acceptingRequestId === req.request_id;

        return (
          <div key={req.request_id} className="border bg-white rounded p-4 mb-4 shadow-sm">
            <p><strong>Project:</strong> {req.project_name}</p>
            <p><strong>Team Lead:</strong> {req.team_lead}</p>
            <p><strong>Review Date:</strong> {req.review_date}</p>
            <p><strong>Start Time:</strong> {req.start_time}</p>
            <p><strong>Review Title:</strong> {req.review_title}</p>

            {/* Reject Flow */}
            {isRejecting && (
              <div className="mt-4">
                <textarea
                  placeholder="Enter rejection reason"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="border p-2 w-full mb-2"
                  rows={3}
                />
                <button
                  onClick={() => handleReviewAction(req, 'reject', isGuide)}
                  disabled={!rejectReason.trim() || loading}
                  className="bg-red-600 text-white px-4 py-2 rounded mr-2"
                >
                  Submit Reject
                </button>
                <button
                  onClick={() => {
                    setRejectingRequestId(null);
                    setRejectReason('');
                  }}
                  className="bg-gray-400 text-white px-4 py-2 rounded"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Accept Flow for Expert */}
            {isAccepting && !isGuide && (
              <div className="mt-4">
                <input
                  type="text"
                  placeholder="Enter meeting link"
                  value={meetingLink}
                  onChange={(e) => setMeetingLink(e.target.value)}
                  className="border p-2 w-full mb-2"
                />
                <button
                  onClick={() => handleReviewAction(req, 'accept', isGuide)}
                  disabled={!meetingLink.trim() || loading}
                  className="bg-green-600 text-white px-4 py-2 rounded mr-2"
                >
                  Submit Accept
                </button>
                <button
                  onClick={() => {
                    setAcceptingRequestId(null);
                    setMeetingLink('');
                  }}
                  className="bg-gray-400 text-white px-4 py-2 rounded"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Action Buttons */}
            {!isRejecting && !isAccepting && (
              <div className="mt-4">
                <button
                  onClick={() => {
                    if (isGuide) {
                      handleReviewAction(req, 'accept', true);
                    } else {
                      setAcceptingRequestId(req.request_id);
                    }
                  }}
                  disabled={loading}
                  className="bg-green-600 text-white px-4 py-2 rounded mr-2"
                >
                  Accept
                </button>
                <button
                  onClick={() => {
                    setRejectingRequestId(req.request_id);
                    setRejectReason('');
                  }}
                  disabled={loading}
                  className="bg-red-600 text-white px-4 py-2 rounded"
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  // Helper function to get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    return new Date().toISOString().slice(0, 10);
  };

  // Helper function to check if review time has arrived
  const isReviewTimeReached = (reviewDate, startTime) => {
    const now = new Date();

    // Extract date from ISO string
    const reviewDateOnly = reviewDate.split('T')[0];

    // Create a Date object for the review date and time
    const reviewDateTime = new Date(`${reviewDateOnly}T${startTime}`);

    // Check if current time is >= review time
    return now >= reviewDateTime;
  };

  // Helper function to sort reviews by date and time
  const sortReviewsByDateTime = (upcomingReviews) => {
    const allReviews = [];

    Object.entries(upcomingReviews).forEach(([teamId, reviews]) => {
      reviews.forEach((rev, index) => {
        const reviewWithKey = { ...rev, key: `${teamId}-${index}` };
        allReviews.push(reviewWithKey);
      });
    });

    // Sort by date and time (ascending - closest first)
    allReviews.sort((a, b) => {
      const dateA = a.review_date.split('T')[0];
      const dateB = b.review_date.split('T')[0];

      // First compare dates
      if (dateA !== dateB) {
        return dateA.localeCompare(dateB);
      }

      // If dates are same, compare times
      return a.start_time.localeCompare(b.start_time);
    });

    return allReviews;
  };

  // Render upcoming reviews section
  const renderUpcomingReviews = (upcomingReviews, title, roleColor) => {
    const sortedReviews = sortReviewsByDateTime(upcomingReviews);

    if (sortedReviews.length === 0) {
      return (
        <div className="mb-8">
          <h2 className={`text-xl font-semibold mb-4 ${roleColor}`}>{title}</h2>
          <div className="text-center py-4">
            <p className="text-gray-600">No upcoming reviews scheduled.</p>
          </div>
        </div>
      );
    }

    return (
      <div className="mb-8">
        <h2 className={`text-xl font-semibold mb-4 ${roleColor}`}>{title}</h2>
        {sortedReviews.map((rev) => {
          const isClicked = clickedMeetings.has(rev.key);
          const endTime = endTimes[rev.key] || '';
          const isSubmitting = submittingEndTime === rev.key;
          const reviewId = rev.review_id || rev.id;
          const isEndTimeMarked = markedEndTimes[reviewId];
          const areMarksEntered = marksAlreadyEntered[reviewId];

          return (
            <div key={rev.key} className="p-4 border-2 border-blue-200 rounded-lg bg-blue-50 mb-4 shadow-sm">
              <p><strong>Project:</strong> {rev.project_name}</p>
              <p><strong>Review Title:</strong> {rev.review_title || 'N/A'}</p>
              <p><strong>Date:</strong> {rev.review_date.split('T')[0]}</p>
              <p><strong>Time:</strong> {rev.start_time}</p>
              <p><strong>Google Meet Link:</strong>
                {rev.meeting_link ? (
                  isReviewTimeReached(rev.review_date, rev.start_time) ? (
                    <a
                      href={rev.meeting_link}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 underline ml-2 hover:text-blue-800 font-medium"
                      onClick={() => handleMeetingLinkClick(rev.key)}
                    >
                      Join Meeting
                    </a>
                  ) : (
                    <span className="ml-2 text-gray-500 cursor-not-allowed">
                      📅 Meeting starts at {rev.start_time} on {rev.review_date.split('T')[0]}
                    </span>
                  )
                ) : (
                  <span className="ml-2 text-gray-500">Google Meet link not available</span>
                )}
              </p>

              {/* Meeting End Time Section */}
              {rev.meeting_link && isReviewTimeReached(rev.review_date, rev.start_time) && (
                <div className="mt-4 p-3 bg-white border border-gray-200 rounded">
                  {isEndTimeMarked ? (
                    <div className="flex items-center text-green-700">
                      <span className="text-lg mr-2">✅</span>
                      <p className="font-medium">
                        Meeting end time marked: <strong>{isEndTimeMarked}</strong>
                      </p>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-yellow-800 mb-2">
                        📝 <strong>Important:</strong> Please mark the meeting end time after completing the review session.
                      </p>

                      <div className="flex items-center space-x-3">
                        <input
                          type="text"
                          placeholder="HH:MM:SS (e.g., 14:30:00)"
                          value={endTime}
                          onChange={(e) => setEndTimes(prev => ({
                            ...prev,
                            [rev.key]: e.target.value
                          }))}
                          className="border border-gray-300 rounded px-3 py-2 text-sm w-40"
                          disabled={isSubmitting}
                        />

                        <button
                          onClick={() => handleEndTimeSubmit(rev)}
                          disabled={!isClicked || isSubmitting || !endTime.trim()}
                          className={`px-4 py-2 rounded text-sm font-medium ${!isClicked || !endTime.trim()
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : isSubmitting
                              ? 'bg-yellow-400 text-white cursor-wait'
                              : 'bg-orange-600 text-white hover:bg-orange-700'
                            }`}
                          title={!isClicked ? 'Please join the meeting first to enable this button' : ''}
                        >
                          {isSubmitting ? 'Submitting...' : 'Mark End Time'}
                        </button>
                      </div>

                      {!isClicked && (
                        <p className="text-xs text-gray-600 mt-1">
                          * Button will be enabled after you join the meeting
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Marks Entry Section */}
              {isEndTimeMarked && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                  {areMarksEntered ? (
                    <div className="flex items-center text-green-700">
                      <span className="text-lg mr-2">🎯</span>
                      <p className="font-medium">Marks have been entered for this review</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-blue-800 mb-3">
                        📊 <strong>Next Step:</strong> Please enter marks for the team and individual members.
                      </p>
                      <button
                        onClick={() => handleOpenMarksModal(rev)}
                        className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700"
                      >
                        Enter Marks
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Review Projects</h1>

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-600 mb-4">{error}</p>}

      {renderReviewRequests(guideReviewRequests, 'Guide Review Requests', true)}
      {renderReviewRequests(expertReviewRequests, 'Subject Expert Review Requests', false)}

      {/* Upcoming Reviews Sections - Separated by Role */}
      {renderUpcomingReviews(guideUpcomingReviews, 'Guide - Upcoming Reviews', 'text-green-700')}
      {renderUpcomingReviews(expertUpcomingReviews, 'Subject Expert - Upcoming Reviews', 'text-purple-700')}

      {/* Marks Entry Modal */}
      {showMarksModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Enter Marks</h3>
              <button
                onClick={() => {
                  setShowMarksModal(false);
                  setCurrentReviewForMarks(null);
                  setTeamMembers([]);
                  setTeamMarks('');
                  setIndividualMarks({});
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {currentReviewForMarks && (
              <div className="mb-4 p-3 bg-gray-50 rounded">
                <p><strong>Project:</strong> {currentReviewForMarks.project_name}</p>
                <p><strong>Review:</strong> {currentReviewForMarks.review_title}</p>
                <p><strong>Date:</strong> {currentReviewForMarks.review_date.split('T')[0]}</p>
              </div>
            )}

            {/* Team Marks */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Team Marks (Overall)</label>

              <input
                type="number"
                min="0"
                max="5"
                step="1"
                placeholder="Literature Survey (0-5)"
                value={teamMarks.literature_survey}
                onChange={(e) => setTeamMarks({ ...teamMarks, literature_survey: Number(e.target.value) })}
                className="w-full border border-gray-300 rounded px-3 py-2 mb-2"
              />

              <input
                type="number"
                min="0"
                max="5"
                step="1"
                placeholder="Aim (0-5)"
                value={teamMarks.aim}
                onChange={(e) => setTeamMarks({ ...teamMarks, aim: Number(e.target.value) })}
                className="w-full border border-gray-300 rounded px-3 py-2 mb-2"
              />

              <input
                type="number"
                min="0"
                max="5"
                step="1"
                placeholder="Scope (0-5)"
                value={teamMarks.scope}
                onChange={(e) => setTeamMarks({ ...teamMarks, scope: Number(e.target.value) })}
                className="w-full border border-gray-300 rounded px-3 py-2 mb-2"
              />

              <input
                type="number"
                min="0"
                max="5"
                step="1"
                placeholder="Need for Study (0-5)"
                value={teamMarks.need_for_study}
                onChange={(e) => setTeamMarks({ ...teamMarks, need_for_study: Number(e.target.value) })}
                className="w-full border border-gray-300 rounded px-3 py-2 mb-2"
              />

              <input
                type="number"
                min="0"
                max="10"
                step="1"
                placeholder="Proposed Methodology (0-10)"
                value={teamMarks.proposed_methodology}
                onChange={(e) => setTeamMarks({ ...teamMarks, proposed_methodology: Number(e.target.value) })}
                className="w-full border border-gray-300 rounded px-3 py-2 mb-2"
              />

              <input
                type="number"
                min="0"
                max="5"
                step="1"
                placeholder="Work Plan (0-5)"
                value={teamMarks.work_plan}
                onChange={(e) => setTeamMarks({ ...teamMarks, work_plan: Number(e.target.value) })}
                className="w-full border border-gray-300 rounded px-3 py-2 mb-2"
              />

              <input
                type="text"
                placeholder="Remarks"
                value={teamMarks.remarks || ""}
                onChange={(e) => setTeamMarks({ ...teamMarks, remarks: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>


            {/* Individual Marks */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Individual Member Marks</h4>

              {teamMembers.map((member) => {
                const memberId = member.reg_num || member.id;
                const marks = individualMarks[memberId] || {
                  oral_presentation: "",
                  viva_voce_and_ppt: "",
                  contributions: "",
                  expert_guide_marks: "",
                  remarks: ""
                };

                return (
                  <div key={memberId} className="mb-4 border rounded p-3 bg-gray-50">
                    <div className="font-medium mb-2">
                      {member.name || member.student_name} ({memberId})
                    </div>

                    <input
                      type="number"
                      min="0"
                      max="5"
                      placeholder="Oral Presentation (0-5)"
                      value={marks.oral_presentation}
                      onChange={(e) =>
                        setIndividualMarks((prev) => ({
                          ...prev,
                          [memberId]: { ...prev[memberId], oral_presentation: Number(e.target.value) }
                        }))
                      }
                      className="w-full border border-gray-300 rounded px-3 py-2 mb-2"
                    />

                    <input
                      type="number"
                      min="0"
                      max="5"
                      placeholder="Viva Voce & PPT (0-5)"
                      value={marks.viva_voce_and_ppt}
                      onChange={(e) =>
                        setIndividualMarks((prev) => ({
                          ...prev,
                          [memberId]: { ...prev[memberId], viva_voce_and_ppt: Number(e.target.value) }
                        }))
                      }
                      className="w-full border border-gray-300 rounded px-3 py-2 mb-2"
                    />

                    <input
                      type="number"
                      min="0"
                      max="5"
                      placeholder="Contributions (0-5)"
                      value={marks.contributions}
                      onChange={(e) =>
                        setIndividualMarks((prev) => ({
                          ...prev,
                          [memberId]: { ...prev[memberId], contributions: Number(e.target.value) }
                        }))
                      }
                      className="w-full border border-gray-300 rounded px-3 py-2 mb-2"
                    />

                    <input
                      type="number"
                      min="0"
                      max="5"
                      placeholder="Expert/Guide Marks (0-5)"
                      value={marks.expert_guide_marks}
                      onChange={(e) =>
                        setIndividualMarks((prev) => ({
                          ...prev,
                          [memberId]: { ...prev[memberId], expert_guide_marks: Number(e.target.value) }
                        }))
                      }
                      className="w-full border border-gray-300 rounded px-3 py-2 mb-2"
                    />

                    <input
                      type="text"
                      placeholder="Remarks"
                      value={marks.remarks}
                      onChange={(e) =>
                        setIndividualMarks((prev) => ({
                          ...prev,
                          [memberId]: { ...prev[memberId], remarks: e.target.value }
                        }))
                      }
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                  </div>
                );
              })}
            </div>


            {/* Action Buttons */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowMarksModal(false);
                  setCurrentReviewForMarks(null);
                  setTeamMembers([]);
                  setTeamMarks('');
                  setIndividualMarks({});
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                disabled={submittingMarks}
              >
                Cancel
              </button>
              <button
                onClick={handleMarksSubmit}
                disabled={submittingMarks}
                className={`px-4 py-2 rounded text-white font-medium ${submittingMarks
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
                  }`}
              >
                {submittingMarks ? 'Submitting...' : 'Submit Marks'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReviewProjects;
