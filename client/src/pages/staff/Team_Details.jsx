import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Users, Calendar, FileText, CheckCircle, XCircle, Clock, User } from 'lucide-react';
import instance from '../../utils/axiosInstance';
import { useSelector } from 'react-redux';

function Team_Details() {
  const { teamId } = useParams();
  const guideRegNum = useSelector((state) => state.userSlice.auth.user || null).reg_num;

  const [teamDetails, setTeamDetails] = useState([]);
  const [currentWeek, setCurrentWeek] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [reason, setReason] = useState('');
  const [status, setStatus] = useState('');
  const [isWeekComplete, setIsWeekComplete] = useState(false);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const verifiedWeeksRes = await instance.get(`/guide/no_of_weeks_verified/${teamId}`);
        console.log(verifiedWeeksRes);
        const verifiedWeekNum = parseInt(verifiedWeeksRes.data.data.verified_weeks_count);
        let nextWeek = isNaN(verifiedWeekNum) ? 1 : verifiedWeekNum + 1;

        const teamRes = await instance.get(`/guide/gets_entire_team/${teamId}`);
        console.log(teamRes.data.data);
        const team = teamRes.data.data;

        // Fetch names for all team members by their reg_num
        const updatedTeam = await Promise.all(
          team.map(async (member) => {
            try {
              const nameRes = await instance.get(`/student/get_name_by_reg_number/${member.reg_num}`);
              console.log(member, "namenamename");
              return { ...member, name: nameRes.data.data.name };
            } catch (error) {
              console.error(`Error fetching name for ${member.reg_num}:`, error);
              return member; // fallback to existing member if name fetch fails
            }
          })
        );
        console.log(updatedTeam, "updated team");
        setTeamDetails(updatedTeam);

        const progressField = `week${nextWeek}_progress`;

        const allSubmitted = updatedTeam.every(
          (member) => member[progressField] && member[progressField].trim() !== ''
        );

        setIsWeekComplete(allSubmitted);
        if (updatedTeam.length > 0 && updatedTeam[0][progressField]) {
          setCurrentWeek(nextWeek);
        } else {
          setCurrentWeek(null);
        }
      } catch (error) {
        console.error(error);
        alert('Error fetching team data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [teamId, guideRegNum]);

  const handleSubmit = async () => {
    if (status === 'accept' && !remarks) {
      alert('Please provide remarks');
      return;
    }
    if (status === 'reject' && !reason) {
      alert('Please provide reason for rejection');
      return;
    }

    try {
      const payload = {
        ...(status === 'accept' ? { remarks, reason: null } : {}),
        ...(status === 'reject' ? { reason, remarks: null } : {}),
      };

      const res = await instance.patch(
        `/guide/verify_weekly_logs/${guideRegNum}/${currentWeek}/${status}/${teamId}`,
        payload
      );

      alert(res.data);
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert('Error submitting verification');
    }
  };

  const resetStatus = () => {
    setStatus('');
    setRemarks('');
    setReason('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading team details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className=" rounded-xl p-6 mb-1">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/guide')}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 shadow-md group"
            >
              <ArrowLeft
                size={20}
                className="text-white bg-blue-600 transition-colors duration-200 group-hover:bg-blue-700"
              />
              Back to Dashboard
            </button>

            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Team Details</h1>
              <div className="flex items-center justify-center gap-2 text-blue-600">
                <Users size={20} />
                <span className="font-mono text-lg">Team ID: {teamId}</span>
              </div>
            </div>
            <div className="w-32"></div> {/* Spacer for balance */}
          </div>
        </div>

        {/* Team Info Card */}
        {teamDetails.length > 0 && (
          <div className=" rounded-xl p-4 mb-1">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FileText size={20} />
              Project Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 bg-white mb-1">Guide Registration Number</p>
                <p className="font-mono text-lg bg-white text-blue-600">{guideRegNum}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm bg-white text-gray-600 mb-1">Project ID</p>
                <p className="font-mono text-lg bg-white text-green-600">{teamDetails[0].project_id}</p>
              </div>
            </div>
          </div>
        )}

        {/* Progress Section */}
        {currentWeek ? (
          <div className=" p-4">
            <div className="flex items-center rounded-md p-4 bg-white justify-between mb-3">
              <h2 className="text-2xl bg-white rounded font-semibold text-gray-800 flex items-center gap-2">
                <Calendar size={24} className='bg-white' />
                Week {currentWeek} Progress
              </h2>
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${isWeekComplete
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800'
                }`}>
                {isWeekComplete ? (
                  <>
                    <CheckCircle size={16} className='bg-green-100' />
                    All Submitted
                  </>
                ) : (
                  <>
                    <Clock size={16} className='bg-yellow-100' />
                    Pending Submissions
                  </>
                )}
              </div>
            </div>

            {/* Team Members Progress */}
            <div className="space-y-4 rounded-lg  mb-6">
              {teamDetails.map((member, index) => (
                <div key={index} className="border bg-white border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
                  <div className="flex bg-white items-start gap-3">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <User size={20} className="bg-blue-100 text-blue-600" />
                    </div>
                    <div className="flex-1 bg-white">
                      <div className="flex items-center bg-white gap-2 mb-2">
                        <h3 className="font-semibold bg-white text-gray-800">{member.name}</h3>
                        <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {member.reg_num}
                        </span>
                      </div>
                      <div className="bg-gray-100 rounded-lg p-3">
                        <p className="text-gray-700 bg-gray-100 leading-relaxed">
                          {member[`week${currentWeek}_progress`] || (
                            <span className="text-red-500 italic">No progress submitted</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            {!status && (
              <div className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50 rounded-lg">
                <button
                  onClick={() => setStatus('accept')}
                  disabled={!isWeekComplete}
                  className={`flex items-center group justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors duration-200 ${isWeekComplete
                    ? 'bg-green-600 hover:bg-green-700 text-white shadow-md'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                >
                  <CheckCircle size={20} className='bg-green-600 group-hover:bg-green-700 transition-colors duration-200' />
                  Accept Week {currentWeek}
                </button>
                <button
                  onClick={() => setStatus('reject')}
                  disabled={!isWeekComplete}
                  className={`flex items-center group justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors duration-200 ${isWeekComplete
                    ? 'bg-red-600 hover:bg-red-700 text-white shadow-md'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                >
                  <XCircle size={20} className='bg-red-600 group-hover:bg-red-700 transition-colors duration-200' />
                  Reject Week {currentWeek}
                </button>
              </div>
            )}

            {/* Accept Form */}
            {status === 'accept' && (
              <div className="mt-6 p-6 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="text-lg font-semibold bg-green-50 text-green-800 mb-4 flex items-center gap-2">
                  <CheckCircle size={20} className='bg-green-50' />
                  Accept Week {currentWeek}
                </h3>
                <textarea
                  placeholder="Enter your remarks for this week's progress..."
                  className="w-full bg-green-50 p-4 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  rows="4"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
                <div className="flex gap-3 bg-green-50 mt-4">
                  <button
                    onClick={handleSubmit}
                    className="flex items-center gap-2 group px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors duration-200 shadow-md"
                  >
                    <CheckCircle size={20} className='bg-green-600 group-hover:bg-green-700 transition-colors duration-200' />
                    Submit Acceptance
                  </button>
                  <button
                    onClick={resetStatus}
                    className="px-6 py-3 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg font-medium transition-colors duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Reject Form */}
            {status === 'reject' && (
              <div className="mt-6 p-6 bg-red-50 border border-red-200 rounded-lg">
                <h3 className="text-lg bg-red-50 font-semibold text-red-800 mb-4 flex items-center gap-2">
                  <XCircle size={20} className='bg-red-50' />
                  Reject Week {currentWeek}
                </h3>
                <textarea
                  placeholder="Enter the reason for rejection..."
                  className="w-full bg-red-50 p-4 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                  rows="4"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
                <div className="flex gap-3 bg-red-50 mt-4">
                  <button
                    onClick={handleSubmit}
                    className="flex items-center gap-2 px-6 py-3 group bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors duration-200 shadow-md"
                  >
                    <XCircle size={20} className='bg-red-600 group-hover:bg-red-700  transition-colors duration-200 ' />
                    Submit Rejection
                  </button>
                  <button
                    onClick={resetStatus}
                    className="px-6 py-3 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg font-medium transition-colors duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="text-gray-400 bg-white mb-4">
              <Clock size={48} className="mx-auto bg-white" />
            </div>
            <h3 className="text-xl bg-white font-semibold text-gray-600 mb-2">No Recent Updates</h3>
            <p className="text-gray-500 bg-white">This team hasn't submitted any progress reports yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Team_Details;