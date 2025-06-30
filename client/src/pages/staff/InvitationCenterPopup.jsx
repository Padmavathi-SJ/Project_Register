import React from 'react';

const InvitationCenterPopup = ({ invitations, onAccept, onReject, onClose }) => {
  const safeInvitations = Array.isArray(invitations) ? invitations : [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-md rounded-xl shadow-xl p-5 relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-4 text-gray-400 hover:text-red-500 text-2xl"
        >
          &times;
        </button>
        <h2 className="text-2xl font-bold bg-white text-center mb-4">Team Invitations</h2>

        {safeInvitations.length === 0 ? (
          <p className="text-gray-600 bg-white text-center">No invitations yet.</p>
        ) : (
          <ul className="space-y-4">
            {safeInvitations.map((invite) => (
              <li key={invite.from_team_id} className="border rounded-lg p-4 shadow">
                <p className="font-semibold">{invite.from_team_id}</p>
                <p className="font-semibold">{invite.project_name}</p>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => {onAccept(invite.from_team_id);window.location.href = "/guide"}} 
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-1 rounded"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => {onReject(invite.from_team_id);window.location.href = "/guide"}} 
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-1 rounded"
                  >
                    Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default InvitationCenterPopup;
