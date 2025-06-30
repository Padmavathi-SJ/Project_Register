import React, { useState, useEffect } from 'react';
import instance from '../../utils/axiosInstance';
import { useSelector } from 'react-redux';

const InvitationPage = () => {
  const [invitations, setInvitations] = useState([]);
  const [loadingId, setLoadingId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectionReasons, setRejectionReasons] = useState({});
  const selector = useSelector((state) => state.userSlice.auth?.user || null);

  useEffect(() => {
    const fetchInvitations = async () => {
      if (!selector.reg_num) return;
      try {
        const resp = await instance.get(`/student/request_recived/${selector.reg_num}`);
        console.log(resp.data.data, "invitation page");
        if (resp.status === 200 && resp.data.data.length) {
          const inv = resp.data.data[0];
          console.log(inv.from_reg_num, "invitation page");
          const userRes = await instance.get(`/student/get_student_details_by_regnum/${inv.from_reg_num}`);
          console.log(userRes, "userResUserRes");
          if (userRes.status === 200) {
            const student = Array.isArray(userRes.data.data) ? userRes.data.data[0] : userRes.data.data;
            setInvitations([{
              ...student,
              status: inv.status,
              from_reg_num: inv.from_reg_num,
              to_reg_num: inv.to_reg_num
            }]);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchInvitations();
  }, [selector.reg_num]);

  const handleAction = async (invite, status, reason = '') => {
    setLoadingId(invite.reg_num);
    try {
      console.log(status, invite.to_reg_num, invite.from_reg_num, "/student/team_request/");
      await instance.patch(
        `/student/team_request/${status}/${invite.to_reg_num}/${invite.from_reg_num}`,
        { reason }
      );
      setInvitations(invites =>
        invites.map(i =>
          i.reg_num === invite.reg_num ? { ...i, status } : i
        )
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingId(null);
      setRejectingId(null);
    }
  };

  const onReasonChange = (regNum, text) => {
    setRejectionReasons(prev => ({ ...prev, [regNum]: text }));
  };

  return (
    <div className="min-h-screen bg-indigo-50 py-12 px-4">
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-lg p-8 border border-indigo-200">
        <h1 className="text-4xl font-bold text-center bg-white text-indigo-700 mb-10">
          Team Invitations
        </h1>

        <div className="overflow-x-auto mx-4 my-6">
          <table className="min-w-full bg-white rounded-lg overflow-hidden shadow-sm">
            <thead className="bg-indigo-100 text-indigo-800">
              <tr>
                {['Name', 'Email', 'Reg. No', 'Department', 'Action'].map((head) => (
                  <th key={head} className="px-6 py-4 text-left bg-white font-semibold">{head}</th>
                ))}
              </tr>
            </thead>
            <tbody className="text-gray-800 bg-white">
              {invitations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center bg-white px-6 py-8 text-gray-500">
                    No invitations received.
                  </td>
                </tr>
              ) : (
                invitations.map(invite => (
                  <tr
                    key={invite.reg_num}
                    className="hover:bg-indigo-50 bg-white transition-colors border-t"
                  >
                    <td className="px-6 py-4">{invite.name}</td>
                    <td className="px-6 py-4">{invite.emailId}</td>
                    <td className="px-6 py-4">{invite.reg_num}</td>
                    <td className="px-6 py-4">{invite.dept}</td>
                    <td className="px-6 py-4 text-center">
                      {invite.status === 'interested' ? (
                        rejectingId === invite.reg_num ? (
                          <div className="space-y-3">
                            <textarea
                              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                              rows={3}
                              placeholder="Reason for rejection..."
                              value={rejectionReasons[invite.reg_num] || ''}
                              onChange={e => onReasonChange(invite.reg_num, e.target.value)}
                            />
                            <div className="flex justify-end gap-3">
                              <button
                                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded transition"
                                onClick={() => setRejectingId(null)}
                              >
                                Cancel
                              </button>
                              <button
                                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition disabled:opacity-50"
                                disabled={loadingId === invite.reg_num}
                                onClick={() =>
                                  handleAction(invite, 'reject', rejectionReasons[invite.reg_num] || '')
                                }
                              >
                                {loadingId === invite.reg_num ? 'Rejecting…' : 'Submit'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-3 justify-center">
                            <button
                              onClick={() => handleAction(invite, 'accept')}
                              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition disabled:opacity-50"
                              disabled={loadingId === invite.reg_num}
                            >
                              {loadingId === invite.reg_num ? 'Accepting…' : 'Accept'}
                            </button>
                            <button
                              onClick={() => setRejectingId(invite.reg_num)}
                              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition disabled:opacity-50"
                              disabled={loadingId === invite.reg_num}
                            >
                              Reject
                            </button>
                          </div>
                        )
                      ) : (
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${invite.status === 'accept'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                            }`}
                        >
                          {invite.status === 'accept' ? 'Accepted' : 'Rejected'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InvitationPage;